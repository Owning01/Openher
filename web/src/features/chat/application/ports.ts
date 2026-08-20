/**
 * Ports (interfaces) — capa application hexagonal.
 *
 * Definen los contratos que la infraestructura debe implementar.
 * La capa de dominio/aplicación depende solo de estas abstracciones.
 */
import type { MessageEnvelope } from "../../../entities/message/model"
import type { SSEEvent } from "../../../entities/config/model"
import type { Session } from "../../../entities/session/model"

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export interface IMessageRepository {
  loadMessages(sessionID: string, directory: string | undefined, limit?: number): Promise<MessageEnvelope[]>
  sendPrompt(
    sessionID: string,
    text: string,
    directory: string | undefined,
    model?: { providerID: string; modelID: string; variant?: string },
    agentID?: string,
    images?: Array<{ base64: string; mime: string }>,
  ): Promise<boolean>
  sendCommand(
    sessionID: string,
    command: string,
    args: string,
    directory: string | undefined,
    model?: { providerID: string; modelID: string; variant?: string },
    agentID?: string,
  ): Promise<unknown>
  abort(sessionID: string, directory: string | undefined): Promise<boolean>
}

export interface IMessageCache {
  get(sessionID: string): MessageEnvelope[] | null
  set(sessionID: string, messages: MessageEnvelope[]): void
  clear(sessionID?: string): void
}

// ---------------------------------------------------------------------------
// Event stream
// ---------------------------------------------------------------------------

export type Unsubscribe = () => void
export type SSEHandler = (event: SSEEvent) => void

export interface IEventStream {
  subscribe(
    sessionID: string | null | undefined,
    directory: string | undefined,
    handler: SSEHandler,
  ): Unsubscribe
  getState(): string
  reconnect(): void
}

// ---------------------------------------------------------------------------
// Chat service (domain)
// ---------------------------------------------------------------------------

export interface IChatService {
  extractText(msg: MessageEnvelope): string
  buildMessageSignature(messages: MessageEnvelope[]): string
  shouldFilterMessage(msg: MessageEnvelope): boolean
  mergeMessages(prev: MessageEnvelope[], safe: MessageEnvelope[], sessionID: string): MessageEnvelope[]
  dedupeOptimistic(pending: MessageEnvelope[], serverMessages: MessageEnvelope[], sessionID: string): MessageEnvelope[]
}

// ---------------------------------------------------------------------------
// Session repository (read-only, para list/status)
// ---------------------------------------------------------------------------

export interface ISessionRepository {
  listSessions(directory?: string): Promise<Session[]>
  loadSession(sessionID: string, directory?: string): Promise<Session | null>
}
