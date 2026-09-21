// Sesión xterm de una terminal individual: PTY por /shell/pty, WebSocket a
// :4849 con fallback a polling, cola rAF, WebGL con rebuild de atlas ante
// zoom/DPR/sleep. Extraído de shellPanels.tsx (F4-P3), conducta idéntica.
import { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebglAddon } from "@xterm/addon-webgl"
import { Capacitor } from "@capacitor/core"
import "@xterm/xterm/css/xterm.css"
import { b64decode, shell } from "../../shell"
import {
  terminalPtyStore,
  rememberTerminalPty,
  getTerminalFontSize,
  setTerminalFontSize,
  TERMINAL_FONT_MIN,
  TERMINAL_FONT_MAX,
} from "../../utils/terminalStore"

export function useXtermSession({ cwd, shellName, tabId }: { cwd?: string; shellName?: string; tabId: string }) {
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

  return ref
}
