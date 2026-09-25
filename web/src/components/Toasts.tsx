import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { CheckIcon, CloseIcon } from "../Icons"
import { APP_ERROR_EVENT } from "../shared/errors/globalHandlers"

export type ToastKind = "info" | "success" | "error"
export type ToastItem = { id: number; kind: ToastKind; msg: string }

type ToastApi = {
  /** Aviso flotante por encima del contenido (no dentro del layout). */
  toast: (msg: string, kind?: ToastKind) => void
}

const ToastCtx = createContext<ToastApi>({ toast: () => {} })
export const useToast = () => useContext(ToastCtx)

const DISMISS_MS: Record<ToastKind, number> = { info: 3500, success: 3500, error: 6000 }
const MAX_VISIBLE = 4
let nextID = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    const h = timers.current.get(id)
    if (h !== undefined) { window.clearTimeout(h); timers.current.delete(id) }
    setItems((xs) => xs.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((msg: string, kind: ToastKind = "info") => {
    const text = msg.trim()
    if (!text) return
    const id = nextID++
    setItems((xs) => [...xs.slice(-(MAX_VISIBLE - 1)), { id, kind, msg: text }])
    timers.current.set(id, window.setTimeout(() => dismiss(id), DISMISS_MS[kind]))
  }, [dismiss])

  useEffect(() => {
    const pending = timers.current
    return () => { pending.forEach((h) => window.clearTimeout(h)); pending.clear() }
  }, [])

  // Errores globales (unhandledrejection / window.error): aviso visible además
  // de la consola. El texto técnico se muestra tal cual (es diagnóstico).
  useEffect(() => {
    const onAppError = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail
      if (msg) toast(msg, "error")
    }
    window.addEventListener(APP_ERROR_EVENT, onAppError)
    return () => window.removeEventListener(APP_ERROR_EVENT, onAppError)
  }, [toast])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      {items.length > 0 && createPortal(
        <div className="toast-stack" aria-live="polite">
          {items.map((t) => (
            <div key={t.id} className={`toast is-${t.kind}`} role={t.kind === "error" ? "alert" : "status"}>
              {(t.kind === "success" || t.kind === "error") && (
                <span className="toast-icon" aria-hidden="true">
                  {t.kind === "success" ? <CheckIcon size={15} /> : <CloseIcon size={15} />}
                </span>
              )}
              <span className="toast-msg">{t.msg}</span>
              <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Cerrar aviso">
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  )
}
