// Cliente HTTP del agente de escritorio remoto (OpenCode Desktop Agent).
// El agente corre en la PC (desktop-agent/, puerto default 5901) y expone
// /health, /info, /stream (MJPEG) y /input con Basic auth — mismo modelo de
// conexión que el server opencode (Tailscale/LAN).

import { authHeader, baseUrl } from "./api"

export type DesktopConfig = {
  host: string
  port: number
  username: string
  password: string
}

export type DesktopWindow = {
  hwnd: number
  title: string
  process: string
  pid: number
  x: number
  y: number
  w: number
  h: number
}

export type DesktopMonitor = {
  x: number
  y: number
  w: number
  h: number
  primary: boolean
}

export type DesktopInfo = {
  width: number
  height: number
  monitors: DesktopMonitor[]
  windows: DesktopWindow[]
}

export type DesktopInput =
  | { type: "mouse"; action: "move" | "down" | "up" | "click"; x: number; y: number; button?: "left" | "right" | "middle" }
  | { type: "scroll"; dy: number }
  | { type: "key"; code: string; action: "down" | "up" | "tap"; mods?: string[] }
  | { type: "text"; text: string }

export type StreamParams = {
  mode: "screen" | "window"
  hwnd?: number
  monitor?: number
  w: number
  q: number
  fps: number
}

const DESKTOP_STORAGE_KEY = "opencode.remote.desktop"

export function loadDesktopConfig(): DesktopConfig | null {
  try {
    const raw = localStorage.getItem(DESKTOP_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DesktopConfig) : null
  } catch {
    return null
  }
}

export function saveDesktopConfig(cfg: DesktopConfig) {
  localStorage.setItem(DESKTOP_STORAGE_KEY, JSON.stringify(cfg))
}

export function canTestDesktop(cfg: DesktopConfig): boolean {
  return Boolean(cfg.host?.trim() && cfg.port > 0)
}

export function desktopStreamUrl(cfg: DesktopConfig, params: StreamParams): string {
  const p = new URLSearchParams({
    mode: params.mode,
    w: String(params.w),
    q: String(params.q),
    fps: String(params.fps),
  })
  if (params.mode === "window" && params.hwnd) p.set("hwnd", String(params.hwnd))
  if (params.monitor !== undefined && params.mode !== "window") p.set("monitor", String(params.monitor))
  return `${baseUrl(cfg)}/stream?${p.toString()}`
}

// Miniaturas del selector de ventanas: frame único vía fetch+blob (el <img>
// con credenciales en la URL no envía Authorization en Chromium moderno).
export async function desktopThumb(config: DesktopConfig, hwnd: number, w = 160): Promise<string> {
  const p = new URLSearchParams({ hwnd: String(hwnd), w: String(w) })
  const res = await fetch(`${baseUrl(config)}/thumb?${p.toString()}`, {
    headers: { Authorization: authHeader(config) },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return URL.createObjectURL(await res.blob())
}

export const desktopApi = {
  async health(cfg: DesktopConfig): Promise<boolean> {
    const res = await fetch(`${baseUrl(cfg)}/health`, {
      headers: { Authorization: authHeader(cfg) },
      cache: "no-store",
    })
    if (!res.ok) return false
    const body = (await res.json().catch(() => null)) as { status?: string } | null
    return body?.status === "ok"
  },

  async info(cfg: DesktopConfig): Promise<DesktopInfo> {
    const res = await fetch(`${baseUrl(cfg)}/info`, {
      headers: { Authorization: authHeader(cfg) },
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as DesktopInfo
  },

  async input(cfg: DesktopConfig, payload: DesktopInput): Promise<void> {
    const res = await fetch(`${baseUrl(cfg)}/input`, {
      method: "POST",
      headers: { Authorization: authHeader(cfg), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  },
}

// ===== Reader MJPEG (fetch + ReadableStream → blob URLs) =====
// Evita mixed-content/credenciales en URL del <img> y permite stats de bytes.

const BOUNDARY = "--ocd-frame"

function concatBytes(a: Uint8Array<ArrayBufferLike>, b: Uint8Array<ArrayBufferLike>): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a)
  out.set(b)
  return out
}

function indexOfBytes(haystack: Uint8Array, needle: Uint8Array, from = 0): number {
  outer:
  for (let i = from; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer
    }
    return i
  }
  return -1
}

function bytesToText(bytes: Uint8Array): string {
  let out = ""
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i])
  return out
}

const CRLFCRLF = new TextEncoder().encode("\r\n\r\n")
const BOUNDARY_BYTES = new TextEncoder().encode(`--${BOUNDARY}`)

/**
 * Consume el stream MJPEG del agente y entrega blob URLs por frame.
 * Resuelve cuando la conexión termina (abort/error/EOF).
 *
 * IMPORTANTE: aquí NO se revoca el blob del frame anterior. Revocar un blob
 * cuyo <img> todavía está decodificando (o a medio decodificar) produce un
 * JPEG truncado a nivel de decodificación → artefactos de color (magenta/
 * morado) al parpadear entre frames. La revocación la hace el componente
 * cuando el <img> termina de cargar el frame SIGUIENTE (onLoad) — nunca se
 * revoca un blob en uso.
 */
export async function readMJPEGStream(
  cfg: DesktopConfig,
  params: StreamParams,
  signal: AbortSignal,
  onFrame: (blobUrl: string, bytes: number) => void,
): Promise<void> {
  const res = await fetch(desktopStreamUrl(cfg, params), {
    headers: { Authorization: authHeader(cfg) },
    signal,
    cache: "no-store",
  })
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

  const reader = res.body.getReader()
  let buffer: Uint8Array<ArrayBufferLike> = new Uint8Array(0)

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer = concatBytes(buffer, value)

    for (;;) {
      const headerEnd = indexOfBytes(buffer, CRLFCRLF)
      if (headerEnd < 0) break
      const headerText = bytesToText(buffer.slice(0, headerEnd))
      const m = /Content-Length:\s*(\d+)/i.exec(headerText)
      if (!m) {
        buffer = buffer.slice(headerEnd + 4)
        continue
      }
      const len = Number(m[1])
      const frameStart = headerEnd + 4
      if (buffer.length < frameStart + len) break

      const frameBytes = buffer.slice(frameStart, frameStart + len)
      buffer = buffer.slice(frameStart + len)

      onFrame(URL.createObjectURL(new Blob([frameBytes], { type: "image/jpeg" })), frameBytes.length)

      // Descartar el "\r\n" y el siguiente "--ocd-frame" para quedar en el header nuevo.
      const nextBoundary = indexOfBytes(buffer, BOUNDARY_BYTES)
      if (nextBoundary < 0) {
        buffer = new Uint8Array(0)
        break
      }
      buffer = buffer.slice(nextBoundary + BOUNDARY_BYTES.length)
    }
  }
}
