// Design Mode: estilos computados REALES de un elemento (con la cascada ya
// resuelta). Los consume el overlay same-origin (`BrowserVisualOverlay`) y el
// formateo del prompt (`useVisualSelection`). El script inyectado en el
// sub-WebView nativo (`browserOverlayScript.ts`) tiene su propia copia porque
// viaja como string y no puede importar; si se toca la lista, tocar las dos.
export const COMPUTED_STYLE_PROPS = [
  "display",
  "position",
  "width",
  "height",
  "padding",
  "margin",
  "gap",
  "flex-direction",
  "justify-content",
  "align-items",
  "grid-template-columns",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "color",
  "background-color",
  "background-image",
  "border",
  "border-radius",
  "box-shadow",
  "opacity",
  "overflow",
  "z-index",
  "transform",
] as const

const SKIP = new Set(["", "none", "normal", "auto", "static", "visible", "rgba(0, 0, 0, 0)", "transparent"])

/** Devuelve solo las props con informacion, en pares `prop: valor` (máx. 120 chars). */
export function describeComputed(el: Element | null | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!el) return out
  try {
    const cs = getComputedStyle(el)
    for (const prop of COMPUTED_STYLE_PROPS) {
      const value = (cs.getPropertyValue(prop) || "").trim()
      if (SKIP.has(value)) continue
      out[prop] = value.slice(0, 120)
    }
  } catch {
    // sin getComputedStyle (documento cross-origin): se omite
  }
  return out
}
