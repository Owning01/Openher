import type { ServerConfig, MessageEnvelope, SessionView } from "../types"
import { isImagePart } from "../utils"
import { api } from "../api"

let idCounter = 0
function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`
}

export type ParseCommandResult =
  | { type: "help"; text: string }
  | { type: "status"; session: { title: string; status: string; directory: string } }
  | { type: "send"; text: string }
  | { type: "command"; command: string; args: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "compact" }
  | { type: "themes" }
  | { type: "history" }
  | { type: "timeline" }
  | { type: "connect"; text: string }
  | { type: "send_raw"; text: string }
  | null

export function parseCommand(text: string): ParseCommandResult {
  if (!text.startsWith("/")) return null
  const normalized = text.slice(1)
  const command = normalized.split(" ")[0]?.trim() ?? ""
  const args = normalized.slice(command.length).trim()
  const localCommand = command.toLowerCase()

  if (["help", "commands", "skills"].includes(localCommand)) {
    return { type: "help", text }
  }

  if (localCommand === "status") {
    return { type: "status", session: { title: "", status: "", directory: "" } }
  }

  if (localCommand === "undo") return { type: "undo" }
  if (localCommand === "redo") return { type: "redo" }
  if (localCommand === "compact") return { type: "compact" }
  if (localCommand === "themes") return { type: "themes" }
  if (localCommand === "history") return { type: "history" }
  if (localCommand === "timeline") return { type: "timeline" }
  if (localCommand === "connect") return { type: "connect", text: args }

  return { type: "command", command, args }
}

export async function resolveCommand(
  config: ServerConfig,
  command: string,
  commands: { name: string }[],
  onSetCommands: (cmds: { name: string }[]) => void
): Promise<{ isKnown: boolean; updatedCommands: { name: string }[] }> {
  let availableCommands = commands
  if (availableCommands.length === 0) {
    try {
      availableCommands = await api.listCommands(config)
      onSetCommands(availableCommands)
    } catch {
      // commands not available
    }
  }
  return { isKnown: availableCommands.some((item) => item.name === command), updatedCommands: availableCommands }
}

export function buildOptimisticMessage(selectedSession: SessionView, text: string, images?: Array<{ base64: string; mime: string }>): MessageEnvelope {
  const now = Date.now()
  const parts: MessageEnvelope["parts"] = text ? [{ id: uniqueId("optimistic-part"), type: "text", text }] : []
  if (images) {
    for (const img of images) {
      parts.push({ id: uniqueId("img-part"), type: "image", data: img.base64, mimeType: img.mime })
    }
  }
  return {
    info: { id: uniqueId("optimistic"), role: "user", sessionID: selectedSession.id, time: { created: now } },
    parts
  }
}

// Eco sin bytes: el server confirma el texto pero puede podar los dataURL de
// las imágenes (tamaño). Sin rehidratación la imagen "aparece y se borra": el
// optimista (con bytes) se elimina por conteo y el eco queda sin src
// renderizable. Se reinyectan los bytes locales en el eco, con ids derivados
// estables (`#local`): el merge por id los conserva como extraLocal en polls
// posteriores en vez de pisarlos con el eco vacío.
export type LocalImageEntry = { sessionID: string; text: string; datas: Array<{ data: string; mime: string }> }

// Texto que v1 usa como placeholder cuando el envío es solo-imagen.
const PLACEHOLDER_IMAGE_TEXT = "(image)"

function normImageText(t: string): string {
  const s = t.trim()
  return s === PLACEHOLDER_IMAGE_TEXT ? "" : s
}

function imagePartHasBytes(p: { data?: string; url?: string }): boolean {
  if (p.data && p.data.length > 0) return true
  const url = p.url ?? ""
  return url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")
}

export function collectLocalImages(messages: MessageEnvelope[]): LocalImageEntry[] {
  const out: LocalImageEntry[] = []
  for (const m of messages) {
    if (m.info.role !== "user") continue
    const datas = m.parts
      .filter((p) => isImagePart(p) && p.data && p.data.length > 0)
      .map((p) => ({ data: p.data as string, mime: p.mimeType ?? p.mime ?? "image/png" }))
    if (datas.length > 0) out.push({ sessionID: m.info.sessionID, text: envelopeText(m).trim(), datas })
  }
  return out
}

// Rellena/appende bytes en mensajes user del server y devuelve los entries
// NO consumidos (el hook los conserva para el próximo fetch).
export function rehydrateImages(
  list: MessageEnvelope[],
  locals: LocalImageEntry[],
  sessionID: string,
): LocalImageEntry[] {
  const pending = locals.filter((e) => e.sessionID === sessionID && e.datas.length > 0)
  if (pending.length === 0) return locals
  const used = new Set<LocalImageEntry>()
  for (const m of list) {
    if (m.info.role !== "user" || (m.info.sessionID && m.info.sessionID !== sessionID)) continue
    const idx = pending.findIndex((e) => !used.has(e) && normImageText(e.text) === normImageText(envelopeText(m).trim()))
    if (idx < 0) continue
    const entry = pending[idx]
    let attached = false
    let di = 0
    m.parts = m.parts.map((p) => {
      if (di >= entry.datas.length || !isImagePart(p) || imagePartHasBytes(p)) return p
      const fill = entry.datas[di++]
      attached = true
      return { ...p, id: `${p.id}#local`, data: fill.data, mimeType: fill.mime }
    })
    const existing = m.parts.filter((p) => isImagePart(p)).length
    for (let k = existing; k < entry.datas.length; k++) {
      const fill = entry.datas[k]
      attached = true
      m.parts.push({ id: `${m.info.id}#local-img-${k}`, sessionID: m.info.sessionID, type: "image", data: fill.data, mimeType: fill.mime })
    }
    // El placeholder "(image)" solo existe para que el envío vacío no se filtre:
    // con imagen real rehidratada no debe mostrarse literal.
    if (m.parts.some((p) => isImagePart(p) && imagePartHasBytes(p))) {
      const noPlaceholder = m.parts.filter((p) => !(p.type === "text" && (p.text ?? "").trim() === PLACEHOLDER_IMAGE_TEXT))
      if (noPlaceholder.length !== m.parts.length) m.parts = noPlaceholder
    }
    if (attached) used.add(entry)
  }
  return used.size === 0 ? locals : locals.filter((e) => !used.has(e))
}

function envelopeText(msg: MessageEnvelope): string {
  const blocks: string[] = []
  for (const part of msg.parts) {
    if (!part.text) continue
    if (part.type === "text" || part.type === "compaction") blocks.push(part.text)
  }
  return blocks.join("\n\n").trim()
}

export function buildStatusMessage(selectedSession: SessionView): MessageEnvelope {
  const now = Date.now()
  const status = [
    `Session: ${selectedSession.title} (${selectedSession.status})`,
    `Directory: ${selectedSession.directory}`,
  ].join("\n")
  return {
    info: { id: uniqueId("local-assistant"), role: "assistant", sessionID: selectedSession.id, time: { created: now, completed: now } },
    parts: [{ id: uniqueId("local-assistant-part"), type: "text", text: status }]
  }
}
