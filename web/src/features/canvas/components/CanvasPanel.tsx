import { useMemo, useState } from "react"
import type { CanvasPart, CanvasPartKind } from "../model/canvasTypes"
import { BACK_TARGET, partsOf } from "../model/canvasTypes"
import { canvasStore, useCanvasStore } from "../store/canvasStore"
import { PhoneScreen } from "./PhoneScreen"
import { Inspector } from "./Inspector"
import { PromptPanel } from "./PromptPanel"
import "../../../styles/canvas.css"

const PALETTE: Array<{ kind: CanvasPartKind; label: string }> = [
  { kind: "topAppBar", label: "Barra sup." },
  { kind: "button", label: "Boton" },
  { kind: "chip", label: "Chip" },
  { kind: "text", label: "Texto" },
  { kind: "card", label: "Tarjeta" },
  { kind: "listItem", label: "Lista" },
  { kind: "switch", label: "Switch" },
  { kind: "textField", label: "Campo" },
  { kind: "searchBar", label: "Buscador" },
  { kind: "divider", label: "Divisor" },
  { kind: "fab", label: "FAB" },
  { kind: "bottomNav", label: "Barra inf." },
]

export function CanvasPanel() {
  const { docs, activeId, selection } = useCanvasStore()
  const [screenId, setScreenId] = useState<string | null>(null)
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [side, setSide] = useState<"inspect" | "prompt">("inspect")
  const [previewStack, setPreviewStack] = useState<string[]>([])

  const doc = useMemo(
    () => docs.find((d) => d.id === activeId) ?? null,
    [docs, activeId],
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

  const openPreview = (id: string) => {
    setPreviewStack((prev) => (prev[prev.length - 1] === id ? prev : [...prev, id]))
  }

  const handleTap = (part: CanvasPart) => {
    if (!part.action) return
    if (part.action.to === BACK_TARGET) {
      setPreviewStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
    } else if (doc.screens.some((s) => s.id === part.action!.to)) {
      openPreview(part.action.to)
    }
  }

  const enterPreview = () => {
    setPreviewStack(screen ? [screen.id] : [])
    setMode("preview")
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
        <button type="button" style={smallBtn} onClick={() => canvasStore.createDoc(`Diseño ${docs.length + 1}`)}>Nuevo</button>
        <button
          type="button" style={smallBtn}
          onClick={() => { if (docs.length > 0) canvasStore.deleteDoc(doc.id) }}
          disabled={docs.length <= 0}
        >
          Borrar
        </button>
        <span style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />
        <button
          type="button" style={{ ...smallBtn, fontWeight: mode === "edit" ? 700 : 400 }}
          onClick={() => setMode("edit")}
        >
          Editar
        </button>
        <button
          type="button" style={{ ...smallBtn, fontWeight: mode === "preview" ? 700 : 400 }}
          onClick={enterPreview}
        >
          Vista previa
        </button>
        {mode === "edit" ? (
          <>
            <button type="button" style={smallBtn} onClick={() => { if (screen) canvasStore.tidyScreen(screen.id) }}>Ordenar</button>
            <button type="button" style={smallBtn} onClick={() => canvasStore.undo()}>Deshacer</button>
            <button type="button" style={smallBtn} onClick={() => canvasStore.redo()}>Rehacer</button>
          </>
        ) : (
          <button
            type="button" style={smallBtn}
            disabled={previewStack.length <= 1}
            onClick={() => setPreviewStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))}
          >
            Atras
          </button>
        )}
      </div>

      {mode === "edit" && screen ? (
        <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
          <div style={{ width: 172, flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Pantallas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {doc.screens.map((s) => (
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
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                <button type="button" style={{ ...smallBtn, flex: 1 }} onClick={() => { const id = canvasStore.addScreen("Nueva", "phone"); if (id) setScreenId(id) }}>+ Móvil</button>
                <button type="button" style={{ ...smallBtn, flex: 1 }} onClick={() => { const id = canvasStore.addScreen("Nueva PC", "desktop"); if (id) setScreenId(id) }}>+ PC</button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Partes</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {PALETTE.map((item) => (
                  <button key={item.kind} type="button" style={smallBtn} onClick={() => canvasStore.addPart(screen.id, item.kind)}>
                    + {item.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, lineHeight: 1.4 }}>
                Tip: clic para agregar, arrastra para mover.
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", minHeight: 0, padding: 4 }}>
            <PhoneScreen
              screen={screen}
              parts={parts}
              mode="edit"
              selectedId={selectedPart?.id ?? null}
              onSelect={(partId) => canvasStore.select(partId ? { screenId: screen.id, partId } : null)}
              onMove={(partId, x, y, commit) => canvasStore.movePart(screen.id, partId, x, y, commit)}
            />
          </div>

          <div style={{ width: 264, flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <button type="button" style={{ ...smallBtn, flex: 1, fontWeight: side === "inspect" ? 700 : 400 }} onClick={() => setSide("inspect")}>Inspeccionar</button>
              <button type="button" style={{ ...smallBtn, flex: 1, fontWeight: side === "prompt" ? 700 : 400 }} onClick={() => setSide("prompt")}>Prompt</button>
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
                    {doc.screens.length > 1 ? (
                      <button type="button" className="btn-danger compact" onClick={() => canvasStore.deleteScreen(screen.id)}>
                        Borrar pantalla
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            ) : (
              <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <PromptPanel doc={doc} />
              </div>
            )}
          </div>
        </div>
      ) : null}

      {mode === "preview" && previewScreen ? (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "center", padding: 4 }}>
          <div key={previewScreen.id} className="m3e-scope">
            <div className="m3e-enter">
              <PhoneScreen
                screen={previewScreen}
                parts={partsOf(doc, previewScreen.id)}
                mode="preview"
                onTap={handleTap}
              />
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", maxWidth: 220, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{previewScreen.name}</div>
            Toca las partes enlazadas para navegar. El boton Atras revierte la transicion.
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
    </div>
  )
}
