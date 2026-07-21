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
  return vars
}

export function applyThemeVars(vars: Record<string, string>) {
  const root = document.documentElement
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value)
  }
}
