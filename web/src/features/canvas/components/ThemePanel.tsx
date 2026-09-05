import type { CanvasTheme } from "../model/theme"
import { isHexColor, presetList, resolveScheme } from "../model/theme"
import { canvasStore } from "../store/canvasStore"

type Props = {
  theme: CanvasTheme
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

export function ThemePanel({ theme }: Props) {
  const set = (patch: Partial<CanvasTheme>) => canvasStore.setTheme({ ...theme, ...patch })
  const scheme = resolveScheme(theme)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Color</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {presetList().map((p) => {
            const active = theme.seed.toUpperCase() === p.seed.toUpperCase()
            return (
              <button
                key={p.key}
                type="button"
                title={p.label}
                aria-label={p.label}
                onClick={() => set({ seed: p.seed })}
                style={{
                  width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
                  background: p.seed,
                  border: active ? "3px solid var(--primary)" : "1px solid var(--border)",
                  outline: "none",
                }}
              />
            )
          })}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <input
            type="color"
            aria-label="Color semilla personalizado"
            value={/^#[0-9a-f]{6}$/i.test(theme.seed) ? theme.seed : "#6750A4"}
            onChange={(e) => set({ seed: e.target.value.toUpperCase() })}
            style={{ width: 36, height: 28, padding: 0, border: "1px solid var(--border)", borderRadius: 6, background: "var(--surface)", cursor: "pointer" }}
          />
          <input
            aria-label="Hex de semilla"
            style={{ ...inputStyle, fontFamily: "ui-monospace, monospace" }}
            value={theme.seed}
            maxLength={7}
            onChange={(e) => { const v = e.target.value; if (v === "" || v === "#" || isHexColor(v)) set({ seed: v }) }}
            placeholder="#6750A4"
          />
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text)" }}>
        <input type="checkbox" checked={theme.dark} onChange={(e) => set({ dark: e.target.checked })} />
        Modo oscuro
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4, color: "var(--muted)", fontSize: 12 }}>
        Contraste
        <select style={inputStyle} value={theme.contrast} onChange={(e) => set({ contrast: e.target.value as CanvasTheme["contrast"] })}>
          <option value="standard">Estandar</option>
          <option value="medium">Medio</option>
          <option value="high">Alto</option>
        </select>
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4, color: "var(--muted)", fontSize: 12 }}>
        Esquinas
        <select style={inputStyle} value={theme.shape} onChange={(e) => set({ shape: e.target.value as CanvasTheme["shape"] })}>
          <option value="square">Cuadradas</option>
          <option value="rounded">Redondeadas</option>
          <option value="full">Completas</option>
        </select>
      </label>

      <div style={{ display: "flex", gap: 6 }}>
        {[scheme.primary, scheme.secondaryContainer, scheme.tertiaryContainer, scheme.surfaceHighest].map((c) => (
          <span key={c} style={{ flex: 1, height: 28, borderRadius: 6, background: c, border: "1px solid var(--border)" }} />
        ))}
      </div>
    </div>
  )
}
