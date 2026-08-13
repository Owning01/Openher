// Auditoría de contraste WCAG 2.2 de los temas (public/themes/*.json).
// Chequea los pares fg/bg críticos en modo dark y light.
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { resolveTheme, themeToCSSVars, contrast } from "./utils/resolveTheme.ts"

const THEMES_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "../public/themes")
const LARGE_TEXT = 3 // 3:1 para texto grande/decorativo (WCAG 1.4.3 AA)

// Pares (fg slot, bg slot, requerido) contra las vars CSS ya clampeadas:
// valida el RESULTADO FINAL que ve el usuario (themeToCSSVars aplica el clamp).
const PAIRS = [
  ["--text", "--bg", 4.5],
  ["--text", "--surface", 4.5],
  ["--muted", "--bg", 4.5],
  ["--muted-strong", "--bg", 4.5],
  ["--primary", "--bg", 3],
  ["--md-text", "--bg", 4.5],
  ["--md-heading", "--bg", 4.5],
  ["--md-link-text", "--bg", 4.5],
  ["--md-code", "--surface-strong", 4.5],
  ["--md-quote", "--bg", 4.5],
  ["--code-comment", "--surface-strong", 4.5],
  ["--code-keyword", "--surface-strong", 4.5],
  ["--code-function", "--surface-strong", 4.5],
  ["--code-string", "--surface-strong", 4.5],
  ["--warning", "--bg", 3],
  ["--success", "--bg", 3],
  ["--danger", "--bg", 3],
  ["--info", "--bg", 3],
]

const files = readdirSync(THEMES_DIR).filter((f) => f.endsWith(".json")).sort()
let failures = 0
for (const file of files) {
  const json = JSON.parse(readFileSync(join(THEMES_DIR, file), "utf8"))
  for (const mode of ["dark", "light"]) {
    const r = resolveTheme(json, mode)
    const vars = themeToCSSVars(r)
    const issues = []
    for (const [fg, bg, min] of PAIRS) {
      const a = vars[fg], b = vars[bg]
      if (!a || !b || a === "#000000" || b === "#000000") continue
      const c = contrast(a, b)
      if (c < min) issues.push(`${fg}/${bg} ${c.toFixed(2)} (min ${min})`)
    }
    if (issues.length > 0) {
      failures++
      console.log(`\n[FAIL] ${file} (${mode})`)
      for (const i of issues) console.log(`  ✗ ${i}`)
    }
  }
}
console.log(`\n${files.length} temas auditados (dark+light) con clamp aplicado. Temas con fallos restantes: ${failures}`)
process.exit(failures > 0 ? 1 : 0)
