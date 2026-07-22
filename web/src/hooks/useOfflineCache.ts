import { useCallback, useEffect, useRef } from "react"
import type { MessageEnvelope, Session } from "../types"
import { DB_NAME, DB_VERSION, DB_STORES } from "../constants"
import { encrypt, decrypt } from "../utils/crypto"

const ENC_PREFIX = "enc:"

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

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(DB_STORES.sessions)) {
        db.createObjectStore(DB_STORES.sessions, { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains(DB_STORES.messages)) {
        db.createObjectStore(DB_STORES.messages, { keyPath: "sessionID" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function useOfflineCache(flags: { offlineCache: boolean }) {
  const dbRef = useRef<IDBDatabase | null>(null)

  useEffect(() => {
    if (!flags.offlineCache) return
    openDB().then((db) => { dbRef.current = db }).catch((err) => console.error("[OfflineCache] openDB:", err))
    return () => { dbRef.current?.close(); dbRef.current = null }
  }, [flags.offlineCache])

  const cacheSessions = useCallback(async (sessions: Session[]) => {
    if (!dbRef.current || !flags.offlineCache) return
    try {
      const tx = dbRef.current.transaction(DB_STORES.sessions, "readwrite")
      const store = tx.objectStore(DB_STORES.sessions)
      for (const s of sessions) store.put(s)
    } catch (err) { console.error("[OfflineCache] cacheSessions:", err) }
  }, [flags.offlineCache])

  const getCachedSessions = useCallback(async (): Promise<Session[]> => {
    if (!dbRef.current || !flags.offlineCache) return []
    try {
      const tx = dbRef.current.transaction(DB_STORES.sessions, "readonly")
      const store = tx.objectStore(DB_STORES.sessions)
      return new Promise((resolve, reject) => {
        const req = store.getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
    } catch (err) { console.error("[OfflineCache] getCachedSessions:", err); return [] }
  }, [flags.offlineCache])

  const cacheMessages = useCallback(async (sessionID: string, messages: MessageEnvelope[]) => {
    if (!dbRef.current || !flags.offlineCache) return
    try {
      const encrypted = await encryptMessages(messages)
      const tx = dbRef.current.transaction(DB_STORES.messages, "readwrite")
      const store = tx.objectStore(DB_STORES.messages)
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
