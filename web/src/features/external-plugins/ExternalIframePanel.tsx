import { useEffect, useState, useCallback, useRef } from "react"
import { shell } from "../../shell"
import { ContextMenu } from "../../components/ContextMenu"

type Props = { name: string; title: string; url: string; isWidget?: boolean }

export function ExternalIframePanel({ name, title, url: defaultUrl, isWidget }: Props) {
  const [url, setUrl] = useState(defaultUrl)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(() => {
    try {
      const v = localStorage.getItem(`opencode.plugin.zoom.${name}`)
      const n = v ? parseFloat(v) : 1
      return Number.isFinite(n) ? Math.min(2, Math.max(0.5, n)) : 1
    } catch { return 1 }
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const [restarting, setRestarting] = useState(false)
  const lastMtimeRef = useRef<number | null>(null)
  const [autoReload, setAutoReload] = useState(() => {
    try {
      const v = localStorage.getItem(`opencode.plugin.autoreload.${name}`)
      return v ? v === "1" : true
    } catch { return true }
  })
  const [autoNotice, setAutoNotice] = useState<string | null>(null)

  // reset cuando cambia el plugin (evita mostrar URL stale del plugin anterior)
  useEffect(() => {
    setUrl(defaultUrl)
    setStatus("loading")
    setError(null)
    setReloadKey(0)
    lastMtimeRef.current = null
    setCtxMenu(null)
    setAutoNotice(null)
  }, [name, defaultUrl])

  useEffect(() => {
    try { localStorage.setItem(`opencode.plugin.autoreload.${name}`, autoReload ? "1" : "0") } catch {}
  }, [name, autoReload])

  useEffect(() => {
    let cancelled = false
    let pollTimer = 0 as any

    const pollReady = async (targetUrl: string) => {
      // poll hasta que el iframe responda o timeout 30s
      for (let i = 0; i < 30; i++) {
        if (cancelled) return
        try {
          const s = await shell.external.status(name)
          if (s?.running) {
            if (!cancelled) {
              setUrl(s.url || targetUrl)
              setStatus("ready")
            }
            return
          }
        } catch {}
        // también probar fetch directo
        try {
          await fetch(targetUrl, { mode: "no-cors", cache: "no-store" })
          if (!cancelled) {
            setStatus("ready")
            return
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 1000))
      }
      if (!cancelled) setStatus("error")
    }

    const start = async () => {
      try {
        // widget_notas no tiene url, solo lanza proceso
        if (isWidget) {
          await shell.external.start(name)
          if (!cancelled) setStatus("ready")
          return
        }
        const res: any = await shell.external.start(name)
        const target = res?.url || defaultUrl
        if (!cancelled) setUrl(target)
        // si ya estaba corriendo, ready inmediato
        if (res?.already) {
          if (!cancelled) setStatus("ready")
          return
        }
        // poll hasta ready
        await pollReady(target)
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || String(e))
          setStatus("error")
        }
      }
    }

    start()

    return () => {
      cancelled = true
      clearTimeout(pollTimer)
      // No auto-stop al cambiar de pestaña: el iframe queda vivo y no se reinicia.
      // El stop se hace solo al cerrar la pestaña (onRemoveTab) o al desmontar el grid.
    }
  }, [name, defaultUrl, isWidget])

  useEffect(() => {
    try { localStorage.setItem(`opencode.plugin.zoom.${name}`, String(zoom)) } catch {}
  }, [name, zoom])

  const clampZoom = useCallback((v: number) => Math.min(2, Math.max(0.5, Math.round(v * 10) / 10)), [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const step = e.deltaY > 0 ? -0.1 : 0.1
      setZoom((z) => clampZoom(z + step))
    }
  }, [clampZoom])

  // evita zoom nativo del WebView2 (Ctrl+rueda) y deja solo nuestro zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault()
    }
    el.addEventListener("wheel", onNativeWheel, { passive: false })
    return () => el.removeEventListener("wheel", onNativeWheel)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === "0") {
        e.preventDefault()
        setZoom(1)
      } else if (e.key === "+" || e.key === "=" || e.key === "Add") {
        e.preventDefault()
        setZoom((z) => clampZoom(z + 0.1))
      } else if (e.key === "-" || e.key === "Subtract") {
        e.preventDefault()
        setZoom((z) => clampZoom(z - 0.1))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [clampZoom])

  const doHardReload = useCallback(async () => {
    setCtxMenu(null)
    try {
      if ("caches" in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    } catch {}
    // liberar ServiceWorker cache del WebView2 si existe intentando reload con no-store
    setReloadKey((k) => k + 1)
    const cur = url || defaultUrl
    const base = (cur.split("?")[0] ?? cur).split("#")[0] ?? cur
    const bust = `${base}${base.includes("?") ? "&" : "?"}__cb=${Date.now()}`
    try { await fetch(bust, { cache: "no-store" }) } catch {}
    setUrl(bust)
    // actualizar mtime para no disparar auto-reload inmediato
    try {
      const m: any = await shell.external.mtime(name)
      if (m?.mtime) lastMtimeRef.current = Number(m.mtime)
    } catch {}
  }, [url, defaultUrl, name])

  const doHardReloadRef = useRef(doHardReload)
  useEffect(() => { doHardReloadRef.current = doHardReload }, [doHardReload])

  const doRestart = useCallback(async () => {
    setCtxMenu(null)
    if (restarting) return
    setRestarting(true)
    setError(null)
    const wasReady = status === "ready"
    if (wasReady) setAutoNotice("Reiniciando servidor…")
    try {
      // pasar a loading solo si estaba ready — mantiene iframe visible con overlay
      // no reseteamos url aún
      const res: any = await shell.external.restart(name)
      const target = res?.url || defaultUrl
      const bustBase = (target.split("?")[0] ?? target).split("#")[0] ?? target
      const bust = `${bustBase}${bustBase.includes("?") ? "&" : "?"}__cb=${Date.now()}`
      setUrl(bust)
      setReloadKey((k) => k + 1)
      const isEmbed = !!res?.embed
      if (!isEmbed) {
        // esperar a que el nuevo proceso responda
        setStatus("loading")
        for (let i = 0; i < 30; i++) {
          try {
            const s: any = await shell.external.status(name)
            if (s?.running) {
              const finalUrl = s?.url ? `${(s.url.split("?")[0] ?? s.url).split("#")[0] ?? s.url}?__cb=${Date.now()}` : bust
              setUrl(finalUrl)
              setReloadKey((k) => k + 1)
              setStatus("ready")
              break
            }
          } catch {}
          await new Promise((r) => setTimeout(r, 800))
          if (i === 29) setStatus("ready")
        }
      } else {
        setStatus("ready")
      }
      try {
        const m: any = await shell.external.mtime(name)
        if (m?.mtime) lastMtimeRef.current = Number(m.mtime)
      } catch {}
      setAutoNotice("Servidor reiniciado")
      setTimeout(() => setAutoNotice(null), 2200)
    } catch (e: any) {
      setError(e?.message || String(e))
      setStatus("error")
      setAutoNotice(null)
    } finally {
      setRestarting(false)
    }
  }, [name, defaultUrl, status, restarting])

  // Ctrl+Shift+R hard reload solo si este panel está visible (keep-mounted hidden no dispara)
  useEffect(() => {
    const onKeyHard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "r") {
        const el = containerRef.current
        if (!el) return
        // keep-mounted usa visibility:hidden + pointerEvents none — solo el visible tiene offsetParent
        const visible = el.offsetParent !== null && getComputedStyle(el).visibility !== "hidden"
        if (!visible) return
        // también verificar que el panel no esté en error/loading (evitar duplicados)
        e.preventDefault()
        doHardReload()
      }
    }
    window.addEventListener("keydown", onKeyHard)
    return () => window.removeEventListener("keydown", onKeyHard)
  }, [doHardReload])

  // reenvío de contextmenu / hard-reload desde iframe embed (same-origin)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return
      if (e.data.plugin !== name) return
      if (e.data.type === "plugin-contextmenu") {
        const x = Number(e.data.x) || 0
        const y = Number(e.data.y) || 0
        try {
          const rect = containerRef.current?.getBoundingClientRect()
          const gx = rect ? rect.left + x : x
          const gy = rect ? rect.top + y : y
          setCtxMenu({ x: gx, y: gy })
        } catch {
          setCtxMenu({ x, y })
        }
      } else if (e.data.type === "plugin-hard-reload") {
        const el = containerRef.current
        const visible = el && el.offsetParent !== null && getComputedStyle(el).visibility !== "hidden"
        if (visible) doHardReloadRef.current?.()
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [name])

  // auto-detección de cambios vía /shell/external/<name>/mtime — polling ligero 3.5s
  useEffect(() => {
    if (status !== "ready" || isWidget) return
    let cancelled = false
    let timer: any
    const tick = async () => {
      if (cancelled) return
      try {
        const res: any = await shell.external.mtime(name)
        const m = Number(res?.mtime || 0)
        if (!m) {
          timer = setTimeout(tick, 4000)
          return
        }
        if (lastMtimeRef.current === null) {
          lastMtimeRef.current = m
        } else if (m !== lastMtimeRef.current) {
          lastMtimeRef.current = m
          if (autoReload && !restarting) {
            setAutoNotice("Cambios detectados — recargando…")
            try {
              if ("caches" in window) {
                const ks = await caches.keys()
                await Promise.all(ks.map((k) => caches.delete(k)))
              }
            } catch {}
            const cur = url || defaultUrl
            const base = (cur.split("?")[0] ?? cur).split("#")[0] ?? cur
            const bust = `${base}${base.includes("?") ? "&" : "?"}__cb=${Date.now()}`
            try { await fetch(bust, { cache: "no-store" }) } catch {}
            setReloadKey((k) => k + 1)
            setUrl(bust)
            setTimeout(() => { if (!cancelled) setAutoNotice(null) }, 2800)
          } else if (!restarting) {
            setAutoNotice("Cambios detectados — clic derecho → Borrar caché para verlos")
            setTimeout(() => { if (!cancelled) setAutoNotice(null) }, 4200)
          }
        }
      } catch {}
      if (!cancelled) timer = setTimeout(tick, 4000)
    }
    timer = setTimeout(tick, 2600)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [name, status, isWidget, autoReload, restarting, url, defaultUrl])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }, [])

  if (isWidget) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--primary-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "var(--primary)" }}>◈</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, maxWidth: 360 }}>
          {status === "loading" ? "Lanzando widget nativo..." : status === "ready" ? "Widget en ejecución en ventana independiente." : `Error: ${error || "no se pudo lanzar"}`}
        </div>
        {status === "loading" && <div className="animate-spin" style={{ width: 20, height: 20, border: "2px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%" }} />}
      </div>
    )
  }

  if (status === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--primary-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "var(--primary)" }}>◈</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{restarting ? "Reiniciando dev server…" : "Iniciando dev server..."}</div>
        <div className="animate-spin" style={{ width: 20, height: 20, border: "2px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%" }} />
        <div style={{ fontSize: 11, color: "var(--muted)", maxWidth: 320 }}>{url}</div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div
        onContextMenu={handleContextMenu}
        style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}
      >
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>No se pudo iniciar {title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", maxWidth: 360 }}>{error || url}</div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Verificá que pnpm/flutter esté instalado y el proyecto exista.</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={doRestart}
            disabled={restarting}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-strong)", color: "var(--text)", cursor: "pointer", fontSize: 12 }}
          >
            {restarting ? "Reiniciando…" : "↻ Reintentar"}
          </button>
          <button
            onClick={doHardReload}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(161,161,170,0.14)", background: "rgba(161,161,170,0.10)", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
          >
            🧹 Recargar sin caché
          </button>
        </div>
        {ctxMenu && (
          <ContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            onClose={() => setCtxMenu(null)}
            actions={[
              { id: "restart", label: restarting ? "Reiniciando…" : "Reiniciar servidor", icon: "↻", onAction: doRestart },
              { id: "hard", label: "Borrar caché y recargar (Ctrl+Shift+R)", icon: "🧹", onAction: doHardReload },
              { id: "auto", label: autoReload ? "Auto-actualizar: ON" : "Auto-actualizar: OFF", icon: autoReload ? "●" : "○", onAction: () => setAutoReload((v) => !v) },
            ]}
          />
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)", position: "relative", overflow: "hidden" }}
      title="Clic derecho para Reiniciar / Borrar caché · Ctrl+rueda zoom · Ctrl+Shift+R recarga sin caché"
    >
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", position: "relative", background: "var(--surface)" }}>
        <iframe
          key={reloadKey}
          src={url}
          title={title}
          style={{
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
            border: "none",
            background: "var(--surface)",
            transform: `scale(${zoom})`,
            transformOrigin: "0 0",
            position: "absolute",
            inset: 0,
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          allow="clipboard-read; clipboard-write"
        />
        {restarting && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(9,9,11,0.58)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, zIndex: 4 }}>
            <div className="animate-spin" style={{ width: 28, height: 28, border: "2px solid rgba(161,161,170,0.2)", borderTopColor: "var(--primary)", borderRadius: "50%" }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(244,244,245,0.95)" }}>Reiniciando servidor…</div>
            <div style={{ fontSize: 11, color: "rgba(161,161,170,0.9)" }}>{title} · {url.split("?")[0]}</div>
          </div>
        )}
      </div>
      {autoNotice && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(24,24,27,0.94)",
            border: "1px solid rgba(161,161,170,0.18)",
            color: "rgba(244,244,245,0.95)",
            fontSize: 11,
            fontWeight: 600,
            padding: "6px 10px",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            backdropFilter: "blur(6px)",
            zIndex: 6,
            maxWidth: "85%",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          {autoNotice}
        </div>
      )}
      {/* barra flotante: acciones + zoom — gris suave */}
      <div
        style={{
          position: "absolute",
          right: 10,
          bottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(24,24,27,0.92)",
          border: "1px solid rgba(161,161,170,0.18)",
          borderRadius: 8,
          padding: "4px 6px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          backdropFilter: "blur(6px)",
          zIndex: 5,
        }}
        onMouseDown={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <button
          type="button"
          onClick={doRestart}
          disabled={restarting}
          title="Reiniciar servidor"
          style={{
            width: 28, height: 26, borderRadius: 6, border: "1px solid rgba(161,161,170,0.14)",
            background: restarting ? "rgba(239,68,68,0.12)" : "rgba(161,161,170,0.10)", color: restarting ? "#fca5a5" : "rgba(244,244,245,0.95)",
            cursor: restarting ? "wait" : "pointer", fontSize: 13, lineHeight: 1, opacity: restarting ? 0.9 : 1,
          }}
        >
          {restarting ? "…" : "↻"}
        </button>
        <button
          type="button"
          onClick={doHardReload}
          title="Borrar caché y recargar (Ctrl+Shift+R)"
          style={{
            width: 28, height: 26, borderRadius: 6, border: "1px solid rgba(161,161,170,0.14)",
            background: "rgba(161,161,170,0.10)", color: "rgba(244,244,245,0.95)",
            cursor: "pointer", fontSize: 12, lineHeight: 1,
          }}
        >
          🧹
        </button>
        <div style={{ width: 1, height: 18, background: "rgba(161,161,170,0.14)", margin: "0 2px" }} />
        <button
          type="button"
          onClick={() => setZoom((z) => clampZoom(z - 0.1))}
          disabled={zoom <= 0.5}
          title="Alejar (Ctrl -)"
          style={{
            width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(161,161,170,0.14)",
            background: "rgba(161,161,170,0.10)", color: "rgba(244,244,245,0.95)",
            cursor: zoom <= 0.5 ? "not-allowed" : "pointer", fontSize: 14, lineHeight: 1, opacity: zoom <= 0.5 ? 0.45 : 1,
          }}
        >
          −
        </button>
        <span
          onClick={() => setZoom(1)}
          title="Click para 100% (Ctrl+0)"
          style={{
            minWidth: 44, textAlign: "center", fontSize: 11, fontWeight: 600, fontFamily: "monospace",
            color: "rgba(161,161,170,0.95)", background: "rgba(161,161,170,0.08)",
            border: "1px solid rgba(161,161,170,0.10)", borderRadius: 6, padding: "3px 6px", cursor: "pointer",
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom((z) => clampZoom(z + 0.1))}
          disabled={zoom >= 2}
          title="Acercar (Ctrl +)"
          style={{
            width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(161,161,170,0.14)",
            background: "rgba(161,161,170,0.10)", color: "rgba(244,244,245,0.95)",
            cursor: zoom >= 2 ? "not-allowed" : "pointer", fontSize: 14, lineHeight: 1, opacity: zoom >= 2 ? 0.45 : 1,
          }}
        >
          +
        </button>
      </div>
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          actions={[
            { id: "restart", label: restarting ? "Reiniciando…" : "Reiniciar servidor", icon: "↻", onAction: doRestart },
            { id: "hard", label: "Borrar caché y recargar (Ctrl+Shift+R)", icon: "🧹", onAction: doHardReload },
            { id: "auto", label: autoReload ? "Auto-actualizar: ON" : "Auto-actualizar: OFF", icon: autoReload ? "●" : "○", onAction: () => setAutoReload((v) => !v) },
          ]}
        />
      )}
    </div>
  )
}
