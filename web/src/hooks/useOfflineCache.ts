import { useCallback, useEffect, useRef } from "react"
import type { MessageEnvelope, Session } from "../types"
import { DB_NAME, DB_VERSION, DB_STORES } from "../constants"

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
    openDB().then((db) => { dbRef.current = db }).catch(() => {})
    return () => { dbRef.current?.close(); dbRef.current = null }
  }, [flags.offlineCache])

  const cacheSessions = useCallback(async (sessions: Session[]) => {
    if (!dbRef.current || !flags.offlineCache) return
    try {
      const tx = dbRef.current.transaction(DB_STORES.sessions, "readwrite")
      const store = tx.objectStore(DB_STORES.sessions)
      for (const s of sessions) store.put(s)
    } catch { /* silently fail */ }
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
    } catch { return [] }
  }, [flags.offlineCache])

  const cacheMessages = useCallback(async (sessionID: string, messages: MessageEnvelope[]) => {
    if (!dbRef.current || !flags.offlineCache) return
    try {
      const tx = dbRef.current.transaction(DB_STORES.messages, "readwrite")
      const store = tx.objectStore(DB_STORES.messages)
      store.put({ sessionID, messages, cachedAt: Date.now() })
    } catch { /* silently fail */ }
  }, [flags.offlineCache])

  const getCachedMessages = useCallback(async (sessionID: string): Promise<MessageEnvelope[] | null> => {
    if (!dbRef.current || !flags.offlineCache) return null
    try {
      const tx = dbRef.current.transaction(DB_STORES.messages, "readonly")
      const store = tx.objectStore(DB_STORES.messages)
      return new Promise((resolve, reject) => {
        const req = store.get(sessionID)
        req.onsuccess = () => resolve(req.result?.messages ?? null)
        req.onerror = () => reject(req.error)
      })
    } catch { return null }
  }, [flags.offlineCache])

  return { cacheSessions, getCachedSessions, cacheMessages, getCachedMessages }
}
