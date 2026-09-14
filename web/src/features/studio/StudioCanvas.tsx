import { memo, useEffect, useMemo, useRef, useState } from "react"
import { BrowserVisualOverlay, type BrowserPickedElement } from "../../components/BrowserVisualOverlay"
import { useT } from "../../i18n-context"
import { frameSrc } from "./frameSrc"

type Props = {
  url: string
  inspectMode: boolean
  inspectTool: "picker" | "pod"
  onToggleInspectTool: (tool: "picker" | "pod") => void
  onPick: (el: BrowserPickedElement) => void
  onExitInspect: () => void
  onReload: () => void
  reloadKey?: number
  onSelectEntry?: (entry: string) => void
  htmlFiles?: string[]
  entryPoint?: string
}

const Icon = function Icon({ path, size = 15 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

export const StudioCanvas = memo(function StudioCanvas({
  url, inspectMode, inspectTool, onToggleInspectTool, onPick, onExitInspect, onReload,
  reloadKey, onSelectEntry, htmlFiles, entryPoint,
}: Props) {
  const t = useT()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [loading, setLoading] = useState(true)
  const src = useMemo(() => frameSrc(url, inspectMode), [url, inspectMode])

  useEffect(() => { setLoading(true) }, [src, reloadKey])

  const toggle = (tool: "picker" | "pod") => {
    onToggleInspectTool(tool)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0, minHeight: 0 }}>
      <div className="studio-canvas-toolbar" style={{
        display: "flex", alignItems: "center", gap: 6, padding: "0 10px", height: 38, flexShrink: 0,
        borderBottom: "1px solid var(--border)", background: "var(--surface)",
      }}>
        <button type="button" className={`btn-icon compact${inspectMode && inspectTool === "picker" ? " active" : ""}`}
          onClick={() => toggle("picker")} title={t('studio.selectElement')} aria-label={t('studio.selectElement')}
          aria-pressed={inspectMode && inspectTool === "picker"}
          style={inspectMode && inspectTool === "picker" ? { color: "var(--primary)", background: "var(--primary-soft)" } : undefined}>
          <Icon path="M3 3l7.5 17 2.3-6.2L19 11.5z" />
        </button>
        <button type="button" className={`btn-icon compact${inspectMode && inspectTool === "pod" ? " active" : ""}`}
          onClick={() => toggle("pod")} title={t('studio.selectArea')} aria-label={t('studio.selectArea')}
          aria-pressed={inspectMode && inspectTool === "pod"}
          style={inspectMode && inspectTool === "pod" ? { color: "var(--primary)", background: "var(--primary-soft)" } : undefined}>
          <Icon path="M4 4h16v16H4z" />
        </button>
        <button type="button" className="btn-icon compact" onClick={onReload} title={t('studio.reload')} aria-label={t('studio.reload')}>
          <Icon path="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" />
        </button>
        <div style={{
          flex: 1, minWidth: 0, height: 26, display: "flex", alignItems: "center", gap: 6, padding: "0 9px",
          background: "var(--surface-subtle)", border: "1px solid var(--border)", borderRadius: 7,
          fontSize: 11, color: "var(--muted)",
        }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url || "about:blank"}</span>
        </div>
        {htmlFiles && htmlFiles.length > 1 && onSelectEntry && (
          <select value={entryPoint} onChange={(e) => onSelectEntry(e.target.value)}
            aria-label={t('studio.entryPoint')}
            style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, padding: "3px 5px" }}>
            {htmlFiles.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
        {inspectMode && (
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--primary)", background: "var(--primary-soft)", padding: "3px 8px", borderRadius: 999 }}>
            {t('studio.inspecting')}
          </span>
        )}
      </div>
      <div style={{ position: "relative", flex: 1, minHeight: 0, background: "#fff" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, pointerEvents: "none", color: "var(--muted)", fontSize: 12 }}>
            {t('studio.loading')}
          </div>
        )}
        <iframe
          key={`${src}#${reloadKey ?? 0}`}
          ref={iframeRef}
          src={src}
          onLoad={() => setLoading(false)}
          title={t('studio.title')}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          allow="clipboard-read; clipboard-write"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", background: "#fff" }}
        />
        {inspectMode && (
          <BrowserVisualOverlay
            iframeRef={iframeRef}
            enabled={inspectMode}
            url={url}
            onPick={onPick}
            onExit={onExitInspect}
          />
        )}
      </div>
    </div>
  )
})
