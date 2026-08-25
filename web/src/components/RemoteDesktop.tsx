import { memo, useCallback, useMemo, useRef, useState, useEffect } from "react"
import { CloseIcon, KeyboardIcon, MonitorIcon } from "../Icons"
import { useT } from "../i18n-context"
import { desktopApi, desktopThumb, type DesktopConfig, type DesktopWindow } from "../desktop"
import { useRemoteDesktop } from "../hooks/useRemoteDesktop"

type Props = {
  config: DesktopConfig | null
  dataMode?: string
  onClose: () => void
  onOpenSettings?: () => void
}

type Source = { mode: "screen" | "window"; hwnd?: number; monitor?: number; label: string }

// Calidad: la captura se pide a un múltiplo del ancho REAL del stage (medido en
// vivo), así el texto se ve nítido en fit y el zoom sigue legible.
const PRESETS: Array<{ key: string; factor: number; q: number; fps: number }> = [
  { key: "low", factor: 1.0, q: 40, fps: 5 },
  { key: "med", factor: 1.75, q: 55, fps: 10 },
  { key: "high", factor: 2.5, q: 75, fps: 15 },
]

const MAX_CAPTURE_W = 1440
const MODS = ["ctrl", "alt", "shift", "win"]

export const RemoteDesktop = memo(function RemoteDesktop({ config, dataMode, onClose, onOpenSettings }: Props) {
  const t = useT()
  const isCellular = dataMode === "ultra" || dataMode === "miser"

  const [source, setSource] = useState<Source>({ mode: "screen", monitor: 0, label: t('desktop.fullScreen') })
  const [preset, setPreset] = useState(() => (isCellular ? "low" : "med"))
  const [consented, setConsented] = useState(!isCellular)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [dragMode, setDragMode] = useState(false)
  const [scrollMode, setScrollMode] = useState(false)
  const [mouseButton, setMouseButton] = useState<"left" | "right" | "middle">("left")
  const [pressedMods, setPressedMods] = useState<Set<string>>(new Set())
  const [showPicker, setShowPicker] = useState(false)
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({})
  const [showStats, setShowStats] = useState(true)
  const [showRotateHint, setShowRotateHint] = useState(true)
  const [stage, setStage] = useState({ w: 0, h: 0 })

  const stageRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const kbInputRef = useRef<HTMLInputElement | null>(null)
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  zoomRef.current = zoom
  panRef.current = pan

  // Blob del frame ANTERIOR al que el <img> terminó de decodificar: se revoca
  // en el onLoad del frame nuevo (el reader ya no revoca — revocar un blob a
  // medio decodificar produce artefactos de color al parpadear).
  const loadedFrameUrlRef = useRef<string | null>(null)
  useEffect(() => {
    return () => {
      if (loadedFrameUrlRef.current) URL.revokeObjectURL(loadedFrameUrlRef.current)
      loadedFrameUrlRef.current = null
    }
  }, [])

  // Stage real en vivo (rotación / split / resize del teclado).
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const presetObj = useMemo(() => PRESETS.find((x) => x.key === preset) ?? PRESETS[1], [preset])
  const captureW = useMemo(() => {
    const base = stage.w > 0 ? stage.w : Math.max(320, Math.floor(window.innerWidth * 0.96))
    return Math.min(Math.round(base * presetObj.factor), MAX_CAPTURE_W)
  }, [stage.w, presetObj])

  const streamingEnabled = Boolean(config) && consented

  const params = useMemo(() => ({
    mode: source.mode,
    hwnd: source.hwnd,
    monitor: source.mode === "screen" ? source.monitor : undefined,
    w: captureW,
    q: presetObj.q,
    fps: presetObj.fps,
  }), [source, captureW, presetObj])

  const { status, error, imageUrl, info, fps, bytes, latency, refreshInfo, retry } =
    useRemoteDesktop(config, params, streamingEnabled)

  // ===== Input remoto =====
  const send = useCallback((payload: Parameters<typeof desktopApi.input>[1]) => {
    if (config) desktopApi.input(config, payload).catch(() => undefined)
  }, [config])

  const pointerToNorm = useCallback((clientX: number, clientY: number) => {
    const img = imgRef.current
    if (!img) return null
    const rect = img.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    return {
      x: Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1),
      y: Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1),
    }
  }, [])

  const clearLongPress = useCallback(() => {
    const g = gestures.current
    if (g.longPressTimer) {
      clearTimeout(g.longPressTimer)
      g.longPressTimer = null
    }
  }, [])

  // ===== Zoom con ancla + pan acotado =====
  const clampPan = useCallback((p: { x: number; y: number }) => {
    const img = imgRef.current
    const stageEl = stageRef.current
    if (!img || !stageEl) return p
    const ir = img.getBoundingClientRect()
    const sr = stageEl.getBoundingClientRect()
    const minX = sr.left - ir.left
    const maxX = sr.right - ir.right
    const minY = sr.top - ir.top
    const maxY = sr.bottom - ir.bottom
    return {
      x: Math.min(Math.max(minX, p.x), Math.max(maxX, 0)),
      y: Math.min(Math.max(minY, p.y), Math.max(maxY, 0)),
    }
  }, [])

  const applyZoomAt = useCallback((newZoom: number, mx: number, my: number) => {
    const z = Math.min(6, Math.max(1, newZoom))
    const cur = zoomRef.current
    const p = panRef.current
    const imgX = (mx - p.x) / cur
    const imgY = (my - p.y) / cur
    setPan(clampPan({ x: mx - imgX * z, y: my - imgY * z }))
    setZoom(z)
  }, [clampPan])

  const zoomStep = useCallback((factor: number) => {
    const el = stageRef.current
    const rect = el?.getBoundingClientRect()
    applyZoomAt(zoomRef.current * factor, rect ? rect.width / 2 : 0, rect ? rect.height / 2 : 0)
  }, [applyZoomAt])

  const fitView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // 1:1 = píxeles reales de la captura (solo útil con factor > 1).
  const oneToOne = useCallback(() => {
    const el = stageRef.current
    const rect = el?.getBoundingClientRect()
    const z = Math.min(6, Math.max(1, captureW / (stage.w || 1)))
    applyZoomAt(z, rect ? rect.width / 2 : 0, rect ? rect.height / 2 : 0)
  }, [applyZoomAt, captureW, stage.w])

  // ===== Gestos =====
  const gestures = useRef({
    pointers: new Map<number, { x: number; y: number }>(),
    downAt: 0,
    downPos: { x: 0, y: 0 },
    moved: false,
    dragDown: false,
    longPressTimer: null as ReturnType<typeof setTimeout> | null,
    lastTap: 0,
    pinchDist: 0,
    pinchZoom: 1,
    scrollAccum: 0,
  })

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const g = gestures.current
    stageRef.current?.setPointerCapture(e.pointerId)
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (g.pointers.size === 2) {
      clearLongPress()
      const pts = [...g.pointers.values()]
      g.pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      g.pinchZoom = zoomRef.current
      return
    }
    if (g.pointers.size === 1) {
      g.downAt = Date.now()
      g.downPos = { x: e.clientX, y: e.clientY }
      g.moved = false
      g.longPressTimer = setTimeout(() => {
        if (!g.moved && g.pointers.size === 1) {
          g.moved = true
          const norm = pointerToNorm(g.downPos.x, g.downPos.y)
          if (norm) send({ type: "mouse", action: "click", x: norm.x, y: norm.y, button: "right" })
        }
      }, 550)
    }
  }, [clearLongPress, pointerToNorm, send])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const g = gestures.current
    const prev = g.pointers.get(e.pointerId)
    if (!prev) return
    const dx = e.clientX - prev.x
    const dy = e.clientY - prev.y
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (g.pointers.size === 2) {
      clearLongPress()
      const pts = [...g.pointers.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const mx = (pts[0].x + pts[1].x) / 2
      const my = (pts[0].y + pts[1].y) / 2
      if (g.pinchDist > 0) {
        const next = Math.min(6, Math.max(1, g.pinchZoom * (dist / g.pinchDist)))
        if (Math.abs(next - zoomRef.current) > 0.02) applyZoomAt(next, mx, my)
      } else if (zoomRef.current > 1) {
        setPan((p) => clampPan({ x: p.x + dx, y: p.y + dy }))
      }
      return
    }

    if (g.pointers.size === 1) {
      const moved = Math.abs(e.clientX - g.downPos.x) + Math.abs(e.clientY - g.downPos.y)
      if (moved > 8) {
        g.moved = true
        clearLongPress()
      }
      if (!g.moved) return
      if (scrollMode) {
        g.scrollAccum += dy
        const notches = Math.round(g.scrollAccum / 60)
        if (notches !== 0) {
          g.scrollAccum = 0
          send({ type: "scroll", dy: notches })
        }
        return
      }
      const norm = pointerToNorm(e.clientX, e.clientY)
      if (!norm) return
      if (dragMode) {
        if (!g.dragDown) {
          g.dragDown = true
          send({ type: "mouse", action: "down", x: norm.x, y: norm.y, button: mouseButton })
        } else {
          send({ type: "mouse", action: "move", x: norm.x, y: norm.y })
        }
      } else {
        send({ type: "mouse", action: "move", x: norm.x, y: norm.y })
      }
    }
  }, [applyZoomAt, clampPan, clearLongPress, dragMode, mouseButton, pointerToNorm, scrollMode, send])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const g = gestures.current
    g.pointers.delete(e.pointerId)
    clearLongPress()

    if (g.pointers.size === 0 && g.dragDown) {
      g.dragDown = false
      const norm = pointerToNorm(e.clientX, e.clientY)
      if (norm) send({ type: "mouse", action: "up", x: norm.x, y: norm.y, button: mouseButton })
    }

    if (g.pointers.size === 0 && !g.moved && !scrollMode) {
      const elapsed = Date.now() - g.downAt
      if (elapsed < 450) {
        const norm = pointerToNorm(e.clientX, e.clientY)
        if (norm) {
          const now = Date.now()
          if (now - g.lastTap < 350) {
            send({ type: "mouse", action: "click", x: norm.x, y: norm.y, button: mouseButton })
            send({ type: "mouse", action: "click", x: norm.x, y: norm.y, button: mouseButton })
            g.lastTap = 0
          } else {
            g.lastTap = now
            send({ type: "mouse", action: "click", x: norm.x, y: norm.y, button: mouseButton })
          }
        }
      }
    }
    g.downAt = 0
    g.moved = false
  }, [clearLongPress, mouseButton, pointerToNorm, scrollMode, send])

  const onPointerCancel = useCallback(() => {
    const g = gestures.current
    g.pointers.clear()
    clearLongPress()
    g.moved = false
    g.dragDown = false
  }, [clearLongPress])

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey && zoomRef.current > 1) {
      const el = stageRef.current
      const rect = el?.getBoundingClientRect()
      applyZoomAt(zoomRef.current * (e.deltaY < 0 ? 1.1 : 0.9), rect ? rect.width / 2 : 0, rect ? rect.height / 2 : 0)
      return
    }
    const g = gestures.current
    g.scrollAccum += e.deltaY
    const notches = Math.round(g.scrollAccum / 100)
    if (notches !== 0) {
      g.scrollAccum = 0
      send({ type: "scroll", dy: notches })
    }
  }, [applyZoomAt, send])

  // ===== Teclado =====
  const toggleMod = useCallback((mod: string) => {
    setPressedMods((prev) => {
      const next = new Set(prev)
      if (next.has(mod)) {
        next.delete(mod)
        send({ type: "key", code: mod, action: "up" })
      } else {
        next.add(mod)
        send({ type: "key", code: mod, action: "down" })
      }
      return next
    })
  }, [send])

  const keyCodes: Record<string, string> = {
    Escape: "esc",
    Enter: "enter",
    Tab: "tab",
    Backspace: "backspace",
    Delete: "delete",
    Home: "home",
    End: "end",
    PageUp: "pageup",
    PageDown: "pagedown",
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  }

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const code = keyCodes[e.key]
    if (code) {
      e.preventDefault()
      send({ type: "key", code, action: "tap", mods: [...pressedMods] })
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      send({ type: "text", text: e.key })
    }
    ;(e.currentTarget as HTMLInputElement).value = ""
  }, [keyCodes, pressedMods, send])

  const pressKey = useCallback((code: string) => {
    send({ type: "key", code, action: "tap", mods: [...pressedMods] })
  }, [pressedMods, send])

  // ===== Selector de fuente (bottom sheet) =====
  const openSourcePicker = useCallback(async () => {
    if (!config) return
    setShowPicker(true)
    const i = await refreshInfo()
    if (!i) return
    // Revocar URLs de la apertura anterior (blob JPEGs sin revoke = fuga)
    setThumbnails((prev) => {
      for (const url of Object.values(prev)) {
        try { URL.revokeObjectURL(url) } catch { /* ignore */ }
      }
      return {}
    })
    const thumbs: Record<number, string> = {}
    const stamps: Record<number, number> = {}
    for (const win of i.windows.slice(0, 12)) {
      const hwnd = win.hwnd
      desktopThumb(config, hwnd, 200)
        .then((url) => {
          if (stamps[hwnd] !== undefined) {
            try { URL.revokeObjectURL(url) } catch { /* ignore */ }
            return
          }
          stamps[hwnd] = 1
          thumbs[hwnd] = url
          setThumbnails({ ...thumbs })
        })
        .catch(() => undefined)
    }
  }, [config, refreshInfo])

  // Unmount: liberar todas las thumbnails pendientes
  useEffect(() => {
    return () => {
      setThumbnails((prev) => {
        for (const url of Object.values(prev)) {
          try { URL.revokeObjectURL(url) } catch { /* ignore */ }
        }
        return prev
      })
    }
  }, [])

  const pickSource = useCallback((s: Source) => {
    setSource(s)
    setShowPicker(false)
    fitView()
  }, [fitView])

  const selectWindow = useCallback((win: DesktopWindow) => {
    pickSource({ mode: "window", hwnd: win.hwnd, label: win.title || win.process })
  }, [pickSource])

  // ===== UI =====
  const kbps = bytes > 0 ? Math.round(bytes / 1024) : 0
  const sourceLabel = source.label
  const portrait = stage.h > stage.w && stage.w > 0

  if (!config) {
    return (
      <div className="modal-overlay desktop-overlay" onClick={onClose}>
        <div className="desktop-modal desktop-missing" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('desktop.title')}>
          <div className="desktop-toolbar">
            <button className="btn-icon compact" onClick={onClose} aria-label={t('detail.backToSessions')} title={t('detail.backToSessions')}>
              <CloseIcon size={16} />
            </button>
            <span className="desktop-status">{t('desktop.title')}</span>
          </div>
          <div className="desktop-missing-body">
            <p className="desktop-missing-title">{t('settings.desktopMissing')}</p>
            {onOpenSettings && (
              <button className="btn-primary" onClick={() => { onClose(); onOpenSettings() }}>
                {t('desktop.settings')}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay desktop-overlay" onClick={onClose}>
      <div className="desktop-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('desktop.title')}>
        {/* Fila 1: navegación + fuente + estado */}
        <div className="desktop-toolbar">
          <button className="btn-icon compact" onClick={onClose} aria-label={t('desktop.disconnect')} title={t('desktop.disconnect')}>
            <CloseIcon size={16} />
          </button>
          <button className="desktop-source-btn" onClick={openSourcePicker} title={t('desktop.source')} aria-label={t('desktop.source')}>
            {sourceLabel}
          </button>
          <span className={`desktop-status ${status === "error" ? "error" : status === "streaming" ? "ok" : ""}`}>
            {status === "error" ? t('desktop.error') : status === "connecting" ? t('desktop.connecting') : `${fps} fps`}
          </span>
          <div className="desktop-toolbar-spacer" />
          {pressedMods.size > 0 && (
            <span className="desktop-mods-active">{[...pressedMods].map((m) => m.toUpperCase()).join("+")}</span>
          )}
          <button className="btn-secondary compact desktop-toggle" onClick={fitView} aria-pressed={zoom === 1} title={t('desktop.fit')}>
            {t('desktop.fit')}
          </button>
          <button className="btn-secondary compact desktop-toggle" onClick={oneToOne} aria-pressed={zoom > 1} title={t('desktop.oneToOne')}>
            {t('desktop.oneToOne')}
          </button>
          <button className="btn-secondary compact" onClick={() => zoomStep(0.75)} aria-label="−" title={t('desktop.zoomOut')}>−</button>
          <button className="btn-secondary compact" onClick={() => zoomStep(1.5)} aria-label="+" title={t('desktop.zoomIn')}>+</button>
          <select
            className="desktop-preset"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            aria-label={t('desktop.quality')}
            title={t('desktop.quality')}
          >
            {PRESETS.map((pr) => (
              <option key={pr.key} value={pr.key}>{t(`desktop.preset_${pr.key}`)} · {Math.min(Math.round((stage.w || 360) * pr.factor), MAX_CAPTURE_W)}px</option>
            ))}
          </select>
        </div>

        {/* Fila 2: herramientas */}
        <div className="desktop-toolbar desktop-toolbar-row2">
          <div className="desktop-segment" role="group" aria-label={t('desktop.mouse')}>
            {(["left", "right", "middle"] as const).map((b) => (
              <button
                key={b}
                className={`desktop-seg-btn${mouseButton === b ? " active" : ""}`}
                onClick={() => setMouseButton(b)}
                aria-pressed={mouseButton === b}
              >
                {t(`desktop.mouse_${b}`)}
              </button>
            ))}
          </div>
          <button
            className={`btn-secondary compact desktop-toggle${dragMode ? " active" : ""}`}
            onClick={() => setDragMode((v) => !v)}
            aria-pressed={dragMode}
            title={t('desktop.dragMode')}
          >
            {t('desktop.dragMode')}
          </button>
          <button
            className={`btn-secondary compact desktop-toggle${scrollMode ? " active" : ""}`}
            onClick={() => setScrollMode((v) => !v)}
            aria-pressed={scrollMode}
            title={t('desktop.scrollMode')}
          >
            {t('desktop.scrollMode')}
          </button>
          <button
            className={`btn-secondary compact desktop-toggle${showKeyboard ? " active" : ""}`}
            onClick={() => {
              setShowKeyboard((v) => !v)
              setTimeout(() => kbInputRef.current?.focus(), 50)
            }}
            aria-pressed={showKeyboard}
            aria-label={t('desktop.keyboard')}
            title={t('desktop.keyboard')}
          >
            <KeyboardIcon size={16} />
          </button>
          <button
            className="btn-secondary compact desktop-toggle"
            onClick={() => setShowStats((v) => !v)}
            aria-pressed={showStats}
            aria-label={t('desktop.statsToggle')}
            title={t('desktop.statsToggle')}
          >
            {showStats ? t('desktop.statsHide') : t('desktop.statsShow')}
          </button>
        </div>

        {showKeyboard && (
          <div className="desktop-kb-row">
            {MODS.map((m) => (
              <button
                key={m}
                className={`desktop-mod${pressedMods.has(m) ? " active" : ""}`}
                onClick={() => toggleMod(m)}
                aria-pressed={pressedMods.has(m)}
              >
                {m.toUpperCase()}
              </button>
            ))}
            <button className="desktop-mod" onClick={() => pressKey("esc")}>ESC</button>
            <button className="desktop-mod" onClick={() => pressKey("tab")}>TAB</button>
            <button className="desktop-mod" onClick={() => pressKey("win")}>WIN</button>
            <button
              className="desktop-mod"
              onClick={() => send({ type: "key", code: "delete", action: "tap", mods: ["ctrl", "alt"] })}
            >
              CAD
            </button>
            <input
              ref={kbInputRef}
              className="desktop-kb-input"
              placeholder={t('desktop.kbPlaceholder')}
              aria-label={t('desktop.kbPlaceholder')}
              onKeyDown={onKeyDown}
              onChange={() => undefined}
            />
            <div className="desktop-dpad" role="group" aria-label={t('desktop.dpad')}>
              <button className="desktop-dpad-btn" onClick={() => pressKey("up")} aria-label="↑">↑</button>
              <button className="desktop-dpad-btn" onClick={() => pressKey("left")} aria-label="←">←</button>
              <button className="desktop-dpad-btn" onClick={() => pressKey("down")} aria-label="↓">↓</button>
              <button className="desktop-dpad-btn" onClick={() => pressKey("right")} aria-label="→">→</button>
            </div>
          </div>
        )}

        <div
          ref={stageRef}
          className="desktop-stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onWheel={onWheel}
          style={{ touchAction: "none" }}
        >
          {portrait && showRotateHint && !showKeyboard && (
            <div className="desktop-rotate-hint">
              <span>{t('desktop.rotateHint')}</span>
              <button className="btn-icon compact" onClick={() => setShowRotateHint(false)} aria-label={t('desktop.cancel')}>×</button>
            </div>
          )}
          {status === "error" && (
            <div className="desktop-error">
              <p>{t('desktop.error')}</p>
              <p className="subtle">{error}</p>
              <div className="desktop-error-actions">
                <button className="btn-primary compact" onClick={retry}>{t('desktop.retry')}</button>
                {onOpenSettings && (
                  <button className="btn-secondary compact" onClick={() => { onClose(); onOpenSettings() }}>
                    {t('desktop.settings')}
                  </button>
                )}
              </div>
            </div>
          )}
          {imageUrl ? (
            <img
              ref={imgRef}
              src={imageUrl}
              alt={t('desktop.title')}
              className="desktop-frame"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
              draggable={false}
              onLoad={() => {
                // Este frame ya está decodificado y visible: recién ahora se
                // puede revocar el blob del anterior sin riesgo de parpadeos.
                if (loadedFrameUrlRef.current && loadedFrameUrlRef.current !== imageUrl) {
                  URL.revokeObjectURL(loadedFrameUrlRef.current)
                }
                loadedFrameUrlRef.current = imageUrl
              }}
            />
          ) : (
            status !== "error" && !needsConsent() && <div className="desktop-error"><p>{t('desktop.connecting')}</p></div>
          )}
          {showStats && status === "streaming" && (
            <div className="desktop-stats-chip">
              {fps} fps · {latency !== null ? `${latency} ms` : "—"} · {kbps} KB
            </div>
          )}
        </div>

        {needsConsent() && (
          <div className="desktop-consent">
            <div className="desktop-consent-card">
              <p className="desktop-consent-title">{t('desktop.consentTitle')}</p>
              <p className="subtle">{t('desktop.consentBody')}</p>
              <div className="desktop-consent-actions">
                <button className="btn-secondary" onClick={onClose}>{t('desktop.consentCancel')}</button>
                <button className="btn-primary" onClick={() => { setPreset("low"); setConsented(true) }}>
                  {t('desktop.consentContinue')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPicker && (
          <div className="desktop-picker" role="dialog" aria-label={t('desktop.source')}>
            <div className="desktop-picker-handle" />
            <div className="desktop-picker-title">{t('desktop.source')}</div>
            <div className="desktop-picker-list">
              <button className="desktop-picker-item" onClick={() => pickSource({ mode: "screen", monitor: 0, label: t('desktop.fullScreen') })}>
                <span className="desktop-picker-icon"><MonitorIcon size={18} /></span>
                <span className="desktop-picker-name"><strong>{t('desktop.fullScreen')}</strong></span>
              </button>
              {(info?.monitors ?? []).length > 1 && info?.monitors.map((m, i) => (
                <button key={i} className="desktop-picker-item" onClick={() => pickSource({ mode: "screen", monitor: i, label: `${t('desktop.monitor')} ${i + 1}${m.primary ? " " : ""}` })}>
                  <span className="desktop-picker-icon"><MonitorIcon size={18} /></span>
                  <span className="desktop-picker-name"><strong>{t('desktop.monitor')} {i + 1}</strong></span>
                </button>
              ))}
              {(info?.windows ?? []).map((win) => (
                <button key={win.hwnd} className="desktop-picker-item" onClick={() => selectWindow(win)}>
                  {thumbnails[win.hwnd] && (
                    <img className="desktop-thumb" src={thumbnails[win.hwnd]} alt="" loading="lazy" />
                  )}
                  <span className="desktop-picker-name">
                    <strong>{win.title}</strong>
                    <small>{win.process}</small>
                  </span>
                </button>
              ))}
            </div>
            <button className="btn-secondary compact desktop-picker-close" onClick={() => setShowPicker(false)}>{t('desktop.cancel')}</button>
          </div>
        )}
      </div>
    </div>
  )

  function needsConsent() {
    return isCellular && !consented
  }
})
