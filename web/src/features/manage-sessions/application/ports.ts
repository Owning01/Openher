import type { Session } from '../../../entities/session/model'
export interface ISessionRepository { list(): Promise<Session[]> }
