import { useRef, useCallback, useEffect } from "react"
import { DB_NAME, DB_VERSION } from "../constants"
import { openDatabase } from "../utils/db"
import type { ModelOption } from "../types"

const QUEUE_STORE = "pendingActions"

export type QueuedAction = {
  id: number
  type: "prompt" | "command" | "shell"
  sessionID: string
  directory: string
  payload: string
  createdAt: number
  model?: Pick<ModelOption, "providerID" | "modelID" | "variant">
  agentID?: string
  images?: Array<{ base64: string; mime: string }>
  options?: { translate?: boolean }
  lastError?: string
}

type NewQueuedAction = Omit<QueuedAction, "id" | "createdAt" | "lastError">

function openQueueDB(): Promise<IDBDatabase> {
  return openDatabase(DB_NAME, DB_VERSION, (db) => {
    if (!db.objectStoreNames.contains(QUEUE_STORE)) {
      const store = db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true })
      store.createIndex("createdAt", "createdAt")
    }
  })
}

function waitForTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"))
  })
}

export function useOfflineQueue() {
  const dbRef = useRef<IDBDatabase | null>(null)
  const dbPromiseRef = useRef<Promise<IDBDatabase> | null>(null)

  useEffect(() => {
    const promise = openQueueDB()
    dbPromiseRef.current = promise
    promise.then((db) => { dbRef.current = db }).catch(() => {})
    return () => {
      dbRef.current?.close()
      dbRef.current = null
      dbPromiseRef.current = null
    }
  }, [])

  const getDB = useCallback(async () => {
    if (dbRef.current) return dbRef.current
    const db = await dbPromiseRef.current
    if (db) dbRef.current = db
    return db ?? null
  }, [])

  const enqueue = useCallback(async (action: NewQueuedAction) => {
    const db = await getDB()
    if (!db) return false
    try {
      const tx = db.transaction(QUEUE_STORE, "readwrite")
      tx.objectStore(QUEUE_STORE).add({ ...action, createdAt: Date.now() })
      await waitForTransaction(tx)
      return true
    } catch {
      return false
    }
  }, [getDB])

  const listPending = useCallback(async (): Promise<QueuedAction[]> => {
    const db = await getDB()
    if (!db) return []
    try {
      const tx = db.transaction(QUEUE_STORE, "readonly")
      const all = await new Promise<QueuedAction[]>((resolve, reject) => {
        const req = tx.objectStore(QUEUE_STORE).getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      return all.sort((a, b) => a.createdAt - b.createdAt)
    } catch {
      return []
    }
  }, [getDB])

  const ack = useCallback(async (id: number) => {
    const db = await getDB()
    if (!db) return false
    try {
      const tx = db.transaction(QUEUE_STORE, "readwrite")
      tx.objectStore(QUEUE_STORE).delete(id)
      await waitForTransaction(tx)
      return true
    } catch {
      return false
    }
  }, [getDB])

  const markFailed = useCallback(async (action: QueuedAction, error: unknown) => {
    const db = await getDB()
    if (!db) return false
    try {
      const tx = db.transaction(QUEUE_STORE, "readwrite")
      tx.objectStore(QUEUE_STORE).put({ ...action, lastError: error instanceof Error ? error.message : String(error) })
      await waitForTransaction(tx)
      return true
    } catch {
      return false
    }
  }, [getDB])

  const queueSize = useCallback(async (): Promise<number> => {
    const db = await getDB()
    if (!db) return 0
    try {
      const tx = db.transaction(QUEUE_STORE, "readonly")
      const req = tx.objectStore(QUEUE_STORE).count()
      return new Promise((resolve) => { req.onsuccess = () => resolve(req.result); req.onerror = () => resolve(0) })
    } catch {
      return 0
    }
  }, [getDB])

  return { enqueue, listPending, ack, markFailed, queueSize }
}
