import type { CanvasTheme } from "./theme"

export type CanvasPartKind =
  | "topAppBar"
  | "button"
  | "iconButton"
  | "extendedFab"
  | "chip"
  | "text"
  | "card"
  | "listItem"
  | "switch"
  | "checkbox"
  | "radio"
  | "slider"
  | "textField"
  | "divider"
  | "fab"
  | "bottomNav"
  | "searchBar"
  | "image"
  | "box"
  | "badge"
  | "dialog"
  | "snackbar"
  | "linearProgress"
  | "circularProgress"
  | "loadingIndicator"

export type CanvasVariant = "filled" | "tonal" | "outlined" | "text"

export type CanvasTransition = "slide" | "slideLeft" | "slideUp" | "slideDown" | "fade" | "expand" | "none"

export type CanvasAction = { to: string; transition?: CanvasTransition }

export const BACK_TARGET = "back"

export type CanvasPart = {
  id: string
  kind: CanvasPartKind
  label: string
  icon?: string | null
  variant?: CanvasVariant
  x: number
  y: number
  w?: number
  checked?: boolean
  /** 0-100 para slider y progresos determinados */
  value?: number
  /** lado para iconButton/fab/imagen/progreso circular/loading */
  size?: number
  /** boton toggle: en preview alterna al tocar */
  toggle?: boolean
  note?: string
  action?: CanvasAction
}

export type ScreenPreset = "phone" | "desktop"

export type SwipeDir = "left" | "right" | "up" | "down"

export type CanvasScreen = {
  id: string
  name: string
  preset: ScreenPreset
  note?: string
  swipe?: Partial<Record<SwipeDir, string>>
}

export type CanvasDoc = {
  id: string
  title: string
  brief?: string
  platform: "android" | "web"
  theme: CanvasTheme
  screens: CanvasScreen[]
  parts: Record<string, CanvasPart[]>
  updatedAt: number
}

export const PHONE_W = 412
export const PHONE_H = 892
export const DESKTOP_W = 1280
export const DESKTOP_H = 800
export const SCREEN_MARGIN = 16

export function screenSizeOf(s: CanvasScreen): { w: number; h: number } {
  return s.preset === "desktop" ? { w: DESKTOP_W, h: DESKTOP_H } : { w: PHONE_W, h: PHONE_H }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function defaultLabelFor(kind: CanvasPartKind): string {
  switch (kind) {
    case "topAppBar": return "Titulo"
    case "button": return "Aceptar"
    case "iconButton": return ""
    case "extendedFab": return "Crear"
    case "chip": return "Filtro"
    case "text": return "Encabezado"
    case "card": return "Tarjeta"
    case "listItem": return "Elemento"
    case "switch": return "Ajuste"
    case "checkbox": return "Acepto"
    case "radio": return "Opcion"
    case "slider": return ""
    case "textField": return "Etiqueta"
    case "divider": return ""
    case "fab": return ""
    case "bottomNav": return ""
    case "searchBar": return "Buscar"
    case "image": return ""
    case "box": return ""
    case "badge": return "3"
    case "dialog": return "Confirmar"
    case "snackbar": return "Guardado"
    case "linearProgress": return ""
    case "circularProgress": return ""
    case "loadingIndicator": return ""
  }
}

export function defaultPartHeight(kind: CanvasPartKind): number {
  switch (kind) {
    case "topAppBar": return 64
    case "button": return 56
    case "iconButton": return 48
    case "extendedFab": return 56
    case "chip": return 32
    case "text": return 40
    case "card": return 188
    case "listItem": return 72
    case "switch": return 32
    case "checkbox": return 40
    case "radio": return 40
    case "slider": return 44
    case "textField": return 56
    case "divider": return 16
    case "fab": return 56
    case "bottomNav": return 80
    case "searchBar": return 56
    case "image": return 200
    case "box": return 220
    case "badge": return 16
    case "dialog": return 220
    case "snackbar": return 48
    case "linearProgress": return 24
    case "circularProgress": return 48
    case "loadingIndicator": return 48
  }
}

export function defaultPartWidth(kind: CanvasPartKind, screenW: number): number {
  const content = screenW - SCREEN_MARGIN * 2
  switch (kind) {
    case "topAppBar": return screenW
    case "button": return 200
    case "iconButton": return 48
    case "extendedFab": return 200
    case "chip": return 120
    case "text": return content
    case "card": return content
    case "listItem": return content
    case "switch": return 220
    case "checkbox": return 220
    case "radio": return 220
    case "slider": return content
    case "textField": return content
    case "divider": return content
    case "fab": return 56
    case "bottomNav": return screenW
    case "searchBar": return content
    case "image": return 200
    case "box": return content
    case "badge": return 48
    case "dialog": return 312
    case "snackbar": return 344
    case "linearProgress": return content
    case "circularProgress": return 48
    case "loadingIndicator": return 48
  }
}

const SQUARE_KINDS: CanvasPartKind[] = ["iconButton", "fab", "image", "circularProgress", "loadingIndicator"]

export function defaultSquareSize(kind: CanvasPartKind): number {
  switch (kind) {
    case "iconButton": return 48
    case "fab": return 56
    case "image": return 200
    case "circularProgress": return 48
    case "loadingIndicator": return 48
    default: return 48
  }
}

export function isSquareKind(kind: CanvasPartKind): boolean {
  return SQUARE_KINDS.includes(kind)
}

export function makePart(kind: CanvasPartKind, screenW: number, at?: { x: number; y: number }): CanvasPart {
  const fullBleed = kind === "topAppBar" || kind === "bottomNav"
  const part: CanvasPart = {
    id: uid(),
    kind,
    label: defaultLabelFor(kind),
    icon: kind === "fab" || kind === "searchBar" || kind === "iconButton" || kind === "extendedFab" ? "add" : null,
    variant: kind === "button" || kind === "extendedFab" ? "filled" : kind === "chip" || kind === "textField" ? "outlined" : kind === "fab" || kind === "iconButton" ? "tonal" : undefined,
    x: at?.x ?? (fullBleed ? 0 : SCREEN_MARGIN),
    y: at?.y ?? SCREEN_MARGIN,
    w: defaultPartWidth(kind, screenW),
    checked: kind === "switch" || kind === "checkbox" ? false : kind === "radio" ? true : undefined,
  }
  if (isSquareKind(kind)) part.size = defaultSquareSize(kind)
  if (kind === "slider" || kind === "linearProgress" || kind === "circularProgress") part.value = 40
  if (kind === "box") {
    part.size = 220
  }
  return part
}

export function makeScreen(name: string, preset: ScreenPreset = "phone"): CanvasScreen {
  return { id: uid(), name, preset }
}

export function makeDoc(title: string): CanvasDoc {
  const home = makeScreen("Inicio", "phone")
  return {
    id: uid(),
    title,
    platform: "android",
    theme: { seed: "#6750A4", dark: false, contrast: "standard", shape: "rounded" },
    screens: [home],
    parts: { [home.id]: [] },
    updatedAt: Date.now(),
  }
}

export function partsOf(doc: CanvasDoc, screenId: string): CanvasPart[] {
  return doc.parts[screenId] ?? []
}

export function isValidDoc(v: unknown): v is CanvasDoc {
  if (typeof v !== "object" || v === null) return false
  const d = v as Record<string, unknown>
  return typeof d.id === "string"
    && typeof d.title === "string"
    && Array.isArray(d.screens)
    && typeof d.parts === "object"
    && d.parts !== null
}

/** Migra docs guardados por la v1 (sin tema/transiciones) al modelo actual. */
export function normalizeDoc(raw: CanvasDoc): CanvasDoc {
  const theme = raw.theme?.seed
    ? raw.theme
    : { seed: "#6750A4", dark: false, contrast: "standard" as const, shape: "rounded" as const }
  const parts: Record<string, CanvasPart[]> = {}
  for (const [sid, list] of Object.entries(raw.parts ?? {})) {
    parts[sid] = (Array.isArray(list) ? list : []).map((p) => ({
      ...p,
      action: p.action ? { to: p.action.to, transition: p.action.transition ?? "slide" as const } : undefined,
    }))
  }
  return { ...raw, theme, parts }
}
