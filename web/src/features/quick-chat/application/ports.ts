export interface IQuickChatRepository { send(prompt: string): Promise<string> }
