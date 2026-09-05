export type CanvasPartKind =
  | "topAppBar"
  | "button"
  | "chip"
  | "text"
  | "card"
  | "listItem"
  | "switch"
  | "textField"
  | "divider"
  | "fab"
  | "bottomNav"
  | "searchBar"

export type CanvasVariant = "filled" | "tonal" | "outlined" | "text"

export type CanvasAction = { to: string }

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
  note?: string
  action?: CanvasAction
}

export type ScreenPreset = "phone" | "desktop"

export type CanvasScreen = {
  id: string
  name: string
  preset: ScreenPreset
  note?: string
}

export type CanvasDoc = {
  id: string
  title: string
  brief?: string
  platform: "android" | "web"
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
    case "chip": return "Filtro"
    case "text": return "Encabezado"
    case "card": return "Tarjeta"
    case "listItem": return "Elemento"
    case "switch": return "Ajuste"
    case "textField": return "Etiqueta"
    case "divider": return ""
    case "fab": return ""
    case "bottomNav": return ""
    case "searchBar": return "Buscar"
  }
}

export function defaultPartHeight(kind: CanvasPartKind): number {
  switch (kind) {
    case "topAppBar": return 64
    case "button": return 56
    case "chip": return 32
    case "text": return 40
    case "card": return 188
    case "listItem": return 72
    case "switch": return 32
    case "textField": return 56
    case "divider": return 16
    case "fab": return 56
    case "bottomNav": return 80
    case "searchBar": return 56
  }
}

export function defaultPartWidth(kind: CanvasPartKind, screenW: number): number {
  const content = screenW - SCREEN_MARGIN * 2
  switch (kind) {
    case "topAppBar": return screenW
    case "button": return 200
    case "chip": return 120
    case "text": return content
    case "card": return content
    case "listItem": return content
    case "switch": return 220
    case "textField": return content
    case "divider": return content
    case "fab": return 56
    case "bottomNav": return screenW
    case "searchBar": return content
  }
}

export function makePart(kind: CanvasPartKind, screenW: number, at?: { x: number; y: number }): CanvasPart {
  const fullBleed = kind === "topAppBar" || kind === "bottomNav"
  return {
    id: uid(),
    kind,
    label: defaultLabelFor(kind),
    icon: kind === "fab" || kind === "searchBar" ? "add" : null,
    variant: kind === "button" ? "filled" : kind === "chip" || kind === "textField" ? "outlined" : kind === "fab" ? "tonal" : undefined,
    x: at?.x ?? (fullBleed ? 0 : SCREEN_MARGIN),
    y: at?.y ?? SCREEN_MARGIN,
    w: defaultPartWidth(kind, screenW),
    checked: kind === "switch" ? false : undefined,
  }
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
