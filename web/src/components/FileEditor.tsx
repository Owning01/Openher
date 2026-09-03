import { memo, useState, useEffect, useRef, useCallback } from "react"
import { api } from "../api"
import { shell } from "../shell"
import { ModalHeader } from "./ModalHeader"
import { CheckIcon } from "../Icons"
import { useT } from "../i18n-context"
import { basename } from "../utils"
import { LiteEditor } from "./LiteEditor"
import { langFromFilename } from "../utils/highlight"
import type { ServerConfig } from "../types"

type Props = {
  config: ServerConfig
  path: string
  directory?: string
  onClose: () => void
}

// Modal de edición: carga/guardado/autoguardado + cromo. El editor en sí es
// LiteEditor (highlight con debounce, Tab/Shift-Tab, multi-cursor,
// autocompletado, find, diff sin guardar): sin lógica de edición duplicada.
export const FileEditor = memo(function FileEditor({ config, path, directory, onClose }: Props) {
  const t = useT()
  const [content, setContent] = useState("")
  const [saved, setSaved] = useState("")
  const [cursor, setCursor] = useState({ line: 1, col: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimerRef = useRef<number | null>(null)
  const contentRef = useRef(content)
  contentRef.current = content

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
            setSaved(r.content)
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
        setSaved(result.content)
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        // Intento de rescate con shell.fs.read si api.readFile falló (por paths absolutos de Windows)
        try {
          const r = await shell.fs.read(path)
          if (!cancelled) {
            setContent(r.content)
            setSaved(r.content)
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
        await api.writeFile(config, path, textToSave, directory)
      }
      setDirty(false)
      setSaved(textToSave)
      setLastSaved(new Date())
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar archivo"
      // v2 no tiene writeFile: mostrar error claro en vez de fallar silencioso
      if (/v2.*writeFile|writeFile.*v2/i.test(msg)) {
        setError("Guardar no disponible en API v2 (solo desktop).")
      } else {
        setError(msg)
      }
    } finally {
      setSaving(false)
    }
  }, [config, path, directory, saving])

  // Guardado inmediato (Ctrl+S del editor): vacía el debounce y guarda ya.
  const flushSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    void saveFile(contentRef.current)
  }, [saveFile])

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

  const handleChange = useCallback((v: string) => {
    setContent(v)
    setDirty(true)
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content file-editor" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="File Editor">
        <ModalHeader title={basename(path)} titleTooltip={path} onClose={onClose}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem" }}>
            {saving ? (
              <span style={{ color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: 6 }}>Guardando...</span>
            ) : dirty ? (
              <span style={{ color: "var(--warning)", display: "inline-flex", alignItems: "center", gap: 6 }}>Modificado (autoguardando)</span>
            ) : lastSaved ? (
              <span style={{ color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 6 }}><CheckIcon size={12} /> Guardado</span>
            ) : null}
          </div>
        </ModalHeader>
        <div className="modal-body file-editor-body">
          {loading ? (
            <p className="subtle">{t('fileEditor.loading')}</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : (
            <LiteEditor
              path={path}
              value={content}
              onChange={handleChange}
              onSave={flushSave}
              onCursor={setCursor}
              savedValue={saved}
            />
          )}
        </div>
        {!loading && !error && (
          <div className="file-editor-status" aria-hidden="true">
            <span>Ln {cursor.line}, Col {cursor.col}</span>
            <span>{langFromFilename(path)}</span>
          </div>
        )}
      </div>
    </div>
  )
})
