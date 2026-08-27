import { memo, useState, Suspense, type DragEvent } from "react"
import { calcDropZone, type DropZone } from "./model"
import { parseDragPayload, isTerminalTabPayload } from "../../utils/drag"
import { lazyRetry } from "../../utils/lazyRetry"
import type { ShellPanelKind } from "../../types"

const ShellPanel = lazyRetry(() =>
  import("../../components/shellPanels").then((m) => ({ default: m.ShellPanel }))
)

const PANEL_SUSPENSE_FALLBACK = (
  <div
    className="panel-loading"
    style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}
  >
    Cargando…
  </div>
)

export interface ShellPanelCellProps {
  index: number
  panelId: string
  kind: Exclude<ShellPanelKind, "session">
  cwd?: string
  sessionID?: string | null
  active: boolean
  onActivate: () => void
  onClose: () => void
  onOpenSessionDir: (dir: string) => void
  onSplitSession: (index: number, dir: "left" | "right" | "top" | "bottom" | "center", specificId?: string) => void
  onSwapPanels: (from: number, to: number) => void
  onOpenFile?: (path: string, index?: number, zone?: "left" | "right" | "top" | "bottom" | "center") => void
}

export const ShellPanelCell = memo(function ShellPanelCell({
  index,
  panelId,
  kind,
  cwd,
  sessionID,
  active,
  onActivate,
  onClose,
  onOpenSessionDir,
  onSplitSession,
  onSwapPanels,
  onOpenFile,
}: ShellPanelCellProps) {
  const [dropZone, setDropZone] = useState<DropZone | null>(null)

  const handleCalcDropZone = (e: DragEvent<HTMLDivElement>): DropZone => {
    return calcDropZone(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect(), kind)
  }

  return (
    <div
      className={`desktop-shell-cell-wrapper${active ? " active" : ""}`}
      style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
      onClick={onActivate}
      onDragOver={(e) => {
        e.preventDefault()
        setDropZone(handleCalcDropZone(e))
      }}
      onDragLeave={() => setDropZone(null)}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const zone = handleCalcDropZone(e)
        setDropZone(null)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const f = e.dataTransfer.files[0]
          const filePath = (f as any).path || f.name
          if (filePath) {
            onOpenFile?.(filePath, index, zone)
            return
          }
        }
        const raw = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain")
        if (raw) {
          if (isTerminalTabPayload(raw)) {
            onSplitSession(index, zone, raw)
            return
          }
          const payload = parseDragPayload(raw)
          if (payload.kind === "panel") {
            if (zone === "center") {
              if (payload.idx !== index) onSwapPanels(payload.idx, index)
            } else {
              onSplitSession(index, zone, raw)
            }
          } else if (payload.kind === "session") {
            onSplitSession(index, zone, payload.id)
          } else if (payload.kind === "kind") {
            onSplitSession(index, zone, raw)
          } else if (payload.kind === "tab") {
            // Ignorar tab suelto
          } else if (payload.kind === "file") {
            onOpenFile?.(payload.path, index, zone)
          }
        }
      }}
    >
      {dropZone && (
        <div
          style={{
            position: "absolute",
            zIndex: 100,
            pointerEvents: "none",
            background: "rgba(88, 166, 255, 0.25)",
            border: "2px dashed #58a6ff",
            borderRadius: "var(--radius-md)",
            transition: "all 0.1s ease",
            ...(dropZone === "left"
              ? { inset: "0 50% 0 0" }
              : dropZone === "right"
              ? { inset: "0 0 0 50%" }
              : dropZone === "top"
              ? { inset: "0 0 50% 0" }
              : dropZone === "bottom"
              ? { inset: "50% 0 0 0" }
              : { inset: "0" }),
          }}
        />
      )}
      <button
        type="button"
        className="shell-panel-close"
        title="Cerrar panel"
        aria-label="Cerrar panel"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        ×
      </button>
      <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
        <ShellPanel
          kind={kind}
          cwd={cwd}
          sessionID={sessionID}
          onOpenSessionDir={onOpenSessionDir}
          onOpenFile={(p: string) => onOpenFile?.(p, index, "center")}
          panelIndex={index}
          panelId={panelId}
        />
      </Suspense>
    </div>
  )
})
