import { memo, useCallback, useState } from "react"
import { Modal } from "../../components/Modal"
import { MonitorIcon, FolderIcon } from "../../Icons"
import { shell, type FsEntry } from "../../shell"

export type OpenWithRecent = { app: string; name: string }

const RECENT_KEY = "opencode.explorer.openWithRecent"
const RECENT_MAX = 10

export function loadOpenWithRecent(): OpenWithRecent[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const arr = raw ? JSON.parse(raw) : []
    if (!Array.isArray(arr)) return []
    return arr
      .filter((r: unknown): r is OpenWithRecent =>
        typeof r === "object" && r !== null &&
        typeof (r as OpenWithRecent).app === "string" && !!(r as OpenWithRecent).app)
      .slice(0, RECENT_MAX)
  } catch {
    return []
  }
}

function saveOpenWithRecent(app: string) {
  const name = app.split(/[/\\]/).filter(Boolean).pop() || app
  const next = [{ app, name }, ...loadOpenWithRecent().filter((r) => r.app !== app)].slice(0, RECENT_MAX)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {}
}

export function removeOpenWithRecent(app: string) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(loadOpenWithRecent().filter((r) => r.app !== app)))
  } catch {}
}

export const OpenWithDialog = memo(function OpenWithDialog({
  file,
  onClose,
  showNotice,
}: {
  file: FsEntry
  onClose: () => void
  showNotice: (msg: string) => void
}) {
  const [appPath, setAppPath] = useState("")
  const [busy, setBusy] = useState<"default" | "custom" | "browse" | null>(null)
  const [recent, setRecent] = useState<OpenWithRecent[]>(() => loadOpenWithRecent())

  const openDefault = useCallback(async () => {
    if (busy) return
    setBusy("default")
    try {
      await shell.fs.openDefault(file.path)
      showNotice(`Abierto con programa predeterminado: ${file.name}`)
      onClose()
    } catch (e) {
      showNotice(`No se pudo abrir: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(null)
    }
  }, [busy, file, showNotice, onClose])

  const openWith = useCallback(async (app: string) => {
    const clean = app.trim()
    if (!clean || busy) return
    setBusy("custom")
    try {
      await shell.fs.openWith(file.path, clean)
      saveOpenWithRecent(clean)
      setRecent(loadOpenWithRecent())
      showNotice(`Abierto con ${clean.split(/[/\\]/).filter(Boolean).pop()}: ${file.name}`)
      onClose()
    } catch (e) {
      showNotice(`No se pudo abrir: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(null)
    }
  }, [busy, file, showNotice, onClose])

  const browse = useCallback(async () => {
    if (busy) return
    setBusy("browse")
    try {
      const picked = await shell.fs.pickApp()
      if (picked?.path) setAppPath(picked.path)
    } catch {
      showNotice("No se pudo abrir el selector de programa")
    } finally {
      setBusy(null)
    }
  }, [busy, showNotice])

  return (
    <Modal onClose={onClose} aria-labelledby="openwith-title">
      <h3 id="openwith-title" className="openwith-title">Abrir con</h3>
      <p className="openwith-file" title={file.path}>{file.name}</p>

      <button
        type="button"
        className="overflow-item openwith-default"
        disabled={busy !== null}
        onClick={openDefault}
      >
        <span><MonitorIcon size={14} /></span>{" "}
        Programa predeterminado
      </button>

      {recent.length > 0 && (
        <>
          <div className="openwith-sep">Recientes</div>
          {recent.map((r) => (
            <div key={r.app} className="openwith-recent-row">
              <button
                type="button"
                className="overflow-item openwith-recent"
                disabled={busy !== null}
                onClick={() => openWith(r.app)}
                title={r.app}
              >
                <span className="openwith-recent-name">{r.name}</span>
                <span className="openwith-recent-path">{r.app}</span>
              </button>
              <button
                type="button"
                className="btn-icon compact"
                title="Quitar de recientes"
                aria-label={`Quitar ${r.name} de recientes`}
                onClick={() => {
                  removeOpenWithRecent(r.app)
                  setRecent(loadOpenWithRecent())
                }}
              >
                ×
              </button>
            </div>
          ))}
        </>
      )}

      <div className="openwith-sep">Elegir otro programa</div>
      <div className="openwith-custom-row">
        <input
          type="text"
          className="pcf-search openwith-input"
          placeholder="C:\...\programa.exe"
          value={appPath}
          onChange={(e) => setAppPath(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") openWith(appPath)
          }}
          aria-label="Ruta del programa"
          spellCheck={false}
        />
        <button
          type="button"
          className="btn-secondary compact"
          disabled={busy !== null}
          onClick={browse}
          title="Buscar programa en disco"
        >
          <FolderIcon size={13} /> Examinar…
        </button>
      </div>

      <div className="openwith-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={!appPath.trim() || busy !== null}
          onClick={() => openWith(appPath)}
        >
          {busy ? "Abriendo…" : "Abrir"}
        </button>
      </div>
    </Modal>
  )
})
