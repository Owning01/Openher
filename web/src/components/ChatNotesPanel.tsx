import { memo, useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CloseIcon, CopyIcon, CheckIcon, TrashIcon } from "../Icons"
import { useT } from "../i18n-context"
import { CHAT_NOTES_MAX, readChatNotes, writeChatNotes } from "../utils/chatNotes"

// Mini bloc de notas del chat: un <textarea> plano por sesión con guardado
// diferido (400ms). Se monta solo al abrir y se desmonta al cerrar: cero costo
// de RAM en reposo. Sin markdown/preview/librerías.

type Props = {
  sessionID: string | null
  onClose: () => void
  onInsert?: (text: string) => void
}

export const ChatNotesPanel = memo(function ChatNotesPanel({ sessionID, onClose, onInsert }: Props) {
  const t = useT()
  const [value, setValue] = useState(() => readChatNotes(sessionID))
  const [copied, setCopied] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const boxRef = useRef<HTMLElement | null>(null)
  const areaRef = useRef<HTMLTextAreaElement | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  // Cambio de chat con el bloc abierto: recarga la nota de la nueva sesión.
  useEffect(() => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    setValue(readChatNotes(sessionID))
    setConfirmClear(false)
  }, [sessionID])

  // Guardado diferido + flush al cerrar/desmontar (cero data loss).
  useEffect(() => {
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      writeChatNotes(sessionID, valueRef.current)
    }, 400)
    return () => { if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null } }
  }, [value, sessionID])
  useEffect(() => () => { writeChatNotes(sessionID, valueRef.current) }, [sessionID])

  // Foco al abrir + Escape cierra (el chat sigue escribible de fondo).
  useEffect(() => {
    areaRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  // Drag del header (DOM directo a 60fps, commit al soltar).
  const startDrag = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest("button")) return
    e.preventDefault()
    const el = boxRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const offX = e.clientX - r.left
    const offY = e.clientY - r.top
    el.style.left = `${r.left}px`
    el.style.top = `${r.top}px`
    el.style.right = "auto"
    el.style.bottom = "auto"
    document.body.style.userSelect = "none"
    const onMove = (ev: PointerEvent) => {
      el.style.left = `${Math.max(-r.width + 80, Math.min(ev.clientX - offX, window.innerWidth - 80))}px`
      el.style.top = `${Math.max(0, Math.min(ev.clientY - offY, window.innerHeight - 40))}px`
    }
    const onUp = () => {
      document.body.style.userSelect = ""
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [])

  const handleCopy = useCallback(() => {
    const v = valueRef.current
    if (!v) return
    navigator.clipboard.writeText(v).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }, [])

  const handleClear = useCallback(() => {
    if (!valueRef.current) return
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
      return
    }
    setConfirmClear(false)
    setValue("")
    writeChatNotes(sessionID, "")
    areaRef.current?.focus()
  }, [confirmClear, sessionID])

  const handleInsert = useCallback(() => {
    const v = valueRef.current.trim()
    if (!v || !onInsert) return
    onInsert(v)
  }, [onInsert])

  return createPortal(
    <section ref={boxRef} role="dialog" aria-label={t("notes.title")} className="chat-notes">
      <header className="chat-notes-head" onPointerDown={startDrag}>
        <span className="chat-notes-title">{t("notes.title")}</span>
        <span className="chat-notes-actions">
          {onInsert && (
            <button type="button" className="btn-icon compact" onClick={handleInsert}
              disabled={!value.trim()} title={t("notes.insert")} aria-label={t("notes.insert")}>
              <span className="chat-notes-insert-glyph" aria-hidden="true">→</span>
            </button>
          )}
          <button type="button" className="btn-icon compact" onClick={handleCopy}
            disabled={!value} title={t("notes.copy")} aria-label={t("notes.copy")}>
            {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
          </button>
          <button type="button" className={`btn-icon compact${confirmClear ? " danger-armed" : ""}`}
            onClick={handleClear} disabled={!value}
            title={confirmClear ? t("notes.confirmClear") : t("notes.clear")}
            aria-label={confirmClear ? t("notes.confirmClear") : t("notes.clear")}>
            <TrashIcon size={13} />
          </button>
          <button type="button" className="btn-icon compact" onClick={onClose}
            title={t("panel.close")} aria-label={t("panel.close")}>
            <CloseIcon size={13} />
          </button>
        </span>
      </header>
      <div className="chat-notes-paper">
        <textarea
          ref={areaRef}
          className="chat-notes-area"
          value={value}
          maxLength={CHAT_NOTES_MAX}
          onChange={(e) => { setValue(e.target.value); setConfirmClear(false) }}
          placeholder={t("notes.placeholder")}
          aria-label={t("notes.title")}
          spellCheck
        />
      </div>
      <footer className="chat-notes-foot">
        <span className="chat-notes-saved" aria-live="polite">
          <span className="chat-notes-dot" aria-hidden="true" />
          {t("notes.saved")}
        </span>
        <span className="chat-notes-count">{t("notes.chars", { count: value.length })}</span>
      </footer>
    </section>,
    document.body
  )
})
