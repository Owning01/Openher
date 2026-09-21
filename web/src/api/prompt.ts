import type { MessageEnvelope, ModelSelection, ServerConfig } from "../types"
import { baseUrl, request, requestRaw, withDirectory } from "../shared/api/client"
import { apiPath, getApiVersion } from "../shared/api/version"
import { modelWireName, toMessageEnvelopeV1, toModelBody } from "../shared/api/mappers"
import type { V2Message } from "../shared/api/mappers"
import { getOpencodeClient } from "../shared/api/opencodeClient"
import { errorStatus } from "../shared/errors/errorShape"

async function syncV2SessionContext(
  client: Awaited<ReturnType<typeof getOpencodeClient>>,
  sessionID: string,
  model?: ModelSelection,
  agentID?: string,
) {
  // En v2 modelo y agente viven en la sesión; no deben viajar como campos
  // inventados dentro de /prompt. Las operaciones son 204 y por eso no
  // generan un segundo prompt ni dependen de una respuesta JSON.
  if (model) {
    await (client as any).session.switchModel({
      sessionID,
      model: { id: model.modelID, providerID: model.providerID, ...(model.variant ? { variant: model.variant } : {}) },
    })
  }
  if (agentID) await (client as any).session.switchAgent({ sessionID, agent: agentID })
}

const sendPrompt = async (
  config: ServerConfig,
  sessionID: string,
  text: string,
  directory?: string,
  model?: ModelSelection,
  agentID?: string,
  images?: Array<{ base64: string; mime: string }>,
) => {
  const version = await getApiVersion(config)
  if (version === "v2") {
    const files = images?.map((img) => ({
      uri: `data:${img.mime};base64,${img.base64.includes(",") ? img.base64.split(",")[1] : img.base64}`,
      name: `clipboard.${img.mime.split("/")[1] || "png"}`,
    }))
    try {
      const client = await getOpencodeClient(config)
      await syncV2SessionContext(client, sessionID, model, agentID)
      const res = await (client as any).session.prompt({ sessionID, text, files })
      return (res ?? true) as boolean
    } catch {
      // Fallback HTTP directo (CapacitorHttp en nativo, sin CORS): el SDK
      // usa fetch del WebView y en Android por Tailscale el POST puede caer
      // por preflight aunque los GETs funcionen (tenían su propio fallback).
      return request<boolean>(config, apiPath(config, `/session/${sessionID}/prompt`), {
        method: "POST",
        body: { text, files },
        readTimeout: 180_000,
        retryable: false,
      })
    }
  }
  const parts: Array<{ type: string; text?: string; data?: string; mimeType?: string; mime?: string; url?: string; filename?: string }> = []
  if (text) {
    parts.push({ type: "text", text })
  } else if (images && images.length > 0) {
    parts.push({ type: "text", text: "(image)" })
  }
  if (images) {
    for (const img of images) {
      const raw = img.base64.includes(",") ? img.base64.split(",")[1] : img.base64
      parts.push({
        type: "file",
        mime: img.mime,
        filename: `clipboard.${img.mime.split("/")[1] || "png"}`,
        url: `data:${img.mime};base64,${raw}`,
      })
    }
  }
  return request<boolean>(config, withDirectory(`/session/${sessionID}/prompt_async`, directory), {
    method: "POST",
    body: { parts, model: toModelBody(model), agent: agentID, variant: model?.variant || undefined },
    retryable: false,
  })
}

const sendCommand = async (
  config: ServerConfig,
  sessionID: string,
  command: string,
  argumentsText: string,
  directory?: string,
  model?: ModelSelection,
  agentID?: string,
) => {
  const version = await getApiVersion(config)
  if (version === "v2") {
    try {
      const client = await getOpencodeClient(config)
      await syncV2SessionContext(client, sessionID, model, agentID)
      const res = await (client as any).session.command({ sessionID, command, text: argumentsText })
      if (res) {
        try { return toMessageEnvelopeV1(res as V2Message) } catch { return res as MessageEnvelope }
      }
      return true as unknown as MessageEnvelope
    } catch {
      // Mismo fallback sin-CORS que sendPrompt (ver arriba).
      await request<boolean>(config, apiPath(config, `/session/${sessionID}/command`), {
        method: "POST",
        body: { command, text: argumentsText },
        readTimeout: 300_000,
        retryable: false,
      })
      return true as unknown as MessageEnvelope
    }
  }
  return request<MessageEnvelope>(config, withDirectory(`/session/${sessionID}/command`, directory), {
    method: "POST",
    body: { command, arguments: argumentsText, agent: agentID, model: modelWireName(model), variant: model?.variant || undefined },
    readTimeout: 300_000,
    retryable: false,
  })
}

const sendShell = (config: ServerConfig, sessionID: string, command: string, directory?: string) =>
  request<boolean>(config, withDirectory(`/session/${sessionID}/shell`, directory), {
    method: "POST",
    body: { command },
    retryable: false,
  })

const abort = async (config: ServerConfig, sessionID: string, directory?: string) => {
  const forced = config.apiVersion
  const failures: string[] = []
  const note = (e: unknown) => {
    failures.push(e instanceof Error ? e.message : String(e))
  }
  // Interrupt crudo v2 (sin SDK): cubre SDK roto o versión sin detectar.
  // El prefijo /api va explícito porque request() no lo agrega sin detección.
  const rawV2Interrupt = async () => {
    const target = `${baseUrl(config)}/api${withDirectory(`/session/${sessionID}/interrupt`, directory)}`
    const res = await requestRaw<{ interrupted?: boolean } | boolean>(config, target, {
      method: "POST",
      retryable: false,
    })
    const data = res.data as { interrupted?: boolean } | boolean
    return typeof data === "boolean" ? data : (data?.interrupted ?? true)
  }
  if (forced !== "v1") {
    let version: "v1" | "v2" = "v1"
    try {
      version = await getApiVersion(config)
    } catch (e) {
      note(e)
    }
    if (version === "v2") {
      try {
        const client = await getOpencodeClient(config)
        const res = await (client as any).session.interrupt({ sessionID })
        return (res as any)?.interrupted ?? true
      } catch (e) {
        note(e)
      }
      // El SDK falló: reintentar por path crudo antes de rendirse.
      try {
        return await rawV2Interrupt()
      } catch (e) {
        note(e)
      }
      if (forced === "v2") {
        throw new Error(`No se pudo detener la sesión (${failures.join(" | ")})`)
      }
      // auto: caer a la rama v1 por compatibilidad con servers viejos
    }
  }
  const primary = `/session/${sessionID}/abort`
  const secondary = `/session/${sessionID}/interrupt`
  try {
    try {
      return await request<boolean>(config, withDirectory(primary, directory), {
        method: "POST",
        retryable: false,
      })
    } catch (error) {
      if (errorStatus(error) !== 404) throw error
      return await request<boolean>(config, withDirectory(secondary, directory), {
        method: "POST",
        retryable: false,
      })
    }
  } catch (error) {
    // auto sin versión detectada: el server puede ser v2 (rutas bajo /api) —
    // último intento por el path crudo antes de informar el fallo real.
    if (forced !== "v1" && forced !== "v2") {
      try {
        return await rawV2Interrupt()
      } catch (e) {
        note(e)
      }
    } else {
      note(error)
    }
    throw new Error(`No se pudo detener la sesión en :${config.port} (${failures.join(" | ") || "sin respuesta del servidor"})`)
  }
}

export const promptApi = {
  sendPrompt,
  sendCommand,
  sendShell,
  abort,
}
