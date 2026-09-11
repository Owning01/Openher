// Regenera src/styles/desktop-narrow.css desde src/styles/layout.css.
// Uso: node scripts/gen-desktop-css.mjs   (o pnpm run css:desktop)
import { writeFileSync } from "node:fs"
import { buildDesktopNarrowCss, DESKTOP_NARROW_URL } from "../src/genDesktopCss.mjs"

const css = buildDesktopNarrowCss()
writeFileSync(DESKTOP_NARROW_URL, css, "utf8")
console.log(`desktop-narrow.css regenerado (${css.length} bytes)`)
