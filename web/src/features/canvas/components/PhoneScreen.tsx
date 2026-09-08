import { useRef } from "react"
import type { CanvasPart, CanvasScreen } from "../model/canvasTypes"
import { defaultPartHeight, screenSizeOf } from "../model/canvasTypes"
import {
  ChatIcon,
  ChevronRightIcon,
  CloseIcon,
  FileIcon,
  FolderIcon,
  MaximizeIcon,
  MenuDotsIcon,
  MicIcon,
  MinimizeIcon,
  PanelLeftIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
} from "../../../Icons"

type Props = {
  screen: CanvasScreen
  parts: CanvasPart[]
  maxWidth?: number
  mode: "edit" | "preview"
  selectedId?: string | null
  onSelect?: (partId: string | null) => void
  onMove?: (partId: string, x: number, y: number, commit: boolean) => void
  onTap?: (part: CanvasPart) => void
}

const DRAGGABLE_EXCLUDE = new Set(["topAppBar", "bottomNav"])
const SIDEBAR_ICONS = [ChatIcon, SearchIcon, FolderIcon, StarIcon, SettingsIcon]

function splitItems(label: string, fallback: string[]): string[] {
  const items = label
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return items.length > 0 ? items : fallback
}

function PartBody({ part }: { part: CanvasPart }) {
  const h = defaultPartHeight(part.kind)
  switch (part.kind) {
    case "topAppBar":
      return (
        <div className="m3e-bar m3e-bar-top">
          <PanelLeftIcon size={22} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{part.label || "Titulo"}</span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            <SearchIcon size={20} />
            <MenuDotsIcon size={20} />
          </span>
        </div>
      )
    case "bottomNav":
      return (
        <div className="m3e-bar m3e-bar-bottom">
          <span className="m3e-navitem active"><ChatIcon size={22} />Inicio</span>
          <span className="m3e-navitem"><SearchIcon size={22} />Buscar</span>
          <span className="m3e-navitem"><SettingsIcon size={22} />Ajustes</span>
        </div>
      )
    case "button":
      return <div className={`m3e-btn m3e-btn-${part.variant ?? "filled"}`}>{part.icon ? <span aria-hidden>{part.icon}</span> : null}{part.label}</div>
    case "chip":
      return <div className="m3e-chip">{part.label}</div>
    case "text":
      return <div className="m3e-text" style={{ fontSize: 28, fontWeight: 600 }}>{part.label}</div>
    case "card":
      return (
        <div className="m3e-card">
          <div className="m3e-card-media" aria-hidden><FileIcon size={28} /></div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{part.label}</div>
          <div style={{ fontSize: 14, color: "var(--m3-on-variant)", marginTop: 4 }}>Descripcion de la tarjeta</div>
        </div>
      )
    case "listItem":
      return (
        <div className="m3e-list">
          <span className="m3e-list-icon" aria-hidden><FileIcon size={20} /></span>
          <span style={{ fontSize: 16 }}>{part.label}</span>
          <span style={{ marginLeft: "auto", display: "flex", color: "var(--m3-on-variant)" }} aria-hidden>
            <ChevronRightIcon size={18} />
          </span>
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
    case "textField":
      return <div className="m3e-field">{part.label}</div>
    case "divider":
      return <div className="m3e-divider" />
    case "fab":
      return <div className="m3e-fab"><PlusIcon size={24} /></div>
    case "searchBar":
      return (
        <div className="m3e-search">
          <SearchIcon size={20} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{part.label}</span>
          <span style={{ marginLeft: "auto", display: "flex" }} aria-hidden><MicIcon size={18} /></span>
        </div>
      )
    case "sideBar": {
      const items = splitItems(part.label, ["Inicio", "Buscar", "Ajustes"]).slice(0, 6)
      return (
        <div className="m3e-sidebar">
          <div className="m3e-sidebar-logo" aria-hidden />
          {items.map((name, i) => {
            const Icon = SIDEBAR_ICONS[i % SIDEBAR_ICONS.length]!
            return (
              <div key={i} className={`m3e-sidebar-item${i === 0 ? " active" : ""}`}>
                <Icon size={20} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
              </div>
            )
          })}
        </div>
      )
    }
    case "chatBubble": {
      const mine = part.variant === "filled"
      return (
        <div className="m3e-bubble-wrap">
          <div className={`m3e-bubble${mine ? " mine" : ""}`}>{part.label || "Mensaje"}</div>
        </div>
      )
    }
    case "avatar": {
      const initials = part.label.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "A"
      return <div className="m3e-avatar" aria-label={part.label}>{initials}</div>
    }
    case "tabBar": {
      const tabs = splitItems(part.label, ["Pestaña 1", "Pestaña 2"]).slice(0, 4)
      return (
        <div className="m3e-tabs">
          {tabs.map((name, i) => (
            <span key={i} className={`m3e-tab${i === 0 ? " active" : ""}`}>{name}</span>
          ))}
        </div>
      )
    }
  }
}

function StatusBar() {
  return (
    <div className="m3e-statusbar" aria-hidden>
      <span>9:41</span>
      <span className="m3e-sb-icons">
        <span className="m3e-sb-signal">
          <i style={{ height: 4 }} /><i style={{ height: 6 }} /><i style={{ height: 8 }} /><i style={{ height: 10 }} />
        </span>
        <span className="m3e-sb-battery"><i /></span>
      </span>
    </div>
  )
}

export function PhoneScreen({ screen, parts, maxWidth = 300, mode, selectedId, onSelect, onMove, onTap }: Props) {
  const { w: sw, h: sh } = screenSizeOf(screen)
  const scale = Math.min(1, maxWidth / sw)
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)
  const isPhone = screen.preset === "phone"

  const content = (
    <div style={{ width: sw, height: sh, transform: `scale(${scale})`, transformOrigin: "top left", position: "relative" }}>
      {isPhone ? <StatusBar /> : null}
      {mode === "edit" ? (
        <div
          style={{ position: "absolute", inset: 0 }}
          onClick={() => onSelect?.(null)}
        />
      ) : null}
      {parts.map((p) => {
        const h = defaultPartHeight(p.kind)
        const w = p.w ?? sw
        const draggable = mode === "edit" && !DRAGGABLE_EXCLUDE.has(p.kind)
        return (
          <div
            key={p.id}
            className={`m3e-part${selectedId === p.id ? " m3e-selected" : ""}${mode === "preview" && p.action ? " m3e-tappable" : ""}`}
            style={{
              left: p.x,
              top: p.y,
              width: w,
              height: h,
              cursor: mode === "edit" ? (draggable ? "grab" : "default") : p.action ? "pointer" : "default",
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
                if (p.action) onTap?.(p)
              } else {
                e.stopPropagation()
                onSelect?.(p.id)
              }
            }}
          >
            <PartBody part={p} />
          </div>
        )
      })}
    </div>
  )

  if (isPhone) {
    return (
      <div className="m3e-scope">
        <div className="m3e-phone" style={{ width: sw * scale + 20 }}>
          <div className="m3e-notch" aria-hidden />
          <div className="m3e-screen" style={{ width: sw * scale, height: sh * scale }}>
            {content}
          </div>
        </div>
      </div>
    )
  }

  const isApp = screen.preset === "app"
  return (
    <div className="m3e-scope">
      <div className="m3e-window" style={{ width: sw * scale }}>
        {isApp ? (
          <div className="m3e-titlebar" aria-hidden>
            <span className="m3e-titlebar-title">{screen.name}</span>
            <span className="m3e-titlebar-btns">
              <MinimizeIcon size={14} />
              <MaximizeIcon size={14} />
              <CloseIcon size={14} />
            </span>
          </div>
        ) : (
          <div className="m3e-titlebar m3e-browser" aria-hidden>
            <span className="m3e-dot" />
            <span className="m3e-dot" />
            <span className="m3e-dot" />
            <span className="m3e-url">mi-app.web</span>
          </div>
        )}
        <div className="m3e-screen m3e-screen-window" style={{ width: sw * scale, height: sh * scale }}>
          {content}
        </div>
      </div>
    </div>
  )
}
