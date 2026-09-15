import { memo, useState } from "react"
import { createPortal } from "react-dom"
import { useT } from "../i18n-context"
import { CloseIcon } from "../Icons"
import { GoUsagePanel, useGoUsage } from "./GoUsagePanel"
import { usageTone } from "../data/goModels"
import "../styles/debate.css"

const TONE_COLOR: Record<string, string> = { ok: "#59d4a0", warn: "#e0b15e", bad: "#f2777a" }

/**
 * Acceso rápido al uso de OpenCode Go desde el chat: chip con el % mensual
 * + modal con el panel completo (barras, modelos, key). Vive en el header
 * del ChatView, al lado del chip de debate.
 */
export const GoChip = memo(function GoChip() {
  const t = useT()
  const { state } = useGoUsage()
  const [open, setOpen] = useState(false)

  const monthly = state.kind === "ready" ? state.usage.usage.monthly : null
  const pct = monthly ? Math.max(0, Math.min(100, Math.round(monthly.percent ?? 0))) : null
  const tone = usageTone(pct ?? 0)

  return (
    <>
      <button
        type="button"
        className="debate-chip"
        onClick={() => setOpen(true)}
        title={t("go.openUsage")}
        aria-label={t("go.openUsage")}
        style={pct !== null ? { borderColor: TONE_COLOR[tone] } : undefined}
      >
        <span className="debate-dot" style={pct !== null ? { background: TONE_COLOR[tone] } : undefined} />
        <span>Go{pct !== null ? ` ${pct}%` : ""}</span>
      </button>
      {open &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setOpen(false)}>
            <div
              className="modal-card"
              role="dialog"
              aria-label={t("go.title")}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 480, maxHeight: "85vh", overflowY: "auto" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>{t("go.title")}</h3>
                <button type="button" className="btn-icon btn-ghost" onClick={() => setOpen(false)} aria-label={t("go.close")}>
                  <CloseIcon size={16} />
                </button>
              </div>
              <GoUsagePanel />
            </div>
          </div>,
          document.body,
        )}
    </>
  )
})
