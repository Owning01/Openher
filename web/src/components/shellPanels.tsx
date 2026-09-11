// Paneles de la shell para el grid de escritorio: terminal, explorador,
// kanban, docs, updates, stats, labs y config. Todos hablan con /shell/*.

import { memo, useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react"
import { useScheduled } from "../hooks/useScheduled"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebglAddon } from "@xterm/addon-webgl"
import { Capacitor } from "@capacitor/core"
import "@xterm/xterm/css/xterm.css"
import { RefreshIcon, TerminalIcon, PlusIcon, SplitIcon, MoreHorizontalIcon, TrashIcon, ChevronDownIcon, PencilIcon, EyeIcon, MaximizeIcon, MinimizeIcon, CloseIcon } from "../Icons"
import { b64decode, fileIcon, shell, type ShellPanelKind } from "../shell"
import { VisualSelectOverlay } from "./VisualSelectOverlay"
const CodeMirrorEditor = lazy(() => import("./CodeMirrorEditor").then((m) => ({ default: m.CodeMirrorEditor })))
import { toBase64Chunked } from "../utils/editorOps"
import { ContextMenu } from "./ContextMenu"
import { LedSwitch } from "./LedSwitch"
import { Opencode2Button } from "../features/opencode2/Opencode2Button"
import type { VisualSelection } from "../hooks/useVisualSelection"
import { useDevServer } from "../hooks/useDevServer"

import { terminalStore, terminalPtyStore, rememberTerminalPty, killTerminalPty, transferTerminalTab, getTerminalFontSize, setTerminalFontSize, TERMINAL_FONT_MIN, TERMINAL_FONT_MAX, consumePendingAutoOpencode2 } from "../utils/terminalStore"
export { killTerminalPty, transferTerminalTab }
import { useT } from "../i18n-context"
import { useDialog } from "./DialogProvider"
import { Markdown } from "./Markdown"
import { sanitizeHtml } from "../utils/sanitize"

/** Ruta absoluta del FS (Windows `C:\…`, UNC o POSIX `/…`). El server solo
    resuelve absolutas: un nombre pelado ("download.png" de un drop del SO o
    de un tab persistido viejo) nunca abre y solo genera 404 en /shell/fs/*.
    (Movida a shared/lib/filePaths para reusarla en el chat.) */
import { isAbsoluteFsPath } from "../shared/lib/filePaths"
export { isAbsoluteFsPath }
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
            {/* Viewport de xterm: solo la terminal activa montada (las ocultas
            desmontan su canvas/WebGL y re-adjuntan el PTY vía poll(ptyId,0) al
            volver — el proceso sobrevive en el backend). Montar N xterms con
            scrollback 3000 retenía GB en GPU+JS. */}
            <div className="terminal-viewport-container">
              {(() => {
                const visibleTab = termTabs.find((t) => t.id === activeTabId) ?? termTabs[0]
                if (!visibleTab) return null
                return (
                <div
                  key={visibleTab.id}
                  style={{
                    position: "absolute",
                    inset: 0,
                    visibility: "visible",
                    pointerEvents: "auto",
                    zIndex: 1,
                  }}
                >
                  <SingleTerminal cwd={cwd} shellName={visibleTab.shell} tabId={visibleTab.id} />
                </div>
                )
              })()}
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
              dividerBefore: true,
              onAction: () => onClose(),
            }] : []),
          ]}
        />
      )}
    </div>
  )
})

// ============================================================== Explorador
// Explorer único: el panel del grid reutiliza PCFilesPanel (el mismo del
// sidebar/móvil). Misma UI, mismos confirms inline y mismos toasts en todos
// lados; la implementación propia anterior (ExplorerTreeFolder + ExplorerPanel
// con barra superior) se eliminó para no duplicar.
const PCFilesPanelLazy = lazy(() => import("../features/pc-files/PCFilesPanel").then((m) => ({ default: m.PCFilesPanel })))

export const ExplorerPanel = memo(function ExplorerPanel({
  onOpenSessionDir,
  initialCwd,
  onOpenFile,
}: {
  onOpenSessionDir: (dir: string) => void
  initialCwd?: string | null
  onOpenFile?: (path: string) => void
}) {
  return (
    <Suspense fallback={<div className="panel-loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Cargando explorador...</div>}>
      <PCFilesPanelLazy initialCwd={initialCwd} onOpenFile={onOpenFile} onOpenSessionDir={onOpenSessionDir} />
    </Suspense>
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
              <Suspense fallback={<div style={{ padding: 16, color: "var(--muted)" }}>Cargando editor…</div>}>
              <CodeMirrorEditor
                path={activeTab}
                value={activeFile?.content ?? ""}
                savedValue={activeFile && !activeFile.loading && !activeFile.error ? activeFile.savedContent : undefined}
                onChange={handleContentChange}
                onSave={() => void handleSave()}
                onCursor={setCursor}
                vsPath={activeTab}
              />
              </Suspense>
            </div>
            <div className="markdown-body message-content" style={{ flex: 1, minWidth: 0, padding: "16px 20px", overflowY: "auto", background: "var(--surface-subtle)" }}>
              <Markdown text={activeFile?.content ?? ""} />
            </div>
          </div>
        ) : (
          <Suspense fallback={<div style={{ padding: 16, color: "var(--muted)" }}>Cargando editor…</div>}>
          <CodeMirrorEditor
            path={activeTab}
            value={activeFile?.content ?? ""}
            savedValue={activeFile && !activeFile.loading && !activeFile.error ? activeFile.savedContent : undefined}
            onChange={handleContentChange}
            onSave={() => void handleSave()}
            onCursor={setCursor}
            vsPath={activeTab}
          />
          </Suspense>
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


// KanbanPanel vive en ./KanbanPanel (split P1): import local + re-export
// para importadores existentes.
import { KanbanPanel } from "./KanbanPanel"
export { KanbanPanel }

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

  // Reloj central (Plan 3) con load inmediato.
  useScheduled("stats-panel", 5000, load, { runOnRegister: true })

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
  // Reloj central (Plan 3) con load inmediato.
  useScheduled("labs-panel", 6000, load, { runOnRegister: true })

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
        <div className="shell-labs-row">
          <Opencode2Button compact />
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
          <LedSwitch label={t('shell.autostart')} checked={autostart} onChange={(next) => { shell.autostart.set(next).then(() => setAutostart(next)) }} />
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
      // El thread de stats puede no estar levantado (abrir stats sin pasar
      // por StatsView): start es idempotente, si ya corre no hace nada.
      await shell.stats.start().catch(() => undefined)
      const r = await shell.stats.proxy<any>(`admin/session/${sessionID}`)
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

  // Reloj central (Plan 3) con load inmediato; re-registra al cambiar de sesión.
  useScheduled(`session-stats:${sessionID}`, 15_000, load, { runOnRegister: true })

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
