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

// Merge por id SIN reemplazar el mensaje entero: conserva los parts de la
// caché que el snapshot nuevo no traiga (app cerrada a mitad de stream, fetch
// acotado, etc.). Mismo contrato que loadSelected — la caché NUNCA se encoge.
// Los parts cacheados vienen cifrados; los nuevos en claro. Al ganar el nuevo
// (misma id) el texto reemplaza; al ganar el cached se mantiene el ciphertext.
export function mergeCachedMessages(
  cached: MessageEnvelope[],
  incoming: MessageEnvelope[],
  sortDesc = true,
): MessageEnvelope[] {
  const byID = new Map<string, MessageEnvelope>()
  for (const m of cached) if (m?.info?.id) byID.set(m.info.id, m)
  for (const m of incoming) {
    if (!m?.info?.id) continue
    const prev = byID.get(m.info.id)
    if (!prev) { byID.set(m.info.id, m); continue }
    const prevByPart = new Map(prev.parts.map((p) => [p.id, p]))
    const parts: MessageEnvelope["parts"] = []
    for (const p of m.parts) {
      prevByPart.delete(p.id)
      parts.push(p)
    }
    for (const p of prevByPart.values()) parts.push(p)
    byID.set(m.info.id, { ...m, parts })
  }
  return [...byID.values()].sort((a, b) =>
    sortDesc
      ? (b.info.time.created || 0) - (a.info.time.created || 0)
      : (a.info.time.created || 0) - (b.info.time.created || 0),
  )
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

// Hash barato (sin crypto) de un part para detectar cambios de texto: los
// appends cambian length; los replaces cambian el prefijo. Permite reusar el
// ciphertext guardado de los parts intactos sin desencriptar el historial.
function partHash(part: { id: string; text?: string }): string {
  const t = part.text ?? ""
  return `${part.id}|${t.length}|${t.slice(0, 8)}`
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
    if (!(DB_STORES as any).quickchat || !db.objectStoreNames.contains((DB_STORES as any).quickchat)) {
      if (!db.objectStoreNames.contains("quickchat")) db.createObjectStore("quickchat", { keyPath: "id" })
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
      // Read existing data in a separate transaction to avoid IDB auto-commit
      // during the async encrypt() calls below.
      const existing = await new Promise<{ sessionID: string; messages: MessageEnvelope[]; hashes?: Record<string, string>; cachedAt: number } | null>((resolve) => {
        const tx = db!.transaction(DB_STORES.messages, "readonly")
        const store = tx.objectStore(DB_STORES.messages)
        const req = store.get(sessionID)
        req.onsuccess = () => resolve(req.result ?? null)
        req.onerror = () => resolve(null)
      })

      // Merge por id: la caché NUNCA se encoge — solo agrega/actualiza con lo nuevo.
      // mergeCachedMessages hace union por part (conserva cached no presentes en
      // el snapshot) y ordena DESC (nuevos primero) para el slice de retención.
      let merged = messages
      let prevHashes: Record<string, string> | undefined
      if (existing?.messages?.length) {
        // Los textos de la caché están CIFRADOS: no se puede comparar contenido
        // contra lo nuevo sin descifrar. Se reusa el ciphertext por part cuando
        // el hash (length + prefijo) coincide — así los parts streamed nuevos se
        // encriptan SOLOS (O(deltas)) en vez de re-encriptar todo el historial.
        try {
          merged = mergeCachedMessages(existing.messages, messages)
          prevHashes = existing.hashes
        } catch {
          // si el merge falla, conservamos solo lo nuevo
        }
      }
      if (merged.length > CACHE_MAX_MESSAGES_PER_SESSION) {
        merged = merged.slice(0, CACHE_MAX_MESSAGES_PER_SESSION)
      }

      // Encriptado incremental: cifra SOLO los parts cuyo hash cambió (o que no
      // tienen ciphertext previo); el resto reusa el texto cifrado guardado.
      // Los hashes guardados se calcularon sobre el PLAINTEXT al escribir —
      // comparar siempre contra ellos (nunca re-hashear el ciphertext).
      const prevByPartID = new Map<string, { text: string; hash: string }>()
      if (existing?.messages && prevHashes) {
        for (const m of existing.messages) {
          for (const p of m.parts) {
            const savedHash = prevHashes[p.id]
            if (typeof p.text === "string" && isEncoded(p.text) && savedHash) {
              prevByPartID.set(p.id, { text: p.text, hash: savedHash })
            }
          }
        }
      }
      const encrypted = await Promise.all(merged.map(async (msg) => ({
        ...msg,
        parts: await Promise.all((msg.parts || []).map(async (part) => {
          const prev = prevByPartID.get(part.id)
          const hash = partHash(part)
          if (prev && prev.hash === hash && typeof part.text === "string") {
            return { ...part, text: prev.text }
          }
          // Part conservado de la caché (fila vieja sin hashes): ya es ciphertext.
          if (typeof part.text === "string" && isEncoded(part.text)) return part
          if (!part.text) return part
          return { ...part, text: ENC_PREFIX + await encrypt(part.text) }
        })),
      })))
      // hashes solo para parts con texto: guarda el hash del texto NUEVO.
      const hashes: Record<string, string> = {}
      for (const m of merged) {
        for (const p of m.parts) {
          if (p.text) hashes[p.id] = partHash(p)
        }
      }
      // Write in a separate transaction (the async encrypt above can't hold the old one).
      const writeTx = db.transaction(DB_STORES.messages, "readwrite")
      const writeStore = writeTx.objectStore(DB_STORES.messages)
      writeStore.put({ sessionID, messages: encrypted, hashes, cachedAt: Date.now() })
    } catch (err) { console.error("[OfflineCache] cacheMessages:", err) }
  }, [flags.offlineCache])

  const getCachedMessages = useCallback(async (sessionID: string): Promise<MessageEnvelope[] | null> => {
    if (!flags.offlineCache) return null
    const db = await getDB()
    if (!db) return null
    try {
      const tx = db.transaction(DB_STORES.messages, "readonly")
      const store = tx.objectStore(DB_STORES.messages)
      const raw = await new Promise<any>((resolve, reject) => {
        const req = store.get(sessionID)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      if (!raw?.messages) return null
      return decryptMessages(raw.messages)
    } catch (err) { console.error("[OfflineCache] getCachedMessages:", err); return null }
  }, [flags.offlineCache, getDB])

  const searchMessages = useCallback(async (query: string): Promise<Array<{ sessionID: string; text: string; messageID: string }>> => {
    if (!flags.offlineCache || !query.trim()) return []
    const db = await getDB()
    if (!db) return []
    try {
      const tx = db.transaction(DB_STORES.messages, "readonly")
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
  }, [flags.offlineCache, getDB])

  return { cacheSessions, getCachedSessions, cacheMessages, getCachedMessages, searchMessages }
}
