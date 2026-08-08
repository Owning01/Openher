import { memo, useState, useCallback, useEffect } from "react"
import { PlusIcon, FolderIcon, LoadingIcon, CloseIcon, PencilIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { FileEntry } from "../types"
import { Modal } from "./Modal"
import { dirParent, dirParts, partsToDir, toAbsolute } from "../hooks/useFolderPicker"

type FolderPickerProps = {
  pickerDir: string
  pickerItems: FileEntry[]
  pickerLoading: boolean
  pickerError: string | null
  creatingSession: boolean
  projects?: string[]
  onBrowse: (path: string) => void
  onCreate: (path: string) => void
  onCreateDefault: () => void
  onClose: () => void
}

// Navegación por rutas ABSOLUTAS: el server lista cualquier directorio de la
// máquina (path relativo "" = raíz de ese directorio).
export const FolderPicker = memo(function FolderPicker({
  pickerDir, pickerItems, pickerLoading, pickerError, creatingSession, projects,
  onBrowse, onCreate, onCreateDefault, onClose
}: FolderPickerProps) {
  const t = useT()
  const [showManual, setShowManual] = useState(false)
  const [manualPath, setManualPath] = useState("")
  const [showProjects, setShowProjects] = useState(true)
  const uniqueProjects = projects ? [...new Set(projects)].filter(Boolean).sort() : []

  const handleManualGo = useCallback(() => {
    if (manualPath.trim()) {
      onBrowse(toAbsolute(pickerDir, manualPath))
      setShowManual(false)
      setManualPath("")
    }
  }, [manualPath, pickerDir, onBrowse])

  useEffect(() => {
    if (showManual) setManualPath(pickerDir)
  }, [pickerDir, showManual])

  const parent = dirParent(pickerDir)
  const segs = dirParts(pickerDir)

  return (
    <Modal onClose={onClose} className="folder-picker" aria-labelledby="new-session-title">
      <div className="fp-header">
        <h2 id="new-session-title">{t('sessions.newSessionTitle')}</h2>
        <button className="btn-icon btn-ghost" onClick={onClose} aria-label={t('session.cancel')}>
          <CloseIcon size={18} />
        </button>
      </div>

      {uniqueProjects.length > 0 && (
        <div className="fp-section">
          <button className="fp-collapse-toggle" onClick={() => setShowProjects((v) => !v)}>
            <span>Proyectos existentes</span>
            <small>{showProjects ? "▼" : "▶"} {uniqueProjects.length}</small>
          </button>
          {showProjects && (
            <div className="fp-project-list">
              {uniqueProjects.map((dir) => (
                <button key={dir} type="button" className="fp-project-row" onClick={() => onCreate(dir)}>
                  <FolderIcon size={16} />
                  <span className="fp-project-name">{dir}</span>
                  <small className="fp-project-action">Nueva sesión</small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="fp-path-bar">
        <div className="fp-path-display">
          {segs.length === 0 ? (
            <span className="fp-path-root">Proyecto (raíz)</span>
          ) : (
            segs.map((seg, i) => (
              <span key={`${seg}-${i}`} className="fp-path-seg">
                {i > 0 && <span className="fp-path-sep">›</span>}
                {i < segs.length - 1 ? (
                  <button className="fp-path-link" onClick={() => onBrowse(partsToDir(segs.slice(0, i + 1)))}>
                    {seg}
                  </button>
                ) : (
                  <span className="fp-path-current">{seg}</span>
                )}
              </span>
            ))
          )}
        </div>
        <button className="btn-icon btn-ghost fp-path-edit" onClick={() => { setShowManual((v) => !v); setManualPath(pickerDir) }} title="Editar ruta" aria-label="Editar ruta">
          <PencilIcon size={14} />
        </button>
      </div>

      {showManual && (
        <div className="fp-manual-row">
          <input type="text" className="search" placeholder="Escribí una ruta absoluta (C:\Users\...) o relativa al directorio actual" value={manualPath} onChange={(e) => setManualPath(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleManualGo() }} autoFocus />
          <button className="btn-primary compact" disabled={!manualPath.trim()} onClick={handleManualGo}>Ir</button>
        </div>
      )}

      {pickerError && (
        <div className="fp-error-banner">
          <span>{pickerError}</span>
        </div>
      )}

      <div className="fp-actions-bar">
        <button type="button" className="btn-secondary" onClick={onCreateDefault} disabled={creatingSession}>
          Usar default
        </button>
        <button type="button" className="btn-primary" onClick={() => onCreate(pickerDir)} disabled={creatingSession}>
          {creatingSession ? <LoadingIcon size={16} /> : <PlusIcon size={16} />}
          Crear aquí
        </button>
      </div>

      <div className="fp-list">
        {pickerLoading ? (
          <div className="fp-loading">
            <LoadingIcon size={24} />
            <span>Cargando...</span>
          </div>
        ) : (
          <>
            {parent !== null && (
              <button type="button" className="fp-row" onClick={() => onBrowse(parent)}>
                <span className="fp-row-icon">📂</span>
                <span className="fp-row-name">..</span>
                <small className="fp-row-hint">Carpeta superior</small>
              </button>
            )}
            {pickerItems.length === 0 ? (
              <span className="fp-row fp-row-empty">
                <span className="fp-row-name">(carpeta vacía)</span>
              </span>
            ) : pickerItems.map((item) => (
              <button key={item.absolute} type="button" className="fp-row"
                onClick={() => onBrowse(item.absolute)}>
                <span className="fp-row-icon">📁</span>
                <span className="fp-row-name">{item.name}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </Modal>
  )
})
