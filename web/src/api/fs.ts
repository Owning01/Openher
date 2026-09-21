import type { FileEntry, PathInfo, ServerConfig } from "../types"
import { arrayBufferToBase64, baseUrl, fetchFileBytes, request, toServerRelative, withDirectory, withLocationDirectory } from "../shared/api/client"
import { toFileEntryV2 } from "../shared/api/mappers"
import { pickV2 } from "./versionDispatch"

const loadPath = (config: ServerConfig, directory?: string) =>
  pickV2(
    config,
    () => request<PathInfo>(config, withDirectory("/path", directory)),
    async () => {
      const loc = await request<{ directory?: string; workspaceID?: string; project?: { id?: string; directory?: string } }>(
        config,
        withLocationDirectory("/location", directory),
      )
      const dir = loc.directory ?? loc.project?.directory ?? ""
      return { home: dir, state: dir, config: dir, worktree: dir, directory: dir }
    },
  )

const listFiles = (config: ServerConfig, path: string, directory?: string) =>
  pickV2(
    config,
    () => {
      const rel = path.replace(/\\/g, "/").replace(/^[A-Za-z]:\/?/, "").replace(/^\/+/, "")
      return request<FileEntry[]>(config, withDirectory(`/file?path=${encodeURIComponent(rel)}`, directory))
    },
    async () => {
      const rel = path.replace(/\\/g, "/").replace(/^[A-Za-z]:\/?/, "").replace(/^\/+/, "")
      const basePath = withLocationDirectory("/fs/list", directory)
      const sep = basePath.includes("?") ? "&" : "?"
      const raw = await request<Array<{ path?: string; type?: string }>>(config, `${basePath}${rel ? `${sep}path=${encodeURIComponent(rel)}` : ""}`)
      return raw.map((e) => toFileEntryV2(directory, e))
    },
  )

const findFiles = (config: ServerConfig, query: string, directory?: string, limit = 20) =>
  pickV2(
    config,
    () => request<string[]>(config, withDirectory(`/find/file?query=${encodeURIComponent(query)}&limit=${limit}`, directory)).then((paths) =>
      paths.map((p) => ({ path: p, type: "file" as const })),
    ),
    async () => {
      const basePath = withLocationDirectory("/fs/find", directory)
      const sep = basePath.includes("?") ? "&" : "?"
      const raw = await request<Array<{ path?: string; type?: string }>>(config, `${basePath}${sep}query=${encodeURIComponent(query)}&type=file&limit=${limit}`)
      return raw.map((e) => ({ path: e.path ?? "", type: (e.type === "directory" ? "directory" : "file") as "file" | "directory" }))
    },
  )

const readFile = (config: ServerConfig, path: string, directory?: string) =>
  pickV2(
    config,
    () => request<{ type: "text" | "binary"; content: string; encoding?: string }>(
      config,
      withDirectory(`/file/content?path=${encodeURIComponent(toServerRelative(path, directory))}`, directory),
    ),
    async () => {
      const rel = toServerRelative(path, directory).split("/").map(encodeURIComponent).join("/")
      const target = `${baseUrl(config)}/api/fs/read/${rel}${withLocationDirectory("", directory)}`
      const bytes = await fetchFileBytes(config, target)
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes)
      if (!text.includes("\uFFFD")) return { type: "text" as const, content: text }
      return { type: "binary" as const, content: arrayBufferToBase64(bytes), encoding: "base64" }
    },
  )

const writeFile = (config: ServerConfig, path: string, content: string, directory?: string) =>
  pickV2(
    config,
    () => request<boolean>(config, withDirectory("/file", directory), {
      method: "POST",
      body: { path: toServerRelative(path, directory), content },
    }),
    () => {
      throw new Error("File writing is not supported on v2 servers yet")
    },
  )

export const fsApi = {
  loadPath,
  listFiles,
  findFiles,
  readFile,
  writeFile,
}
