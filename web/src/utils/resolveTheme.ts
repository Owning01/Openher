const CSS_MAP: Record<string, string> = {
  background: "--bg",
  backgroundPanel: "--surface",
  backgroundElement: "--surface-strong",
  border: "--border",
  borderActive: "--border-strong",
  borderSubtle: "--border-subtle",
  text: "--text",
  textMuted: "--muted",
  primary: "--primary",
  secondary: "--secondary",
  accent: "--accent",
  warning: "--warning",
  success: "--success",
  error: "--danger",
  info: "--info",
  markdownText: "--md-text",
  markdownHeading: "--md-heading",
  markdownLink: "--md-link",
  markdownLinkText: "--md-link-text",
  markdownCode: "--md-code",
  markdownCodeBlock: "--md-code-block",
  markdownBlockQuote: "--md-quote",
  markdownEmph: "--md-emph",
  markdownStrong: "--md-strong",
  markdownHorizontalRule: "--md-hr",
  markdownListItem: "--md-list-item",
  markdownListEnumeration: "--md-list-num",
  markdownImage: "--md-image",
  markdownImageText: "--md-image-text",
  syntaxComment: "--code-comment",
  syntaxKeyword: "--code-keyword",
  syntaxFunction: "--code-function",
  syntaxString: "--code-string",
  syntaxNumber: "--code-number",
  syntaxVariable: "--code-builtin",
  syntaxType: "--code-attr",
  syntaxOperator: "--code-attr",
  syntaxPunctuation: "--code-text",
}

type ThemeJson = {
  defs?: Record<string, string>
  theme: Record<string, string | { dark: string; light: string }>
}

function resolveColor(value: unknown, defs: Record<string, string>, theme: Record<string, unknown>, chain: string[]): string {
  if (typeof value === "string") {
    if (value.startsWith("#")) return value
    if (chain.includes(value)) return "#000000"
    const next = defs[value] ?? theme[value]
    if (next !== undefined) return resolveColor(next, defs, theme, [...chain, value])
    return value
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>
    return resolveColor(obj["dark"] ?? obj["light"], defs, theme, chain)
  }
  return "#000000"
}

export function resolveTheme(json: ThemeJson, mode: "dark" | "light"): Record<string, string> {
  const defs = json.defs ?? {}
  const theme = json.theme
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(theme)) {
    if (key === "thinkingOpacity" || key === "selectedListItemText" || key === "backgroundMenu") continue
    if (typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>
      const modeVal = obj[mode]
      if (modeVal !== undefined) {
        result[key] = resolveColor(modeVal, defs, theme, [])
      } else {
        const fallback = obj["dark"] ?? obj["light"]
        if (fallback !== undefined) result[key] = resolveColor(fallback, defs, theme, [])
      }
    } else if (typeof value === "string") {
      result[key] = resolveColor(value, defs, theme, [])
    }
  }
  return result
}

export function themeToCSSVars(resolved: Record<string, string>): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const [slot, hex] of Object.entries(resolved)) {
    const cssName = CSS_MAP[slot]
    if (cssName) vars[cssName] = hex
  }
  vars["--surface-subtle"] = resolved["backgroundPanel"] ?? resolved["background"] ?? "#000"
  vars["--muted-strong"] = resolved["textMuted"] ?? "#666"
  vars["--thinking-header"] = resolved["warning"] ?? "#f5a742"
  vars["--thinking-text"] = resolved["textMuted"] ?? "#808080"
  vars["--md-heading"] ??= resolved["accent"] ?? resolved["primary"] ?? "#888"
  vars["--md-link"] ??= resolved["primary"] ?? "#888"
  vars["--md-link-text"] ??= resolved["info"] ?? resolved["primary"] ?? "#888"
  vars["--md-code"] ??= resolved["success"] ?? "#888"
  vars["--md-code-block"] ??= resolved["text"] ?? "#eee"
  vars["--md-quote"] ??= resolved["textMuted"] ?? "#888"
  vars["--md-emph"] ??= resolved["warning"] ?? "#888"
  vars["--md-strong"] ??= resolved["primary"] ?? "#888"
  vars["--md-hr"] ??= resolved["textMuted"] ?? "#888"
  vars["--md-list-item"] ??= resolved["primary"] ?? "#888"
  vars["--md-list-num"] ??= resolved["info"] ?? resolved["primary"] ?? "#888"
  vars["--md-image"] ??= resolved["primary"] ?? "#888"
  vars["--md-image-text"] ??= resolved["info"] ?? resolved["primary"] ?? "#888"

  // Clamp WCAG: los colores de texto/acento que no llegan al contraste mínimo
  // contra su fondo real se mezclan hacia negro/blanco (preserva el matiz del
  // tema, ajusta solo la luminosidad). El texto sobre botones usa --on-primary
  // (var propia) — clampear --primary no afecta el contraste del botón.
  const bg = vars["--bg"] ?? "#000"
  const surface = vars["--surface-strong"] ?? bg
  // El texto principal se clamp contra el fondo que le da PEOR contraste.
  const textFg = vars["--text"] ?? "#fff"
  const textBg = contrast(textFg, bg) <= contrast(textFg, surface) ? bg : surface
  clampVar(vars, "--text", textBg, 4.5)
  clampVar(vars, "--md-text", textBg, 4.5)
  clampVar(vars, "--muted", bg, 4.5)
  clampVar(vars, "--muted-strong", bg, 4.5)
  clampVar(vars, "--primary", bg, 3)
  clampVar(vars, "--warning", bg, 3)
  clampVar(vars, "--success", bg, 3)
  clampVar(vars, "--danger", bg, 3)
  clampVar(vars, "--info", bg, 3)
  clampVar(vars, "--md-heading", bg, 4.5)
  clampVar(vars, "--md-link", bg, 3)
  clampVar(vars, "--md-link-text", bg, 4.5)
  clampVar(vars, "--md-quote", bg, 4.5)
  clampVar(vars, "--md-emph", bg, 4.5)
  clampVar(vars, "--md-strong", bg, 4.5)
  clampVar(vars, "--md-list-item", bg, 4.5)
  clampVar(vars, "--md-list-num", bg, 4.5)
  clampVar(vars, "--md-image", bg, 3)
  clampVar(vars, "--md-image-text", bg, 4.5)
  // Código: el fondo real de inline/bloques es --surface-strong.
  clampVar(vars, "--md-code", surface, 4.5)
  for (const name of ["--code-comment", "--code-keyword", "--code-function", "--code-string", "--code-builtin", "--code-attr", "--code-text"]) {
    clampVar(vars, name, surface, 4.5)
  }
  return vars
}

function clampVar(vars: Record<string, string>, name: string, bg: string, min: number) {
  const fg = vars[name]
  if (!fg || !/^#[0-9a-fA-F]{3,8}$/.test(fg)) return
  const fixed = ensureContrast(fg, bg, min)
  if (fixed !== fg) vars[name] = fixed
}

// Mezcla `fg` hacia negro/blanco hasta alcanzar contraste >= min contra `bg`.
// Búsqueda por muestreo (20 pasos x 2 direcciones): barata, corre 1 vez por tema.
function ensureContrast(fg: string, bg: string, min: number): string {
  if (contrast(fg, bg) >= min) return fg
  for (let i = 1; i <= 20; i++) {
    const t = i / 20
    for (const target of ["#000000", "#ffffff"]) {
      const mixed = mixHex(fg, target, t)
      if (contrast(mixed, bg) >= min) return mixed
    }
  }
  return fg
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "")
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")
  return `#${c(r)}${c(g)}${c(b)}`
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t)
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

export function applyThemeVars(vars: Record<string, string>) {
  const root = document.documentElement
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value)
  }
}
