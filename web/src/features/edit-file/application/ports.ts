export interface IFileRepository { read(path: string): Promise<string> }
