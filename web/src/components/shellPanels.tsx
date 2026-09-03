// Paneles de la shell para el grid de escritorio: terminal, explorador,
// kanban, docs, updates, stats, labs y config. Todos hablan con /shell/*.

import { memo, useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebglAddon } from "@xterm/addon-webgl"
import { Capacitor } from "@capacitor/core"
import "@xterm/xterm/css/xterm.css"
import { FolderIcon, RefreshIcon, TerminalIcon, PlusIcon, SplitIcon, MoreHorizontalIcon, TrashIcon, ChevronDownIcon, FileIcon, SaveIcon, DiskIcon, LinkIcon, MonitorIcon, PencilIcon, EyeIcon, StarIcon, MaximizeIcon, MinimizeIcon, CloseIcon } from "../Icons"
import { b64decode, fileIcon, KANBAN_COLORS, shell, type FsEntry, type KanbanBoard, type KanbanCard, type ShellPanelKind } from "../shell"
import { normFsPath, affectedParentDirs } from "../utils/fsChanges"
import { calcMenuPosForAnchor } from "../utils/menuPos"
import { VisualSelectOverlay } from "./VisualSelectOverlay"
import { LiteEditor } from "./LiteEditor"
import { toBase64Chunked } from "../utils/editorOps"
import { ContextMenu } from "./ContextMenu"
import type { VisualSelection } from "../hooks/useVisualSelection"
import { useDevServer } from "../hooks/useDevServer"

import { terminalStore, terminalPtyStore, rememberTerminalPty, killTerminalPty, transferTerminalTab, getTerminalFontSize, setTerminalFontSize, TERMINAL_FONT_MIN, TERMINAL_FONT_MAX } from "../utils/terminalStore"
export { killTerminalPty, transferTerminalTab }
import { createPortal } from "react-dom"
import { useT } from "../i18n-context"
import { useDialog } from "./DialogProvider"
import { Markdown } from "./Markdown"
import { Modal } from "./Modal"
import { sanitizeHtml } from "../utils/sanitize"

/** Ruta absoluta del FS (Windows `C:\…`, UNC o POSIX `/…`). El server solo
    resuelve absolutas: un nombre pelado ("download.png" de un drop del SO o
    de un tab persistido viejo) nunca abre y solo genera 404 en /shell/fs/*. */
export function isAbsoluteFsPath(p: string): boolean {
  if (p.startsWith("/") || p.startsWith("\\\\")) return true
  return /^[a-zA-Z]:[\\/]/.test(p)
}
const BrowserPanel = lazy(() => import("./BrowserPanel").then((m) => ({ default: m.BrowserPanel })))
const DocEditorPanel = lazy(() => import("./DocEditorPanel").then((m) => ({ default: m.DocEditorPanel })))
// Visor PDF bajo demanda: chunk + worker solo se descargan al abrir un .pdf
const PdfViewer = lazy(() => import("./PdfViewer").then((m) => ({ default: m.PdfViewer })))
export { BrowserPanel, DocEditorPanel }

// ============================================================== Terminal

// ============================================================== Terminal (Multi-Pestaña)

export const SingleTerminal = memo(function SingleTerminal({ cwd, shellName, tabId }: { cwd?: string; shellName?: string; tabId: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const initialCwdRef = useRef(cwd)
  const initialShellRef = useRef(shellName)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const getUiScale = () => {
      try {
        const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui-scale"))
        return Number.isFinite(v) && v > 0 ? v : 1
      } catch { return 1 }
    }
    let baseFontFromStore = 13
    try { baseFontFromStore = getTerminalFontSize(tabId) } catch {}
    const initialScale = getUiScale()
    const effectiveSize = Math.round(baseFontFromStore * initialScale)
    // TUI opencode: box-drawing continuo, alt buffer, WebGL atlases estables, DPR alto
    const term = new Terminal({
      fontFamily: "Cascadia Mono, Consolas, 'Cascadia Mono', monospace",
      fontSize: effectiveSize,
      lineHeight: 1.0,
      letterSpacing: 0,
      fontWeight: "400" as any,
      fontWeightBold: "700" as any,
      cursorBlink: true,
      cursorStyle: "block",
      cursorInactiveStyle: "outline",
      cursorWidth: 1,
      scrollback: 3000,
      allowTransparency: false,
      allowProposedApi: true,
      convertEol: false,
      customGlyphs: true,
      rescaleOverlappingGlyphs: true as any,
      minimumContrastRatio: 1,
      smoothScrollDuration: 0,
      scrollSensitivity: 1,
      fastScrollSensitivity: 5,
      altClickMovesCursor: false,
      rightClickSelectsWord: true,
      macOptionIsMeta: true,
      macOptionClickForcesSelection: true,
      wordSeparator: " ()[]{}',\"`",
      windowsPty: { backend: "conpty" } as any,
      // Terminal isolated surface: #0d1117 kept as terminal canvas (not tokenized per frontend-pro isolation)
      theme: {
        background: "#0d1117",
        foreground: "#e6edf3",
        cursor: "#58a6ff",
        cursorAccent: "#0d1117",
        selectionBackground: "#264f78",
        selectionInactiveBackground: "#1e3a5f",
        selectionForeground: "#ffffff",
      },
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(el)

    // Links clicables (http/https): xterm no trae detector propio, se registra
    // uno sin deps extra. provideLinks recibe y en base 1 → getLine(y-1); los
    // rangos también son 1-based. Une líneas wrapped para URLs largas.
    const openTerminalLink = (url: string) => {
      let proto = ""
      try { proto = new URL(url).protocol } catch { return }
      if (proto !== "http:" && proto !== "https:") return
      try {
        if (Capacitor.isNativePlatform()) window.open(url, "_system")
        else window.open(url, "_blank", "noopener,noreferrer")
      } catch { /* ignore */ }
    }
    const linkProviderDisposable = term.registerLinkProvider({
      provideLinks(bufferLineNumber, callback) {
        try {
          const buf = term.buffer.active
          const cols = term.cols || 80
          let startRow = bufferLineNumber - 1
          for (let i = 0; i < 5 && startRow > 0; i++) {
            const l = buf.getLine(startRow)
            if (!l || !l.isWrapped) break
            startRow--
          }
          const parts: string[] = []
          let row = startRow
          for (let i = 0; i < 6; i++) {
            const l = buf.getLine(row)
            if (!l) break
            parts.push(l.translateToString(true))
            const next = buf.getLine(row + 1)
            row++
            if (!next || !next.isWrapped) break
          }
          const full = parts.join("")
          if (full.indexOf("http") === -1) { callback(undefined); return }
          const links: Array<{
            range: { start: { x: number; y: number }; end: { x: number; y: number } }
            text: string
            activate: (event: MouseEvent, text: string) => void
          }> = []
          const re = /https?:\/\/[^\s<>"'`\]]+/g
          let m: RegExpExecArray | null
          while ((m = re.exec(full)) !== null) {
            const url = m[0].replace(/[.,;:!?)\]]+$/, "")
            if (url.length < 9) continue
            const s = m.index
            const e = s + url.length
            links.push({
              range: {
                start: { x: (s % cols) + 1, y: startRow + Math.floor(s / cols) + 1 },
                end: { x: (e % cols) + 1, y: startRow + Math.floor(e / cols) + 1 },
              },
              text: url,
              activate: (_event, text) => openTerminalLink(text || url),
            })
          }
          callback(links.length ? links : undefined)
        } catch {
          callback(undefined)
        }
      },
    })

    // Renderer por GPU: WebGL preferido; fallback a DOM (Canvas addon es opcional y no está instalado
    // por compatibilidad con @xterm/xterm@6 — su peer es ^5). DOM + cola optimizada ya rinde para opencode.
    let webglAddon: WebglAddon | null = null
    const hasWebGL2 = (() => {
      try {
        const c = document.createElement("canvas")
        return !!c.getContext("webgl2")
      } catch { return false }
    })()
    // CSP-safe probe: algunos entornos bloquean data: canvas.toDataURL
    let usingWebGL = false
    let webglProbeFailed = false
    const probeWebGL = (): boolean => {
      try {
        const c = document.createElement("canvas")
        const gl = c.getContext("webgl2", { alpha: false, antialias: false }) as any
        if (!gl) return false
        // Si el driver está bloqueado, getExtension puede lanzar
        try { gl.getExtension("WEBGL_lose_context") } catch {}
        return true
      } catch { return false }
    }
    const canUseWebGL = hasWebGL2 && probeWebGL()
    // Teardown+rebuild para atlas corruption (zoom/DPR/sleep): clearTextureAtlas no alcanza en Chromium+Nvidia
    let webglRebuildTimer = 0
    const rebuildWebGL = () => {
      try { webglAddon?.dispose() } catch {}
      webglAddon = null
      usingWebGL = false
      if (!canUseWebGL || disposed) return
      try {
        webglAddon = new WebglAddon()
        webglAddon.onContextLoss(() => {
          try { webglAddon?.dispose() } catch {}
          webglAddon = null
          usingWebGL = false
          webglProbeFailed = true
        })
        term.loadAddon(webglAddon)
        usingWebGL = true
        webglProbeFailed = false
      } catch {
        webglAddon = null
        usingWebGL = false
      }
    }
    if (canUseWebGL) {
      try {
        webglAddon = new WebglAddon()
        webglAddon.onContextLoss(() => {
          try { webglAddon?.dispose() } catch {}
          webglAddon = null
          usingWebGL = false
          webglProbeFailed = true
        })
        term.loadAddon(webglAddon)
        usingWebGL = true
      } catch {
        webglAddon = null
        usingWebGL = false
        webglProbeFailed = true
      }
    }
    try {
      console.info(`[xterm] ${tabId} renderer=${usingWebGL ? "webgl" : webglProbeFailed ? "dom(blocked)" : "dom"} webgl2=${hasWebGL2} canUse=${canUseWebGL} font=${effectiveSize} dpr=${window.devicePixelRatio}`)
    } catch {}

    term.attachCustomKeyEventHandler((e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && term.hasSelection()) {
        if (e.type === "keydown") {
          navigator.clipboard.writeText(term.getSelection())
        }
        return false
      }
      return true
    })

    try {
      fit.fit()
    } catch {
      /* ignore */
    }

    let disposed = false
    let ws: WebSocket | null = null
    let ptyId = ""
    let wsPort = 0
    let pollTimer = 0
    let since = 0
    let polling = false

    // Cola de escritura para TUI 60fps (opencode alternate buffer). Batch por rAF para no
    // bloquear el hilo UI; truncation suave para no romper frames de la TUI.
    let writeQueue: (string | Uint8Array)[] = []
    let flushScheduled = false
    let queueTruncated = false
    const MAX_QUEUE = 900
    const TRUNCATE_MARKER = "\r\n\x1b[33m[terminal: salida omitida mientras estaba en segundo plano]\x1b[0m\r\n"
    const scheduleFlush = () => {
      if (flushScheduled) return
      flushScheduled = true
      requestAnimationFrame(() => {
        flushScheduled = false
        let budget = 0
        // Presupuesto más alto para TUI: opencode pinta frames completos en un burst
        while (writeQueue.length > 0 && budget < 64) {
          const chunk = writeQueue.shift()!
          if (chunk instanceof Uint8Array) term.write(chunk)
          else term.write(chunk)
          budget++
          if (writeQueue.length > 120 && budget % 24 === 0) break
        }
        if (writeQueue.length === 0 && queueTruncated) {
          queueTruncated = false
          term.write(TRUNCATE_MARKER)
        }
        if (writeQueue.length > 0) scheduleFlush()
      })
    }
    const queueWrite = (data: string | Uint8Array) => {
      writeQueue.push(data)
      if (writeQueue.length > MAX_QUEUE) {
        const drop = writeQueue.length - MAX_QUEUE
        writeQueue.splice(0, drop)
        queueTruncated = true
      }
      scheduleFlush()
    }
    const queueWriteB64 = (b64: string) => {
      try { queueWrite(b64decode(b64)) } catch { /* ignore */ }
    }

    // Oculto → cerrar WS y vaciar cola: el ring buffer del server (2MB) acota el
    // historial y al volver reconectamos + replay acotado. Evita acumular en renderer.
    const onVisChange = () => {
      if (document.visibilityState === "hidden") {
        polling = false
        window.clearTimeout(pollTimer)
        try { ws?.close() } catch { /* ignore */ }
        ws = null
        writeQueue.length = 0
        queueTruncated = false
      } else if (!disposed && ptyId) {
        if (wsPort) connectWs(wsPort, ptyId)
        else { polling = true; poll() }
      }
    }
    document.addEventListener("visibilitychange", onVisChange)

    let lastCols = 0, lastRows = 0
    const sendResize = () => {
      const cols = term.cols, rows = term.rows
      if (cols === lastCols && rows === lastRows) {
        // DPR-only change still needs pixel resize
        const dpr = window.devicePixelRatio || 1
        const w = Math.round(el.clientWidth * dpr)
        const h = Math.round(el.clientHeight * dpr)
        if (ws && ws.readyState === WebSocket.OPEN) {
          try { ws.send(JSON.stringify({ cmd: "resize", cols, rows, pixel_width: w, pixel_height: h })) } catch {}
        } else if (ptyId) {
          shell.pty.resize(ptyId, cols, rows, w, h).catch(() => {})
        }
        return
      }
      lastCols = cols; lastRows = rows
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(el.clientWidth * dpr)
      const h = Math.round(el.clientHeight * dpr)
      if (ws && ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ cmd: "resize", cols, rows, pixel_width: w, pixel_height: h })) } catch {}
        // También HTTP para que el ConPTY lo aplique aunque el WS esté reconectando
        shell.pty.resize(ptyId, cols, rows, w, h).catch(() => {})
      } else if (ptyId) {
        shell.pty.resize(ptyId, cols, rows, w, h).catch(() => {})
      }
      try { console.info(`[xterm] ${tabId} resize ${cols}x${rows} dpr=${dpr} px=${w}x${h} font=${term.options.fontSize}`) } catch {}
    }

    const applyZoom = (nextBase: number) => {
      if (disposed) return
      const z = getUiScale()
      const nextSize = Math.max(TERMINAL_FONT_MIN, Math.min(TERMINAL_FONT_MAX, Math.round(nextBase * z)))
      if (term.options.fontSize !== nextSize) term.options.fontSize = nextSize
      // Zoom cambia métricas de glyph: full rebuild del atlas (no solo clear) para evitar bordes duplicados
      if (usingWebGL) {
        window.clearTimeout(webglRebuildTimer)
        try { (webglAddon as any)?.clearTextureAtlas?.() } catch {}
        webglRebuildTimer = window.setTimeout(() => {
          if (disposed || !usingWebGL) return
          rebuildWebGL()
          try { fit.fit(); (term as any).refresh?.(0, term.rows - 1) } catch {}
          sendResize()
        }, 60) as any
      }
      try { fit.fit(); (term as any).refresh?.(0, term.rows - 1) } catch {}
      sendResize()
    }

    // Fix zoom TUI: al cambiar --ui-scale, el canvas WebGL queda con atlas viejo
    // y se ven letras dobles/triples. Ajustar fontSize + limpiar atlas + refit.
    const handleUiZoom = () => {
      if (disposed) return
      try {
        let base = baseFontFromStore
        try { base = getTerminalFontSize(tabId) } catch {}
        applyZoom(base)
      } catch {}
    }
    const handleTerminalZoom = (e: Event) => {
      if (disposed) return
      const d = (e as CustomEvent).detail as any
      if (!d || d.tabId !== tabId) return
      try {
        baseFontFromStore = d.size
        applyZoom(d.size)
      } catch {}
    }

    // Fallback a polling si el WebSocket no está disponible (server viejo).
    const poll = async () => {
      if (disposed || !ptyId || !polling) return
      try {
        const r = await shell.pty.poll(ptyId, since)
        if (!disposed && r.data) {
          since = r.len
          queueWriteB64(r.data)
        }
      } catch {
        /* ignore */
      }
      if (!disposed && polling) pollTimer = window.setTimeout(poll, 250)
    }

    const onData = term.onData((d) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ cmd: "write", data: d }))
      } else if (ptyId) {
        shell.pty.write(ptyId, d).catch(() => {})
      }
    })

    // Conexión WS reutilizable
    const connectWs = (port: number, id: string) => {
      let reconnectAttempts = 0
      const maxReconnect = 5
      const tryConnect = () => {
        if (disposed || !id) return
        try {
          const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:"
          const wsHost = window.location.hostname || "localhost"
          const sock = new WebSocket(`${wsProto}//${wsHost}:${port}`)
          sock.binaryType = "arraybuffer"
          sock.onopen = () => {
            if (disposed) { sock.close(); return }
            reconnectAttempts = 0
            ws = sock
            sock.send(JSON.stringify({ cmd: "attach", id }))
            sendResize()
          }
          sock.onmessage = (e) => {
            if (disposed) return
            if (e.data instanceof ArrayBuffer) {
              queueWrite(new Uint8Array(e.data))
            } else if (typeof e.data === "string") {
              queueWrite(e.data)
            }
          }
          sock.onerror = () => { try { sock.close() } catch { /* ignore */ } }
          sock.onclose = () => {
            if (disposed) return
            // Oculto: no reconectar (onVisChange lo hace al volver)
            if (document.visibilityState === "hidden") return
            if (reconnectAttempts < maxReconnect) {
              reconnectAttempts += 1
              window.setTimeout(tryConnect, 400 * reconnectAttempts)
            } else {
              polling = true
              poll()
            }
          }
        } catch {
          if (reconnectAttempts < maxReconnect) {
            reconnectAttempts += 1
            window.setTimeout(tryConnect, 400 * reconnectAttempts)
          } else {
            polling = true
            poll()
          }
        }
      }
      tryConnect()
    }

    const existing = terminalPtyStore.get(tabId)
    if (existing) {
      ptyId = existing.ptyId
      wsPort = existing.wsPort
      if (!wsPort) {
        // Solo el fallback polling necesita replay manual: el writer WS ya
        // re-envía el ring completo al attach (consumed=0). Hacer AMBOS
        // duplicaba todo el scrollback.
        shell.pty.poll(ptyId, 0).then((r) => {
          if (disposed) return
          if (r.data) {
            since = r.len
            queueWriteB64(r.data)
          }
        }).catch(() => {})
        polling = true
        poll()
      } else {
        connectWs(wsPort, ptyId)
      }
    } else {
      shell.pty.create(initialCwdRef.current, initialShellRef.current).then(async (res) => {
        if (disposed) {
          rememberTerminalPty(tabId, { ptyId: res.id, wsPort: res.ws_port })
          return
        }
        ptyId = res.id
        wsPort = res.ws_port
        rememberTerminalPty(tabId, { ptyId: res.id, wsPort: res.ws_port })
        connectWs(wsPort, ptyId)
        // Auto opencode2: solo la primera terminal de la sesión si el flag está pendiente (evita que cada nueva pestaña ejecute opencode2)
        try {
          const { consumePendingAutoOpencode2 } = await import("../utils/terminalStore")
          const pending = consumePendingAutoOpencode2()
          if (pending) {
            // Resolver exe real desde shell config (evita PATH no encontrado con instalación bun global)
            let cmd = "opencode2"
            try {
              const cfg = await shell.config.get().catch(() => null) as any
              const raw: string = cfg?.opencode2_command ?? ""
              if (raw.trim()) {
                const exe = raw.trim().split(/\s+/)[0] ?? ""
                if (exe) cmd = exe.includes(" ") ? `"${exe}"` : exe
              }
            } catch {}
            console.info("[auto-opencode2] PTY listo, enviando", cmd, "a", ptyId)
            const payload = cmd + "\r"
            const send = () => {
              try { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ cmd: "write", data: payload })) } catch {}
              if (ptyId) shell.pty.write(ptyId, payload).then(() => console.info("[auto-opencode2] write OK", ptyId)).catch((e) => console.warn("[auto-opencode2] write fail", e))
            }
            setTimeout(send, 500)
            setTimeout(send, 1100)
            setTimeout(send, 1800)
          }
        } catch {}
      }).catch(() => {
        term.writeln("\r\n\x1b[31m[Terminal] No se pudo iniciar el proceso ConPTY. Verifique que el ejecutable de escritorio esté en ejecución.\x1b[0m\r\n")
      })
    }

    // Zoom: dentro del terminal (rueda con Ctrl, pinch, botones) + global --ui-scale
    const handleWheelZoom = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -1 : 1
      try {
        const cur = getTerminalFontSize(tabId)
        const nxt = setTerminalFontSize(tabId, cur + delta)
        baseFontFromStore = nxt
        applyZoom(nxt)
      } catch {}
    }
    // Pinch con 2 dedos (Android/tablet)
    let pinchStartDist = 0
    let pinchStartFont = 0
    let pinchActive = false
    let pinchLastNudge = 0
    const dist2 = (t0: Touch, t1: Touch) => Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchActive = true
        pinchStartDist = dist2(e.touches[0]!, e.touches[1]!)
        try { pinchStartFont = getTerminalFontSize(tabId) } catch { pinchStartFont = baseFontFromStore }
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!pinchActive || e.touches.length !== 2) return
      const d = dist2(e.touches[0]!, e.touches[1]!)
      const delta = d - pinchStartDist
      if (Math.abs(delta) < 18) return
      const now = Date.now()
      if (now - pinchLastNudge < 90) return
      pinchLastNudge = now
      e.preventDefault()
      const step = delta > 0 ? 1 : -1
      try {
        const nxt = setTerminalFontSize(tabId, pinchStartFont + step)
        baseFontFromStore = nxt
        pinchStartFont = nxt
        pinchStartDist = d
        applyZoom(nxt)
      } catch {}
    }
    const onTouchEnd = () => { pinchActive = false }
    el.addEventListener("wheel", handleWheelZoom, { passive: false })
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd, { passive: true })

    // Escuchar zoom global + zoom por tab
    window.addEventListener("ui-zoom", handleUiZoom)
    window.addEventListener("terminal:zoom", handleTerminalZoom as any)
    // Ctrl+=/Ctrl+- / Ctrl+0: nativo al terminal (no robar al TUI sin Ctrl)
    const onKeyDown = (ev: KeyboardEvent) => {
      if (!(ev.ctrlKey || ev.metaKey)) return
      if (ev.key === "=" || ev.key === "+" || ev.key === "Add") {
        ev.preventDefault()
        try {
          const nxt = setTerminalFontSize(tabId, getTerminalFontSize(tabId) + 1)
          baseFontFromStore = nxt
          applyZoom(nxt)
        } catch {}
      } else if (ev.key === "-" || ev.key === "Subtract" || ev.key === "_") {
        ev.preventDefault()
        try {
          const nxt = setTerminalFontSize(tabId, getTerminalFontSize(tabId) - 1)
          baseFontFromStore = nxt
          applyZoom(nxt)
        } catch {}
      } else if (ev.key === "0") {
        ev.preventDefault()
        try {
          const nxt = setTerminalFontSize(tabId, 13)
          baseFontFromStore = nxt
          applyZoom(nxt)
        } catch {}
      }
    }
    window.addEventListener("keydown", onKeyDown)
    // Algunos navegadores no disparan ResizeObserver con solo font-size: forzar
    let zoomDebounce = 0
    const onWindowResize = () => {
      window.clearTimeout(zoomDebounce)
      zoomDebounce = window.setTimeout(() => { if (!disposed) handleUiZoom() }, 40)
    }
    window.addEventListener("resize", onWindowResize)
    // DPR change (mover entre monitores / zoom del OS) también corrompe atlas
    let lastDpr = window.devicePixelRatio || 1
    const dprQuery = window.matchMedia?.(`(resolution: ${lastDpr}dppx)`) as MediaQueryList | undefined
    const onDprChange = () => {
      if (disposed) return
      const dpr = window.devicePixelRatio || 1
      if (dpr === lastDpr) return
      lastDpr = dpr
      try { (webglAddon as any)?.clearTextureAtlas?.() } catch {}
      if (usingWebGL) {
        window.clearTimeout(webglRebuildTimer)
        webglRebuildTimer = window.setTimeout(() => {
          if (disposed || !usingWebGL) return
          rebuildWebGL()
          try { fit.fit(); (term as any).refresh?.(0, term.rows - 1) } catch {}
          sendResize()
        }, 80) as any
      }
      try { fit.fit() } catch {}
      sendResize()
      // re-armar listener con nuevo dpr
      try { dprQuery?.removeEventListener?.("change", onDprChange as any) } catch {}
      try { window.matchMedia?.(`(resolution: ${dpr}dppx)`)?.addEventListener?.("change", onDprChange as any) } catch {}
    }
    try { dprQuery?.addEventListener?.("change", onDprChange as any) } catch {}
    window.addEventListener("resize", onDprChange)

    let resizeTimer = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        if (disposed) return
        try {
          try { (webglAddon as any)?.clearTextureAtlas?.() } catch {}
          fit.fit()
          try { (term as any).refresh?.(0, term.rows - 1) } catch {}
          sendResize()
        } catch {
          /* ignore */
        }
      }, 80)
    })
    ro.observe(el)
    window.setTimeout(() => {
      try {
        try { (webglAddon as any)?.clearTextureAtlas?.() } catch {}
        fit.fit()
        sendResize()
      } catch {
        /* ignore */
      }
    }, 150)

    return () => {
      disposed = true
      window.clearTimeout(pollTimer)
      window.clearTimeout(resizeTimer)
      window.clearTimeout(zoomDebounce)
      window.clearTimeout(webglRebuildTimer)
      el.removeEventListener("wheel", handleWheelZoom as any)
      el.removeEventListener("touchstart", onTouchStart as any)
      el.removeEventListener("touchmove", onTouchMove as any)
      el.removeEventListener("touchend", onTouchEnd as any)
      document.removeEventListener("visibilitychange", onVisChange)
      window.removeEventListener("ui-zoom", handleUiZoom as any)
      window.removeEventListener("terminal:zoom", handleTerminalZoom as any)
      window.removeEventListener("keydown", onKeyDown as any)
      window.removeEventListener("resize", onWindowResize)
      window.removeEventListener("resize", onDprChange as any)
      try { dprQuery?.removeEventListener?.("change", onDprChange as any) } catch {}
      ro.disconnect()
      onData.dispose()
      try { linkProviderDisposable.dispose() } catch { /* ignore */ }
      try {
        ws?.close()
      } catch {
        /* ignore */
      }
      try {
        webglAddon?.dispose()
      } catch {
        /* ignore */
      }
      // NO matar PTY: sobrevive a hide/resize/tab-switch; solo killTerminalPty() con X lo mata
      term.dispose()
    }
  }, [tabId])

  return <div ref={ref} style={{ width: "100%", height: "100%", background: "#0d1117", padding: 6, touchAction: "none", overscrollBehavior: "contain" }} />
})

export const TerminalPanel = memo(function TerminalPanel({
  cwd,
  shellName,
  hideHeader = false,
  panelIndex,
  panelId,
  onToggleDock,
  isDocked,
  isFloating,
  onMaximize,
  maximized,
  onClose,
}: {
  cwd?: string
  shellName?: string
  hideHeader?: boolean
  panelIndex?: number
  panelId?: string
  onToggleDock?: () => void
  isDocked?: boolean
  /** Instancia de la ventana flotante (modal), no un panel del grid. */
  isFloating?: boolean
  onMaximize?: () => void
  maximized?: boolean
  onClose?: () => void
}) {
  const [currentShell, setCurrentShell] = useState<string>(shellName || "pwsh")
  const [splitTabId, setSplitTabId] = useState<string | null>(null)
  const [termTabs, setTermTabs] = useState<Array<{ id: string; title: string; shell: string }>>(() => {
    if (panelId && terminalStore.has(panelId)) return terminalStore.get(panelId)!.tabs
    return [{ id: "term-1", title: `${shellName || "pwsh"} 1`, shell: shellName || "pwsh" }]
  })
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    if (panelId && terminalStore.has(panelId)) return terminalStore.get(panelId)!.activeId
    return "term-1"
  })

  // Persistir tabs al mover la terminal (panelId se mueve con el panel).
  useEffect(() => {
    if (!panelId) return
    terminalStore.set(panelId, { tabs: termTabs, activeId: activeTabId, splitId: splitTabId })
  }, [panelId, termTabs, activeTabId, splitTabId])

  // Si el panelId cambia (movimiento), hidratar desde el store.
  useEffect(() => {
    if (panelId && terminalStore.has(panelId)) {
      const saved = terminalStore.get(panelId)!
      setTermTabs(saved.tabs)
      setActiveTabId(saved.activeId)
      if (saved.splitId) setSplitTabId(saved.splitId)
    }
  }, [panelId])

  useEffect(() => {
    const onTabsUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (panelId && (detail?.sourcePanelId === panelId || detail?.destPanelId === panelId)) {
        if (terminalStore.has(panelId)) {
          const saved = terminalStore.get(panelId)!
          setTermTabs([...saved.tabs])
          setActiveTabId(saved.activeId)
          if (saved.splitId) setSplitTabId(saved.splitId)
        }
      }
    }
    window.addEventListener("terminal:tabs-updated", onTabsUpdated)
    return () => window.removeEventListener("terminal:tabs-updated", onTabsUpdated)
  }, [panelId])

  const handleAddTab = () => {
    const nextNum = termTabs.length + 1
    const newId = `term-${Date.now()}`
    setTermTabs((prev) => [...prev, { id: newId, title: `${currentShell} ${nextNum}`, shell: currentShell }])
    setActiveTabId(newId)
  }

  const handleSplit = () => {
    const nextNum = termTabs.length + 1
    const newId = `term-${Date.now()}`
    const newTab = { id: newId, title: `${currentShell} ${nextNum}`, shell: currentShell }
    setTermTabs((prev) => [...prev, newTab])
    // Mostrar split: mantener el tab activo actual a la izquierda y el nuevo a la derecha
    if (!splitTabId) {
      setSplitTabId(newId)
    } else {
      // Si ya hay split, reemplazar el panel derecho y enfocar el nuevo
      setSplitTabId(newId)
      setActiveTabId(newId)
    }
  }

  const handleCloseTab = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (termTabs.length <= 1) {
      killTerminalPty(id)
      const newId = `term-${Date.now()}`
      setTermTabs([{ id: newId, title: `${currentShell} 1`, shell: currentShell }])
      setActiveTabId(newId)
      setSplitTabId(null)
      if (panelId) {
        terminalStore.delete(panelId)
      }
      return
    }
    const nextTabs = termTabs.filter((t) => t.id !== id)
    setTermTabs(nextTabs)
    // Solo X explícita mata la PTY; hide/resize no la toca
    killTerminalPty(id)
    if (splitTabId === id) {
      setSplitTabId(null)
    }
    if (activeTabId === id) {
      // Si se cerró el tab activo y había split, promover el split a activo
      if (splitTabId && splitTabId !== id) {
        setActiveTabId(splitTabId)
        setSplitTabId(null)
      } else {
        setActiveTabId(nextTabs[nextTabs.length - 1].id)
      }
    } else if (splitTabId && activeTabId === splitTabId) {
      // Caso borde: active es el split y se cerró otro tab
    }
  }

  const [zoomTick, setZoomTick] = useState(0)
  useEffect(() => {
    const onZoom = () => setZoomTick((x) => x + 1)
    window.addEventListener("terminal:zoom", onZoom)
    return () => window.removeEventListener("terminal:zoom", onZoom)
  }, [])
  const activeZoom = (() => { void zoomTick; try { return getTerminalFontSize(activeTabId) } catch { return 13 } })()
  const pct = Math.round((activeZoom / 13) * 100)
  const zoomIn = () => { try { const cur = getTerminalFontSize(activeTabId); setTerminalFontSize(activeTabId, cur + 1) } catch {} }
  const zoomOut = () => { try { const cur = getTerminalFontSize(activeTabId); setTerminalFontSize(activeTabId, cur - 1) } catch {} }
  const zoomReset = () => { try { setTerminalFontSize(activeTabId, 13) } catch {} }

  // Menú contextual del header (click derecho): movimiento + acople
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: "#0d1117" }}>
      {/* Barra superior estilo VS Code */}
      {!hideHeader && (
        <div className="terminal-header-bar"
          draggable={true}
          style={{ cursor: "grab" }}
          onContextMenu={(e) => {
            e.preventDefault()
            setCtxMenu({ x: e.clientX, y: e.clientY })
          }}
          onDragStart={(e) => {
            const dragPayload = panelIndex !== undefined ? `panel:${panelIndex}:kind:terminal` : "kind:terminal"
            e.dataTransfer.setData("text/plain", dragPayload)
            e.dataTransfer.setData("application/x-opencode-path", dragPayload)
            e.dataTransfer.effectAllowed = "move"
          }}
        >
          <div className="terminal-tabs-group">
            <div className="terminal-tab active">
              <span className="terminal-status-dot" />
              <span>TERMINAL</span>
            </div>
          </div>

          <div className="terminal-actions-group">
            <span className="terminal-zoom-group" title="Zoom (Ctrl+rueda, pinch, Ctrl+=/-/0)">
              <button type="button" className="terminal-action-btn" onClick={zoomOut} aria-label="Zoom menos">−</button>
              <button type="button" className="terminal-zoom-label" onClick={zoomReset} aria-label="Restablecer zoom" title="Restablecer al 100% (Ctrl+0)">{pct}%</button>
              <button type="button" className="terminal-action-btn" onClick={zoomIn} aria-label="Zoom más">+</button>
            </span>
            <div className="terminal-shell-picker">
              <span className="terminal-tab-icon" style={{ marginRight: 4 }}><TerminalIcon size={12} /></span>
              <select
                value={currentShell}
                onChange={(e) => setCurrentShell(e.target.value)}
                className="terminal-shell-select"
                title="Seleccionar shell"
              >
                <option value="pwsh">pwsh</option>
                <option value="powershell">powershell</option>
                <option value="cmd">cmd</option>
                <option value="bash">bash</option>
                <option value="wsl">wsl</option>
              </select>
            </div>

            <button
              type="button"
              className="terminal-action-btn"
              onClick={handleAddTab}
              title="Nueva terminal"
              aria-label="Nueva terminal"
            >
              <PlusIcon size={13} />
              <span style={{ marginLeft: 1 }}><ChevronDownIcon size={10} /></span>
            </button>

            <button
              type="button"
              className="terminal-action-btn"
              onClick={handleSplit}
              title="Dividir terminal"
              aria-label="Dividir terminal"
            >
              <SplitIcon size={13} />
            </button>

            <button
              type="button"
              className="terminal-action-btn terminal-trash-btn"
              onClick={() => handleCloseTab(activeTabId)}
              title="Eliminar terminal"
              aria-label="Eliminar terminal"
            >
              <TrashIcon size={13} />
            </button>

            <button
              type="button"
              className="terminal-action-btn"
              title="Más acciones..."
              aria-label="Más acciones"
            >
              <MoreHorizontalIcon size={13} />
            </button>

            {(onToggleDock || onMaximize || onClose) && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 2, marginLeft: 6, borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: 6 }}>
                {onToggleDock && (
                  <button
                    type="button"
                    className="terminal-action-btn"
                    onClick={onToggleDock}
                    title={isDocked ? "Desacoplar terminal" : "Acoplar abajo"}
                    aria-label={isDocked ? "Desacoplar terminal" : "Acoplar abajo"}
                  >
                    <SplitIcon size={12} />
                  </button>
                )}

                {onMaximize && (
                  <button
                    type="button"
                    className="terminal-action-btn"
                    onClick={onMaximize}
                    title={maximized ? "Restaurar tamaño" : "Maximizar"}
                    aria-label={maximized ? "Restaurar tamaño" : "Maximizar"}
                  >
                    {maximized ? <MinimizeIcon size={12} /> : <MaximizeIcon size={12} />}
                  </button>
                )}

                {onClose && (
                  <button
                    type="button"
                    className="terminal-action-btn"
                    onClick={onClose}
                    title="Cerrar panel"
                    aria-label="Cerrar panel"
                  >
                    <CloseIcon size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenedor principal de terminales con columna de pestañas estilo VS Code */}
      <div className="terminal-body-wrapper">
        {splitTabId ? (
          <div style={{ display: "flex", flex: 1, minHeight: 0, gap: 1, background: "var(--border)" }}>
            {(() => {
              const leftTab = termTabs.find((t) => t.id === activeTabId) ?? termTabs[0]
              const rightTab = termTabs.find((t) => t.id === splitTabId)
              if (!leftTab || !rightTab) return null
              return (
                <>
                  <div style={{ flex: 1, position: "relative", background: "#0d1117", display: "flex", flexDirection: "column" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <SingleTerminal cwd={cwd} shellName={leftTab.shell} tabId={leftTab.id} />
                    </div>
                    <div style={{ padding: "2px 6px", fontSize: 12, color: "var(--muted)", background: "var(--surface-strong)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                      <span>{leftTab.title}</span>
                      <button onClick={() => setSplitTabId(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }} title="Cerrar split">×</button>
                    </div>
                  </div>
                  <div style={{ flex: 1, position: "relative", background: "#0d1117", display: "flex", flexDirection: "column" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <SingleTerminal cwd={cwd} shellName={rightTab.shell} tabId={rightTab.id} />
                    </div>
                    <div style={{ padding: "2px 6px", fontSize: 12, color: "var(--muted)", background: "var(--surface-strong)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                      <span>{rightTab.title}</span>
                      <button onClick={() => setSplitTabId(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }} title="Cerrar split">×</button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        ) : (
          <>
            {/* Viewport de xterm: todas las terminales montadas para no perder procesos */}
            <div className="terminal-viewport-container">
              {termTabs.map((tab) => (
                <div
                  key={tab.id}
                  style={{
                    position: "absolute",
                    inset: 0,
                    visibility: tab.id === activeTabId ? "visible" : "hidden",
                    pointerEvents: tab.id === activeTabId ? "auto" : "none",
                    zIndex: tab.id === activeTabId ? 1 : 0,
                  }}
                >
                  <SingleTerminal cwd={cwd} shellName={tab.shell} tabId={tab.id} />
                </div>
              ))}
            </div>

            {/* Columna lateral de terminales activas estilo VS Code */}
            <div className="terminal-tabs-column">
                <div
                className="terminal-tabs-column-head"
                draggable={!isDocked}
                style={{ cursor: isDocked ? "default" : "grab" }}
                onDragStart={(e) => {
                  if (isDocked) { e.preventDefault(); return }
                  const dragPayload = panelIndex !== undefined ? `panel:${panelIndex}:kind:terminal` : "kind:terminal"
                  e.dataTransfer.setData("text/plain", dragPayload)
                  e.dataTransfer.setData("application/x-opencode-path", dragPayload)
                  e.dataTransfer.effectAllowed = "move"
                }}
              >
                <span>TERMINALS ({termTabs.length})</span>
                <button
                  type="button"
                  onClick={handleAddTab}
                  style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}
                  title="Nueva terminal"
                >
                  <PlusIcon size={11} />
                </button>
              </div>
              {termTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`terminal-tab-item${tab.id === activeTabId ? " active" : ""}`}
                  onClick={() => setActiveTabId(tab.id)}
                  draggable
                  style={{ cursor: "grab" }}
                  onDragStart={(e) => {
                    const pId = panelId || (isDocked ? "bottom-terminal" : `panel-${panelIndex ?? 0}-term`)
                    const dragPayload = `panel:${panelIndex ?? 0}:terminal-tab:${tab.id}:${pId}`
                    e.dataTransfer.setData("text/plain", dragPayload)
                    e.dataTransfer.setData("application/x-opencode-path", dragPayload)
                    e.dataTransfer.effectAllowed = "move"
                  }}
                >
                  <div className="terminal-tab-item-left">
                    <TerminalIcon size={12} />
                    <span>{tab.title}</span>
                  </div>
                  <button
                    type="button"
                    className="terminal-tab-close-btn"
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    title={termTabs.length > 1 ? "Cerrar terminal" : "Reiniciar terminal"}
                    aria-label={termTabs.length > 1 ? "Cerrar terminal" : "Reiniciar terminal"}
                  >
                    <TrashIcon size={11} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Menú contextual del header: movimiento, acople como ventana, zoom, cerrar */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          actions={[
            ...(onToggleDock ? [{
              id: "dock",
              label: isDocked ? "Abrir como ventana flotante" : "Acoplar abajo",
              onAction: () => onToggleDock(),
            }] : []),
            ...(!isDocked && isFloating ? [{
              id: "center",
              label: "Centrar ventana",
              onAction: () => { try { window.dispatchEvent(new CustomEvent("terminal:float-center")) } catch {} },
            }] : []),
            ...(onMaximize ? [{
              id: "maximize",
              label: maximized ? "Restaurar tamaño" : "Maximizar",
              onAction: () => onMaximize(),
            }] : []),
            ...(onClose ? [{
              id: "close",
              label: "Cerrar terminal",
              onAction: () => onClose(),
            }] : []),
          ]}
        />
      )}
    </div>
  )
})

// ============================================================== Explorador

let clipboardItem: { path: string; name: string; isDir: boolean } | null = null

function ExplorerTreeFolder({
  entry,
  depth = 0,
  onOpenFile,
  handleContextMenu,
  handleDropExternal,
  fav,
  cwd,
  t,
}: {
  entry: FsEntry
  depth?: number
  onOpenFile: (path: string) => void
  handleContextMenu: (e: React.MouseEvent, entry: FsEntry | null, isDir: boolean) => void
  handleDropExternal: (e: React.DragEvent, targetDir: string) => void
  fav: (path: string, add: boolean) => void
  cwd: string | null
  t: (k: any) => string
}) {
  const [expanded, setExpanded] = useState(false)
  const [subDirs, setSubDirs] = useState<FsEntry[]>([])
  const [subFiles, setSubFiles] = useState<FsEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [dropTarget, setDropTarget] = useState(false)

  const toggle = async () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (subDirs.length === 0 && subFiles.length === 0) {
      await reload()
    }
  }

  const reload = async () => {
    setLoading(true)
    try {
      const r = await shell.fs.list(entry.path)
      setSubDirs(r.dirs || [])
      setSubFiles(r.files || [])
    } catch {
      setSubDirs([])
      setSubFiles([])
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh: recarga si /changes reporta create/remove dentro de esta carpeta
  useEffect(() => {
    if (!expanded) return
    const onFs = (e: Event) => {
      const parents = (e as CustomEvent<string[]>).detail ?? []
      if (parents.includes(normFsPath(entry.path))) void reload()
    }
    window.addEventListener("explorer:fs-changed", onFs)
    return () => window.removeEventListener("explorer:fs-changed", onFs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, entry.path])

  return (
    <div className="shell-tree-folder-group">
      <div
        className={`shell-row shell-dir${expanded ? " is-expanded" : ""}${dropTarget ? " is-drop-target" : ""}`}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        onClick={toggle}
        onDoubleClick={() => fav(entry.path, true)}
        onContextMenu={(e) => handleContextMenu(e, entry, true)}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed === "move" ? "move" : "copy"; setDropTarget(true) }}
        onDragLeave={() => setDropTarget(false)}
        onDrop={(e) => { setDropTarget(false); handleDropExternal(e, entry.path) }}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", entry.path)
          e.dataTransfer.setData("application/x-opencode-path", entry.path)
          e.dataTransfer.setData("application/x-opencode-is-image", "0")
          e.dataTransfer.effectAllowed = "move"
        }}
      >
        <span className="shell-tree-chevron" style={{ width: 12, fontSize: 9, color: "var(--muted)", display: "inline-flex", justifyContent: "center", flexShrink: 0 }}>
          {expanded ? "▼" : "▶"}
        </span>
        <FolderIcon size={13} className="shell-glyph" />
        <span className="shell-name">{entry.name}</span>
        {cwd && (
          <button className="btn-icon compact shell-star" title={t('shell.fav')} onClick={(e) => { e.stopPropagation(); fav(entry.path, true) }}><StarIcon size={12} /></button>
        )}
      </div>

      {expanded && (
        <div className="shell-tree-sublist" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", marginLeft: `${depth * 14 + 11}px` }}>
          {loading && (
            <div style={{ padding: "3px 8px 3px 14px", color: "var(--muted)", fontSize: "0.72rem" }}>
              Cargando...
            </div>
          )}
          {!loading && subDirs.map((d) => (
            <ExplorerTreeFolder
              key={d.path}
              entry={d}
              depth={depth + 1}
              onOpenFile={onOpenFile}
              handleContextMenu={handleContextMenu}
              handleDropExternal={handleDropExternal}
              fav={fav}
              cwd={cwd}
              t={t}
            />
          ))}
          {!loading && subFiles.map((f) => {
            const ic = fileIcon(f.name, false)
            const isImg = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(f.name)
            return (
              <div
                key={f.path}
                className="shell-row shell-file"
                style={{ paddingLeft: `${(depth + 1) * 14 + 6}px` }}
                onClick={() => onOpenFile(f.path)}
                onContextMenu={(e) => handleContextMenu(e, f, false)}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", f.path)
                  e.dataTransfer.setData("application/x-opencode-path", f.path)
                  e.dataTransfer.setData("application/x-opencode-is-image", isImg ? "1" : "0")
                  e.dataTransfer.effectAllowed = "move"
                }}
              >
                <span style={{ width: 12, flexShrink: 0 }} />
                <span className="shell-glyph" style={{ color: ic.color }}>{ic.glyph}</span>
                <span className="shell-name">{f.name}</span>
                <span className="shell-size">{f.size != null ? (f.size > 1024 * 1024 ? `${(f.size / 1048576).toFixed(1)}M` : f.size > 1024 ? `${(f.size / 1024).toFixed(0)}K` : `${f.size}B`) : ""}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const EXPLORER_RECENT_KEY = "opencode.explorer.recentDirs"
function loadExplorerRecent(): string[] {
  try {
    const raw = localStorage.getItem(EXPLORER_RECENT_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((s: any) => typeof s === "string" && s).slice(0, 20) : []
  } catch { return [] }
}
function pushExplorerRecent(path: string) {
  if (!path) return
  try {
    const list = loadExplorerRecent().filter((p) => p !== path)
    list.unshift(path)
    localStorage.setItem(EXPLORER_RECENT_KEY, JSON.stringify(list.slice(0, 20)))
  } catch {}
}

export const ExplorerPanel = memo(function ExplorerPanel({
  onOpenSessionDir,
  initialCwd,
  onOpenFile,
}: {
  onOpenSessionDir: (dir: string) => void
  initialCwd?: string | null
  onOpenFile?: (path: string) => void
}) {
  const t = useT()
  const { confirm } = useDialog()
  const [drives, setDrives] = useState<string[]>([])
  const [showDrives, setShowDrives] = useState(false)
  const [cwd, setCwd] = useState<string | null>(initialCwd || null)
  const [dirs, setDirs] = useState<FsEntry[]>([])
  const [files, setFiles] = useState<FsEntry[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [preview, setPreview] = useState<{ path: string; content: string; ext: string; truncated: boolean } | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FsEntry | null; isDir: boolean } | null>(null)
  const [copied, setCopied] = useState<typeof clipboardItem>(clipboardItem)
  const [dragOverTree, setDragOverTree] = useState(false)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [execConfirm, setExecConfirm] = useState<{ path: string; name: string } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const projectAnchorRef = useRef<HTMLButtonElement | null>(null)
  const projectMenuElRef = useRef<HTMLDivElement | null>(null)
  const [explorerRecent, setExplorerRecent] = useState<string[]>(() => loadExplorerRecent())
  const [projectMenuPos, setProjectMenuPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null)
  const refreshExplorerRecent = useCallback(() => setExplorerRecent(loadExplorerRecent()), [])

  const toggleProjectMenu = useCallback(() => {
    setShowProjectMenu((v) => {
      const next = !v
      if (next) {
        const r = projectAnchorRef.current?.getBoundingClientRect()
        if (r) {
          // Menú estimado 420px de ancho (DRY con calcMenuPos: mismo clamp+flip)
          setProjectMenuPos(calcMenuPosForAnchor(r, 420, Math.min(360, Math.round(window.innerHeight * 0.6))))
        }
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!showProjectMenu) return
    const onPointerDown = (e: PointerEvent): void => {
      const t = e.target as Node
      if (projectMenuElRef.current?.contains(t)) return
      if (projectAnchorRef.current?.contains(t)) return
      setShowProjectMenu(false)
    }
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") setShowProjectMenu(false) }
    const onReflow = (): void => setShowProjectMenu(false)
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKey)
    window.addEventListener("resize", onReflow)
    window.addEventListener("scroll", onReflow, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onReflow)
      window.removeEventListener("scroll", onReflow, true)
    }
  }, [showProjectMenu])

  const isExecScript = (path?: string) => {
    if (!path) return false
    const p = path.toLowerCase()
    return p.endsWith(".bat") || p.endsWith(".cmd") || p.endsWith(".vbs") || p.endsWith(".ps1") || p.endsWith(".exe") || p.endsWith(".sh")
  }

  const showNotice = (msg: string) => {
    setActionNotice(msg)
    window.setTimeout(() => setActionNotice((m) => (m === msg ? null : m)), 2500)
  }

  const load = useCallback(async (path: string, silent = false) => {
    if (!path) return
    setCwd(path)
    if (!silent) {
      setPreview(null)
      pushExplorerRecent(path)
      refreshExplorerRecent()
    }
    try {
      const r = await shell.fs.list(path)
      setDirs(r.dirs || [])
      setFiles(r.files || [])
    } catch {
      setDirs([])
      setFiles([])
    }
  }, [refreshExplorerRecent])

  // Auto-cargar la sesión cuando cambia o se define initialCwd
  useEffect(() => {
    if (initialCwd) {
      load(initialCwd)
    } else {
      const recent = loadExplorerRecent()
      if (recent.length > 0) {
        load(recent[0]!)
      } else {
        shell.fs.drives().then(({ drives }) => {
          setDrives(drives)
          if (drives.length > 0) load(drives[0])
        }).catch(() => {})
      }
    }
  }, [initialCwd, load])

  useEffect(() => {
    if (showDrives && drives.length === 0) {
      shell.fs.drives().then(({ drives }) => {
        setDrives(drives)
        shell.fs.favorites().then(({ favorites }) => setFavorites(favorites))
      }).catch(() => {})
    }
  }, [showDrives, drives.length])

  // Auto-refresh del explorador: poll a /shell/fs/changes cada 2.5s (solo con
  // la pestaña visible) + al volver el foco. Recarga silenciosa si el cambio
  // cae en el cwd; avisa al árbol para subcarpetas expandidas.
  const cwdRef = useRef(cwd)
  cwdRef.current = cwd
  const loadRef = useRef(load)
  loadRef.current = load
  useEffect(() => {
    const seqRef = { current: 0 }
    const inflightRef = { current: false }
    let stopped = false
    let timer = 0
    const poll = async () => {
      if (stopped) return
      if (document.visibilityState === "visible" && !inflightRef.current) {
        inflightRef.current = true
        try {
          const r = await shell.fs.changes(seqRef.current)
          seqRef.current = r.seq ?? seqRef.current
          const parents = affectedParentDirs(r.events ?? [])
          if (parents.length > 0) {
            const cur = cwdRef.current
            if (cur && parents.includes(normFsPath(cur))) {
              await loadRef.current(cur, true)
            }
            window.dispatchEvent(new CustomEvent("explorer:fs-changed", { detail: parents }))
          }
        } catch {
          /* server viejo sin /changes: el explorador sigue manual */
        } finally {
          inflightRef.current = false
        }
      }
      if (!stopped) timer = window.setTimeout(poll, 2500)
    }
    // Baseline sin aplicar eventos (evita tormenta inicial del ring del server)
    shell.fs.changes(0).then((r) => { seqRef.current = r.seq ?? 0 }).catch(() => {}).finally(() => {
      if (!stopped) timer = window.setTimeout(poll, 2500)
    })
    const wake = () => {
      if (stopped || document.visibilityState !== "visible") return
      window.clearTimeout(timer)
      void poll()
    }
    const onFocus = () => { if (!stopped) { window.clearTimeout(timer); void poll() } }
    document.addEventListener("visibilitychange", wake)
    window.addEventListener("focus", onFocus)
    return () => {
      stopped = true
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", wake)
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    if (!contextMenu) return
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    window.addEventListener("pointerdown", onDocClick)
    return () => window.removeEventListener("pointerdown", onDocClick)
  }, [contextMenu])

  const nav = (path: string) => {
    setHistory((h) => [...h, cwd ?? ""])
    load(path)
  }
  const back = () => {
    const prev = history[history.length - 1]
    if (prev) {
      setHistory((h) => h.slice(0, -1))
      load(prev)
    } else if (initialCwd && cwd !== initialCwd) {
      load(initialCwd)
    }
  }
  const fav = (path: string, add: boolean) => {
    shell.fs.toggleFavorite(path, add).then(() => shell.fs.favorites().then(({ favorites }) => setFavorites(favorites)))
  }

  const openFile = async (path: string) => {
    if (onOpenFile) {
      onOpenFile(path)
      return
    }
    const r = await shell.fs.read(path)
    setPreview({ path: r.path, content: r.content, ext: r.ext, truncated: r.truncated })
  }

  const handleContextMenu = (e: React.MouseEvent, entry: FsEntry | null, isDir: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    const menuW = 240
    const menuH = 460 // altura real máxima (≈12 ítems); 260 cortaba "Copiar/Eliminar"
    const x = e.clientX + menuW > window.innerWidth ? Math.max(8, e.clientX - menuW) : e.clientX
    const y = e.clientY + menuH > window.innerHeight ? Math.max(8, window.innerHeight - menuH - 8) : e.clientY
    setContextMenu({ x, y, entry, isDir })
  }

  const copyRelativePath = (path: string) => {
    const base = initialCwd || cwd || ""
    const rel = base && path.startsWith(base) ? path.slice(base.length).replace(/^[/\\]+/, "") : path
    navigator.clipboard.writeText(rel)
    setContextMenu(null)
    showNotice(`Ruta relativa copiada: ${rel}`)
  }

  const copyFullPath = (path: string) => {
    navigator.clipboard.writeText(path)
    setContextMenu(null)
    showNotice(`Ruta completa copiada`)
  }

  const handleCopyItem = (entry: FsEntry, isDir: boolean) => {
    clipboardItem = { path: entry.path, name: entry.name, isDir }
    setCopied(clipboardItem)
    setContextMenu(null)
    showNotice(`Copiado: ${entry.name}`)
  }

  const handlePasteItem = async (destDir: string) => {
    if (!copied) return
    setContextMenu(null)
    try {
      await shell.fs.copy(copied.path, destDir)
      showNotice(`Pegado en ${destDir.split(/[/\\]/).pop() || destDir}`)
      if (cwd) load(cwd)
    } catch {
      showNotice(`Error al pegar archivo`)
    }
  }

  const handleDeleteItem = async (entry: FsEntry) => {
    setContextMenu(null)
    if (!(await confirm({ title: t('common.confirmDelete') ?? "Confirmar", message: `¿Eliminar definitivamente "${entry.name}"?`, confirmText: t('common.yes'), cancelText: t('common.cancel'), variant: "danger" }))) return
    try {
      await shell.fs.delete(entry.path)
      showNotice(`Eliminado: ${entry.name}`)
      if (cwd) load(cwd)
    } catch {
      showNotice(`Error al eliminar`)
    }
  }

  const handleDropExternal = async (e: React.DragEvent, targetDir: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverTree(false)
    // Drag interno (archivo/carpeta del propio árbol) → mover a targetDir.
    const internalSrc = e.dataTransfer.getData("application/x-opencode-path")
    if (internalSrc) {
      await handleMoveInto(internalSrc, targetDir)
      return
    }
    const filesList = e.dataTransfer.files
    if (!filesList || filesList.length === 0) return

    let count = 0
    for (const f of Array.from(filesList)) {
      try {
        const reader = new FileReader()
        const b64 = await new Promise<string>((res, rej) => {
          reader.onload = () => {
            const dataUrl = reader.result as string
            const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl
            res(base64)
          }
          reader.onerror = rej
          reader.readAsDataURL(f)
        })
        const sep = targetDir.includes("\\") ? "\\" : "/"
        const targetPath = `${targetDir}${targetDir.endsWith(sep) ? "" : sep}${f.name}`
        await shell.fs.write(targetPath, b64)
        count++
      } catch {
        /* ignore */
      }
    }
    showNotice(`Añadido(s) ${count} archivo(s) a la carpeta`)
    if (cwd) load(cwd)
  }

  const handleMoveInto = async (srcPath: string, targetDir: string) => {
    const normTarget = targetDir.replace(/[\\/]+$/, "")
    const srcNorm = srcPath.replace(/[\\/]+$/, "")
    const sep = srcNorm.includes("\\") ? "\\" : "/"
    if (srcNorm === normTarget || normTarget.startsWith(srcNorm + sep)) {
      showNotice("No podés mover una carpeta dentro de sí misma")
      return
    }
    try {
      const r = await shell.fs.move(srcPath, targetDir)
      const parts = r.path.split(/[/\\]/)
      showNotice(`Movido a ${parts[parts.length - 2] || targetDir}`)
      if (cwd) load(cwd)
    } catch (err) {
      showNotice(`Error al mover: ${String(err).slice(0, 80)}`)
      if (cwd) load(cwd)
    }
  }

  const handleCreateFile = async (parentDir: string) => {
    setContextMenu(null)
    const raw = window.prompt("Nombre del nuevo archivo (ej: app.ts):")
    if (!raw || !raw.trim()) return
    const name = raw.trim().replace(/[\/\\]/g, "").replace(/\0/g, "")
    if (!name || name === ".." || name.includes(":") || name.includes("..")) {
      showNotice("Nombre de archivo inválido")
      return
    }
    const sep = parentDir.includes("\\") ? "\\" : "/"
    const fullPath = `${parentDir}${parentDir.endsWith(sep) ? "" : sep}${name}`
    try {
      await shell.fs.write(fullPath, "")
      showNotice(`Archivo creado: ${name}`)
      if (cwd) load(cwd)
      if (onOpenFile) onOpenFile(fullPath)
    } catch {
      showNotice("Error al crear archivo")
    }
  }

  const handleCreateFolder = async (parentDir: string) => {
    setContextMenu(null)
    const raw = window.prompt("Nombre de la nueva carpeta:")
    if (!raw || !raw.trim()) return
    const name = raw.trim().replace(/[\/\\]/g, "").replace(/\0/g, "")
    if (!name || name === ".." || name.includes(":") || name.includes("..")) {
      showNotice("Nombre de carpeta inválido")
      return
    }
    const sep = parentDir.includes("\\") ? "\\" : "/"
    const fullPath = `${parentDir}${parentDir.endsWith(sep) ? "" : sep}${name}`
    try {
      await shell.fs.mkdir(fullPath)
      showNotice(`Carpeta creada: ${name}`)
      if (cwd) load(cwd)
    } catch {
      showNotice("Error al crear carpeta")
    }
  }

  const projName = initialCwd ? (initialCwd.split(/[/\\]/).filter(Boolean).pop() || initialCwd) : null

  const openChangeFolder = async () => {
    try {
      const picked = await shell.fs.pickFolder()
      const path = (picked as any)?.path as string | null | undefined
      if (path) load(path)
    } catch {}
  }

  return (
    <div
      className={`shell-explorer${dragOverTree ? " is-drag-over" : ""}`}
      onContextMenu={(e) => handleContextMenu(e, null, true)}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDragOverTree(true) }}
      onDragLeave={() => setDragOverTree(false)}
      onDrop={(e) => handleDropExternal(e, cwd || initialCwd || "")}
    >
      <div className="shell-explorer-top" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", position: "relative" }}>
        <button className="btn-icon compact" onClick={back} title={t('shell.back')} aria-label={t('shell.back')}>←</button>
        <span className="shell-path" title={cwd ?? ""} style={{ flex: "1 1 auto", minWidth: 120 }}>
          {projName && cwd?.startsWith(initialCwd!) ? (
            cwd === initialCwd ? <><FolderIcon size={12} /> {projName}</> : <><FolderIcon size={12} /> {projName}/{cwd.slice(initialCwd!.length).replace(/^[/\\]+/, "")}</>
          ) : (cwd ?? "…")}
        </span>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            className="btn-secondary compact"
            onClick={openChangeFolder}
            title="Cambiar carpeta"
            aria-label="Cambiar carpeta"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 500, whiteSpace: "nowrap", padding: "4px 8px", minHeight: 26, lineHeight: 1 }}
          >
            <FolderIcon size={12} /> Cambiar carpeta
          </button>
          <button
            ref={projectAnchorRef}
            type="button"
            className="btn-secondary compact"
            onClick={toggleProjectMenu}
            title="Proyectos recientes"
            aria-label="Proyectos recientes"
            aria-expanded={showProjectMenu}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 26, minHeight: 26, padding: "0 5px", lineHeight: 1 }}
          >
            <ChevronDownIcon size={10} />
          </button>
          {showProjectMenu && projectMenuPos && createPortal(
            <div
              ref={projectMenuElRef}
              className="modal-dropdown fade-in"
              style={{
                position: "fixed",
                left: projectMenuPos.left,
                ...(projectMenuPos.top !== undefined ? { top: projectMenuPos.top } : { bottom: projectMenuPos.bottom }),
                zIndex: 100000,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                padding: "4px 0",
                minWidth: "280px",
                maxWidth: "min(420px, 88vw)",
                maxHeight: "min(360px, 60vh)",
                overflowY: "auto",
              }}
            >
              <div style={{ padding: "6px 10px 4px", fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Proyectos recientes
              </div>
              {explorerRecent.length === 0 ? (
                <div style={{ padding: "8px 10px", color: "var(--muted)", fontSize: "0.82rem" }}>Sin proyectos recientes</div>
              ) : explorerRecent.map((p) => {
                const label = p.split(/[/\\]/).filter(Boolean).pop() || p
                const isActive = cwd === p
                return (
                  <button
                    key={p}
                    type="button"
                    className="overflow-item"
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "space-between", fontWeight: isActive ? 600 : 400 }}
                    onClick={() => {
                      setShowProjectMenu(false)
                      load(p)
                    }}
                    title={p}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <FolderIcon size={13} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: "0.72rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "52%" }}>{p}</span>
                  </button>
                )
              })}
              <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
              <button type="button" className="overflow-item" onClick={() => { setShowProjectMenu(false); openChangeFolder() }}>
                <span><FolderIcon size={14} /></span> Cambiar carpeta…
              </button>
            </div>,
            document.body)}
        </div>
        <button type="button" className="btn-icon compact" onClick={() => handleCreateFile(cwd || initialCwd || "")} title="Nuevo archivo">
          +<FileIcon size={13} />
        </button>
        <button type="button" className="btn-icon compact" onClick={() => handleCreateFolder(cwd || initialCwd || "")} title="Nueva carpeta">
          +<FolderIcon size={13} />
        </button>
        <button type="button" className="btn-icon compact" onClick={() => load(cwd || initialCwd || "")} title="Recargar archivos">
          ↻
        </button>
        {copied && cwd && (
          <button type="button" className="btn-icon compact" onClick={() => handlePasteItem(cwd)} title={`Pegar "${copied.name}" aquí`}>
            <SaveIcon size={13} />
          </button>
        )}
        {initialCwd && (
          <button type="button" className="btn-icon compact" onClick={() => setShowDrives(!showDrives)} title={showDrives ? "Ocultar unidades de disco" : "Ver discos del sistema"}>
            <DiskIcon size={13} />
          </button>
        )}
      </div>
      {actionNotice && (
        <div style={{ padding: "4px 8px", fontSize: "0.75rem", background: "var(--primary-soft)", color: "var(--primary)", borderBottom: "1px solid var(--border)" }}>
          {actionNotice}
        </div>
      )}
      {showDrives && (
        <div className="shell-drives">
          {initialCwd && (
            <button type="button" className={`shell-drive${cwd === initialCwd ? " active" : ""}`} onClick={() => load(initialCwd)} title={initialCwd}>
              <FolderIcon size={13} /> Proyecto ({projName})
            </button>
          )}
          {drives.map((d) => (
            <button key={d} type="button" className={`shell-drive${cwd === d ? " active" : ""}`} onClick={() => load(d)}>{d}</button>
          ))}
        </div>
      )}
      <div className="shell-tree">
        {showDrives && favorites.length > 0 && (
          <div className="shell-tree-group">
            <div className="shell-tree-title">Favoritos</div>
            {favorites.map((f) => (
              <div key={f} className="shell-row" onDoubleClick={() => load(f)}>
                <FolderIcon size={13} className="shell-glyph" />
                <span className="shell-name">{f}</span>
                <button className="btn-icon compact" title={t('shell.removeFav')} onClick={() => fav(f, false)}>×</button>
              </div>
            ))}
          </div>
        )}
        {dirs.map((d) => (
          <ExplorerTreeFolder
            key={d.path}
            entry={d}
            depth={0}
            onOpenFile={openFile}
            handleContextMenu={handleContextMenu}
            handleDropExternal={handleDropExternal}
            fav={fav}
            cwd={cwd}
            t={t}
          />
        ))}
        {files.map((f) => {
          const ic = fileIcon(f.name, false)
          const isImg = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(f.name)
          return (
            <div
              key={f.path}
              className="shell-row shell-file"
              onClick={() => openFile(f.path)}
              onContextMenu={(e) => handleContextMenu(e, f, false)}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", f.path)
                e.dataTransfer.setData("application/x-opencode-path", f.path)
                e.dataTransfer.setData("application/x-opencode-is-image", isImg ? "1" : "0")
              }}
            >
              <span className="shell-glyph" style={{ color: ic.color }}>{ic.glyph}</span>
              <span className="shell-name">{f.name}</span>
              <span className="shell-size">{f.size != null ? (f.size > 1024 * 1024 ? `${(f.size / 1048576).toFixed(1)}M` : f.size > 1024 ? `${(f.size / 1024).toFixed(0)}K` : `${f.size}B`) : ""}</span>
            </div>
          )
        })}
        {dirs.length === 0 && files.length === 0 && <div className="shell-empty">{t('shell.empty')}</div>}
      </div>

      {/* Menú Contextual (Click Derecho) */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="modal-dropdown fade-in"
          style={{
            position: "fixed",
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 100000,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
            padding: "4px 0",
            minWidth: "230px",
            maxHeight: `calc(100vh - ${contextMenu.y}px - 12px)`,
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          {contextMenu.entry && (
            <>
              {!contextMenu.isDir && isExecScript(contextMenu.entry.path) && (
                <button
                  type="button"
                  className="overflow-item"
                  style={{ color: "var(--primary)", fontWeight: 600 }}
                  onClick={() => {
                    const entry = contextMenu.entry!
                    setContextMenu(null)
                    setExecConfirm({ path: entry.path, name: entry.name })
                  }}
                >
                  <span><TerminalIcon size={14} /></span> Ejecutar script
                </button>
              )}
              {!contextMenu.isDir && (contextMenu.entry.name.endsWith(".docx") || contextMenu.entry.name.endsWith(".pdf") || contextMenu.entry.name.endsWith(".md") || contextMenu.entry.name.endsWith(".txt")) && (
                <>
                  {contextMenu.entry.name.endsWith(".docx") && (
                    <button
                      type="button"
                      className="overflow-item"
                      onClick={() => {
                        const p = contextMenu.entry!.path
                        setContextMenu(null)
                        shell.doc.convert(p, "md").then((r: any) => {
                          if (r.ok) {
                            showNotice(`Convertido a Markdown: ${r.dest}`)
                            load(cwd || "")
                          }
                        }).catch((e: any) => showNotice(`Error: ${e.message || String(e)}`))
                      }}
                    >
                      <span><FileIcon size={14} /></span> Convertir a Markdown (.md)
                    </button>
                  )}
                  {contextMenu.entry.name.endsWith(".pdf") && (
                    <button
                      type="button"
                      className="overflow-item"
                      onClick={() => {
                        const p = contextMenu.entry!.path
                        setContextMenu(null)
                        shell.doc.convert(p, "md").then((r: any) => {
                          if (r.ok) {
                            showNotice(`Extraído texto a Markdown: ${r.dest}`)
                            load(cwd || "")
                          }
                        }).catch((e: any) => showNotice(`Error: ${e.message || String(e)}`))
                      }}
                    >
                      <span><FileIcon size={14} /></span> Extraer texto a Markdown (.md)
                    </button>
                  )}
                  {(contextMenu.entry.name.endsWith(".md") || contextMenu.entry.name.endsWith(".txt")) && (
                    <>
                      <button
                        type="button"
                        className="overflow-item"
                        onClick={() => {
                          const p = contextMenu.entry!.path
                          setContextMenu(null)
                          shell.doc.convert(p, "docx").then((r: any) => {
                            if (r.ok) {
                              showNotice(`Convertido a Word: ${r.dest}`)
                              load(cwd || "")
                            }
                          }).catch((e: any) => showNotice(`Error: ${e.message || String(e)}`))
                        }}
                      >
                        <span><FileIcon size={14} /></span> Convertir a Word (.docx)
                      </button>
                      <button
                        type="button"
                        className="overflow-item"
                        onClick={() => {
                          const p = contextMenu.entry!.path
                          setContextMenu(null)
                          shell.doc.convert(p, "pdf").then((r: any) => {
                            if (r.ok) {
                              showNotice(`Convertido a PDF: ${r.dest}`)
                              load(cwd || "")
                            }
                          }).catch((e: any) => showNotice(`Error: ${e.message || String(e)}`))
                        }}
                      >
                        <span><FileIcon size={14} /></span> Convertir a PDF (.pdf)
                      </button>
                    </>
                  )}
                </>
              )}
              <button
                type="button"
                className="overflow-item"
                onClick={() => (contextMenu.isDir ? nav(contextMenu.entry!.path) : openFile(contextMenu.entry!.path))}
              >
                <span><FolderIcon size={14} /></span> {contextMenu.isDir ? "Abrir carpeta" : "Abrir archivo"}
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => copyRelativePath(contextMenu.entry!.path)}
              >
                <span><LinkIcon size={14} /></span> Obtener ruta relativa
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => copyFullPath(contextMenu.entry!.path)}
              >
                <span><SaveIcon size={14} /></span> Obtener ruta completa
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => handleCreateFile(contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : cwd || initialCwd || "")}
              >
                <span><FileIcon size={14} /></span> Nuevo archivo
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => handleCreateFolder(contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : cwd || initialCwd || "")}
              >
                <span><FolderIcon size={14} /></span> Nueva carpeta
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => handleCopyItem(contextMenu.entry!, contextMenu.isDir)}
              >
                <span><SaveIcon size={14} /></span> Copiar {contextMenu.isDir ? "carpeta" : "archivo"}
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => {
                  const p = contextMenu.entry!.path
                  setContextMenu(null)
                  shell.fs.reveal(p).then((r) => {
                    if (r.ok) showNotice(`Abierto en el Explorador`)
                  }).catch(() => showNotice(`No se pudo abrir el Explorador`))
                }}
              >
                <span><MonitorIcon size={14} /></span> Abrir en el Explorador
              </button>
              <button
                type="button"
                className="overflow-item"
                style={{ color: "var(--danger)" }}
                onClick={() => handleDeleteItem(contextMenu.entry!)}
              >
                <span><TrashIcon size={14} /></span> Eliminar
              </button>
            </>
          )}
          {!contextMenu.entry && (
            <>
              <button
                type="button"
                className="overflow-item"
                onClick={() => handleCreateFile(cwd || initialCwd || "")}
              >
                <span><FileIcon size={14} /></span> Nuevo archivo aquí
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => handleCreateFolder(cwd || initialCwd || "")}
              >
                <span><FolderIcon size={14} /></span> Nueva carpeta aquí
              </button>
            </>
          )}
          {copied && (
            <button
              type="button"
              className="overflow-item"
              onClick={() => handlePasteItem(contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : cwd || initialCwd || "")}
            >
              <span><SaveIcon size={14} /></span> Pegar "{copied.name}"
            </button>
          )}
        </div>
      )}

      {preview && (
        <div className="shell-preview">
          <div className="shell-preview-head">
            <span className="shell-preview-name">{preview.path}</span>
            {cwd && <button className="btn-secondary compact" onClick={() => onOpenSessionDir(cwd)}>{t('shell.openSession')}</button>}
            <button className="btn-icon compact" onClick={() => setPreview(null)}>×</button>
          </div>
          <pre className="shell-preview-body">{preview.content}{preview.truncated ? "\n…" : ""}</pre>
        </div>
      )}

      {execConfirm && (
        <Modal onClose={() => setExecConfirm(null)} className="compact-modal" aria-labelledby="exec-confirm-title">
          <h2 id="exec-confirm-title" style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "1.1rem" }}>
            <TerminalIcon size={18} /> Ejecutar archivo
          </h2>
          <p style={{ margin: "12px 0 6px", fontSize: "0.9rem" }}>
            ¿Estás seguro de que deseas ejecutar <strong>{execConfirm.name}</strong>?
          </p>
          <p className="subtle" style={{ wordBreak: "break-all", fontSize: "0.8rem", margin: "0 0 16px" }}>
            {execConfirm.path}
          </p>
          <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn-secondary compact" onClick={() => setExecConfirm(null)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn-primary compact"
              onClick={async () => {
                const target = execConfirm
                setExecConfirm(null)
                try {
                  const res = await shell.fs.execFile(target.path)
                  if (res.ok) {
                    showNotice(`Ejecutando: ${target.name}`)
                  } else {
                    showNotice(`Error al ejecutar archivo`)
                  }
                } catch (err: any) {
                  showNotice(`Error: ${err?.message || "al ejecutar"}`)
                }
              }}
            >
              <TerminalIcon size={14} /> Ejecutar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
})

// ============================================================== Editor de Archivos Multi-Pestaña

export const FileEditorPanel = memo(function FileEditorPanel({
  path: initialPath,
  openPaths,
  tabs: controlledTabs,
  activePath: controlledActive,
  onTabSelect,
  onTabClose,
  onClose,
  initialCwd,
  onSelectFile,
  visualSelection,
  inspectMode,
  onVisualSelect,
  onVisualClear,
  onToggleInspect,
}: {
  path: string
  openPaths?: string[]
  tabs?: string[]
  activePath?: string
  onTabSelect?: (path: string) => void
  onTabClose?: (path: string) => void
  onClose?: () => void
  initialCwd?: string
  onSelectFile?: (path: string) => void
  visualSelection?: VisualSelection | null
  inspectMode?: boolean
  onVisualSelect?: (payload: { selectedText: string; lineStart: number | null; lineEnd: number | null; surroundingContext: string; boundingRect?: { x: number; y: number; w: number; h: number } }) => void
  onVisualClear?: () => void
  onToggleInspect?: () => void
}) {
  const isControlled = Array.isArray(controlledTabs) && controlledActive !== undefined
  const [internalTabs, setInternalTabs] = useState<string[]>(() => {
    if (controlledTabs) return controlledTabs
    if (openPaths && openPaths.length > 0) {
      return openPaths.includes(initialPath) ? openPaths : [...openPaths, initialPath]
    }
    return initialPath ? [initialPath] : []
  })
  const [internalActive, setInternalActive] = useState<string>(controlledActive ?? initialPath ?? "")
  const tabs = isControlled ? controlledTabs! : internalTabs
  const activeTab = isControlled ? controlledActive! : internalActive
  // Sincroniza tabs controlados si el caller cambia la lista (ej: abrir nuevo archivo)
  useEffect(() => {
    if (isControlled && controlledTabs) {
      // no-op: tabs viene de props, React ya re-renderiza
    }
  }, [isControlled, controlledTabs])
  const [filesState, setFilesState] = useState<Record<string, { content: string; savedContent: string; dirty: boolean; loading: boolean; error: string | null; loaded: boolean; saveError: string | null }>>({})
  const [saving, setSaving] = useState(false)
  const [cursor, setCursor] = useState({ line: 1, col: 1 })
  useEffect(() => {
    setCursor({ line: 1, col: 1 })
  }, [activeTab])
  // .md abre en vista previa por defecto; resto de archivos en dividido.
  // Modos por tab (no global): volver a un .md conserva su modo.
  const [mdModes, setMdModes] = useState<Record<string, "edit" | "preview" | "split">>({})
  const mdViewMode =
    mdModes[activeTab] ?? (/\.(md|markdown|mdown|mkd)$/i.test(activeTab) ? "preview" : "split")
  const setMdViewMode = useCallback(
    (mode: "edit" | "preview" | "split") =>
      setMdModes((prev) => (prev[activeTab] === mode ? prev : { ...prev, [activeTab]: mode })),
    [activeTab]
  )

  const isMarkdown = /\.(md|markdown|mdown|mkd)$/i.test(activeTab)

  // Si cambia la prop inicial desde fuera (solo no controlado, para no duplicar tabs)
  useEffect(() => {
    if (isControlled) return
    if (!initialPath) return
    setInternalTabs((prev) => (prev.includes(initialPath) ? prev : [...prev, initialPath]))
    setInternalActive(initialPath)
  }, [initialPath, isControlled])

  // Cargar contenido de la pestaña activa si no fue cargada aún
  // pendingReload + reloadNonce permiten reintentar tras un error de lectura.
  const pendingReload = useRef<Set<string>>(new Set())
  const [reloadNonce, setReloadNonce] = useState(0)
  useEffect(() => {
    if (!activeTab) return
    // Los PDF son binarios: los maneja PdfViewer vía /shell/fs/download, no fs.read
    if (/\.pdf$/i.test(activeTab)) return
    // Tab con nombre pelado (drop del SO, estado persistido viejo): el server
    // no lo resuelve — error local inmediato en vez de un 404 en consola.
    if (!isAbsoluteFsPath(activeTab)) {
      setFilesState((prev) => {
        if (prev[activeTab]?.error) return prev
        return {
          ...prev,
          [activeTab]: { content: "", savedContent: "", dirty: false, loading: false, error: "Ruta no válida — abrí el archivo desde el Explorador", loaded: false, saveError: null },
        }
      })
      return
    }
    let cancelled = false
    setFilesState((prev) => {
      if (!pendingReload.current.has(activeTab) && prev[activeTab] && (prev[activeTab].content || prev[activeTab].error)) return prev
      pendingReload.current.delete(activeTab)
      return {
        ...prev,
        [activeTab]: { content: "", savedContent: "", dirty: false, loading: true, error: null, loaded: false, saveError: null },
      }
    })

    shell.fs.read(activeTab).then((r) => {
      if (cancelled) return
      setFilesState((prev) => ({
        ...prev,
        [activeTab]: { content: r.content, savedContent: r.content, dirty: false, loading: false, error: null, loaded: true, saveError: null },
      }))
    }).catch((err) => {
      if (cancelled) return
      setFilesState((prev) => ({
        ...prev,
        [activeTab]: { content: "", savedContent: "", dirty: false, loading: false, error: err instanceof Error ? err.message : "Error al abrir archivo", loaded: false, saveError: null },
      }))
    })

    return () => {
      cancelled = true
    }
  }, [activeTab, reloadNonce])

  const activeFile = filesState[activeTab]
  const autoSaveTimerRef = useRef<number | null>(null)
  const filesStateRef = useRef(filesState)
  filesStateRef.current = filesState
  const activeTabRef = useRef(activeTab)
  activeTabRef.current = activeTab
  const prevTabRef = useRef(activeTab)

  // Escritura con timeout (15s, el POST no acepta AbortSignal) + 1 reintento
  const savePath = useCallback(async (tab: string, content: string): Promise<boolean> => {
    const b64 = toBase64Chunked(content)
    let lastErr: unknown = null
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await Promise.race([
          shell.fs.write(tab, b64),
          new Promise<never>((_, rej) => window.setTimeout(() => rej(new Error("timeout 15s")), 15000)),
        ])
        lastErr = null
        break
      } catch (err) {
        lastErr = err
      }
    }
    if (lastErr) {
      const msg = lastErr instanceof Error ? lastErr.message : "Error al guardar archivo"
      setFilesState((prev) => {
        const cur = prev[tab]
        if (!cur) return prev
        return { ...prev, [tab]: { ...cur, saveError: msg } }
      })
      return false
    }
    setFilesState((prev) => {
      const cur = prev[tab]
      if (!cur) return prev
      return { ...prev, [tab]: { ...cur, dirty: cur.content !== content, savedContent: content, saveError: null } }
    })
    return true
  }, [])

  const handleSave = useCallback(async () => {
    if (!activeTab || !filesState[activeTab] || saving) return
    const current = filesState[activeTab]
    if (!current.loaded) {
      setFilesState((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], saveError: "El archivo no terminó de cargar; reintentá la carga" },
      }))
      return
    }
    setSaving(true)
    try {
      await savePath(activeTab, current.content)
    } finally {
      setSaving(false)
    }
  }, [activeTab, filesState, saving, savePath])

  // Flush anti-pérdida al cambiar de tab: el autosave con debounce se
  // cancelaría en el cleanup y handleSave solo conoce activeTab.
  useEffect(() => {
    const prev = prevTabRef.current
    prevTabRef.current = activeTab
    if (!prev || prev === activeTab) return
    const st = filesStateRef.current[prev]
    if (st && st.dirty && !st.loading && !st.error && st.loaded) {
      void savePathRef.current(prev, st.content)
    }
  }, [activeTab])
  const savePathRef = useRef(savePath)
  savePathRef.current = savePath

  // Aviso del navegador si quedan tabs sucias al cerrar/recargar
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (Object.values(filesStateRef.current).some((f) => f.dirty)) e.preventDefault()
    }
    window.addEventListener("beforeunload", onBefore)
    return () => window.removeEventListener("beforeunload", onBefore)
  }, [])

  const handleRetryLoad = useCallback(() => {
    if (!activeTab) return
    pendingReload.current.add(activeTab)
    setReloadNonce((n) => n + 1)
  }, [activeTab])

  const handleContentChange = useCallback((val: string) => {
    setFilesState((prev) => ({
      ...prev,
      [activeTab]: {
        ...(prev[activeTab] || { loading: false, error: null, savedContent: "", loaded: false, saveError: null }),
        content: val,
        // Sucio exacto: deshacer hasta lo guardado limpia el flag (sin writes redundantes)
        dirty: val !== (prev[activeTab]?.savedContent ?? ""),
        saveError: null,
      },
    }))
  }, [activeTab])

  // Autoguardado con debounce de 1000ms al detectar modificaciones
  useEffect(() => {
    if (!activeFile?.dirty || activeFile?.loading || saving) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    autoSaveTimerRef.current = window.setTimeout(() => {
      void handleSave()
    }, 1000)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [activeFile?.content, activeFile?.dirty, activeFile?.loading, handleSave, saving])

  // Cierre con flush: si la tab está sucia se guarda antes de cerrar
  // (mejor que un diálogo: cero pérdida sin fricción).
  const handleCloseTab = async (tabToClose: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const st = filesState[tabToClose]
    if (st && st.dirty && !st.loading && !st.error && st.loaded) {
      try {
        await savePath(tabToClose, st.content)
      } catch {
        /* best effort: se cierra igual, el contenido queda en disco parcial */
      }
    }
    if (isControlled) {
      if (onTabClose) onTabClose(tabToClose)
      return
    }
    const nextTabs = tabs.filter((t) => t !== tabToClose)
    setInternalTabs(nextTabs)
    if (nextTabs.length === 0) {
      if (onClose) onClose()
    } else if (activeTab === tabToClose) {
      const idx = tabs.indexOf(tabToClose)
      const newActive = nextTabs[Math.max(0, idx - 1)]
      setInternalActive(newActive)
      if (onSelectFile) onSelectFile(newActive)
    }
  }

  const handleSelectTab = (tabPath: string) => {
    if (isControlled) {
      if (onTabSelect) onTabSelect(tabPath)
      return
    }
    setInternalActive(tabPath)
    if (onSelectFile) onSelectFile(tabPath)
  }

  if (tabs.length === 0) {
    return null
  }

  const relPath = initialCwd && activeTab.startsWith(initialCwd) ? activeTab.slice(initialCwd.length).replace(/^[/\\]+/, "") : activeTab
  // Conteo sin split (sin duplicar el archivo en RAM por render)
  const { lineCount, charCount } = useMemo(() => {
    const c = activeFile?.content ?? ""
    if (!c) return { lineCount: 0, charCount: 0 }
    let n = 1
    for (let i = 0; i < c.length; i++) if (c.charCodeAt(i) === 10) n++
    return { lineCount: n, charCount: c.length }
  }, [activeFile?.content])
  const ext = (activeTab.split(".").pop() || "").toLowerCase()

  return (
    <div className="file-editor-panel" style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)" }}>
      {/* Barra de pestañas — DRY con .tab (24px/23px) */}
      <div className="file-editor-tab-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "1px", minWidth: 0, overflowX: "auto", scrollbarWidth: "none" }}>
          {tabs.map((tab) => {
            const name = tab.split(/[/\\]/).pop() || tab
            const isActive = tab === activeTab
            const isDirty = filesState[tab]?.dirty
            const ic = fileIcon(name, false)
            return (
              <div
                key={tab}
                className={`file-editor-tab${isActive ? " active" : ""}`}
                onClick={() => handleSelectTab(tab)}
                title={tab}
                role="tab"
                aria-selected={isActive}
              >
                <span className="file-editor-tab-icon" style={{ color: ic.color }}>{ic.glyph}</span>
                <span className="file-editor-tab-name">{name}</span>
                {isDirty && <span className="file-editor-dirty" title="Modificado (autoguardando...)" />}
                <button
                  type="button"
                  className="file-editor-tab-close"
                  onClick={(e) => handleCloseTab(tab, e)}
                  title="Cerrar pestaña"
                  aria-label={`Cerrar ${name}`}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 4px", flexShrink: 0 }}>
          {onVisualSelect && onToggleInspect && (
            <button
              type="button"
              className={`btn-icon compact${inspectMode ? " active" : ""}${visualSelection ? " has-selection" : ""}`}
              onClick={onToggleInspect}
              title={inspectMode ? "Salir modo selección (Esc)" : visualSelection ? `Zona: ${visualSelection.fileName ?? ""}:${visualSelection.lineStart ?? ""} — clic para cambiar` : "Seleccionar zona para el agente (Ctrl+Shift+C)"}
              aria-label="Seleccionar zona"
              style={visualSelection ? { color: "var(--primary)", borderColor: "var(--primary-soft)" } : undefined}
            >
              <span style={{ fontSize: 13, lineHeight: 1 }}>◈</span>
            </button>
          )}
          {visualSelection && onVisualClear && (
            <button type="button" className="btn-icon compact" onClick={onVisualClear} title={`Quitar selección ${visualSelection.fileName ?? ""}`} aria-label="Quitar selección">
              ×
            </button>
          )}
          {onClose && (
            <button type="button" className="btn-icon compact" onClick={onClose} title="Cerrar panel de editor">
              ×
            </button>
          )}
        </div>
      </div>
      {/* Barra de modos markdown — 3 iconos compactos debajo de las pestañas */}
      {isMarkdown && (
        <div className="file-editor-md-bar">
          <button type="button" className={`file-editor-md-btn${mdViewMode === "edit" ? " active" : ""}`} onClick={() => setMdViewMode("edit")} title="Editar" aria-label="Editar">
            <PencilIcon size={12} />
          </button>
          <button type="button" className={`file-editor-md-btn${mdViewMode === "split" ? " active" : ""}`} onClick={() => setMdViewMode("split")} title="Vista dividida" aria-label="Vista dividida">
            <SplitIcon size={12} />
          </button>
          <button type="button" className={`file-editor-md-btn${mdViewMode === "preview" ? " active" : ""}`} onClick={() => setMdViewMode("preview")} title="Vista previa" aria-label="Vista previa">
            <EyeIcon size={12} />
          </button>
        </div>
      )}

      {/* Cuerpo del editor de código / Markdown */}
      <div style={{ flex: 1, position: "relative", minHeight: 0, display: "flex", flexDirection: "column" }}>
        {(activeFile?.error || activeFile?.saveError) && (
          <div className="file-editor-banner" role="alert">
            <span className="file-editor-banner-msg" title={activeFile.error ?? activeFile.saveError ?? ""}>
              {activeFile.error ?? activeFile.saveError}
            </span>
            {activeFile.error ? (
              <button type="button" className="btn-secondary compact" onClick={handleRetryLoad}>
                Reintentar carga
              </button>
            ) : (
              <button type="button" className="btn-secondary compact" onClick={() => void handleSave()}>
                Reintentar guardado
              </button>
            )}
          </div>
        )}
        <div style={{ flex: 1, position: "relative", minHeight: 0, display: "flex" }}>
        {onVisualSelect && onToggleInspect && (
          <VisualSelectOverlay
            enabled={!!inspectMode}
            filePath={activeTab}
            onSelect={(payload) => onVisualSelect(payload)}
            onExit={onToggleInspect}
          />
        )}
        {/\.pdf$/i.test(activeTab) ? (
          <Suspense fallback={<div style={{ padding: 16, color: "var(--muted)" }}>Cargando visor PDF…</div>}>
            <PdfViewer path={activeTab} />
          </Suspense>
        ) : activeFile?.loading ? (
          <div style={{ padding: 16, color: "var(--muted)" }}>Cargando archivo...</div>
        ) : isMarkdown && mdViewMode === "preview" ? (
          <div className="markdown-body message-content" style={{ flex: 1, padding: "16px 24px", overflowY: "auto", background: "var(--surface)" }}>
            <Markdown text={activeFile?.content ?? ""} />
          </div>
        ) : isMarkdown && mdViewMode === "split" ? (
          <div style={{ flex: 1, display: "flex", minHeight: 0, width: "100%" }}>
            <div style={{ flex: 1, minWidth: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
              <LiteEditor
                path={activeTab}
                value={activeFile?.content ?? ""}
                savedValue={activeFile && !activeFile.loading && !activeFile.error ? activeFile.savedContent : undefined}
                onChange={handleContentChange}
                onSave={() => void handleSave()}
                onCursor={setCursor}
                vsPath={activeTab}
              />
            </div>
            <div className="markdown-body message-content" style={{ flex: 1, minWidth: 0, padding: "16px 20px", overflowY: "auto", background: "var(--surface-subtle)" }}>
              <Markdown text={activeFile?.content ?? ""} />
            </div>
          </div>
        ) : (
          <LiteEditor
            path={activeTab}
            value={activeFile?.content ?? ""}
            savedValue={activeFile && !activeFile.loading && !activeFile.error ? activeFile.savedContent : undefined}
            onChange={handleContentChange}
            onSave={() => void handleSave()}
            onCursor={setCursor}
            vsPath={activeTab}
          />
        )}
        </div>
      </div>
      {/* Status bar inferior — todo mismo color */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 10px", fontSize: "0.72rem", color: "var(--muted)", borderTop: "1px solid var(--border-subtle)", background: "var(--surface)", height: "22px", minHeight: "22px", flexShrink: 0 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{relPath}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span>{saving ? "Guardando..." : activeFile?.dirty ? "● Modificado" : " Guardado"}</span>
          {ext && <span style={{ textTransform: "uppercase" }}>{ext}</span>}
          <span>Ln {cursor.line}, Col {cursor.col}</span>
          <span>{lineCount} líneas</span>
          <span>{charCount} caracs</span>
          <span>Ctrl+S</span>
        </div>
      </div>
    </div>
  )
})

// ============================================================== Kanban — Premium

export const KanbanPanel = memo(function KanbanPanel() {
  const t = useT()
  const { confirm } = useDialog()
  const [boards, setBoards] = useState<KanbanBoard[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [drag, setDrag] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showNotes, setShowNotes] = useState<boolean>(true)
  const [boardNotes, setBoardNotes] = useState<string>("")
  const [showAddBoard, setShowAddBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [showAddCard, setShowAddCard] = useState<{ column: string } | null>(null)
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null)
  const [cardTitle, setCardTitle] = useState("")
  const [cardNotes, setCardNotes] = useState("")
  const [cardColor, setCardColor] = useState(KANBAN_COLORS[0])
  const [kbError, setKbError] = useState<string | null>(null)

  const load = useCallback(() => {
    shell.kanban.all().then(({ boards }) => {
      setBoards(boards)
      setActive((a) => {
        const next = a && boards.some((b) => b.id === a) ? a : boards[0]?.id ?? null
        if (next) setBoardNotes(localStorage.getItem(`opencode.kanban.notes.${next}`) || "")
        return next
      })
    })
  }, [])
  useEffect(load, [load])
  useEffect(() => { if (active) setBoardNotes(localStorage.getItem(`opencode.kanban.notes.${active}`) || "") }, [active])

  const handleNotesChange = (val: string) => {
    setBoardNotes(val)
    if (active) localStorage.setItem(`opencode.kanban.notes.${active}`, val)
  }

  const board = boards.find((b) => b.id === active) ?? null

  const filteredCards = (colId: string) => {
    if (!board) return []
    let cards = board.cards.filter((c) => c.column === colId)
    if (search.trim()) {
      const q = search.toLowerCase()
      cards = cards.filter((c) => c.title.toLowerCase().includes(q) || c.notes.toLowerCase().includes(q))
    }
    return cards
  }

  const openAddCard = (column: string) => {
    setCardTitle("")
    setCardNotes("")
    setCardColor(KANBAN_COLORS[Math.floor(Math.random() * KANBAN_COLORS.length)])
    setKbError(null)
    setShowAddCard({ column })
  }

  const submitAddCard = async () => {
    if (!board || !showAddCard || !cardTitle.trim()) return
    setKbError(null)
    try {
      await shell.kanban.addCard(board.id, showAddCard.column, cardTitle.trim(), cardNotes.trim(), cardColor)
    } catch (e) {
      // Sin esto el modal se cerraba igual y la tarjeta "desaparecía".
      setKbError(e instanceof Error ? e.message : "No se pudo guardar la tarjeta")
      return
    }
    setShowAddCard(null)
    load()
  }

  const openEditCard = (card: KanbanCard) => {
    setEditingCard(card)
    setCardTitle(card.title)
    setCardNotes(card.notes)
    setCardColor(card.color)
    setKbError(null)
  }

  const submitEditCard = async () => {
    if (!editingCard || !cardTitle.trim()) return
    setKbError(null)
    try {
      // La columna también se persiste: antes se cambiaba en el select pero
      // nunca se enviaba y al recargar la tarjeta "volvía" a su columna.
      await shell.kanban.updateCard(editingCard.id, { title: cardTitle.trim(), notes: cardNotes.trim(), color: cardColor, column: editingCard.column })
    } catch (e) {
      setKbError(e instanceof Error ? e.message : "No se pudo guardar la tarjeta")
      return
    }
    setEditingCard(null)
    load()
  }

  const drop = async (column: string) => {
    if (drag) {
      await shell.kanban.updateCard(drag, { column })
      setDrag(null)
      setDragOverCol(null)
      load()
    }
  }

  const delCard = async (cardId: string) => {
    if (!(await confirm({ message: t('shell.deleteCard') ?? "¿Eliminar tarjeta?", confirmText: t('common.yes'), cancelText: t('common.cancel'), variant: "danger" }))) return
    await shell.kanban.delCard(cardId)
    load()
  }

  const submitAddBoard = async () => {
    if (!newBoardName.trim()) return
    await shell.kanban.addBoard(newBoardName.trim())
    setNewBoardName("")
    setShowAddBoard(false)
    load()
  }

  if (!board) {
    return (
      <div className="shell-kanban-empty">
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>️</div>
        <p style={{ fontWeight: 600 }}>{t('shell.noBoards')}</p>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)", textAlign: "center", maxWidth: 300 }}>Crea tu primer tablero para organizar tareas con columnas y tarjetas arrastrables.</p>
        <button className="btn-primary" onClick={() => setShowAddBoard(true)}>{t('shell.newBoard')}</button>
        {showAddBoard && (
          <div className="shell-kanban-modal-overlay" onClick={() => setShowAddBoard(false)}>
            <div className="shell-kanban-modal" onClick={(e) => e.stopPropagation()}>
              <div className="shell-kanban-modal-head"><h3>{t('shell.newBoard')}</h3><button className="btn-icon" onClick={() => setShowAddBoard(false)}>×</button></div>
              <div className="shell-kanban-modal-body">
                <label>Nombre del tablero<input value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Ej: Sprint 12, Roadmap Q4" autoFocus onKeyDown={(e) => e.key === "Enter" && submitAddBoard()} /></label>
              </div>
              <div className="shell-kanban-modal-foot"><button className="btn-secondary" onClick={() => setShowAddBoard(false)}>Cancelar</button><button className="btn-primary" onClick={submitAddBoard} disabled={!newBoardName.trim()}>Crear tablero</button></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const totalCards = board.cards.length
  const colCount = board.columns.length

  return (
    <div className="shell-kanban">
      {/* Header premium: tabs de tableros + búsqueda + acciones */}
      <div className="shell-kanban-head">
        <div className="shell-kanban-board-tabs">
          {boards.map((b) => (
            <button key={b.id} className={`shell-kanban-board-tab${b.id === active ? " active" : ""}`} onClick={() => setActive(b.id)} title={b.name}>
              <span>{b.name}</span>
              <span className="shell-kanban-board-tab-count">{b.cards.length}</span>
            </button>
          ))}
          <button className="shell-kanban-board-tab" onClick={() => setShowAddBoard(true)} title={t('shell.newBoard')} style={{ borderStyle: "dashed" }}>+ {t('shell.newBoard')}</button>
        </div>
        <div className="shell-kanban-head-actions">
          <div className="shell-kanban-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20L16 16" /></svg>
            <input type="search" placeholder="Buscar tarjetas..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--muted)", whiteSpace: "nowrap" }}>{totalCards} tarjetas · {colCount} columnas</span>
          <button type="button" className={`btn-secondary compact${showNotes ? " active" : ""}`} onClick={() => setShowNotes((v) => !v)} title="Notas del tablero"></button>
          <button className="btn-icon compact" title={t('shell.deleteBoard')} onClick={async () => { if (board && !(await confirm({ message: t('shell.deleteBoard'), confirmText: t('common.yes'), cancelText: t('common.cancel'), variant: "danger" }))) return; shell.kanban.delBoard(board.id).then(load) }} style={{ color: "var(--muted)" }}>×</button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", gap: 12 }}>
        <div className="shell-kanban-cols">
          {board.columns.map((col, colIdx) => {
            const cards = filteredCards(col.id)
            const isDragOver = dragOverCol === col.id
            return (
              <div key={col.id} className={`shell-kanban-col${isDragOver ? " drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id) }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => drop(col.id)}>
                <div className="shell-kanban-col-head">
                  <span className="shell-kanban-col-dot" style={{ color: KANBAN_COLORS[colIdx % KANBAN_COLORS.length], background: KANBAN_COLORS[colIdx % KANBAN_COLORS.length] }} />
                  <span className="shell-kanban-col-title">{col.title}</span>
                  <span className="shell-kanban-col-count">{cards.length}</span>
                  <button className="shell-kanban-col-menu" title="Más opciones" onClick={() => {}}>⋯</button>
                </div>
                <div className="shell-kanban-cards">
                  {cards.map((c) => (
                    <div key={c.id} className={`shell-kanban-card${drag === c.id ? " dragging" : ""}`} style={{ "--card-color": c.color } as React.CSSProperties}
                      draggable onDragStart={() => setDrag(c.id)} onDragEnd={() => { setDrag(null); setDragOverCol(null) }}
                      onClick={() => openEditCard(c)}>
                      <div className="shell-kanban-card-head">
                        <span className="shell-kanban-card-title">{c.title}</span>
                        <span className="shell-kanban-card-actions">
                          <button onClick={(e) => { e.stopPropagation(); openEditCard(c) }} title="Editar"></button>
                          <button className="danger" onClick={(e) => { e.stopPropagation(); delCard(c.id) }} title="Eliminar">×</button>
                        </span>
                      </div>
                      {c.notes && <div className="shell-kanban-card-notes">{c.notes}</div>}
                      <div className="shell-kanban-card-foot">
                        <span className="shell-kanban-card-meta">
                          {c.notes && <span className="shell-kanban-card-tag">nota</span>}
                          <span className="shell-kanban-card-date">#{c.id.slice(0, 4)}</span>
                        </span>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && search && <div style={{ padding: 12, textAlign: "center", color: "var(--muted)", fontSize: "0.82rem" }}>Sin resultados</div>}
                  <button className="shell-kanban-add" onClick={() => openAddCard(col.id)}>+ {t('shell.addCard')}</button>
                </div>
              </div>
            )
          })}
        </div>

        {showNotes && (
          <div className="shell-kanban-notes">
            <div className="shell-kanban-notes-head">
              <span className="shell-kanban-notes-title"> Notas — {board.name}</span>
              <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{boardNotes.length} caracteres</span>
                <button type="button" className="btn-icon compact" title="Copiar" onClick={() => navigator.clipboard?.writeText(boardNotes)}>Copiar</button>
                <button type="button" className="btn-icon compact" title="Limpiar" onClick={async () => { if (!(await confirm({ message: "¿Limpiar notas?", confirmText: t('common.yes'), cancelText: t('common.cancel') }))) return; handleNotesChange("") }}>Limpiar</button>
              </span>
            </div>
            <textarea value={boardNotes} onChange={(e) => handleNotesChange(e.target.value)} placeholder="Notas del tablero — se guardan automáticamente..." />
          </div>
        )}
      </div>

      {/* Modal nuevo tablero */}
      {showAddBoard && (
        <div className="shell-kanban-modal-overlay" onClick={() => setShowAddBoard(false)}>
          <div className="shell-kanban-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shell-kanban-modal-head"><h3>{t('shell.newBoard')}</h3><button className="btn-icon" onClick={() => setShowAddBoard(false)}>×</button></div>
            <div className="shell-kanban-modal-body">
              <label>Nombre<input value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Ej: Backlog, En curso" autoFocus onKeyDown={(e) => e.key === "Enter" && submitAddBoard()} /></label>
            </div>
            <div className="shell-kanban-modal-foot"><button className="btn-secondary" onClick={() => setShowAddBoard(false)}>Cancelar</button><button className="btn-primary" onClick={submitAddBoard} disabled={!newBoardName.trim()}>Crear</button></div>
          </div>
        </div>
      )}

      {/* Modal nueva tarjeta */}
      {showAddCard && (
        <div className="shell-kanban-modal-overlay" onClick={() => setShowAddCard(null)}>
          <div className="shell-kanban-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shell-kanban-modal-head"><h3>Nueva tarjeta — {board.columns.find((c) => c.id === showAddCard.column)?.title}</h3><button className="btn-icon" onClick={() => setShowAddCard(null)}>×</button></div>
            <div className="shell-kanban-modal-body">
              <label>Título<input value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} placeholder="Ej: Implementar login" autoFocus /></label>
              <label>Notas<textarea value={cardNotes} onChange={(e) => setCardNotes(e.target.value)} placeholder="Detalles, checklist, enlaces..." rows={3} /></label>
              {kbError && <div role="alert" style={{ color: "var(--danger)", fontSize: "0.78rem" }}>{kbError}</div>}
              <label>Color<div className="shell-kanban-color-pick">{KANBAN_COLORS.map((col) => <button key={col} className={`shell-kanban-color-dot${cardColor === col ? " active" : ""}`} style={{ background: col, color: col }} onClick={() => setCardColor(col)} aria-label={col} />)}</div></label>
            </div>
            <div className="shell-kanban-modal-foot"><button className="btn-secondary" onClick={() => setShowAddCard(null)}>Cancelar</button><button className="btn-primary" onClick={submitAddCard} disabled={!cardTitle.trim()}>Crear tarjeta</button></div>
          </div>
        </div>
      )}

      {/* Modal editar tarjeta */}
      {editingCard && (
        <div className="shell-kanban-modal-overlay" onClick={() => setEditingCard(null)}>
          <div className="shell-kanban-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shell-kanban-modal-head"><h3>Editar tarjeta</h3><button className="btn-icon" onClick={() => setEditingCard(null)}>×</button></div>
            <div className="shell-kanban-modal-body">
              <label>Título<input value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} autoFocus /></label>
              <label>Notas<textarea value={cardNotes} onChange={(e) => setCardNotes(e.target.value)} rows={4} /></label>
              {kbError && <div role="alert" style={{ color: "var(--danger)", fontSize: "0.78rem" }}>{kbError}</div>}
              <label>Columna<select value={editingCard.column} onChange={(e) => setEditingCard({ ...editingCard, column: e.target.value })}>{board.columns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
              <label>Color<div className="shell-kanban-color-pick">{KANBAN_COLORS.map((col) => <button key={col} className={`shell-kanban-color-dot${cardColor === col ? " active" : ""}`} style={{ background: col, color: col }} onClick={() => setCardColor(col)} />)}</div></label>
            </div>
            <div className="shell-kanban-modal-foot"><button className="btn-secondary" onClick={() => setEditingCard(null)}>Cancelar</button><button className="btn-primary" onClick={submitEditCard}>Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  )
})

// ============================================================== Docs

function renderMarkdown(src: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const lines = src.replace(/\r\n/g, "\n").split("\n")
  const out: string[] = []
  let inCode = false
  let codeBuf: string[] = []
  const flushCode = () => {
    if (codeBuf.length) {
      out.push(`<pre class="shell-md-code">${esc(codeBuf.join("\n"))}</pre>`)
      codeBuf = []
    }
  }
  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) { flushCode(); inCode = false } else { flushCode(); inCode = true }
      continue
    }
    if (inCode) { codeBuf.push(line); continue }
    const h = line.match(/^(#{1,4})\s+(.*)/)
    if (h) { out.push(`<h${h[1].length}>${esc(h[2])}</h${h[1].length}>`); continue }
    if (/^\s*[-*]\s+/.test(line)) { out.push(`<li>${esc(line.replace(/^\s*[-*]\s+/, ""))}</li>`); continue }
    if (/^\d+\.\s+/.test(line)) { out.push(`<li>${esc(line.replace(/^\d+\.\s+/, ""))}</li>`); continue }
    if (line.trim() === "") { if (out.length && out[out.length - 1] !== "<br>") out.push("<br>"); continue }
    let html = esc(line)
    html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/`(.+?)`/g, "<code>$1</code>")
    html = html.replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    out.push(`<p>${html}</p>`)
  }
  flushCode()
  return out.join("\n")
}

export const DocsPanel = memo(function DocsPanel() {
  const t = useT()
  const [root, setRoot] = useState<string>("")
  const [files, setFiles] = useState<{ name: string; path: string; size: number }[]>([])
  const [filter, setFilter] = useState("")
  const [doc, setDoc] = useState<{ path: string; html: string } | null>(null)

  useEffect(() => {
    shell.docs.list().then((r) => {
      setRoot(r.root)
      setFiles(r.files)
    })
  }, [])

  const open = async (path: string) => {
    const r = await shell.docs.read(path)
    setDoc({ path: r.path, html: renderMarkdown(r.content) })
  }

  const shown = filter ? files.filter((f) => f.path.toLowerCase().includes(filter.toLowerCase())) : files

  return (
    <div className="shell-docs">
      <div className="shell-docs-head">
        <input type="search" placeholder={t('shell.searchDocs')} value={filter} onChange={(e) => setFilter(e.target.value)} />
        <a className="btn-secondary compact" href="https://opencode.ai/docs" target="_blank" rel="noreferrer">{t('shell.officialDocs')}</a>
      </div>
      <div className="shell-docs-body">
        <div className="shell-docs-list">
          {shown.map((f) => (
            <div key={f.path} className={`shell-row shell-file${doc?.path === f.path ? " active" : ""}`} onClick={() => open(f.path)} title={f.path}>
              <span className="shell-glyph" style={{ color: "var(--primary)" }}>M</span>
              <span className="shell-name">{f.name}</span>
            </div>
          ))}
        </div>
        <div className="shell-docs-content" dangerouslySetInnerHTML={doc ? { __html: sanitizeHtml(doc.html) } : undefined}>
          {!doc && <div className="shell-empty">{t('shell.selectDoc')}<br /><small>{root}</small></div>}
        </div>
      </div>
    </div>
  )
})

// ============================================================== Updates (GitHub + X)

export const UpdatesPanel = memo(function UpdatesPanel() {
  const t = useT()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback((refresh = false) => {
    setLoading(true)
    shell.updates.get(refresh).then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const fmt = (iso: string) => (iso ? new Date(iso).toLocaleDateString() : "")

  return (
    <div className="shell-updates">
      <div className="shell-updates-head">
        <strong>{t('shell.updates')}</strong>
        <button className="btn-secondary compact" onClick={() => load(true)} disabled={loading}>{loading ? "…" : t('shell.refresh')}</button>
      </div>
      <div className="shell-updates-body">
        {data?.github?.map((repo: any) => (
          <div key={repo.repo} className="shell-updates-section">
            <div className="shell-updates-title">GitHub · {repo.repo}</div>
            {repo.releases?.map((r: any, i: number) => (
              <div key={i} className="shell-update-item">
                <a href={r.url} target="_blank" rel="noreferrer"><b>{r.tag}</b> {r.name}</a>
                <small>{fmt(r.date)}</small>
                {r.body && <p className="shell-update-body">{r.body.slice(0, 300)}</p>}
              </div>
            ))}
            <div className="shell-updates-commits">
              {repo.commits?.map((c: any, i: number) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer" title={c.message}>
                  <code>{c.sha}</code> {c.message.slice(0, 80)}
                </a>
              ))}
            </div>
          </div>
        ))}
        {data?.x?.map((x: any) => (
          <div key={x.handle} className="shell-updates-section">
            <div className="shell-updates-title">X @{x.handle}</div>
            {x.error && <small>{x.error}</small>}
            <div className="shell-x-lines">{x.lines?.slice(0, 15).map((l: string, i: number) => <div key={i}>{l}</div>)}</div>
          </div>
        ))}
        {!data && !loading && <div className="shell-empty">{t('shell.noUpdates')}</div>}
      </div>
    </div>
  )
})

// ============================================================== Stats

export const StatsPanel = memo(function StatsPanel() {
  const t = useT()
  const [status, setStatus] = useState<{ running: boolean; port: number; url: string } | null>(null)
  const [starting, setStarting] = useState(false)

  const load = useCallback(() => {
    shell.stats.status()
      .then((s) => {
        setStatus(s)
        if (!s.running && !starting) {
          setStarting(true)
          shell.stats.start()
            .then(() => shell.stats.status().then(setStatus))
            .catch(() => {})
            .finally(() => setStarting(false))
        }
      })
      .catch(() => {
        fetch("http://localhost:8765/api/data?raw=1", { mode: "no-cors" })
          .then(() => setStatus({ running: true, port: 8765, url: "http://localhost:8765" }))
          .catch(() => setStatus({ running: false, port: 8765, url: "http://localhost:8765" }))
      })
  }, [starting])

  useEffect(() => {
    load()
    const iv = window.setInterval(load, 5000)
    return () => window.clearInterval(iv)
  }, [load])

  return (
    <div className="shell-stats">
      {status?.running ? (
        <iframe src={status.url || "http://localhost:8765"} className="shell-stats-frame" title="OpenCode Stats" />
      ) : (
        <div className="shell-empty">
          <p>{t('shell.statsOff')}</p>
          <button className="btn-primary" disabled={starting} onClick={() => { setStarting(true); shell.stats.start().then(load).finally(() => setStarting(false)) }}>
            {starting ? "…" : t('shell.startStats')}
          </button>
        </div>
      )}
    </div>
  )
})

// ============================================================== Labs + Config

export const LabsPanel = memo(function LabsPanel() {
  const t = useT()
  const { alert } = useDialog()
  const [apps, setApps] = useState<any[]>([])
  const [server, setServer] = useState<any>(null)
  const [autostart, setAutostart] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    shell.labs.list().then((r) => setApps(r.apps))
    shell.server.status().then(setServer)
    shell.autostart.get().then((r) => setAutostart(r.enabled))
  }, [])
  useEffect(() => {
    load()
    const iv = window.setInterval(load, 6000)
    return () => window.clearInterval(iv)
  }, [load])

  const start = async (appId: string) => {
    setBusy(appId)
    try {
      await shell.labs.start(appId)
    } catch (e: any) {
      void alert({ title: "Error", message: e.message ?? String(e) })
    }
    setBusy(null)
    load()
  }

  return (
    <div className="shell-labs">
      <div className="shell-updates-head">
        <strong>{t('shell.labs')}</strong>
        <button className="btn-secondary compact" onClick={load} title="refresh"><RefreshIcon size={12} /></button>
      </div>
      <div className="shell-labs-section">
        <div className="shell-updates-title">Server opencode</div>
        <div className="shell-labs-row">
          <span>{server?.running ? "● " + t('shell.running') : "○ " + t('shell.stopped')}</span>
          <button className="btn-primary compact" disabled={!server?.running && !server} onClick={() => shell.server.start().then(load)}>{t('shell.start')}</button>
          <button className="btn-secondary compact" onClick={() => shell.server.stop().then(load)}>{t('shell.stop')}</button>
        </div>
      </div>
      <div className="shell-labs-section">
        <div className="shell-updates-title">{t('shell.apps')}</div>
        {apps.map((a) => (
          <div key={a.id} className="shell-labs-row">
            <span>{a.title} {!a.configured && <small>({t('shell.notConfigured')})</small>}</span>
            <button className="btn-primary compact" disabled={!a.configured || busy === a.id} onClick={() => start(a.id)}>{busy === a.id ? "…" : t('shell.launch')}</button>
          </div>
        ))}
      </div>
      <div className="shell-labs-section">
        <div className="shell-updates-title">Windows</div>
        <label className="shell-labs-row">
          <span>{t('shell.autostart')}</span>
          <input type="checkbox" checked={autostart} onChange={(e) => shell.autostart.set(e.target.checked).then(() => setAutostart(e.target.checked))} />
        </label>
      </div>
    </div>
  )
})

export const ConfigPanel = memo(function ConfigPanel() {
  const t = useT()
  const [raw, setRaw] = useState("")
  const [msg, setMsg] = useState("")

  const load = useCallback(() => {
    shell.config.get().then((c) => {
      setRaw(JSON.stringify(c, null, 2))
    })
  }, [])
  useEffect(load, [load])

  const apply = async () => {
    try {
      const parsed = JSON.parse(raw)
      await shell.config.import(parsed)
      setMsg("")
      load()
    } catch (e: any) {
      setMsg(" " + (e.message ?? e))
    }
  }
  const exportCfg = async () => {
    const r = await shell.config.export()
    await navigator.clipboard.writeText(JSON.stringify(r.config, null, 2))
    setMsg(" " + t('shell.copied'))
  }

  return (
    <div className="shell-config">
      <div className="shell-config-head">
        <button className="btn-primary compact" onClick={apply}>{t('shell.apply')}</button>
        <button className="btn-secondary compact" onClick={exportCfg}>{t('shell.export')}</button>
        {msg && <span className="shell-config-msg">{msg}</span>}
      </div>
      <textarea className="shell-config-ta" value={raw} onChange={(e) => { setRaw(e.target.value); setMsg("") }} spellCheck={false} />
    </div>
  )
})

// ============================================================== Open Design & Auto-Servidor de Proyectos Locales
export const DesignPanel = memo(function DesignPanel({ initialUrl }: { initialUrl?: string }) {
  const { alert } = useDialog()
  const [url, setUrl] = useState(() => localStorage.getItem("od.web.url") || initialUrl || "")
  const [iframeKey, setIframeKey] = useState(0)
  const [status, setStatus] = useState<"loading" | "ready" | "offline">("loading")
  const [customInputUrl, setCustomInputUrl] = useState("")
  const [servedProject, setServedProject] = useState<{
    token: string
    directory: string
    entryPoint: string
    htmlFiles: string[]
    packageType: string
  } | null>(() => {
    try {
      const saved = localStorage.getItem("od.served.project")
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const devServer = useDevServer(servedProject?.directory)

  useEffect(() => {
    let cancelled = false
    setStatus("loading")

    if (devServer.status === "running" && devServer.serverUrl) {
      setUrl(devServer.serverUrl)
      setStatus("ready")
      return
    }

    if (servedProject && servedProject.token) {
      const previewUrl = `${window.location.origin}/shell/preview/${servedProject.token}/${servedProject.entryPoint || "index.html"}`
      setUrl(previewUrl)
      setStatus("ready")
      return
    }

    // Consultar al shell el estado real del daemon
    shell.design.status().then((r: any) => {
      if (cancelled) return
      const discovered = r?.url as string | undefined
      const running = !!r?.running
      if (discovered && running) {
        setUrl(discovered)
        try { localStorage.setItem("od.web.url", discovered) } catch {}
        setStatus("ready")
        return
      }
      if (discovered) {
        fetch(discovered, { mode: "no-cors", cache: "no-store" })
          .then(() => { if (!cancelled) { setUrl(discovered); setStatus("ready") } })
          .catch(() => { if (!cancelled) setStatus("offline") })
      } else {
        setStatus("offline")
      }
    }).catch(() => {
      if (cancelled) return
      setStatus("offline")
    })

    const t = window.setTimeout(() => { if (!cancelled) setStatus((s) => (s === "loading" ? "offline" : s)) }, 3000)
    return () => { cancelled = true; window.clearTimeout(t) }
  }, [iframeKey, servedProject, devServer.status, devServer.serverUrl])

  const handlePickAndServe = async () => {
    try {
      const res = await shell.fs.pickFolder()
      if (res?.ok && res.path) {
        setStatus("loading")
        const serveRes = await shell.project.serve(res.path)
        if (serveRes?.ok && serveRes.token) {
          const p = {
            token: serveRes.token,
            directory: serveRes.directory,
            entryPoint: serveRes.entrypoint || "index.html",
            htmlFiles: serveRes.htmlFiles || ["index.html"],
            packageType: serveRes.hasPackageJson ? "node" : "static",
          }
          setServedProject(p)
          try { localStorage.setItem("od.served.project", JSON.stringify(p)) } catch {}
          const pUrl = `${window.location.origin}/shell/preview/${serveRes.token}/${serveRes.entrypoint || "index.html"}`
          setUrl(pUrl)
          setStatus("ready")
          setIframeKey((k) => k + 1)
        }
      }
    } catch (err: any) {
      void alert({ title: "Error", message: "Error al servir proyecto: " + (err?.message || String(err)) })
      setStatus("offline")
    }
  }

  const handleStartDevServer = async () => {
    try {
      setStatus("loading")
      const sUrl = await devServer.startDevServer()
      if (sUrl) {
        setUrl(sUrl)
        setStatus("ready")
        setIframeKey((k) => k + 1)
      }
    } catch (err: any) {
      void alert({ title: "Error", message: "Error al iniciar dev server: " + (err?.message || String(err)) })
      setStatus("offline")
    }
  }

  const handleSwitchHtml = (file: string) => {
    if (!servedProject) return
    const next = { ...servedProject, entryPoint: file }
    setServedProject(next)
    try { localStorage.setItem("od.served.project", JSON.stringify(next)) } catch {}
    setUrl(`${window.location.origin}/shell/preview/${servedProject.token}/${file}`)
    setIframeKey((k) => k + 1)
  }

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let u = customInputUrl.trim()
    if (!u) return
    if (!/^https?:\/\//i.test(u)) u = `http://${u}`
    setUrl(u)
    setStatus("ready")
    setIframeKey((k) => k + 1)
  }

  const handleCloseProject = () => {
    setServedProject(null)
    try { localStorage.removeItem("od.served.project") } catch {}
    setUrl("")
    setStatus("offline")
  }

  const reload = () => setIframeKey((k) => k + 1)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)" }}>
      {/* Header nativo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface-subtle)", flexShrink: 0, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Open Design</span>
          {servedProject ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", overflow: "hidden" }}>
              <span style={{ background: "var(--primary-soft)", color: "var(--primary)", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                {servedProject.directory.split(/[\\/]/).pop()}
              </span>
              {servedProject.htmlFiles.length > 1 && (
                <select
                  value={servedProject.entryPoint}
                  onChange={(e) => handleSwitchHtml(e.target.value)}
                  style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, padding: "2px 4px" }}
                >
                  {servedProject.htmlFiles.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Previsualización y diseño interactivo</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {servedProject && devServer.hasDevServer && devServer.status !== "running" && (
            <button className="btn-primary compact" onClick={handleStartDevServer} disabled={devServer.status === "starting"} title="Iniciar servidor dev con hot-reload">
              {devServer.status === "starting" ? "⏳ Levantando..." : `▶ Iniciar Dev (${devServer.devCommand || "npm run dev"})`}
            </button>
          )}
          {devServer.status === "running" && (
            <button className="btn-secondary compact" onClick={devServer.stopDevServer} title="Detener dev server">
              ⏹ Parar Dev
            </button>
          )}
          <button className="btn-secondary compact" onClick={handlePickAndServe} title="Abrir y servir carpeta de proyecto web">
             Abrir Proyecto
          </button>
          {servedProject && (
            <button className="btn-secondary compact" onClick={handleCloseProject} title="Cerrar proyecto actual">
              
            </button>
          )}
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: status === "ready" ? "var(--success)" : status === "offline" ? "var(--danger)" : "var(--muted)", display: "inline-block" }} />
          <button className="btn-secondary compact" onClick={reload} title="Recargar">↻</button>
        </div>
      </div>

      {status === "offline" && !url ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--primary-soft)", border: "1px solid var(--primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "var(--primary)" }}>
            ◈
          </div>
          <div style={{ maxWidth: 440 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: "var(--text)" }}>Servidor de Proyectos & Open Design</div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
              Seleccioná una carpeta de proyecto. Si es un proyecto web con Node/Vite o HTML estático, se levantará automáticamente para inspeccionar sus estilos y diseño visual.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn-primary" onClick={handlePickAndServe} style={{ padding: "8px 18px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <span></span>
              <span>Abrir Carpeta de Proyecto</span>
            </button>
            <button className="btn-secondary" onClick={reload} style={{ padding: "8px 14px" }}>
              Reintentar OpenDesign (:3000)
            </button>
          </div>

          <form onSubmit={handleCustomUrlSubmit} style={{ display: "flex", gap: 6, marginTop: 8, maxWidth: 360, width: "100%" }}>
            <input
              type="text"
              placeholder="O ingresá una URL (ej: localhost:5173)"
              value={customInputUrl}
              onChange={(e) => setCustomInputUrl(e.target.value)}
              style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "var(--text)" }}
            />
            <button type="submit" className="btn-secondary compact" style={{ padding: "6px 12px" }}>
              Ir
            </button>
          </form>
        </div>
      ) : (
        <iframe
          key={iframeKey}
          src={url}
          onLoad={() => setStatus("ready")}
          style={{ flex: 1, border: "none", background: "#fff" }}
          title="Open Design Preview"
          allow="clipboard-read; clipboard-write"
        />
      )}
    </div>
  )
})

// ============================================================== Wrapper

export type ShellPanelProps = {
  kind: Exclude<ShellPanelKind, "session">
  cwd?: string
  onOpenSessionDir: (dir: string) => void
  sessionID?: string | null
  onOpenFile?: (path: string) => void
  panelIndex?: number
  panelId?: string
}

// ============================================================== Session Stats (compacto)

type SessionDetail = {
  id: string
  title: string
  model: string
  directory: string
  created: number
  updated: number
  tokens?: { tokens_input?: number; tokens_output?: number; tokens_reasoning?: number; tokens_cache_read?: number; tokens_cache_write?: number }
  cost: number
  events: number
  events_mb: number
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function fmtCost(n: number): string {
  if (n >= 1) return `$${n.toFixed(2)}`
  if (n >= 0.01) return `$${n.toFixed(3)}`
  return `$${n.toFixed(4)}`
}

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts
  if (diff < 60) return "ahora"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export const SessionStatsPanel = memo(function SessionStatsPanel({ sessionID, onClose }: { sessionID?: string | null; onClose?: () => void }) {
  const t = useT()
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!sessionID) return
    setLoading(true)
    setError(null)
    try {
      const r = await shell.stats.proxy(`admin/session/${sessionID}`)
      if (r && r.error) {
        setError(r.error)
        setDetail(null)
      } else if (r && r.id) {
        setDetail(r)
        setError(null)
      } else {
        setError("Sesión no encontrada en stats")
        setDetail(null)
      }
    } catch {
      setError("No se pudo conectar con opencode-stats")
    } finally {
      setLoading(false)
    }
  }, [sessionID])

  useEffect(() => {
    load()
    const iv = window.setInterval(load, 15_000)
    return () => window.clearInterval(iv)
  }, [load])

  return (
    <div className="session-stats-modal">
      <div className="session-stats-modal-header">
        <span className="session-stats-modal-title">Stats de sesión</span>
        <div className="session-stats-modal-actions">
          <button className="btn-icon compact" onClick={load} title="Actualizar">↻</button>
          {onClose && <button className="btn-icon compact" onClick={onClose} title="Cerrar">×</button>}
        </div>
      </div>
      <div className="session-stats-modal-body">
        {!sessionID && <div className="shell-empty"><p>{t('shell.noSession')}</p></div>}
        {loading && !detail && <div className="shell-empty"><p>Cargando stats...</p></div>}
        {error && <div className="shell-empty"><p className="ss-error">{error}</p><button className="btn-secondary" onClick={load}>Reintentar</button></div>}
        {detail && (() => {
          const t = detail.tokens
          const input = t?.tokens_input ?? 0
          const output = t?.tokens_output ?? 0
          const reasoning = t?.tokens_reasoning ?? 0
          const cacheRead = t?.tokens_cache_read ?? 0
          const totalTokens = input + output + reasoning
          const cacheHit = cacheRead > 0 ? ((cacheRead / (cacheRead + input)) * 100).toFixed(0) : "0"
          return (
            <>
              <div className="session-stats-grid">
                <div className="session-stats-card"><span className="ss-label">Costo</span><span className="ss-value">{fmtCost(detail.cost)}</span></div>
                <div className="session-stats-card"><span className="ss-label">Tokens</span><span className="ss-value">{fmtTokens(totalTokens)}</span></div>
                <div className="session-stats-card"><span className="ss-label">Input</span><span className="ss-value">{fmtTokens(input)}</span></div>
                <div className="session-stats-card"><span className="ss-label">Output</span><span className="ss-value">{fmtTokens(output)}</span></div>
                <div className="session-stats-card"><span className="ss-label">Reasoning</span><span className="ss-value">{fmtTokens(reasoning)}</span></div>
                <div className="session-stats-card"><span className="ss-label">Cache HIT</span><span className="ss-value">{cacheHit}%</span></div>
                <div className="session-stats-card"><span className="ss-label">Eventos</span><span className="ss-value">{detail.events}</span></div>
                <div className="session-stats-card"><span className="ss-label">Última vez</span><span className="ss-value">{timeAgo(detail.updated)}</span></div>
              </div>
              {detail.model && <div className="session-stats-footer"><span className="ss-model">{detail.model}</span></div>}
            </>
          )
        })()}
      </div>
    </div>
  )
})

export const ShellPanel = memo(function ShellPanel({ kind, cwd, onOpenSessionDir, sessionID: _sessionID, onOpenFile, panelIndex, panelId }: ShellPanelProps) {
  switch (kind) {
    case "terminal":
      return <TerminalPanel cwd={cwd} panelIndex={panelIndex} panelId={panelId} />
    case "explorer":
      return <ExplorerPanel onOpenSessionDir={onOpenSessionDir} initialCwd={cwd} onOpenFile={onOpenFile} />
    case "kanban":
      return <KanbanPanel />
    case "docs":
      return <DocsPanel />
    case "updates":
      return <UpdatesPanel />
    case "stats":
      return <StatsPanel />
    case "labs":
      return <LabsPanel />
    case "config":
      return <ConfigPanel />
    case "browser":
      return (
        <Suspense fallback={<div className="panel-loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Cargando navegador...</div>}>
          <BrowserPanel initialUrl={cwd?.startsWith("http") ? cwd : "http://localhost:5173"} />
        </Suspense>
      )
    case "doc":
      return (
        <Suspense fallback={<div className="panel-loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Cargando editor...</div>}>
          <DocEditorPanel initialPath={cwd} />
        </Suspense>
      )
    case "design":
      return <DesignPanel initialUrl={cwd?.startsWith("http") ? cwd : undefined} />
    default:
      return null
  }
})
