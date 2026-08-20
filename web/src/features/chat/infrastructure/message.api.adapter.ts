import { api } from "../../../api"
import type { ServerConfig } from "../../../entities/config/model"
import type { MessageEnvelope } from "../../../entities/message/model"
import type { IMessageRepository } from "../application/ports"

export function createMessageApiAdapter(config: ServerConfig): IMessageRepository {
  return {
    loadMessages: (sessionID: string, directory?: string, limit = 100): Promise<MessageEnvelope[]> =>
      api.loadMessages(config, sessionID, directory, limit) as Promise<MessageEnvelope[]>,
    sendPrompt: (sessionID: string, text: string, directory?: string): Promise<boolean> =>
      api.sendPrompt(config, sessionID, text, directory) as Promise<boolean>,
    sendCommand: (sessionID: string, command: string, args: string, directory?: string): Promise<unknown> =>
      api.sendCommand(config, sessionID, command, args, directory),
  }
}
