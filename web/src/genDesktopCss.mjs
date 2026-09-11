// genDesktopCss.mjs — proyección del layout desktop para ventanas angostas.
//
// layout.css encierra el shell de escritorio (rail, sidebar, grid, celdas,
// tab bar, resizers, maximizado, posiciones del rail) en
// @media (min-width: 781px). La app wry marca html[data-desktop="true"] y debe
// conservar ese layout a CUALQUIER ancho: al achicar la ventana el DOM sigue
// siendo el de escritorio, así que caer a los estilos móviles rompe todo.
//
// Este módulo reproyecta esos bloques con prefijo html[data-desktop="true"]
// dentro de @media (max-width: 780px) (donde el @media original ya no aplica)
// y escribe styles/desktop-narrow.css, la última @import de styles.css para
// ganar la cascada. ui-regression.test.mjs verifica que no quede
// desincronizado: si se edita layout.css hay que correr
//   node scripts/gen-desktop-css.mjs
import { readFileSync } from "node:fs"

const LAYOUT_URL = new URL("./styles/layout.css", import.meta.url)
export const DESKTOP_NARROW_URL = new URL("./styles/desktop-narrow.css", import.meta.url)

const BANNER = `/* styles/desktop-narrow.css — GENERADO, no editar a mano.
   Proyecta los bloques @media (min-width: 781px) de layout.css para
   html[data-desktop="true"] dentro de @media (max-width: 780px): la app wry
   conserva el layout de escritorio real cuando la ventana se achica.
   Regenerar: node scripts/gen-desktop-css.mjs
   Fuente de verdad: styles/layout.css */

`

/** Devuelve el índice del '}' que cierra el bloque abierto en openIdx. */
function findBlockEnd(css, openIdx) {
  let depth = 0
  for (let i = openIdx; i < css.length; i++) {
    const ch = css[i]
    if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2)
      i = end === -1 ? css.length : end + 1
      continue
    }
    if (ch === '"' || ch === "'") {
      const quote = ch
      i++
      while (i < css.length && css[i] !== quote) {
        if (css[i] === "\\") i++
        i++
      }
      continue
    }
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return i
    }
  }
  throw new Error("genDesktopCss: bloque CSS sin cerrar")
}

/** Extrae el cuerpo de cada @media (min-width: 781px) exacto de layout.css. */
export function extractDesktopBlocks(css) {
  const marker = "@media (min-width: 781px)"
  const blocks = []
  let i = 0
  for (;;) {
    const at = css.indexOf(marker, i)
    if (at === -1) break
    let open = at + marker.length
    while (open < css.length && /\s/.test(css[open])) open++
    // Solo el bloque exacto: si sigue otro término (and/not) no es nuestro.
    if (css[open] !== "{") {
      i = at + 1
      continue
    }
    const close = findBlockEnd(css, open)
    blocks.push(css.slice(open + 1, close))
    i = close + 1
  }
  return blocks
}

/** Separa una lista de selectores por comas de primer nivel (:not(.a, .b)). */
function splitSelectors(prelude) {
  const out = []
  let depth = 0
  let cur = ""
  for (const ch of prelude) {
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    if (ch === "," && depth === 0) {
      out.push(cur)
      cur = ""
      continue
    }
    cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out
}

function prefixSelector(selector) {
  const s = selector.replace(/\s+/g, " ").trim()
  if (!s) return s
  // :root/html ya son el elemento raíz: se combinan en el mismo compuesto en
  // vez de volverse descendientes imposibles (html[data-desktop] :root).
  if (s.startsWith(":root")) return `html[data-desktop="true"]${s}`
  if (s.startsWith("html")) return `html[data-desktop="true"]${s.slice(4)}`
  return `html[data-desktop="true"] ${s}`
}

/** Reescribe reglas y @media anidados con los selectores prefijados. */
export function prefixRules(body) {
  let out = ""
  let i = 0
  const n = body.length
  while (i < n) {
    if (/\s/.test(body[i])) {
      i++
      continue
    }
    if (body.startsWith("/*", i)) {
      const end = body.indexOf("*/", i + 2)
      i = end === -1 ? n : end + 2
      continue
    }
    let j = i
    let depth = 0
    while (j < n) {
      const ch = body[j]
      if (ch === "(" || ch === "[") depth++
      else if (ch === ")" || ch === "]") depth--
      else if (ch === "{" && depth === 0) break
      j++
    }
    if (j >= n) break
    const prelude = body.slice(i, j).trim()
    const close = findBlockEnd(body, j)
    const inner = body.slice(j + 1, close)
    if (prelude.startsWith("@")) {
      out += `${prelude} {\n${prefixRules(inner)}\n}\n`
    } else {
      const selectors = splitSelectors(prelude).map(prefixSelector).join(", ")
      out += `${selectors} {\n${inner.trim()}\n}\n`
    }
    i = close + 1
  }
  return out
}

/** CSS completo de styles/desktop-narrow.css. */
export function buildDesktopNarrowCss() {
  const css = readFileSync(LAYOUT_URL, "utf8").replace(/\r\n/g, "\n")
  const blocks = extractDesktopBlocks(css)
  const inner = blocks.map(prefixRules).join("\n")
  return (
    BANNER +
    "@media (max-width: 780px) {\n" +
    inner +
    "\n  /* La titlebar frameless (38px) ya la descuenta el body: el shell no debe\n" +
    "     pedir 100dvh completo ni desbordar (titlebar.css). */\n" +
    '  html[data-frameless="true"][data-desktop="true"] .app-shell {\n' +
    "    height: calc(100dvh - 38px);\n" +
    "  }\n" +
    "}\n"
  )
}
