import { useCallback, useEffect, useRef } from "react"
import type { MessageEnvelope, Session } from "../types"
import { DB_NAME, DB_VERSION, DB_STORES } from "../constants"
import { encrypt, decrypt } from "../utils/crypto"
import { openDatabase } from "../utils/db"

const ENC_PREFIX = "enc:"

// Tope de mensajes cacheados por sesión (los más recientes se conservan).
const CACHE_MAX_MESSAGES_PER_SESSION = 2000

function isEncoded(val: unknown): boolean {
  return typeof val === "string" && val.startsWith(ENC_PREFIX)
}

async function encryptMessages(messages: MessageEnvelope[]): Promise<MessageEnvelope[]> {
  return Promise.all(messages.map(async (msg) => ({
    ...msg,
    parts: await Promise.all((msg.parts || []).map(async (part) => ({
      ...part,
      text: part.text ? ENC_PREFIX + await encrypt(part.text) : part.text,
    }))),
  })))
}

async function decryptMessages(messages: MessageEnvelope[]): Promise<MessageEnvelope[]> {
  return Promise.all(messages.map(async (msg) => ({
    ...msg,
    parts: await Promise.all((msg.parts || []).map(async (part) => ({
      ...part,
      text: part.text && isEncoded(part.text) ? await decrypt(part.text.slice(4)) : part.text,
    }))),
  })))
}

function deleteDBWithRetry(attempts = 8): Promise<void> {
  return new Promise((resolve, reject) => {
    const del = indexedDB.deleteDatabase(DB_NAME)
    del.onsuccess = () => resolve()
    del.onerror = () => reject(del.error)
    del.onblocked = () => {
      // Otra conexión (otra pestaña, extensión) tiene la DB abierta: reintentar.
      if (attempts <= 0) { reject(new Error("DB delete blocked")); return }
      setTimeout(() => deleteDBWithRetry(attempts - 1).then(resolve, reject), 500)
    }
  })
}

function openDB(): Promise<IDBDatabase> {
  const upgrade = (db: IDBDatabase) => {
    if (!db.objectStoreNames.contains(DB_STORES.sessions)) {
      db.createObjectStore(DB_STORES.sessions, { keyPath: "id" })
    }
    if (!db.objectStoreNames.contains(DB_STORES.messages)) {
      db.createObjectStore(DB_STORES.messages, { keyPath: "sessionID" })
    }
  }

  return openDatabase(DB_NAME, DB_VERSION, upgrade).then((db) => {
    const hasStores =
      db.objectStoreNames.contains(DB_STORES.sessions) &&
      db.objectStoreNames.contains(DB_STORES.messages)
    if (hasStores) return db

    // DB corrupta (v2 creada sin stores por versiones bugueadas): recrear desde cero.
    db.close()
    return deleteDBWithRetry().then(() => openDatabase(DB_NAME, DB_VERSION, upgrade))
  })
}

export function useOfflineCache(flags: { offlineCache: boolean }) {
  const dbRef = useRef<IDBDatabase | null>(null)
  const openingRef = useRef<Promise<IDBDatabase | null> | null>(null)

  const getDB = useCallback(async (): Promise<IDBDatabase | null> => {
    if (dbRef.current) return dbRef.current
    if (openingRef.current) return openingRef.current
    openingRef.current = openDB().then((db) => {
      dbRef.current = db
      return db
    }).catch((err) => {
      console.error("[OfflineCache] openDB:", err)
      return null
    }).finally(() => {
      openingRef.current = null
    })
    return openingRef.current
  }, [])

  useEffect(() => {
    getDB()
    return () => { dbRef.current?.close(); dbRef.current = null }
  }, [getDB])

  const cacheSessions = useCallback(async (sessions: Session[]) => {
    const db = await getDB()
    if (!db) return
    try {
      const tx = db.transaction(DB_STORES.sessions, "readwrite")
      const store = tx.objectStore(DB_STORES.sessions)
      for (const s of sessions) store.put(s)
    } catch (err) { console.error("[OfflineCache] cacheSessions:", err) }
  }, [getDB])

  const getCachedSessions = useCallback(async (): Promise<Session[]> => {
    const db = await getDB()
    if (!db) return []
    try {
      const tx = db.transaction(DB_STORES.sessions, "readonly")
      const store = tx.objectStore(DB_STORES.sessions)
      return new Promise((resolve, reject) => {
        const req = store.getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
    } catch (err) { console.error("[OfflineCache] getCachedSessions:", err); return [] }
  }, [getDB])

  const cacheMessages = useCallback(async (sessionID: string, messages: MessageEnvelope[]) => {
    let db = await getDB()
    if (!db || !flags.offlineCache) return
    try {
      const tx = db.transaction(DB_STORES.messages, "readwrite")
      const store = tx.objectStore(DB_STORES.messages)
      const existing = await new Promise<{ sessionID: string; messages: MessageEnvelope[]; cachedAt: number } | null>((resolve) => {
        const req = store.get(sessionID)
        req.onsuccess = () => resolve(req.result ?? null)
        req.onerror = () => resolve(null)
      })

      // Merge por id: la caché NUNCA se encoge — solo agrega/actualiza con lo nuevo.
      let merged = messages
      if (existing?.messages?.length) {
        try {
          const decrypted = await decryptMessages(existing.messages)
          const map = new Map<string, MessageEnvelope>()
          for (const m of decrypted) map.set(m.info.id, m)
          for (const m of messages) map.set(m.info.id, m)
          merged = [...map.values()].sort((a, b) => (b.info.time.created || 0) - (a.info.time.created || 0))
        } catch {
          // si la decriptación falla, conservamos solo lo nuevo
        }
      }
      if (merged.length > CACHE_MAX_MESSAGES_PER_SESSION) {
        merged = merged.slice(0, CACHE_MAX_MESSAGES_PER_SESSION)
      }

      const encrypted = await encryptMessages(merged)
      store.put({ sessionID, messages: encrypted, cachedAt: Date.now() })
    } catch (err) { console.error("[OfflineCache] cacheMessages:", err) }
  }, [flags.offlineCache])

  const getCachedMessages = useCallback(async (sessionID: string): Promise<MessageEnvelope[] | null> => {
    if (!dbRef.current || !flags.offlineCache) return null
    try {
      const tx = dbRef.current.transaction(DB_STORES.messages, "readonly")
      const store = tx.objectStore(DB_STORES.messages)
      const raw = await new Promise<any>((resolve, reject) => {
        const req = store.get(sessionID)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      if (!raw?.messages) return null
      return decryptMessages(raw.messages)
    } catch (err) { console.error("[OfflineCache] getCachedMessages:", err); return null }
  }, [flags.offlineCache])

  const searchMessages = useCallback(async (query: string): Promise<Array<{ sessionID: string; text: string; messageID: string }>> => {
    if (!dbRef.current || !flags.offlineCache || !query.trim()) return []
    try {
      const tx = dbRef.current.transaction(DB_STORES.messages, "readonly")
      const store = tx.objectStore(DB_STORES.messages)
      const all = await new Promise<any[]>((resolve, reject) => {
        const req = store.getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      const q = query.toLowerCase()
      const results: Array<{ sessionID: string; text: string; messageID: string }> = []
      for (const entry of all) {
        if (!entry.messages) continue
        for (const msg of entry.messages) {
          for (const part of msg.parts || []) {
            let text = part.text || ""
            if (isEncoded(text)) {
              try { text = await decrypt(text.slice(4)) } catch { text = "" }
            }
            if (text.toLowerCase().includes(q)) {
              results.push({ sessionID: entry.sessionID, text: text.slice(0, 200), messageID: msg.info?.id || "" })
              if (results.length >= 50) break
            }
          }
          if (results.length >= 50) break
        }
        if (results.length >= 50) break
      }
      return results
    } catch (err) { console.error("[OfflineCache] searchMessages:", err); return [] }
  }, [flags.offlineCache])

  return { cacheSessions, getCachedSessions, cacheMessages, getCachedMessages, searchMessages }
}
