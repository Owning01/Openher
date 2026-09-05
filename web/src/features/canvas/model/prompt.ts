import type { CanvasDoc, CanvasPart, CanvasScreen } from "./canvasTypes"
import { BACK_TARGET, partsOf } from "./canvasTypes"

export type PromptLang = "es" | "en"
export type PromptPlatform = "android" | "web"

function partEs(p: CanvasPart): string {
  const q = (s: string) => (s.trim() ? `"${s.trim()}"` : "sin etiqueta")
  switch (p.kind) {
    case "topAppBar": return `barra superior con titulo ${q(p.label)}`
    case "button": return `boton ${p.variant ?? "filled"} ${q(p.label)}`
    case "chip": return `chip ${q(p.label)}`
    case "text": return `texto ${q(p.label)}`
    case "card": return `tarjeta con encabezado ${q(p.label)}`
    case "listItem": return `item de lista ${q(p.label)}`
    case "switch": return `switch ${q(p.label)} (inicial ${p.checked ? "on" : "off"})`
    case "textField": return `campo de texto con etiqueta ${q(p.label)}`
    case "divider": return "divisor"
    case "fab": return "boton flotante (FAB)"
    case "bottomNav": return "barra de navegacion inferior"
    case "searchBar": return `buscador con placeholder ${q(p.label)}`
  }
}

function partEn(p: CanvasPart): string {
  const q = (s: string) => (s.trim() ? `"${s.trim()}"` : "unlabeled")
  switch (p.kind) {
    case "topAppBar": return `top app bar titled ${q(p.label)}`
    case "button": return `${p.variant ?? "filled"} button ${q(p.label)}`
    case "chip": return `chip ${q(p.label)}`
    case "text": return `text ${q(p.label)}`
    case "card": return `card with headline ${q(p.label)}`
    case "listItem": return `list item ${q(p.label)}`
    case "switch": return `switch ${q(p.label)} (initially ${p.checked ? "on" : "off"})`
    case "textField": return `text field labeled ${q(p.label)}`
    case "divider": return "a divider"
    case "fab": return "a floating action button (FAB)"
    case "bottomNav": return "a bottom navigation bar"
    case "searchBar": return `a search bar with placeholder ${q(p.label)}`
  }
}

function actionEs(p: CanvasPart, screens: CanvasScreen[]): string | null {
  if (!p.action) return null
  if (p.action.to === BACK_TARGET) return "al tocar vuelve a la pantalla anterior"
  const t = screens.find((s) => s.id === p.action!.to)
  if (!t) return null
  return `al tocar abre "${t.name}"`
}

function actionEn(p: CanvasPart, screens: CanvasScreen[]): string | null {
  if (!p.action) return null
  if (p.action.to === BACK_TARGET) return "tapping goes back to the previous screen"
  const t = screens.find((s) => s.id === p.action!.to)
  if (!t) return null
  return `tapping opens "${t.name}"`
}

function describeParts(parts: CanvasPart[], screens: CanvasScreen[], lang: PromptLang): string[] {
  const ordered = [...parts].sort((a, b) => a.y - b.y || a.x - b.x)
  return ordered.map((p) => {
    const base = lang === "es" ? partEs(p) : partEn(p)
    const act = lang === "es" ? actionEs(p, screens) : actionEn(p, screens)
    const note = p.note?.trim() ? (lang === "es" ? ` Nota: ${p.note.trim()}` : ` Note: ${p.note.trim()}`) : ""
    return `- ${base[0].toUpperCase()}${base.slice(1)}${act ? ` (${act})` : ""}.${note}`
  })
}

export function generatePrompt(
  doc: CanvasDoc,
  opts?: { lang?: PromptLang; platform?: PromptPlatform; screenId?: string },
): string {
  const lang: PromptLang = opts?.lang ?? "es"
  const platform: PromptPlatform = opts?.platform ?? doc.platform ?? "android"
  const screens = opts?.screenId ? doc.screens.filter((s) => s.id === opts.screenId) : doc.screens
  const stack = platform === "web"
    ? (lang === "es" ? "React + Tailwind" : "React + Tailwind")
    : (lang === "es" ? "Jetpack Compose con Material 3 Expressive" : "Jetpack Compose with Material 3 Expressive")
  const head = lang === "es"
    ? `Construi la app "${doc.title}" con ${stack}. Screens:`
    : `Build the "${doc.title}" app with ${stack}. Screens:`
  const lines = [head, ""]
  for (const s of screens) {
    const size = s.preset === "desktop"
      ? (lang === "es" ? "layout desktop 1280x800" : "1280x800 desktop layout")
      : (lang === "es" ? "layout movil" : "mobile layout")
    lines.push(lang === "es" ? `Pantalla "${s.name}" (${size}):` : `Screen "${s.name}" (${size}):`)
    const ps = describeParts(partsOf(doc, s.id), doc.screens, lang)
    if (ps.length === 0) lines.push(lang === "es" ? "- (vacia)" : "- (empty)")
    else lines.push(...ps)
    if (s.note?.trim()) lines.push(lang === "es" ? `Descripcion: ${s.note.trim()}` : `Description: ${s.note.trim()}`)
    lines.push("")
  }
  if (doc.brief?.trim()) lines.push(lang === "es" ? `Contexto: ${doc.brief.trim()}` : `Context: ${doc.brief.trim()}`)
  lines.push(lang === "es"
    ? "Usa componentes Material 3 (botones 56dp, esquinas expresivas, FAB a 16dp del borde, listas con 3dp entre items)."
    : "Use Material 3 components (56dp buttons, expressive corners, FAB 16dp from edges, 3dp gaps in lists).")
  return lines.join("\n").trim()
}
