// Bitacora del relevo entre agentes (team-send) para el panel "Equipo".
// El log lo escribe scripts/team-send.py en <home>/.local/share/opencode/team/
// messages.jsonl (una linea JSON por mensaje). Aca solo se LEE: se resuelve el
// home desde el config global del desktop y se lee el archivo por /shell/fs/read.
//
// OJO: /shell/fs/read corta en 65536 bytes DESDE EL INICIO; por eso el escritor
// recorta el log a las ultimas lineas (scripts/team-send.py MAX_LOG_BYTES).
import { shell } from "../shell"

export type TeamMessage = {
  ts: number
  from: string
  to: string
  text: string
}

const TEAM_LOG_REL = "/.local/share/opencode/team/messages.jsonl"
// El backend responde 404 con {"error":"no es archivo"} (sin la palabra 404).
const MISSING_RE = /404|no encontrado|not found|no es archivo|no existe/i

/** Home del usuario a partir de una ruta que vive debajo de el: corta en el
 *  primer segmento oculto (.config/.opencode/.agents/...) o en AppData.
 *  C:/Users/x/.config/opencode/opencode.json        -> C:/Users/x
 *  C:/Users/x/AppData/Roaming/opencode/config.json  -> C:/Users/x
 *  C:/Users/x/.agents/skills                        -> C:/Users/x */
export function homeFromConfigPath(path: string): string | null {
  const norm = (path ?? "").replace(/\\/g, "/")
  if (!norm) return null
  const parts = norm.split("/").filter(Boolean)
  const idx = parts.findIndex((s) => s.startsWith(".") || s === "AppData")
  if (idx <= 0) return null
  const prefix = norm.startsWith("/") ? "/" : ""
  return prefix + parts.slice(0, idx).join("/")
}

/** Ruta absoluta del log (acepta / y \: el shell normaliza). */
export function teamLogPath(home: string): string {
  return home.replace(/\/+$/, "") + TEAM_LOG_REL
}

/** Parsea JSONL tolerando lineas vacias o corruptas (se ignoran, no rompen el feed). */
export function parseTeamLog(content: string): TeamMessage[] {
  const out: TeamMessage[] = []
  for (const line of (content ?? "").split(/\r?\n/)) {
    const s = line.trim()
    if (!s) continue
    try {
      const o = JSON.parse(s) as Partial<TeamMessage>
      if (typeof o.ts === "number" && typeof o.from === "string" && typeof o.text === "string") {
        out.push({ ts: o.ts, from: o.from, to: typeof o.to === "string" ? o.to : "", text: o.text })
      }
    } catch {
      /* linea corrupta: se saltea */
    }
  }
  return out
}

let cachedLogPath: string | null = null

/** Resuelve la ruta del log (config global + scan roots) y la cachea. */
async function resolveLogPath(): Promise<string> {
  if (cachedLogPath) return cachedLogPath
  const cfg = await shell.opencode.getGlobal()
  const candidates: string[] = []
  const fromConfig = homeFromConfigPath(cfg?.configPath ?? "")
  if (fromConfig) candidates.push(fromConfig)
  for (const root of cfg?.scannedRoots ?? []) {
    const h = homeFromConfigPath(root)
    if (h && !candidates.includes(h)) candidates.push(h)
  }
  if (candidates.length === 0) throw new Error("No se pudo resolver el home del equipo")
  cachedLogPath = teamLogPath(candidates[0])
  return cachedLogPath
}

/** Lee la bitacora completa (mas vieja primero). Log inexistente => []. */
export async function loadTeamLog(): Promise<TeamMessage[]> {
  const path = await resolveLogPath()
  let content = ""
  try {
    const res = await shell.fs.read(path)
    content = res?.content ?? ""
  } catch (e) {
    const msg = String((e as Error)?.message ?? e)
    if (MISSING_RE.test(msg)) return [] // todavia no existe el log: feed vacio
    cachedLogPath = null // ruta stale o error real: re-resolver en el proximo intento
    throw e
  }
  return parseTeamLog(content).sort((a, b) => a.ts - b.ts)
}
