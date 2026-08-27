import { Capacitor, CapacitorHttp } from "@capacitor/core"
import { computeBackoff } from "../../utils"
import { recordDataUsage } from "../../utils/dataUsage"
import type { ServerConfig } from "../../types"
import { ensureVersionDetected, apiPath, unwrapData } from "./version"
import { toWrappedError } from "../errors/sdkErrorInterceptor"

export function toBase64(input: string): string {
  const bytes = new TextEncoder().encode(input)
  const binary = Array.from(bytes).map((b) => String.fromCodePoint(b)).join("")
  return btoa(binary)
}

export function authHeader(config: { username: string; password: string }): string {
  return `Basic ${toBase64(`${config.username}:${config.password}`)}`
}

export function baseUrl(config: { host: string; port: number }): string {
  let host = config.host.trim()
  const schemeMatch = host.match(/^(https?):\/\//)
  const scheme = schemeMatch ? schemeMatch[1] : "http"
  if (schemeMatch) host = host.slice(schemeMatch[0].length)
  host = host.split("/")[0] ?? host
  // 0.0.0.0/:: no es ruteable para el cliente; el server bindea en 0.0.0.0 pero el cliente debe usar loopback
  if (host === "0.0.0.0" || host === "::" || host === "[::]" || host === "0:0:0:0:0:0:0:0") host = "127.0.0.1"
  if (host === "::1" || host === "[::1]") host = "127.0.0.1"
  if (host.includes(":") && !host.startsWith("[")) {
    host = `[${host}]`
  }
  return `${scheme}://${host}:${config.port}`
}

export function normalizeSlashes(path: string): string {
  return path.replace(/\\/g, "/")
}

export function toServerRelative(path: string, directory?: string): string {
  const norm = normalizeSlashes(path)
  if (!directory) return norm
  const normDir = normalizeSlashes(directory).replace(/\/+$/, "")
  if (norm.toLowerCase().startsWith(normDir.toLowerCase())) {
    const rel = norm.slice(normDir.length).replace(/^\/+/, "")
    if (rel) return rel
  }
  return norm
}

export function withDirectory(path: string, directory?: string): string {
  if (!directory) return path
  const separator = path.includes("?") ? "&" : "?"
  return `${path}${separator}directory=${encodeURIComponent(normalizeSlashes(directory))}`
}

export function withLocationDirectory(path: string, directory?: string): string {
  if (!directory) return path
  const separator = path.includes("?") ? "&" : "?"
  return `${path}${separator}location[directory]=${encodeURIComponent(normalizeSlashes(directory))}`
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT"
  body?: unknown
  readTimeout?: number
  rawPath?: boolean
}

export type ResponseWithHeaders<T> = {
  data: T
  headers: Record<string, string>
}

export async function fetchFileBytes(config: ServerConfig, target: string): Promise<Uint8Array> {
  const headers: Record<string, string> = {}
  if (config.username && config.password) headers.Authorization = authHeader(config)
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.request({
      url: target,
      method: "GET",
      headers,
      responseType: "blob",
      connectTimeout: 12_000,
      readTimeout: 30_000,
    })
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
    const b64 = String(res.data ?? "").split(",").pop() ?? ""
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  }
  const res = await fetch(target, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}

export function arrayBufferToBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function responseDetail(body: unknown): string | null {
  if (!body) return null
  if (typeof body === "string") {
    try {
      return responseDetail(JSON.parse(body)) ?? body
    } catch {
      return body
    }
  }
  if (typeof body === "object") {
    const value = body as { data?: { message?: string }; message?: string; error?: { message?: string }; _tag?: string; name?: string }
    // Copiado pattern sdk: prefiere data.message > message > name > _tag
    return value.data?.message ?? (value as { message?: string }).message ?? (value as { error?: { message?: string } }).error?.message ?? (typeof value._tag === "string" ? value._tag : null) ?? (typeof value.name === "string" ? value.name : null) ?? JSON.stringify(body)
  }
  return String(body)
}

export function normalizeHeaders(headers: Record<string, unknown> | undefined): Record<string, string> {
  if (!headers) return {}
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), Array.isArray(value) ? value.join(", ") : String(value)]),
  )
}

export function serializedSize(value: unknown): number {
  if (value === undefined || value === null) return 0
  if (typeof value === "number") return 8
  if (typeof value === "boolean") return 4
  if (typeof value === "string") return new TextEncoder().encode(value).length
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length
  } catch {
    return 0
  }
}

export async function requestWithHeaders<T>(config: ServerConfig, path: string, options: RequestOptions = {}): Promise<ResponseWithHeaders<T>> {
  if (options.rawPath) {
    return requestRaw<T>(config, `${baseUrl(config)}${path}`, options)
  }
  const autoV2 = config.apiVersion !== "v1" && config.apiVersion !== "v2"
  if (autoV2) {
    const version = await ensureVersionDetected(config)
    if (version === "v2") {
      return requestRaw<T>(config, `${baseUrl(config)}/api${path}`, options)
    }
    return requestRaw<T>(config, `${baseUrl(config)}${path}`, options)
  }
  return requestRaw<T>(config, `${baseUrl(config)}${apiPath(config, path)}`, options)
}

export async function requestRaw<T>(config: ServerConfig, target: string, options: RequestOptions = {}): Promise<ResponseWithHeaders<T>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  }
  if (config.username && config.password) {
    headers.Authorization = authHeader(config)
  }
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  const method = options.method ?? "GET"
  const timeout = options.readTimeout ?? 30_000
  const maxRetries = 1
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (Capacitor.isNativePlatform()) {
        const response = await CapacitorHttp.request({
          url: target,
          method,
          headers,
          data: options.body,
          connectTimeout: 12_000,
          readTimeout: timeout,
        })

        if (response.status >= 400) {
          const detail = responseDetail(response.data) || `HTTP ${response.status}`
          throw toWrappedError(detail, response.status, target, method, response.data) as Error
        }

        const responseHeaders = normalizeHeaders(response.headers)
        recordDataUsage(serializedSize(options.body), "up")
        recordDataUsage(serializedSize(response.data), "down")
        if (response.status === 204) return { data: true as T, headers: responseHeaders }
        return { data: unwrapData(response.data as T), headers: responseHeaders }
      }

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)
      let response: Response
      try {
        try {
          response = await fetch(target, {
            method,
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
            signal: controller.signal,
          })
        } catch (netErr) {
          const isDesktop = typeof window !== "undefined" && !!(window as unknown as { __OPENCODE_DESKTOP__?: boolean }).__OPENCODE_DESKTOP__
          const msg = String((netErr as { message?: unknown })?.message ?? netErr)
          const isCorsLike =
            isDesktop &&
            (msg.includes("Failed to fetch") ||
              msg.includes("NetworkError") ||
              msg.includes("Load failed") ||
              (netErr as { name?: string })?.name === "TypeError")
          if (isCorsLike && !target.includes("/shell/proxy")) {
            const proxyUrl = `/shell/proxy?url=${encodeURIComponent(target)}`
            response = await fetch(proxyUrl, {
              method,
              headers,
              body: options.body === undefined ? undefined : JSON.stringify(options.body),
              signal: controller.signal,
            })
          } else {
            throw netErr
          }
        }
      } finally {
        clearTimeout(timer)
      }

      if (!response.ok) {
        let detail = `HTTP ${response.status}`
        let rawBody: unknown = null
        try {
          const clone = response.clone()
          rawBody = await clone.json()
          detail = responseDetail(rawBody) ?? detail
        } catch {
          try {
            const text = await response.text()
            rawBody = text
            if (text) detail = text
          } catch {
            rawBody = detail
          }
        }
        throw toWrappedError(detail, response.status, target, method, rawBody) as Error
      }

      const responseHeaders = normalizeHeaders(Object.fromEntries(response.headers.entries()))
      recordDataUsage(serializedSize(options.body), "up")
      const contentLength = Number(response.headers.get("content-length"))
      if (contentLength > 0) recordDataUsage(contentLength, "down")
      if (response.status === 204) return { data: true as T, headers: responseHeaders }
      const json = (await response.json()) as T
      if (!contentLength) recordDataUsage(serializedSize(json), "down")
      return { data: unwrapData(json), headers: responseHeaders }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const retryable =
        lastError instanceof TypeError ||
        lastError.name === "AbortError" ||
        /network|timeout|fetch failed|ERR_/i.test(lastError.message)
      if (!retryable) break
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, computeBackoff(1_000, 10_000, attempt)))
      }
    }
  }

  const errorObj = lastError ?? new Error("Unknown error")
  const isNetworkError = errorObj.message.startsWith("Network error") || errorObj.name === "AbortError"
  if (!isNetworkError) throw errorObj

  const corsHint =
    config.username && config.password
      ? " Browser mode + Basic Auth may be blocked by CORS preflight; use APK/native mode or disable auth temporarily for browser debugging."
      : ""
  throw new Error(`Network error: cannot reach ${target}. Check server hostname/port, Windows firewall, and CORS (--cors).${corsHint}`)
}

export async function request<T>(config: ServerConfig, path: string, options: RequestOptions = {}): Promise<T> {
  return (await requestWithHeaders<T>(config, path, options)).data
}
