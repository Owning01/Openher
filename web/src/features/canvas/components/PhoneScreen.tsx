import { useRef } from "react"
import type { CanvasPart, CanvasScreen } from "../model/canvasTypes"
import { defaultPartHeight, isSquareKind, screenSizeOf } from "../model/canvasTypes"
import type { Scheme } from "../model/theme"
import { shapeFactor } from "../model/theme"
import type { ShapeScale } from "../model/theme"

export type GuideLines = { v: number[]; h: number[] }

type Props = {
  screen: CanvasScreen
  parts: CanvasPart[]
  scheme: Scheme
  shape: ShapeScale
  maxWidth?: number
  mode: "edit" | "preview"
  selectedId?: string | null
  guides?: GuideLines
  onSelect?: (partId: string | null) => void
  onMove?: (partId: string, x: number, y: number, commit: boolean) => void
  onTap?: (part: CanvasPart) => void
}

const DRAGGABLE_EXCLUDE = new Set(["topAppBar", "bottomNav"])

function variantBg(part: CanvasPart, scheme: Scheme): React.CSSProperties {
  switch (part.variant ?? "filled") {
    case "filled": return { background: scheme.primary, color: scheme.onPrimary }
    case "tonal": return { background: scheme.secondaryContainer, color: scheme.onSecondaryContainer }
    case "outlined": return { background: "transparent", color: scheme.primary, border: `1px solid ${scheme.outline}` }
    case "text": return { background: "transparent", color: scheme.primary }
  }
}

function PartBody({ part, scheme, r }: { part: CanvasPart; scheme: Scheme; r: (base: number) => number }) {
  const h = defaultPartHeight(part.kind)
  const v = variantBg(part, scheme)
  switch (part.kind) {
    case "topAppBar":
      return (
        <div className="m3e-bar m3e-bar-top">
          <span aria-hidden>=</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{part.label || "Titulo"}</span>
        </div>
      )
    case "bottomNav":
      return (
        <div className="m3e-bar m3e-bar-bottom">
          <span>Inicio</span><span>Buscar</span><span>Ajustes</span>
        </div>
      )
    case "button":
      return <div className="m3e-btn" style={v}>{part.icon ? <span aria-hidden>{part.icon}</span> : null}{part.label}</div>
    case "iconButton":
      return (
        <div style={{ ...v, width: "100%", height: "100%", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
          {part.icon ?? "+"}
        </div>
      )
    case "extendedFab":
      return (
        <div style={{ ...v, height: h, borderRadius: r(16), display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, padding: "0 20px" }}>
          {part.icon ? <span aria-hidden>{part.icon}</span> : null}{part.label}
        </div>
      )
    case "chip":
      return <div className="m3e-chip" style={{ borderRadius: r(8) }}>{part.label}</div>
    case "text":
      return <div className="m3e-text" style={{ fontSize: 28, fontWeight: 600 }}>{part.label}</div>
    case "card":
      return (
        <div className="m3e-card" style={{ borderRadius: r(20) }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{part.label}</div>
          <div style={{ fontSize: 14, color: "var(--m3-on-variant)", marginTop: 4 }}>Descripcion de la tarjeta</div>
        </div>
      )
    case "listItem":
      return (
        <div className="m3e-list" style={{ borderRadius: r(28) }}>
          <span aria-hidden style={{ fontSize: 22 }}>*</span>
          <span style={{ fontSize: 16 }}>{part.label}</span>
        </div>
      )
    case "switch":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: h }}>
          <span style={{ fontSize: 16 }}>{part.label}</span>
          <span style={{ marginLeft: "auto" }} className={`m3e-switch-track${part.checked ? " on" : ""}`}>
            <span className="m3e-switch-thumb" />
          </span>
        </div>
      )
    case "checkbox":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: h }}>
          <span style={{
            width: 18, height: 18, borderRadius: 2, flexShrink: 0,
            background: part.checked ? scheme.primary : "transparent",
            border: `2px solid ${part.checked ? scheme.primary : scheme.onVariant}`,
            color: scheme.onPrimary, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {part.checked ? "✓" : ""}
          </span>
          <span style={{ fontSize: 16 }}>{part.label}</span>
        </div>
      )
    case "radio":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: h }}>
          <span style={{
            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
            border: `2px solid ${part.checked ? scheme.primary : scheme.onVariant}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {part.checked ? <span style={{ width: 10, height: 10, borderRadius: "50%", background: scheme.primary }} /> : null}
          </span>
          <span style={{ fontSize: 16 }}>{part.label}</span>
        </div>
      )
    case "slider": {
      const val = part.value ?? 40
      return (
        <div style={{ display: "flex", alignItems: "center", height: h }}>
          <div style={{ position: "relative", width: "100%", height: 16, borderRadius: 8, background: scheme.secondaryContainer, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${val}%`, background: scheme.primary }} />
            <div style={{ position: "absolute", left: `calc(${val}% - 2px)`, top: -14, width: 4, height: 44, borderRadius: 2, background: scheme.primary }} />
          </div>
        </div>
      )
    }
    case "textField":
      return <div className="m3e-field" style={{ borderRadius: r(16) }}>{part.label}</div>
    case "divider":
      return <div className="m3e-divider" />
    case "fab":
      return <div className="m3e-fab" style={{ borderRadius: r(16), width: "100%", height: "100%" }}>{part.icon ?? "+"}</div>
    case "searchBar":
      return <div className="m3e-search">? {part.label}</div>
    case "image":
      return (
        <div style={{ width: "100%", height: "100%", borderRadius: r(20), background: scheme.surfaceHighest, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: scheme.onVariant }}>
          {part.icon ?? "^"}
        </div>
      )
    case "box":
      return <div style={{ width: "100%", height: "100%", borderRadius: r(28), background: scheme.surfaceHigh }} />
    case "badge":
      return (
        <div style={{
          minWidth: 16, height: 16, borderRadius: 8, background: scheme.error, color: scheme.onError,
          fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
        }}>
          {part.label}
        </div>
      )
    case "dialog":
      return (
        <div style={{ width: "100%", height: "100%", borderRadius: r(28), background: scheme.surfaceHigh, padding: 20, display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
          <div style={{ fontSize: 22, fontWeight: 500 }}>{part.label}</div>
          <div style={{ fontSize: 15, color: scheme.onVariant, marginTop: 8 }}>Confirma esta accion para continuar.</div>
          <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end", gap: 16, fontSize: 15, fontWeight: 600, color: scheme.primary }}>
            <span>Cancelar</span><span>Aceptar</span>
          </div>
        </div>
      )
    case "snackbar":
      return (
        <div style={{
          width: "100%", height: h, borderRadius: 8, background: scheme.inverseSurface, color: scheme.inverseOnSurface,
          display: "flex", alignItems: "center", padding: "0 16px", fontSize: 15, boxSizing: "border-box",
        }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{part.label}</span>
          <span style={{ marginLeft: "auto", color: scheme.inversePrimary, fontWeight: 600, paddingLeft: 12 }}>Deshacer</span>
        </div>
      )
    case "linearProgress": {
      const val = part.value
      return (
        <div style={{ display: "flex", alignItems: "center", height: h }}>
          <div style={{ width: "100%", height: 12, borderRadius: 6, background: scheme.secondaryContainer, overflow: "hidden", position: "relative" }}>
            {val === undefined
              ? <div className="m3e-indeterminate" style={{ background: scheme.primary }} />
              : <div style={{ width: `${val}%`, height: "100%", background: scheme.primary }} />}
          </div>
        </div>
      )
    }
    case "circularProgress": {
      const val = part.value
      const s = part.size ?? 48
      const R = 20, C = 2 * Math.PI * R
      return (
        <div style={{ width: s, height: s }}>
          <svg viewBox="0 0 48 48" width="100%" height="100%" className={val === undefined ? "m3e-spin" : undefined}>
            <circle cx="24" cy="24" r={R} fill="none" stroke={scheme.secondaryContainer} strokeWidth="5" />
            <circle cx="24" cy="24" r={R} fill="none" stroke={scheme.primary} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={val === undefined ? `${C * 0.25} ${C}` : `${(C * val) / 100} ${C}`} transform="rotate(-90 24 24)" />
          </svg>
        </div>
      )
    }
    case "loadingIndicator": {
      const s = part.size ?? 48
      return (
        <div style={{ width: s, height: s, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="m3e-loading" style={{ width: s * 0.7, height: s * 0.7, background: scheme.primary }} />
        </div>
      )
    }
  }
}

export function PhoneScreen({ screen, parts, scheme, shape, maxWidth = 300, mode, selectedId, guides, onSelect, onMove, onTap }: Props) {
  const { w: sw, h: sh } = screenSizeOf(screen)
  const scale = Math.min(1, maxWidth / sw)
  const factor = shapeFactor(shape)
  const r = (base: number) => Math.round(base * factor)
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)

  const vars = {
    "--m3-primary": scheme.primary,
    "--m3-on-primary": scheme.onPrimary,
    "--m3-primary-container": scheme.primaryContainer,
    "--m3-on-primary-container": scheme.onPrimaryContainer,
    "--m3-secondary-container": scheme.secondaryContainer,
    "--m3-on-secondary-container": scheme.onSecondaryContainer,
    "--m3-surface": scheme.surface,
    "--m3-surface-low": scheme.surfaceLow,
    "--m3-surface-container": scheme.surfaceContainer,
    "--m3-surface-high": scheme.surfaceHigh,
    "--m3-surface-highest": scheme.surfaceHighest,
    "--m3-on-surface": scheme.onSurface,
    "--m3-on-variant": scheme.onVariant,
    "--m3-outline": scheme.outline,
    "--m3-outline-variant": scheme.outlineVariant,
  } as React.CSSProperties

  return (
    <div className="m3e-scope">
      <div className="m3e-phone" style={{ width: sw * scale + 20 }}>
        <div className="m3e-screen" style={{ ...vars, width: sw * scale, height: sh * scale }}>
          <div style={{ width: sw, height: sh, transform: `scale(${scale})`, transformOrigin: "top left", position: "relative" }}>
            {mode === "edit" ? (
              <div style={{ position: "absolute", inset: 0 }} onClick={() => onSelect?.(null)} />
            ) : null}
            {parts.map((p) => {
              const square = isSquareKind(p.kind)
              const h = square ? (p.size ?? defaultPartHeight(p.kind)) : defaultPartHeight(p.kind)
              const w = square ? h : (p.w ?? sw)
              const boxH = p.kind === "box" ? (p.size ?? 220) : h
              const draggable = mode === "edit" && !DRAGGABLE_EXCLUDE.has(p.kind)
              return (
                <div
                  key={p.id}
                  className={`m3e-part${selectedId === p.id ? " m3e-selected" : ""}${mode === "preview" && (p.action || p.toggle) ? " m3e-tappable" : ""}`}
                  style={{
                    left: p.x,
                    top: p.y,
                    width: w,
                    height: boxH,
                    cursor: mode === "edit" ? (draggable ? "grab" : "default") : (p.action || p.toggle) ? "pointer" : "default",
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => {
                    if (mode !== "edit" || !draggable) return
                    onSelect?.(p.id)
                    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
                    dragRef.current = { id: p.id, startX: e.clientX, startY: e.clientY, origX: p.x, origY: p.y, moved: false }
                  }}
                  onPointerMove={(e) => {
                    const d = dragRef.current
                    if (!d || d.id !== p.id || !onMove) return
                    const dx = (e.clientX - d.startX) / scale
                    const dy = (e.clientY - d.startY) / scale
                    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3) return
                    d.moved = true
                    onMove(p.id, d.origX + dx, d.origY + dy, false)
                  }}
                  onPointerUp={() => {
                    const d = dragRef.current
                    dragRef.current = null
                    if (d && d.id === p.id && d.moved && onMove) onMove(p.id, p.x, p.y, true)
                  }}
                  onClick={(e) => {
                    if (mode === "preview") {
                      if (p.action || p.toggle) onTap?.(p)
                    } else {
                      e.stopPropagation()
                      onSelect?.(p.id)
                    }
                  }}
                >
                  <PartBody part={p} scheme={scheme} r={r} />
                </div>
              )
            })}
            {mode === "edit" && guides ? (
              <svg style={{ position: "absolute", inset: 0, width: sw, height: sh, pointerEvents: "none" }}>
                {guides.v.map((x, i) => (
                  <line key={`v${i}`} x1={x} y1={0} x2={x} y2={sh} stroke={scheme.primary} strokeWidth={1 / scale} strokeDasharray="6 4" />
                ))}
                {guides.h.map((y, i) => (
                  <line key={`h${i}`} x1={0} y1={y} x2={sw} y2={y} stroke={scheme.primary} strokeWidth={1 / scale} strokeDasharray="6 4" />
                ))}
              </svg>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
