import type { CanvasDoc, CanvasPart, CanvasPartKind, CanvasScreen, CanvasTransition } from "../model/canvasTypes"
import { BACK_TARGET, defaultPartHeight, isSquareKind, screenSizeOf } from "../model/canvasTypes"
import { canvasStore } from "../store/canvasStore"

type Props = {
  doc: CanvasDoc
  screen: CanvasScreen
  part: CanvasPart
}

const VARIANTS = ["filled", "tonal", "outlined", "text"] as const
const EDITABLE_KINDS: CanvasPartKind[] = ["button", "extendedFab", "iconButton", "fab"]
const ICON_KINDS: CanvasPartKind[] = ["button", "extendedFab", "iconButton", "fab", "image"]
const TOGGLEABLE: CanvasPartKind[] = ["button", "iconButton", "fab", "extendedFab", "chip", "switch", "checkbox"]
const VALUED: CanvasPartKind[] = ["slider", "linearProgress", "circularProgress"]
const TRANSITIONS: Array<{ key: CanvasTransition; label: string }> = [
  { key: "slide", label: "Deslizar derecha" },
  { key: "slideLeft", label: "Deslizar izquierda" },
  { key: "slideUp", label: "Deslizar arriba" },
  { key: "slideDown", label: "Deslizar abajo" },
  { key: "fade", label: "Fundido" },
  { key: "expand", label: "Expandir" },
  { key: "none", label: "Sin animacion" },
]

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--muted)" }}>
      {label}
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text)",
  fontSize: 13,
  padding: "6px 8px",
  width: "100%",
  boxSizing: "border-box",
}

export function Inspector({ doc, screen, part }: Props) {
  const { w: sw, h: sh } = screenSizeOf(screen)
  const h = defaultPartHeight(part.kind)
  const patch = (p: Partial<CanvasPart>, history = true) => canvasStore.updatePart(screen.id, part.id, p, { history })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
      <div style={{ fontWeight: 700, color: "var(--text)" }}>{part.kind}</div>

      <Row label="Texto">
        <input
          style={inputStyle}
          value={part.label}
          onChange={(e) => patch({ label: e.target.value }, false)}
          onBlur={() => canvasStore.updatePart(screen.id, part.id, { label: part.label })}
        />
      </Row>

      {EDITABLE_KINDS.includes(part.kind) ? (
        <Row label="Estilo">
          <select
            style={inputStyle}
            value={part.variant ?? "filled"}
            onChange={(e) => patch({ variant: e.target.value as CanvasPart["variant"] })}
          >
            {VARIANTS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </Row>
      ) : null}

      <div style={{ display: "flex", gap: 8 }}>
        <Row label="X">
          <input
            style={inputStyle} type="number" value={Math.round(part.x)}
            onChange={(e) => patch({ x: Number(e.target.value) || 0 }, false)}
          />
        </Row>
        <Row label="Y">
          <input
            style={inputStyle} type="number" value={Math.round(part.y)}
            onChange={(e) => patch({ y: Number(e.target.value) || 0 }, false)}
          />
        </Row>
        <Row label="Ancho">
          <input
            style={inputStyle} type="number" value={Math.round(part.w ?? sw)}
            onChange={(e) => patch({ w: Number(e.target.value) || 0 }, false)}
          />
        </Row>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>Lienzo {sw}x{sh} · alto {h}</div>

      {(part.kind === "switch" || part.kind === "checkbox" || part.kind === "radio") ? (
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)" }}>
          <input type="checkbox" checked={!!part.checked} onChange={(e) => patch({ checked: e.target.checked })} />
          {part.kind === "radio" ? "Seleccionado" : "Encendido inicial"}
        </label>
      ) : null}

      {ICON_KINDS.includes(part.kind) ? (
        <Row label="Icono (texto o simbolo)">
          <input
            style={inputStyle}
            value={part.icon ?? ""}
            maxLength={4}
            onChange={(e) => patch({ icon: e.target.value || null }, false)}
            placeholder="+"
          />
        </Row>
      ) : null}

      {TOGGLEABLE.includes(part.kind) ? (
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)" }}>
          <input type="checkbox" checked={!!part.toggle} onChange={(e) => patch({ toggle: e.target.checked || undefined })} />
          Boton toggle (alterna al tocar en vista previa)
        </label>
      ) : null}

      {VALUED.includes(part.kind) ? (
        <Row label={`Valor ${part.value ?? 40}%`}>
          <input
            style={{ width: "100%" }}
            type="range" min={0} max={100}
            value={part.value ?? 40}
            onChange={(e) => patch({ value: Number(e.target.value) }, false)}
          />
        </Row>
      ) : null}

      {isSquareKind(part.kind) ? (
        <Row label={`Tamaño ${part.size ?? ""}`}>
          <input
            style={inputStyle} type="number" min={24} max={400}
            value={part.size ?? ""}
            onChange={(e) => patch({ size: Number(e.target.value) || undefined }, false)}
          />
        </Row>
      ) : null}
      {part.kind === "box" ? (
        <Row label={`Alto ${part.size ?? 220}`}>
          <input
            style={inputStyle} type="number" min={24}
            value={part.size ?? 220}
            onChange={(e) => patch({ size: Number(e.target.value) || 220 }, false)}
          />
        </Row>
      ) : null}

      <Row label="Al tocar abre">
        <select
          style={inputStyle}
          value={part.action?.to ?? ""}
          onChange={(e) => {
            const v = e.target.value
            patch({ action: v ? { to: v, transition: part.action?.transition ?? "slide" } : undefined })
          }}
        >
          <option value="">Nada</option>
          <option value={BACK_TARGET}>Atras</option>
          {doc.screens.filter((s) => s.id !== screen.id).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </Row>

      {part.action ? (
        <Row label="Transicion">
          <select
            style={inputStyle}
            value={part.action.transition ?? "slide"}
            onChange={(e) => patch({ action: { to: part.action!.to, transition: e.target.value as CanvasTransition } })}
          >
            {TRANSITIONS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </Row>
      ) : null}

      <Row label="Nota de comportamiento (va al prompt)">
        <textarea
          style={{ ...inputStyle, minHeight: 56, resize: "vertical" }}
          value={part.note ?? ""}
          onChange={(e) => patch({ note: e.target.value }, false)}
          placeholder="Que hace esta parte…"
        />
      </Row>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn-secondary compact" onClick={() => canvasStore.duplicatePart(screen.id, part.id)}>Duplicar</button>
        <button type="button" className="btn-secondary compact" onClick={() => canvasStore.reorderPart(screen.id, part.id, "front")}>Al frente</button>
        <button type="button" className="btn-secondary compact" onClick={() => canvasStore.reorderPart(screen.id, part.id, "back")}>Al fondo</button>
        <button type="button" className="btn-danger compact" onClick={() => canvasStore.deletePart(screen.id, part.id)}>Borrar</button>
      </div>
    </div>
  )
}
