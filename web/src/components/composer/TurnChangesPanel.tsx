import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useT } from "../../i18n-context"
import { useOutsideClick } from "../../hooks/useOutsideClick"
import { BranchIcon } from "../../Icons"
import { FileTypeIcon } from "../FileTypeIcon"
import { DiffStatBadge, toRelativePath } from "../ToolPart"
import { DiffView } from "../DiffView"
import type { TurnChanges } from "../../types"

type TurnChangesPanelProps = {
  turns?: TurnChanges[]
  directory?: string
}

/**
 * Resumen de cambios por turno (estilo Copilot/Cursor): botón colapsado con
 * totales del último turno y panel con pager de turnos + diff por archivo.
 */
export const TurnChangesPanel = memo(function TurnChangesPanel({ turns: turnChanges, directory }: TurnChangesPanelProps) {
  const t = useT()
  const [showTurnChanges, setShowTurnChanges] = useState(false)
  const [turnIdx, setTurnIdx] = useState(-1)
  const [openPatch, setOpenPatch] = useState<string | null>(null)
  const turnWrapRef = useRef<HTMLDivElement | null>(null)
  const closeTurnChanges = useCallback(() => setShowTurnChanges(false), [])
  useOutsideClick(turnWrapRef, closeTurnChanges, showTurnChanges)
  useEffect(() => {
    if (!showTurnChanges) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowTurnChanges(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [showTurnChanges])
  const turns = turnChanges ?? []
  const activeTurnIdx = turns.length === 0 ? -1 : turnIdx < 0 ? turns.length - 1 : Math.min(turnIdx, turns.length - 1)
  const activeTurn = activeTurnIdx >= 0 ? turns[activeTurnIdx]! : null
  const latestTurn = turns.length > 0 ? turns[turns.length - 1]! : null
  const latestTotals = useMemo(() => {
    let add = 0
    let del = 0
    for (const f of latestTurn?.files ?? []) { add += f.additions ?? 0; del += f.deletions ?? 0 }
    return { add, del, count: latestTurn?.files.length ?? 0 }
  }, [latestTurn])

  if (!latestTurn) return null

  return (
    <div className="turn-changes-row">
      <div ref={turnWrapRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          type="button"
          className="turn-changes-btn"
          onClick={() => { setTurnIdx(turns.length - 1); setOpenPatch(null); setShowTurnChanges((v) => !v) }}
          aria-expanded={showTurnChanges}
          title={t('diff.filesModified', { count: latestTotals.count }) ?? "Archivos cambiados en este turno"}
        >
          <BranchIcon size={13} />
          <span>{latestTotals.count} archivo{latestTotals.count === 1 ? "" : "s"}</span>
          <span className="turn-add">+{latestTotals.add}</span>
          <span className="turn-del">−{latestTotals.del}</span>
        </button>
        {showTurnChanges && activeTurn && (
          <div className="turn-changes-panel fade-in" role="dialog" aria-label="Cambios del turno">
            <div className="turn-changes-head">
              <strong>Cambios del turno</strong>
              <span className="turn-add">+{activeTurn.files.reduce((n, f) => n + (f.additions ?? 0), 0)}</span>
              <span className="turn-del">−{activeTurn.files.reduce((n, f) => n + (f.deletions ?? 0), 0)}</span>
              <span style={{ flex: 1 }} />
              <span className="turn-pager">
                <button type="button" disabled={activeTurnIdx <= 0} onClick={() => { setTurnIdx(activeTurnIdx - 1); setOpenPatch(null) }} aria-label="Turno anterior">‹</button>
                <span>{activeTurnIdx + 1}/{turns.length}</span>
                <button type="button" disabled={activeTurnIdx >= turns.length - 1} onClick={() => { setTurnIdx(activeTurnIdx + 1); setOpenPatch(null) }} aria-label="Turno siguiente">›</button>
              </span>
            </div>
            {activeTurn.label && <div className="turn-changes-label" title={activeTurn.label}>{activeTurn.label}</div>}
            <div className="turn-changes-files">
              {activeTurn.files.map((f) => {
                const key = `${activeTurnIdx}:${f.file}`
                const isOpen = openPatch === key
                return (
                  <div key={key}>
                    <button
                      type="button"
                      className="turn-file-row"
                      onClick={() => setOpenPatch((p) => (p === key ? null : key))}
                      aria-expanded={isOpen}
                    >
                      <FileTypeIcon name={f.file || ""} size={14} />
                      <span className="turn-file-name" title={f.file}>{toRelativePath(f.file || "", directory)}</span>
                      <DiffStatBadge add={f.additions ?? 0} del={f.deletions ?? 0} />
                      <span className={`turn-chev${isOpen ? " open" : ""}`}>›</span>
                    </button>
                    {isOpen && f.patch && (
                      <div className="turn-patch">
                        <DiffView patch={f.patch} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="turn-changes-foot">Solo este turno · clic en un archivo para ver el diff</div>
          </div>
        )}
      </div>
    </div>
  )
})
