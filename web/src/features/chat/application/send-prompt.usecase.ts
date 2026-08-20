/**
 * Use case: send-prompt — orquesta el envío de un prompt.
 *
 * Encapsula la decisión `doSend` de `useMessages` sin estado React:
 * resuelve si es prompt normal, comando slash o shell y delega al
 * `IMessageRepository`. El caller (hook/componente) gestiona el
 * optimistic update y el await de confirmación.
 */
import type { Session } from "../../../entities/session/model"
import type { IMessageRepository } from "./ports"

export type SendPromptDeps = {
  repo: IMessageRepository
}

export type SendPromptPayload = {
  session: Session
  text: string
  model?: { providerID: string; modelID: string; variant?: string }
  agentID?: string
  images?: Array<{ base64: string; mime: string }>
}

export type SendPromptResult = {
  ok: boolean
  error?: string
}

export function createSendPromptUseCase(deps: SendPromptDeps) {
  const { repo } = deps

  return async function sendPrompt(payload: SendPromptPayload): Promise<SendPromptResult> {
    const { session, text, model, agentID, images } = payload
    const trimmed = text.trim()
    const hasImages = Boolean(images && images.length > 0)
    if (!trimmed && !hasImages) return { ok: false, error: "Empty message" }
    if (!session.id) return { ok: false, error: "No session" }

    try {
      const ok = await repo.sendPrompt(session.id, trimmed, session.directory, model, agentID, images)
      return { ok: Boolean(ok) }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  }
}

/** Variante que soporta envío de comandos slash (`/cmd args`). */
export function createSendCommandUseCase(deps: SendPromptDeps) {
  const { repo } = deps
  return async function sendCommand(
    session: Session,
    command: string,
    args: string,
    model?: { providerID: string; modelID: string; variant?: string },
    agentID?: string,
  ): Promise<SendPromptResult> {
    try {
      await repo.sendCommand(session.id, command, args, session.directory, model, agentID)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  }
}
