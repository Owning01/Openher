// Fuente unica de verdad de nombres/alias de herramientas (U8/U18).
//
// Antes cada superficie repetia su propia lista de alias:
//   - ToolPart.shortToolLabel / toolSvgIcon / FILE_TOOLS / isShellTool
//   - MessageBubble.toolShortLabel
//   - toolMeta.detectToolName / isTaskTool / isQuestionTool
//   - subagentBackground.isTaskToolPart
//   - useSSE / useSSEHandler (chequeos de "part de subagente")
// Aca viven el mapa de alias, las categorias, los verbos y la deteccion de la
// tarjeta de subagente. Los labels visibles NO cambian: son los mismos valores
// que devolvian las funciones reemplazadas.

// --- Deteccion desde texto XML (protocolo v1) -------------------------------

/** Nombre de tool embebido en `<invoke name="...">` (v1). */
export function detectToolName(text: string): string | null {
  const m = text.match(/<invoke\s+name="([^"]+)"/i)
  return m ? m[1] : null
}

/** `true` si el texto es una invocacion del tool `task` (case-insensitive). */
export function isTaskTool(text: string): boolean {
  return /<invoke\s+name="task"/i.test(text)
}

/** `true` si el texto es una invocacion del tool `question` (case-insensitive). */
export function isQuestionTool(text: string): boolean {
  return /<invoke\s+name="question"/i.test(text)
}

// --- Alias / canonizacion ----------------------------------------------------

// Mapa alias -> id canonico. Lookup EXACTO (case-sensitive): igual que las
// listas que reemplaza, que comparaban con `===`. Un nombre desconocido se
// devuelve tal cual.
const CANONICAL_ALIASES: Record<string, string> = {
  bash: "bash", execute: "bash", shell: "bash", terminal: "bash",
  read: "read", readFile: "read",
  write: "write", writeFile: "write",
  edit: "edit", apply_patch: "edit", patch: "edit",
  grep: "search", glob: "search", search: "search",
  websearch: "web", webfetch: "web", browse: "web",
  task: "task", subagent: "task",
}

/** Id canonico de un tool (alias -> representante). Desconocido: sin cambios. */
export function canonicalTool(tool?: string | null): string {
  const t = (tool ?? "").trim()
  if (!t) return ""
  return CANONICAL_ALIASES[t] ?? t
}

const MCP_RE = /mcp__([^_]+)__(.+)/

/** Partes de un nombre MCP (`mcp__servidor__herramienta`), o `null`. */
export function mcpToolParts(tool?: string | null): { server: string; name: string } | null {
  if (!tool) return null
  const m = tool.match(MCP_RE)
  return m ? { server: m[1], name: m[2] } : null
}

// --- Labels visibles ---------------------------------------------------------

const SHORT_LABEL: Record<string, string> = {
  bash: "SHELL", read: "READ", write: "WRITE", edit: "EDIT", search: "SEARCH", web: "BROWSER",
}

/**
 * Etiqueta corta en mayusculas de ToolPart (verbos/fallbacks). Identica a la
 * vieja `ToolPart.shortToolLabel`.
 */
export function toolShortLabel(tool: string): string {
  const canonical = canonicalTool(tool)
  if (SHORT_LABEL[canonical]) return SHORT_LABEL[canonical]
  const mcp = mcpToolParts(tool)
  if (mcp) return `${mcp.server.toUpperCase()} · ${mcp.name}`
  return tool.toUpperCase()
}

/**
 * Etiqueta resumida de MessageBubble (lista de tools del turno). Identica a la
 * vieja `MessageBubble.toolShortLabel`: MCP lleva prefijo `mcp ·`, el resto se
 * muestra tal cual.
 */
export function toolSummaryLabel(tool?: string): string {
  if (!tool) return ""
  const mcp = mcpToolParts(tool)
  if (mcp) return `mcp · ${mcp.server} · ${mcp.name}`
  return tool
}

// --- Clasificacion -----------------------------------------------------------

export type ToolCategory = "shell" | "edit" | "read" | "search" | "explore" | "other"

const SHELL_TOOLS = new Set(["bash", "execute", "shell", "terminal"])

/** `true` para los shell tools que ToolPart trata como comando (case-exact). */
export function isShellTool(tool?: string | null): boolean {
  return tool != null && SHELL_TOOLS.has(tool)
}

const FILE_TOOLS = new Set(["write", "edit", "apply_patch", "patch"])

/** `true` para los tools que editan/escriben archivos (case-exact). */
export function isFileTool(tool?: string | null): boolean {
  return tool != null && FILE_TOOLS.has(tool)
}

/**
 * Categoria amplia usada por la tarjeta "antigravity" de ToolPart. Conserva el
 * ORDEN y los `includes()` de la vieja heuristica de `antigravityInfo`.
 */
export function toolCategory(tool?: string | null): ToolCategory {
  const norm = (tool ?? "").toLowerCase()
  if (isShellTool(norm) || norm.includes("command") || norm.includes("bash") || norm.includes("shell") || norm.includes("execute")) return "shell"
  if (norm.includes("replace") || norm.includes("write") || norm.includes("edit") || norm.includes("patch")) return "edit"
  if (norm.includes("view") || norm.includes("read")) return "read"
  if (norm.includes("search") || norm.includes("grep")) return "search"
  if (norm.includes("find") || norm.includes("list") || norm.includes("dir")) return "explore"
  return "other"
}

/** Verbo visible de la tarjeta de actividad. Identico al de `antigravityInfo`. */
export function toolVerb(tool?: string | null): string {
  switch (toolCategory(tool)) {
    case "shell": return "Ran"
    case "edit": return "Edited"
    case "read": return "Analyzed"
    case "search": return "Searched"
    case "explore": return "Explored"
    default: return tool ? toolShortLabel(tool) : "Tool"
  }
}

export type ToolIconKind = "shell" | "file" | "search" | "web" | "code"

/**
 * Grupo de icono SVG de ToolPart. `browse` cae a `code` igual que el switch
 * viejo (no estaba entre los casos de `toolSvgIcon`).
 */
export function toolIconKind(tool?: string | null): ToolIconKind {
  const canonical = canonicalTool(tool)
  if (canonical === "bash") return "shell"
  if (canonical === "read") return "file"
  if (canonical === "search") return "search"
  if (canonical === "web" && tool !== "browse") return "web"
  return "code"
}

// --- Subagente / tarea (U18) -------------------------------------------------

export type TaskToolLike = {
  tool?: string
  text?: string
  state?: {
    input?: unknown
    metadata?: Record<string, unknown> | null
  } | null
} | null | undefined

/**
 * `true` si el part es la tarjeta de un subagente/tarea. Criterio UNICO que
 * absorbe los 4 chequeos divergentes previos (ToolPart XML, subagentBackground,
 * useSSE, useSSEHandler):
 *   - tool `task`/`subagent` (directo o canonicalizado)
 *   - `state.input.subagent_type`
 *   - `state.metadata.subagent`
 *   - `<invoke name="task">` en el texto (v1)
 */
export function isTaskToolPart(part: TaskToolLike): boolean {
  if (!part) return false
  if (canonicalTool(part.tool) === "task") return true
  const input = part.state?.input as { subagent_type?: unknown } | undefined
  if (input && typeof input === "object" && input.subagent_type) return true
  const meta = part.state?.metadata
  if (meta && typeof meta === "object" && meta.subagent) return true
  if (typeof part.text === "string" && isTaskTool(part.text)) return true
  return false
}
