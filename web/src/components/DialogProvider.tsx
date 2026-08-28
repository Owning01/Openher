import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Modal } from "./Modal"
import { useT } from "../i18n-context"

type DialogOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "danger"
}

type AlertOptions = {
  title?: string
  message: string
  okText?: string
}

type DialogContextValue = {
  confirm: (opts: DialogOptions | string) => Promise<boolean>
  alert: (opts: AlertOptions | string) => Promise<void>
}

const DialogContext = createContext<DialogContextValue | null>(null)

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error("useDialog debe usarse dentro de DialogProvider")
  return ctx
}

// Alias for convenience, matches requested "confirm" naming
export const useConfirm = useDialog

type DialogState =
  | { type: "confirm"; opts: DialogOptions; resolve: (v: boolean) => void }
  | { type: "alert"; opts: AlertOptions; resolve: () => void }
  | null

export function DialogProvider({ children }: { children: ReactNode }) {
  const t = useT()
  const [state, setState] = useState<DialogState>(null)

  const confirm = useCallback((opts: DialogOptions | string) => {
    const o: DialogOptions = typeof opts === "string" ? { message: opts } : opts
    return new Promise<boolean>((resolve) => setState({ type: "confirm", opts: o, resolve }))
  }, [])

  const alert = useCallback((opts: AlertOptions | string) => {
    const o: AlertOptions = typeof opts === "string" ? { message: opts } : opts
    return new Promise<void>((resolve) => setState({ type: "alert", opts: o, resolve: () => resolve() }))
  }, [])

  const close = useCallback(() => setState(null), [])

  const handleConfirm = useCallback(() => {
    if (state?.type === "confirm") state.resolve(true)
    if (state?.type === "alert") (state.resolve as () => void)()
    close()
  }, [state, close])

  const handleCancel = useCallback(() => {
    if (state?.type === "confirm") state.resolve(false)
    close()
  }, [state, close])

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {state &&
        createPortal(
          <Modal onClose={state.type === "confirm" ? handleCancel : handleConfirm} aria-labelledby="dialog-title">
            {state.opts.title && <h2 id="dialog-title">{state.opts.title}</h2>}
            <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{state.opts.message}</p>
            <div className="modal-actions">
              {state.type === "confirm" ? (
                <>
                  <button className="btn-secondary" onClick={handleCancel}>
                    {(state.opts as DialogOptions).cancelText ?? t("common.cancel")}
                  </button>
                  <button
                    className={(state.opts as DialogOptions).variant === "danger" ? "btn-danger" : "btn-primary"}
                    onClick={handleConfirm}
                    autoFocus
                  >
                    {(state.opts as DialogOptions).confirmText ?? t("common.yes")}
                  </button>
                </>
              ) : (
                <button className="btn-primary" onClick={handleConfirm} autoFocus>
                  {(state.opts as AlertOptions).okText ?? t("common.yes")}
                </button>
              )}
            </div>
          </Modal>,
          document.body
        )}
    </DialogContext.Provider>
  )
}
