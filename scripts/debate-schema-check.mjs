// Valida que el plugin debate-room implementa docs/DEBATE-SCHEMA.json.
// Uso: node scripts/debate-schema-check.mjs [--plugin <ruta>]
// Sale 0 si todo lo exigido por el schema aparece en el fuente; si no, lista
// faltantes y sale 1. Chequeo estático (sin cargar el harness).
import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
const pi = args.indexOf("--plugin")
const pluginPath = pi >= 0 && args[pi + 1]
  ? args[pi + 1]
  : "C:/Users/perca/.config/opencode/plugins/debate-room/index.ts"

const schema = JSON.parse(readFileSync(join(root, "docs", "DEBATE-SCHEMA.json"), "utf8"))
if (!existsSync(pluginPath)) {
  console.error(`plugin no encontrado: ${pluginPath}`)
  process.exit(1)
}
const src = readFileSync(pluginPath, "utf8")
const missing = []
const need = (label, present) => { if (!present) missing.push(label) }

// Envelope
for (const f of ["originSessionID", "seq", "ts", "debateID"]) {
  need(`envelope.${f}`, src.includes(f))
}
// Eventos v1 (dual-emit compat) y v2
for (const name of Object.keys(schema.events_v1_compat)) {
  const short = name.replace("rpc.debate.", "")
  need(`v1:${name}`, src.includes(`"${short}"`) || src.includes(`'${short}'`))
}
for (const name of Object.keys(schema.events_v2)) {
  const short = name.replace("rpc.debate.", "")
  need(`v2:${name}`, src.includes(short))
}
// RPC
for (const name of Object.keys(schema.rpc)) {
  const short = name.split("/")[1]
  need(`rpc:${name}`, src.includes(short))
}
// Config defaults
for (const key of Object.keys(schema.config_defaults)) {
  need(`config:${key}`, src.includes(key))
}
// Semántica del loop
for (const marker of ["paused", "deadline", "kind", "user", "similarity", "guards", "labMode"]) {
  need(`loop:${marker}`, src.includes(marker))
}

if (missing.length) {
  console.error("debate-schema-check: FALTANTES")
  for (const m of missing) console.error(`  - ${m}`)
  process.exit(1)
}
console.log("debate-schema-check: OK (schema cubierto por el plugin)")
