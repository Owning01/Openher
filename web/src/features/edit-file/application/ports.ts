import type { FileEntry } from '../../../entities/file/model'
export interface IFileRepository { read(path: string): Promise<string> }
