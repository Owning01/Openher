import type { MessageEnvelope } from "../../../entities/message/model"
import type { IMessageRepository, IMessageCache } from "./ports"

export function createLoadMessagesUseCase(repo: IMessageRepository, cache?: IMessageCache) {
  return async (sessionID: string, directory?: string, limit = 100): Promise<MessageEnvelope[]> => {
    if (cache) {
      const cached = await cache.get(sessionID).catch(() => null)
      if (cached && cached.length > 0) {
        repo.loadMessages(sessionID, directory, limit).then((fresh) => cache.set(sessionID, fresh).catch(() => {})).catch(() => {})
        return cached
      }
    }
    const fresh = await repo.loadMessages(sessionID, directory, limit)
    if (cache) await cache.set(sessionID, fresh).catch(() => {})
    return fresh
  }
}

export function createGetCachedMessagesUseCase(cache: IMessageCache) {
  return (sessionID: string): Promise<MessageEnvelope[] | null> => cache.get(sessionID)
}
