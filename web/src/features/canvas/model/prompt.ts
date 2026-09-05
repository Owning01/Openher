import type { CanvasDoc, CanvasPart, CanvasScreen, CanvasTransition } from "./canvasTypes"
import { BACK_TARGET, partsOf } from "./canvasTypes"
import { normalizeTheme } from "./theme"

export type PromptLang = "es" | "en"
export type PromptPlatform = "android" | "web"

function transitionEs(t?: CanvasTransition): string {
  switch (t ?? "slide") {
    case "slide": return "deslizando desde la derecha"
    case "slideLeft": return "deslizando desde la izquierda"
    case "slideUp": return "deslizando desde abajo"
    case "slideDown": return "deslizando desde arriba"
    case "fade": return "con fundido"
    case "expand": return "expandiendo"
    case "none": return "sin animacion"
  }
}

function transitionEn(t?: CanvasTransition): string {
  switch (t ?? "slide") {
    case "slide": return "sliding from the right"
    case "slideLeft": return "sliding from the left"
    case "slideUp": return "sliding from the bottom"
    case "slideDown": return "sliding from the top"
    case "fade": return "with a fade"
    case "expand": return "expanding"
    case "none": return "with no animation"
  }
}

function partEs(p: CanvasPart): string {
  const q = (s: string) => (s.trim() ? `"${s.trim()}"` : "sin etiqueta")
  switch (p.kind) {
    case "topAppBar": return `barra superior con titulo ${q(p.label)}`
    case "button": return `boton ${p.variant ?? "filled"} ${q(p.label)}${p.toggle ? " (toggle)" : ""}`
    case "iconButton": return `boton de icono ${p.variant ?? "tonal"}`
    case "extendedFab": return `boton flotante extendido ${q(p.label)}`
    case "chip": return `chip ${q(p.label)}`
    case "text": return `texto ${q(p.label)}`
    case "card": return `tarjeta con encabezado ${q(p.label)}`
    case "listItem": return `item de lista ${q(p.label)}`
    case "switch": return `switch ${q(p.label)} (inicial ${p.checked ? "on" : "off"})`
    case "checkbox": return `checkbox ${q(p.label)} (inicial ${p.checked ? "marcado" : "sin marcar"})`
    case "radio": return `radio ${q(p.label)} (inicial ${p.checked ? "elegido" : "sin elegir"})`
    case "slider": return `slider (valor inicial ${p.value ?? 40}%)`
    case "textField": return `campo de texto con etiqueta ${q(p.label)}`
    case "divider": return "divisor"
    case "fab": return "boton flotante (FAB)"
    case "bottomNav": return "barra de navegacion inferior"
    case "searchBar": return `buscador con placeholder ${q(p.label)}`
    case "image": return "imagen (placeholder)"
    case "box": return "contenedor de fondo"
    case "badge": return p.label.trim() ? `insignia con texto ${q(p.label)}` : "insignia de punto"
    case "dialog": return `dialogo con titulo ${q(p.label)} y botones Cancelar/Aceptar`
    case "snackbar": return `snackbar ${q(p.label)} con accion Deshacer`
    case "linearProgress": return p.value === undefined ? "barra de progreso indeterminada" : `barra de progreso (${p.value}%)`
    case "circularProgress": return p.value === undefined ? "progreso circular indeterminado" : `progreso circular (${p.value}%)`
    case "loadingIndicator": return "indicador de carga expresivo con morphing de forma"
  }
}

function partEn(p: CanvasPart): string {
  const q = (s: string) => (s.trim() ? `"${s.trim()}"` : "unlabeled")
  switch (p.kind) {
    case "topAppBar": return `top app bar titled ${q(p.label)}`
    case "button": return `${p.variant ?? "filled"} button ${q(p.label)}${p.toggle ? " (toggle)" : ""}`
    case "iconButton": return `${p.variant ?? "tonal"} icon button`
    case "extendedFab": return `extended FAB ${q(p.label)}`
    case "chip": return `chip ${q(p.label)}`
    case "text": return `text ${q(p.label)}`
    case "card": return `card with headline ${q(p.label)}`
    case "listItem": return `list item ${q(p.label)}`
    case "switch": return `switch ${q(p.label)} (initially ${p.checked ? "on" : "off"})`
    case "checkbox": return `checkbox ${q(p.label)} (initially ${p.checked ? "checked" : "unchecked"})`
    case "radio": return `radio button ${q(p.label)} (initially ${p.checked ? "selected" : "unselected"})`
    case "slider": return `slider (initial value ${p.value ?? 40}%)`
    case "textField": return `text field labeled ${q(p.label)}`
    case "divider": return "a divider"
    case "fab": return "a floating action button (FAB)"
    case "bottomNav": return "a bottom navigation bar"
    case "searchBar": return `a search bar with placeholder ${q(p.label)}`
    case "image": return "an image placeholder"
    case "box": return "a background container box"
    case "badge": return p.label.trim() ? `a badge reading ${q(p.label)}` : "a dot badge"
    case "dialog": return `a dialog titled ${q(p.label)} with Cancel/OK buttons`
    case "snackbar": return `a snackbar ${q(p.label)} with an Undo action`
    case "linearProgress": return p.value === undefined ? "an indeterminate linear progress bar" : `a linear progress bar (${p.value}%)`
    case "circularProgress": return p.value === undefined ? "an indeterminate circular progress indicator" : `a circular progress indicator (${p.value}%)`
    case "loadingIndicator": return "an expressive shape-morphing loading indicator"
  }
}

function actionEs(p: CanvasPart, screens: CanvasScreen[]): string | null {
  if (!p.action) return null
  if (p.action.to === BACK_TARGET) return `al tocar vuelve a la pantalla anterior ${transitionEs(p.action.transition)}`
  const t = screens.find((s) => s.id === p.action!.to)
  if (!t) return null
  return `al tocar abre "${t.name}" ${transitionEs(p.action.transition)}`
}

function actionEn(p: CanvasPart, screens: CanvasScreen[]): string | null {
  if (!p.action) return null
  if (p.action.to === BACK_TARGET) return `tapping goes back to the previous screen ${transitionEn(p.action.transition)}`
  const t = screens.find((s) => s.id === p.action!.to)
  if (!t) return null
  return `tapping opens "${t.name}" ${transitionEn(p.action.transition)}`
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
  const theme = normalizeTheme(doc.theme)
  const shapeEs = theme.shape === "square" ? "esquinas cuadradas" : theme.shape === "full" ? "esquinas completamente redondas" : "esquinas redondeadas"
  const shapeEn = theme.shape === "square" ? "square corners" : theme.shape === "full" ? "fully rounded corners" : "rounded corners"
  lines.push(lang === "es"
    ? `Tema: color semilla ${theme.seed}${theme.dark ? ", modo oscuro" : ""}, ${shapeEs}.`
    : `Theme: seed color ${theme.seed}${theme.dark ? ", dark mode" : ""}, ${shapeEn}.`)
  lines.push(lang === "es"
    ? "Usa componentes Material 3 (botones 56dp, esquinas expresivas, FAB a 16dp del borde, listas con 3dp entre items)."
    : "Use Material 3 components (56dp buttons, expressive corners, FAB 16dp from edges, 3dp gaps in lists).")
  return lines.join("\n").trim()
}
