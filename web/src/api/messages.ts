import type { DiffFile, FileStatusEntry, MessageEnvelope, ProjectCurrent, ServerConfig, Session, VcsStatus } from "../types"
type TodoItem = any
import { request, withDirectory, withLocationDirectory } from "../shared/api/client"
import { resolveApiVersion } from "../shared/api/version"
import { toMessageEnvelopeV1, toSessionV1 } from "../shared/api/mappers"
import type { V2Message, V2Session } from "../shared/api/mappers"
import { getOpencodeClient } from "../shared/api/opencodeClient"
import { pickV2 } from "./versionDispatch"

// Variante del SDK que resolvió message.list por host (ver loadMessages):
// evita re-probar variantes fallidas en cada apertura de sesión.
const messageVariantCache = new Map<string, number>()

const loadMessages = async (config: ServerConfig, sessionID: string, directory?: string, limit = 100) => {
  const safeLimit = Math.min(limit, 200)
  try {
    const client = await getOpencodeClient(config)
    // Probar múltiples variantes del client — el nombre exacto varía entre betas v2.
    // Caché por host de la variante que funcionó: la primera apertura prueba
    // en orden, las siguientes van directo (evita N llamadas fallidas por open).
    const variantKey = `${config.host}:${config.port}`
    const startAt = messageVariantCache.get(variantKey) ?? 0
    let res: unknown
    let hitIndex = -1
    const tryCall = async (fn: unknown, args: unknown) => {
      if (typeof fn !== "function") return undefined
      try { return await (fn as any)(args) } catch { return undefined }
    }
    // En v2, client.message.list({ sessionID }) consulta /api/session/:id/message (historial persistente real)
    // NUNCA consultar session.context primero: /context devuelve solo el prompt context activo para inferencia,
    // que tras un abort o entre turnos omite mensajes de usuario no completados o devuelve solo metadata sin texto.
    const variants = [
      (client as any).message?.list,
      (client as any).session?.messages,
      (client as any).session?.getMessages,
      (client as any).message?.listMessages,
      (client as any).session?.context,
    ]
    for (let i = 0; i < variants.length && !res; i++) {
      const idx = (startAt + i) % variants.length
      res = await tryCall(variants[idx], { sessionID, limit: safeLimit })
      if (res) hitIndex = idx
    }
    if (hitIndex >= 0) messageVariantCache.set(variantKey, hitIndex)
    const rawList: unknown = Array.isArray(res) ? res : (res as any)?.data ?? res
    if (Array.isArray(rawList)) {
      const mapped = (rawList as any[]).map((m: any) => {
        if (m && typeof m === "object" && "info" in m && "parts" in m) return m as MessageEnvelope
        try {
          return toMessageEnvelopeV1(m as V2Message)
        } catch {
          // naive mapping for SessionMessageInfo
          const text = m?.text ?? m?.content ?? ""
          return {
            info: {
              id: m?.id ?? `${sessionID}_${Math.random()}`,
              role: m?.type ?? "assistant",
              sessionID: m?.sessionID ?? sessionID,
              time: { created: m?.time?.created ?? Date.now() },
              agent: m?.agent,
              modelID: m?.model?.id,
              providerID: m?.model?.providerID,
            },
            parts: [{ id: `${m?.id ?? "part"}_0`, sessionID, type: "text", text: typeof text === "string" ? text : "" }],
          } as MessageEnvelope
        }
      }) as MessageEnvelope[]
      if (mapped && mapped.length > 0) {
        return mapped.map((mm) => ({
          ...mm,
          info: { ...mm.info, sessionID: mm.info?.sessionID || sessionID },
          parts: (mm.parts ?? []).map((p) => ({ ...p, sessionID: (p as any).sessionID ?? mm.info?.sessionID ?? sessionID })),
        }))
      }
      // Si el client devolvió array vacío, no retornar — dejar que el fallback HTTP lo intente (puede tener datos con otro dialecto)
      if (Array.isArray(rawList) && rawList.length === 0) {
        // continuar a HTTP fallback
      } else if (mapped) {
        return mapped.map((mm) => ({
          ...mm,
          info: { ...mm.info, sessionID: mm.info?.sessionID || sessionID },
          parts: (mm.parts ?? []).map((p) => ({ ...p, sessionID: (p as any).sessionID ?? mm.info?.sessionID ?? sessionID })),
        }))
      }
    }
  } catch {}
  // HTTP fallback: probar v1 path primero, luego v2 alternativo si 404
  let raw: MessageEnvelope[] | V2Message[] | null = null
  try {
    raw = await request<MessageEnvelope[] | V2Message[]>(config, withDirectory(`/session/${sessionID}/message?limit=${safeLimit}`, directory), {
      readTimeout: 12_000,
    })
  } catch (e) {
    const msg = String((e as Error).message || "")
    if (/404|not found/i.test(msg)) {
      try {
        raw = await request<MessageEnvelope[] | V2Message[]>(config, withLocationDirectory(`/session/${sessionID}/message?limit=${safeLimit}`, directory), {
          readTimeout: 12_000,
        })
      } catch {}
    }
    if (!raw) throw e
  }
  const list = resolveApiVersion(config) === "v2" ? (raw as V2Message[]).map(toMessageEnvelopeV1) : (raw as MessageEnvelope[])
  return (list ?? []).map((m) => ({
    ...m,
    info: {
      ...m.info,
      sessionID: m.info?.sessionID || sessionID,
    },
    parts: (m.parts ?? []).map((p) => ({
      ...p,
      sessionID: p.sessionID ?? m.info?.sessionID ?? sessionID,
    })),
  }))
}

const loadTodo = (config: ServerConfig, sessionID: string, directory?: string) =>
  pickV2(
    config,
    () => request<TodoItem[]>(config, withDirectory(`/session/${sessionID}/todo`, directory)),
    () => [] as TodoItem[],
  )

const loadDiff = (config: ServerConfig, sessionID: string, directory?: string) =>
  pickV2(
    config,
    () => request<DiffFile[]>(config, withDirectory(`/session/${sessionID}/diff`, directory)),
    async () => {
      const raw = await request<unknown>(config, withLocationDirectory("/vcs/diff", directory))
      if (!Array.isArray(raw)) return []
      return raw.map((d) => {
        const item = d as { file?: string; additions?: number; deletions?: number }
        return { file: item.file ?? "", additions: item.additions ?? 0, deletions: item.deletions ?? 0 }
      })
    },
  )

const loadProjectCurrent = (config: ServerConfig, directory?: string) =>
  request<ProjectCurrent>(config, withDirectory("/project/current", directory))

const loadVcs = (config: ServerConfig, directory?: string) =>
  request<VcsStatus>(config, withDirectory("/vcs", directory))

const loadFileStatus = (config: ServerConfig, directory?: string) =>
  pickV2(
    config,
    () => request<FileStatusEntry[] | Record<string, FileStatusEntry>>(config, withDirectory("/file/status", directory)),
    async () => {
      const raw = await request<unknown>(config, withLocationDirectory("/vcs/status", directory))
      return (Array.isArray(raw) ? raw : []) as FileStatusEntry[]
    },
  )

const revert = (config: ServerConfig, sessionID: string, messageID: string, directory?: string) =>
  pickV2(
    config,
    () => request<Session>(config, withDirectory(`/session/${sessionID}/revert`, directory), {
      method: "POST",
      body: { messageID },
      retryable: false,
    }),
    async () => {
      const client = await getOpencodeClient(config)
      const res = await (client as any).session.revert.stage({ sessionID, messageID })
      try {
        return toSessionV1(res as V2Session)
      } catch {
        return res as unknown as Session
      }
    },
  )

const unrevert = (config: ServerConfig, sessionID: string, directory?: string) =>
  pickV2(
    config,
    () => request<Session>(config, withDirectory(`/session/${sessionID}/unrevert`, directory), {
      method: "POST",
      body: {},
      retryable: false,
    }),
    async () => {
      const client = await getOpencodeClient(config)
      const res = await (client as any).session.revert.clear({ sessionID })
      try {
        return toSessionV1(res as V2Session)
      } catch {
        return res as unknown as Session
      }
    },
  )

const summarize = (config: ServerConfig, sessionID: string, providerID: string, modelID: string, directory?: string, auto = false, readTimeout = 300_000) =>
  pickV2(
    config,
    () => request<boolean>(config, withDirectory(`/session/${sessionID}/summarize`, directory), {
      method: "POST",
      body: { providerID, modelID, auto },
      readTimeout,
      retryable: false,
    }),
    async () => {
      const client = await getOpencodeClient(config)
      const res = await (client as any).session.compact({ sessionID })
      return (res ?? true) as boolean
    },
  )

const fetchDiffContent = (config: ServerConfig, sessionID: string, file: string, directory?: string) =>
  pickV2(
    config,
    () => request<{ content: string }>(config, withDirectory(`/session/${sessionID}/diff/${encodeURIComponent(file)}`, directory)),
    async () => {
      const raw = await request<{ content?: string }>(config, withLocationDirectory(`/vcs/diff/raw?file=${encodeURIComponent(file)}`, directory)).catch(
        () => null,
      )
      return { content: raw?.content ?? "" }
    },
  )

export const messagesApi = {
  loadMessages,
  loadTodo,
  loadDiff,
  loadProjectCurrent,
  loadVcs,
  loadFileStatus,
  revert,
  unrevert,
  summarize,
  fetchDiffContent,
}
