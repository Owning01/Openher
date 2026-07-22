import { useRef, useCallback, useEffect } from "react"
import { DB_NAME, DB_VERSION } from "../constants"
import { openDatabase } from "../utils/db"

const QUEUE_STORE = "pendingActions"

type QueuedAction = {
  id: number
  type: "prompt" | "command" | "shell"
  sessionID: string
  directory: string
  payload: string
  createdAt: number
}

function openQueueDB(): Promise<IDBDatabase> {
  return openDatabase(DB_NAME, DB_VERSION, (db) => {
    if (!db.objectStoreNames.contains(QUEUE_STORE)) {
      const store = db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true })
      store.createIndex("createdAt", "createdAt")
    }
  })
}

export function useOfflineQueue() {
  const dbRef = useRef<IDBDatabase | null>(null)

  useEffect(() => {
    openQueueDB().then((db) => { dbRef.current = db }).catch(() => {})
    return () => { dbRef.current?.close(); dbRef.current = null }
  }, [])

  const enqueue = useCallback(async (action: Omit<QueuedAction, "id" | "createdAt">) => {
    if (!dbRef.current) return
    try {
      const tx = dbRef.current.transaction(QUEUE_STORE, "readwrite")
      tx.objectStore(QUEUE_STORE).add({ ...action, createdAt: Date.now() })
      await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) })
    } catch { /* silently fail */ }
  }, [])

  const dequeueAll = useCallback(async (): Promise<QueuedAction[]> => {
    if (!dbRef.current) return []
    try {
      const tx = dbRef.current.transaction(QUEUE_STORE, "readwrite")
      const store = tx.objectStore(QUEUE_STORE)
      const all = await new Promise<QueuedAction[]>((resolve, reject) => {
        const req = store.getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      store.clear()
      return all.sort((a, b) => a.createdAt - b.createdAt)
    } catch { return [] }
  }, [])

  const queueSize = useCallback(async (): Promise<number> => {
    if (!dbRef.current) return 0
    try {
      const tx = dbRef.current.transaction(QUEUE_STORE, "readonly")
      const req = tx.objectStore(QUEUE_STORE).count()
      return new Promise((resolve) => { req.onsuccess = () => resolve(req.result); req.onerror = () => resolve(0) })
    } catch { return 0 }
  }, [])

  return { enqueue, dequeueAll, queueSize }
}
