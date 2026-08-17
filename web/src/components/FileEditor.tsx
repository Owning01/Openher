import { memo, useState, useEffect, useRef, useCallback } from "react"
import { api } from "../api"
import { shell } from "../shell"
import { ModalHeader } from "./ModalHeader"
import { useT } from "../i18n-context"
import { basename } from "../utils"
import type { ServerConfig } from "../types"

type Props = {
  config: ServerConfig
  path: string
  directory?: string
  onClose: () => void
}

export const FileEditor = memo(function FileEditor({ config, path, directory, onClose }: Props) {
  const t = useT()
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setDirty(false)

    const load = async () => {
      // Si la ruta es absoluta o estamos en desktop, probamos leer vía shell nativo primero
      if (typeof window !== "undefined" && (window as any).__OPENCODE_DESKTOP__) {
        try {
          const r = await shell.fs.read(path)
          if (!cancelled) {
            setContent(r.content)
            setLoading(false)
            return
          }
        } catch {
          // Si falla shell.fs.read, cae al endpoint del servidor
        }
      }

      try {
        const result = await api.readFile(config, path, directory)
        if (cancelled) return
        if (result.type === "binary") {
          setError("Binary file — cannot display")
          setLoading(false)
          return
        }
        setContent(result.content)
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        // Intento de rescate con shell.fs.read si api.readFile falló (por paths absolutos de Windows)
        try {
          const r = await shell.fs.read(path)
          if (!cancelled) {
            setContent(r.content)
            setLoading(false)
            return
          }
        } catch {
          // ignora
        }
        setError(err instanceof Error ? err.message : "Failed to load file")
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [config, path, directory])

  const saveFile = useCallback(async (textToSave: string) => {
    if (saving) return
    setSaving(true)
    try {
      if (typeof window !== "undefined" && (window as any).__OPENCODE_DESKTOP__) {
        const b64 = btoa(unescape(encodeURIComponent(textToSave)))
        await shell.fs.write(path, b64)
      } else {
        try {
          const b64 = btoa(unescape(encodeURIComponent(textToSave)))
          await shell.fs.write(path, b64)
        } catch {
          // ignore
        }
      }
      setDirty(false)
      setLastSaved(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar archivo")
    } finally {
      setSaving(false)
    }
  }, [path, saving])

  // Autoguardado con debounce de 1000ms
  useEffect(() => {
    if (!dirty || loading) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    autoSaveTimerRef.current = window.setTimeout(() => {
      void saveFile(content)
    }, 1000)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [content, dirty, loading, saveFile])

  // Atajo de teclado Ctrl+S / Cmd+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        if (dirty) {
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
          void saveFile(content)
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [content, dirty, saveFile])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content file-editor" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="File Editor">
        <ModalHeader title={basename(path)} titleTooltip={path} onClose={onClose}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.75rem" }}>
            {saving ? (
              <span style={{ color: "var(--primary)" }}>Guardando...</span>
            ) : dirty ? (
              <span style={{ color: "var(--warning, #e3b341)" }}>● Modificado (autoguardando)</span>
            ) : lastSaved ? (
              <span style={{ color: "var(--color-success, #3fb950)" }}>✓ Guardado</span>
            ) : null}
          </div>
        </ModalHeader>
        <div className="modal-body file-editor-body">
          {loading ? (
            <p className="subtle">{t('fileEditor.loading')}</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : (
            <textarea
              className="file-editor-textarea"
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setDirty(true)
              }}
              spellCheck={false}
              autoFocus
            />
          )}
        </div>
      </div>
    </div>
  )
})
