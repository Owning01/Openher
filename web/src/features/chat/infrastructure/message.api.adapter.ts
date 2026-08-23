/**
 * Adapter: Message API — implementa `IMessageRepository` usando `shared/api`.
 *
 * Thin wrapper sobre `api.*` para desacoplar la capa application del
 * cliente HTTP concreto. Mantiene compatibilidad con el barrel `src/api.ts`.
 */
import type { IMessageRepository } from "../application/ports"
import { api } from "../../../api"
import type { ServerConfig } from "../../../entities/config/model"

export function createMessageApiAdapter(config: ServerConfig): IMessageRepository {
  return {
    loadMessages(sessionID: string, directory?: string, limit = 100) {
      return api.loadMessages(config, sessionID, directory, limit)
    },
    sendPrompt(
      sessionID: string,
      text: string,
      directory?: string,
      model?: { providerID: string; modelID: string; variant?: string },
      agentID?: string,
      images?: Array<{ base64: string; mime: string }>,
    ) {
      return api.sendPrompt(config, sessionID, text, directory, model, agentID, images).then((v) => Boolean(v))
    },
    sendCommand(
      sessionID: string,
      command: string,
      args: string,
      directory?: string,
      model?: { providerID: string; modelID: string; variant?: string },
      agentID?: string,
    ) {
      return api.sendCommand(config, sessionID, command, args, directory, model, agentID)
    },
    abort(sessionID: string, directory?: string) {
      return api.abort(config, sessionID, directory).then((v) => Boolean(v))
    },
  }
}
