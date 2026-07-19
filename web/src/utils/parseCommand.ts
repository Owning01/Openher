import type { ServerConfig, MessageEnvelope, SessionView } from "../types"
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
    return { type: "status", session: null as any }
  }

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
