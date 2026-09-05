import { useEffect, useMemo, useRef, useState } from "react"
import type { CanvasPart, CanvasPartKind, CanvasScreen, CanvasTransition, SwipeDir } from "../model/canvasTypes"
import { BACK_TARGET, partsOf, screenSizeOf, SCREEN_MARGIN, defaultPartHeight, isSquareKind } from "../model/canvasTypes"
import { normalizeTheme, resolveScheme } from "../model/theme"
import { canvasStore, useCanvasStore } from "../store/canvasStore"
import {
  ArrowLeftIcon,
  DownloadIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  RedoIcon,
  TrashIcon,
  UndoIcon,
} from "../../../Icons"
import { PhoneScreen, type GuideLines } from "./PhoneScreen"
import { Inspector } from "./Inspector"
import { LayersPanel } from "./LayersPanel"
import { ThemePanel } from "./ThemePanel"
import { PromptPanel } from "./PromptPanel"
import { ToolBtn } from "./ToolBtn"
import "../../../styles/canvas.css"

const PALETTE_GROUPS: Array<{ title: string; items: Array<{ kind: CanvasPartKind; label: string }> }> = [
  { title: "Acciones", items: [
    { kind: "button", label: "Boton" },
    { kind: "iconButton", label: "Icono" },
    { kind: "extendedFab", label: "FAB ext." },
    { kind: "fab", label: "FAB" },
    { kind: "chip", label: "Chip" },
  ] },
  { title: "Navegacion", items: [
    { kind: "topAppBar", label: "Barra sup." },
    { kind: "bottomNav", label: "Barra inf." },
    { kind: "searchBar", label: "Buscador" },
  ] },
  { title: "Contencion", items: [
    { kind: "card", label: "Tarjeta" },
    { kind: "listItem", label: "Lista" },
    { kind: "box", label: "Caja" },
    { kind: "dialog", label: "Dialogo" },
    { kind: "snackbar", label: "Snackbar" },
  ] },
  { title: "Entradas", items: [
    { kind: "textField", label: "Campo" },
    { kind: "switch", label: "Switch" },
    { kind: "checkbox", label: "Check" },
    { kind: "radio", label: "Radio" },
    { kind: "slider", label: "Slider" },
  ] },
  { title: "Contenido", items: [
    { kind: "text", label: "Texto" },
    { kind: "image", label: "Imagen" },
    { kind: "badge", label: "Badge" },
    { kind: "divider", label: "Divisor" },
  ] },
  { title: "Progreso", items: [
    { kind: "loadingIndicator", label: "Loading" },
    { kind: "linearProgress", label: "Lineal" },
    { kind: "circularProgress", label: "Circular" },
  ] },
]

const REVERSE: Record<CanvasTransition, CanvasTransition> = {
  slide: "slideLeft", slideLeft: "slide", slideUp: "slideDown", slideDown: "slideUp",
  fade: "fade", expand: "expand", none: "none",
}

const SWIPE_DIRS: Array<{ key: SwipeDir; label: string }> = [
  { key: "left", label: "Izq" },
  { key: "right", label: "Der" },
  { key: "up", label: "Arriba" },
  { key: "down", label: "Abajo" },
]

function partBox(p: CanvasPart, sw: number): { w: number; h: number } {
  const square = isSquareKind(p.kind)
  const h = p.kind === "box" ? (p.size ?? 220) : square ? (p.size ?? defaultPartHeight(p.kind)) : defaultPartHeight(p.kind)
  return { w: square ? h : (p.w ?? sw), h }
}

function snapMove(
  sw: number, sh: number, parts: CanvasPart[], movingId: string, w: number, h: number, x: number, y: number,
): { x: number; y: number; guides: GuideLines } {
  const TOL = 7
  const guides: GuideLines = { v: [], h: [] }
  let nx = Math.max(0, Math.min(sw - w, Math.round(x)))
  let ny = Math.max(0, Math.min(sh - h, Math.round(y)))
  const trySnap = (val: number, candidates: Array<{ at: number; axis: number }>, isV: boolean) => {
    for (const c of candidates) {
      if (Math.abs(val - c.at) < TOL) {
        ;(isV ? guides.v : guides.h).push(c.axis)
        return c.at
      }
    }
    return val
  }
  const vCand: Array<{ at: number; axis: number }> = [
    { at: SCREEN_MARGIN, axis: SCREEN_MARGIN },
    { at: Math.round(sw / 2 - w / 2), axis: Math.round(sw / 2) },
    { at: sw - SCREEN_MARGIN - w, axis: sw - SCREEN_MARGIN },
  ]
  const hCand: Array<{ at: number; axis: number }> = [
    { at: SCREEN_MARGIN, axis: SCREEN_MARGIN },
    { at: Math.round(sh / 2 - h / 2), axis: Math.round(sh / 2) },
  ]
  for (const o of parts) {
    if (o.id === movingId) continue
    const b = partBox(o, sw)
    vCand.push({ at: Math.round(o.x), axis: Math.round(o.x) })
    vCand.push({ at: Math.round(o.x + b.w / 2 - w / 2), axis: Math.round(o.x + b.w / 2) })
    vCand.push({ at: Math.round(o.x + b.w - w), axis: Math.round(o.x + b.w) })
    hCand.push({ at: Math.round(o.y), axis: Math.round(o.y) })
    hCand.push({ at: Math.round(o.y + b.h / 2 - h / 2), axis: Math.round(o.y + b.h / 2) })
    hCand.push({ at: Math.round(o.y + b.h - h), axis: Math.round(o.y + b.h) })
  }
  nx = trySnap(nx, vCand, true)
  ny = trySnap(ny, hCand, false)
  return { x: nx, y: ny, guides }
}

export function CanvasPanel() {
  const { docs, activeId, selection } = useCanvasStore()
  const [screenId, setScreenId] = useState<string | null>(null)
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [side, setSide] = useState<"inspect" | "layers" | "theme" | "prompt">("inspect")
  const [previewStack, setPreviewStack] = useState<string[]>([])
  const [previewTrans, setPreviewTrans] = useState<CanvasTransition[]>(["slide"])
  const [guides, setGuides] = useState<GuideLines | undefined>(undefined)
  const [exporting, setExporting] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const touchRef = useRef<{ x: number; y: number } | null>(null)
  const exportRef = useRef<HTMLDivElement | null>(null)

  const doc = useMemo(
    () => docs.find((d) => d.id === activeId) ?? null,
    [docs, activeId],
  )
  const scheme = useMemo(
    () => resolveScheme(normalizeTheme(doc?.theme)),
    [doc?.theme],
  )
  const screen = useMemo(() => {
    if (!doc) return null
    return doc.screens.find((s) => s.id === screenId) ?? doc.screens[0] ?? null
  }, [doc, screenId])
  const parts = useMemo(() => (doc && screen ? partsOf(doc, screen.id) : []), [doc, screen])
  const selectedPart = useMemo(() => {
    if (!selection || !screen || selection.screenId !== screen.id) return null
    return parts.find((p) => p.id === selection.partId) ?? null
  }, [selection, screen, parts])

  const previewScreenId = previewStack[previewStack.length - 1] ?? screen?.id ?? null
  const previewScreen = doc?.screens.find((s) => s.id === previewScreenId) ?? null
  const lastTransition = previewTrans[previewTrans.length - 1] ?? "slide"

  useEffect(() => {
    if (!exporting || !doc) return
    let cancelled = false
    const run = async () => {
      try {
        await (document as Document).fonts?.ready
        await new Promise((r) => setTimeout(r, 60))
        if (cancelled) return
        const el = exportRef.current?.firstElementChild as HTMLElement | null
        if (!el) throw new Error("nada para exportar")
        const { toPng } = await import("html-to-image")
        const url = await toPng(el, { pixelRatio: 2, cacheBust: true })
        if (cancelled) return
        const s = doc.screens.find((x) => x.id === exporting)
        const a = document.createElement("a")
        a.href = url
        a.download = `${(s?.name ?? "pantalla").replace(/[\\/:*?"<>|]+/g, " ").trim() || "pantalla"}.png`
        a.click()
        setExportError(null)
      } catch (e) {
        if (!cancelled) setExportError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setExporting(null)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [exporting, doc])

  useEffect(() => {
    if (mode !== "edit") return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); canvasStore.undo(); return }
      if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); canvasStore.redo(); return }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault()
        if (selectedPart && screen) canvasStore.duplicatePart(screen.id, selectedPart.id)
        return
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedPart && screen) {
        e.preventDefault()
        canvasStore.deletePart(screen.id, selectedPart.id)
        return
      }
      if (selectedPart && screen && e.key.startsWith("Arrow")) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0
        canvasStore.movePart(screen.id, selectedPart.id, selectedPart.x + dx, selectedPart.y + dy, true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mode, screen, selectedPart])

  if (!doc) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "var(--muted)" }}>
        <div style={{ fontSize: 14 }}>Sin diseños todavia</div>
        <button type="button" className="btn-primary compact" onClick={() => canvasStore.createDoc("Mi diseño")}>
          Crear diseño
        </button>
      </div>
    )
  }

  const openPreview = (id: string, transition: CanvasTransition = "slide") => {
    if (previewStack[previewStack.length - 1] === id) return
    setPreviewStack([...previewStack, id])
    setPreviewTrans([...previewTrans, transition])
  }

  const goBack = () => {
    if (previewStack.length <= 1) return
    const opened = previewTrans[previewTrans.length - 1] ?? "slide"
    const next = previewTrans.slice(0, -1)
    next[next.length - 1] = REVERSE[opened]
    setPreviewStack(previewStack.slice(0, -1))
    setPreviewTrans(next)
  }

  const flipToggle = (scrId: string, part: CanvasPart) => {
    if (part.kind === "switch" || part.kind === "checkbox" || part.kind === "radio") {
      canvasStore.updatePart(scrId, part.id, { checked: !part.checked })
    } else if (part.kind === "button" || part.kind === "extendedFab" || part.kind === "iconButton" || part.kind === "fab") {
      const cur = part.variant ?? "filled"
      canvasStore.updatePart(scrId, part.id, { variant: cur === "filled" ? "tonal" : "filled" })
    }
  }

  const handleTap = (part: CanvasPart) => {
    if (!previewScreen) return
    if (part.toggle) flipToggle(previewScreen.id, part)
    if (!part.action) return
    if (part.action.to === BACK_TARGET) {
      goBack()
    } else if (doc.screens.some((s) => s.id === part.action!.to)) {
      openPreview(part.action.to, part.action.transition ?? "slide")
    }
  }

  const enterPreview = () => {
    setPreviewStack(screen ? [screen.id] : [])
    setPreviewTrans(["slide"])
    setMode("preview")
  }

  const handleMove = (scrId: string, partId: string, x: number, y: number, commit: boolean) => {
    if (!screen || scrId !== screen.id) {
      canvasStore.movePart(scrId, partId, x, y, commit)
      return
    }
    if (commit) {
      setGuides(undefined)
      const cur = partsOf(doc, scrId).find((p) => p.id === partId)
      if (cur) canvasStore.movePart(scrId, partId, cur.x, cur.y, true)
      return
    }
    const cur = parts.find((p) => p.id === partId)
    if (!cur) return
    const { w: sw, h: sh } = screenSizeOf(screen)
    const b = partBox(cur, sw)
    const snapped = snapMove(sw, sh, parts, partId, b.w, b.h, x, y)
    setGuides(snapped.guides.v.length || snapped.guides.h.length ? snapped.guides : undefined)
    canvasStore.movePart(scrId, partId, snapped.x, snapped.y, false)
  }

  const onSwipeEnd = (dx: number, dy: number) => {
    if (!previewScreen) return
    const adx = Math.abs(dx), ady = Math.abs(dy)
    if (Math.max(adx, ady) < 60) return
    const dir: SwipeDir = adx > ady ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down")
    const to = previewScreen.swipe?.[dir]
    if (!to) return
    if (to === BACK_TARGET) goBack()
    else if (doc.screens.some((s) => s.id === to)) {
      openPreview(to, dir === "left" ? "slide" : dir === "right" ? "slideLeft" : dir === "up" ? "slideUp" : "slideDown")
    }
  }

  const smallBtn: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text)",
    fontSize: 12,
    padding: "5px 10px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  }

  const linkedTargets = (s: CanvasScreen): string[] => {
    const names: string[] = []
    for (const p of partsOf(doc, s.id)) {
      if (p.action && p.action.to !== BACK_TARGET) {
        const t = doc.screens.find((x) => x.id === p.action!.to)
        if (t && !names.includes(t.name)) names.push(t.name)
      }
    }
    const sw = s.swipe ?? {}
    for (const to of Object.values(sw)) {
      const t = doc.screens.find((x) => x.id === to)
      if (t && t.id !== BACK_TARGET && !names.includes(t.name)) names.push(t.name)
    }
    return names
  }

  const exportScreen = exporting ? doc.screens.find((s) => s.id === exporting) ?? null : null

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
        <select
          aria-label="Diseño activo"
          value={doc.id}
          onChange={(e) => { canvasStore.setActive(e.target.value); setScreenId(null); setPreviewStack([]) }}
          style={{ ...smallBtn, maxWidth: 200 }}
        >
          {docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
        <button type="button" style={smallBtn} onClick={() => canvasStore.createDoc(`Diseño ${docs.length + 1}`)} title="Nuevo diseño" aria-label="Nuevo diseño">
          <PlusIcon size={13} />
        </button>
        <ToolBtn title={exporting ? "Exportando…" : "Exportar pantalla como PNG"} onClick={() => { if (exporting || !screen) return; setExportError(null); setExporting(screen.id) }}>
          <DownloadIcon size={14} />
        </ToolBtn>
        <span style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />
        <ToolBtn title="Editar" active={mode === "edit"} onClick={() => setMode("edit")}>
          <PencilIcon size={14} />
        </ToolBtn>
        <ToolBtn title="Vista previa navegable" active={mode === "preview"} onClick={enterPreview}>
          <EyeIcon size={14} />
        </ToolBtn>
        {mode === "edit" ? (
          <>
            <button type="button" style={smallBtn} onClick={() => { if (screen) canvasStore.tidyScreen(screen.id) }}>Ordenar</button>
            <ToolBtn title="Deshacer (Ctrl+Z)" onClick={() => canvasStore.undo()}>
              <UndoIcon size={14} />
            </ToolBtn>
            <ToolBtn title="Rehacer (Ctrl+Y)" onClick={() => canvasStore.redo()}>
              <RedoIcon size={14} />
            </ToolBtn>
          </>
        ) : (
          <ToolBtn title="Atras" disabled={previewStack.length <= 1} onClick={goBack}>
            <ArrowLeftIcon size={14} />
          </ToolBtn>
        )}
        {exportError ? <span style={{ fontSize: 11, color: "var(--danger, #B3261E)" }}>PNG: {exportError}</span> : null}
      </div>

      {mode === "edit" && screen ? (
        <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
          <div style={{ width: 172, flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Pantallas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {doc.screens.map((s) => {
                  const links = linkedTargets(s)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setScreenId(s.id); canvasStore.select(null) }}
                      style={{
                        ...smallBtn,
                        textAlign: "left",
                        fontWeight: s.id === screen.id ? 700 : 400,
                        borderColor: s.id === screen.id ? "var(--primary)" : "var(--border)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.name} · {s.preset === "desktop" ? "PC" : "Móvil"}
                      {links.length > 0 ? (
                        <span style={{ display: "block", fontSize: 10, fontWeight: 400, color: "var(--muted)" }}>
                          → {links.join(", ")}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                <button type="button" style={{ ...smallBtn, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} onClick={() => { const id = canvasStore.addScreen("Nueva", "phone"); if (id) setScreenId(id) }}><PlusIcon size={12} /> Móvil</button>
                <button type="button" style={{ ...smallBtn, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} onClick={() => { const id = canvasStore.addScreen("Nueva PC", "desktop"); if (id) setScreenId(id) }}><PlusIcon size={12} /> PC</button>
              </div>
            </div>
            {PALETTE_GROUPS.map((g) => (
              <div key={g.title}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>{g.title}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {g.items.map((item) => (
                    <button key={item.kind} type="button" style={{ ...smallBtn, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} onClick={() => canvasStore.addPart(screen.id, item.kind)}>
                      <PlusIcon size={11} /> {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
              Arrastra para mover (con guias). Supr borra · Ctrl+Z/Y · Ctrl+D duplica · Flechas mueven.
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", minHeight: 0, padding: 4 }}>
            <PhoneScreen
              screen={screen}
              parts={parts}
              scheme={scheme}
              shape={normalizeTheme(doc.theme).shape}
              mode="edit"
              selectedId={selectedPart?.id ?? null}
              guides={guides}
              onSelect={(partId) => canvasStore.select(partId ? { screenId: screen.id, partId } : null)}
              onMove={(partId, x, y, commit) => handleMove(screen.id, partId, x, y, commit)}
            />
          </div>

          <div style={{ width: 264, flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
            <div style={{ display: "flex", gap: 4, flexShrink: 0, flexWrap: "wrap" }}>
              {(["inspect", "layers", "theme", "prompt"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  style={{ ...smallBtn, flex: 1, fontWeight: side === tab ? 700 : 400 }}
                  onClick={() => setSide(tab)}
                >
                  {tab === "inspect" ? "Ajustes" : tab === "layers" ? "Capas" : tab === "theme" ? "Tema" : "Prompt"}
                </button>
              ))}
            </div>
            {side === "inspect" ? (
              selectedPart ? (
                <Inspector doc={doc} screen={screen} part={selectedPart} />
              ) : (
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                  Selecciona una parte del lienzo para editar texto, estilo, posicion y navegacion.
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      Nombre de la pantalla
                      <input
                        value={screen.name}
                        onChange={(e) => canvasStore.renameScreen(screen.id, e.target.value)}
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 13, padding: "6px 8px" }}
                      />
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" style={{ ...smallBtn, flex: 1 }} onClick={() => canvasStore.setPreset(screen.id, "phone")}>Móvil</button>
                      <button type="button" style={{ ...smallBtn, flex: 1 }} onClick={() => canvasStore.setPreset(screen.id, "desktop")}>PC</button>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Swipe abre</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      {SWIPE_DIRS.map((d) => (
                        <label key={d.key} style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 11, color: "var(--muted)" }}>
                          {d.label}
                          <select
                            value={screen.swipe?.[d.key] ?? ""}
                            onChange={(e) => canvasStore.setScreenSwipe(screen.id, d.key, e.target.value)}
                            style={{ ...smallBtn, maxWidth: "100%" }}
                          >
                            <option value="">—</option>
                            {doc.screens.filter((s) => s.id !== screen.id).map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--muted)" }}>
                      Nota de la pantalla (va al prompt)
                      <textarea
                        value={screen.note ?? ""}
                        onChange={(e) => canvasStore.setScreenNote(screen.id, e.target.value)}
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 13, padding: "6px 8px", minHeight: 48, resize: "vertical" }}
                      />
                    </label>
                    {doc.screens.length > 1 ? (
                      <button type="button" className="btn-danger compact" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => canvasStore.deleteScreen(screen.id)}>
                        <TrashIcon size={12} /> Borrar pantalla
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            ) : side === "layers" ? (
              <LayersPanel screenId={screen.id} parts={parts} selectedId={selectedPart?.id ?? null} />
            ) : side === "theme" ? (
              <ThemePanel theme={normalizeTheme(doc.theme)} />
            ) : (
              <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <PromptPanel doc={doc} />
              </div>
            )}
          </div>
        </div>
      ) : null}

      {mode === "preview" && previewScreen ? (
        <div
          style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "center", padding: 4 }}
          onTouchStart={(e) => { const t = e.touches[0]; if (t) touchRef.current = { x: t.clientX, y: t.clientY } }}
          onTouchEnd={(e) => {
            const s = touchRef.current
            touchRef.current = null
            const t = e.changedTouches[0]
            if (!s || !t) return
            onSwipeEnd(t.clientX - s.x, t.clientY - s.y)
          }}
        >
          <div key={`${previewScreen.id}-${previewStack.length}`} className="m3e-scope">
            <div className={`m3e-enter-${lastTransition}`}>
              <PhoneScreen
                screen={previewScreen}
                parts={partsOf(doc, previewScreen.id)}
                scheme={scheme}
                shape={normalizeTheme(doc.theme).shape}
                mode="preview"
                onTap={handleTap}
              />
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", maxWidth: 220, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{previewScreen.name}</div>
            Toca las partes enlazadas o desliza para navegar. Atras revierte la transicion.
            <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {previewStack.map((id, i) => {
                const s = doc.screens.find((x) => x.id === id)
                return s ? (
                  <span key={`${id}-${i}`} style={{ fontSize: 11, border: "1px solid var(--border)", borderRadius: 999, padding: "2px 8px" }}>
                    {s.name}
                  </span>
                ) : null
              })}
            </div>
          </div>
        </div>
      ) : null}

      {exportScreen ? (
        <div ref={exportRef} style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }}>
          <PhoneScreen
            screen={exportScreen}
            parts={partsOf(doc, exportScreen.id)}
            scheme={scheme}
            shape={normalizeTheme(doc.theme).shape}
            maxWidth={screenSizeOf(exportScreen).w}
            mode="edit"
          />
        </div>
      ) : null}
    </div>
  )
}
