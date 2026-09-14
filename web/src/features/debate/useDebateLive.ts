import { useCallback, useEffect, useState } from "react"
import type { ServerConfig } from "../../types"
import { pluginBus } from "../../plugins"
import { authHeader, baseUrl } from "../../shared/api/client"

/**
 * Debate en vivo dentro de OpenHer.
 *
 * El plugin `debate-room` del server OpenCode emite eventos RPC
 * (`rpc.debate.started|turn|status|acta|done|error`) por el mismo stream
 * `/api/event` que OpenHer ya consume. `useSSEHandler` reemite TODO evento al
 * `pluginBus`, así que acá solo escuchamos — sin tocar el handler SSE.
 */

export type DebateTurn = {
  index: number
  role: string
  body: string
  status: string
  repliesTo?: string
  blockingIssues?: string[]
}

export type DebateState = {
  id: string
  topic: string
  cache: string
  running: boolean
  consensus: boolean
  turns: DebateTurn[]
  acta: string
}

const EMPTY: DebateState = { id: "", topic: "", cache: "shared", running: false, consensus: false, turns: [], acta: "" }

function authHeaders(config: ServerConfig | null): Record<string, string> {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (config?.username && config?.password) headers.authorization = authHeader(config)
  return headers
}

export function useDebateLive(config: ServerConfig | null) {
  const [debates, setDebates] = useState<Record<string, DebateState>>({})
  const [activeID, setActiveID] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dispose = pluginBus.on("*", (payload: any) => {
      const event = payload?.event
      if (typeof event !== "string" || !event.startsWith("rpc.debate.")) return
      const kind = event.slice("rpc.debate.".length)
      // pluginBus entrega { event, payload }; el evento SSE trae el dato en `.data`
      // (shape: { id, created, type, location, data }).
      const envelope = payload?.payload ?? payload ?? {}
      const d = ((envelope as any).data ?? envelope) as Record<string, any>
      const id: string | undefined = d.debateID
      if (!id) return

      setDebates((prev) => {
        const cur = prev[id] ?? { ...EMPTY, id, running: true }
        if (kind === "started") return { ...prev, [id]: { ...cur, topic: d.topic ?? cur.topic, cache: d.cache ?? cur.cache, running: true } }
        if (kind === "turn")
          return {
            ...prev,
            [id]: {
              ...cur,
              running: true,
              turns: [
                ...cur.turns,
                { index: d.index ?? cur.turns.length + 1, role: d.role ?? "?", body: d.body ?? "", status: d.status ?? "UNKNOWN", repliesTo: d.repliesTo || undefined, blockingIssues: d.blockingIssues ?? [] },
              ],
            },
          }
        if (kind === "acta") return { ...prev, [id]: { ...cur, acta: d.text ?? cur.acta, consensus: Boolean(d.consensus) } }
        if (kind === "done") return { ...prev, [id]: { ...cur, running: false, consensus: Boolean(d.consensus) } }
        if (kind === "error") return { ...prev, [id]: { ...cur, running: false, acta: cur.acta || `Error: ${d.message ?? "desconocido"}` } }
        return prev
      })
      setActiveID((cur) => cur ?? id)
    })
    return dispose
  }, [])

  const start = useCallback(
    async (topic: string, cache: "shared" | "isolated" = "shared", files: string[] = []) => {
      setError(null)
      try {
        if (!config) throw new Error("Sin servidor configurado")
        const res = await fetch(`${baseUrl(config)}/api/rpc/debate/start`, {
          method: "POST",
          headers: authHeaders(config),
          body: JSON.stringify({ topic, cache, ...(files.length ? { files } : {}) }),
        })
        if (!res.ok) throw new Error(`RPC debate.start → ${res.status}`)
        const out = (await res.json()) as { debateID?: string }
        if (out?.debateID) setActiveID(out.debateID)
        return out?.debateID
      } catch (err: any) {
        setError(err?.message ?? String(err))
        return undefined
      }
    },
    [config],
  )

  const stop = useCallback(
    async (debateID: string) => {
      try {
        if (!config) return
        await fetch(`${baseUrl(config)}/api/rpc/debate/stop`, {
          method: "POST",
          headers: authHeaders(config),
          body: JSON.stringify({ debateID }),
        })
      } catch {
        /* best-effort */
      }
    },
    [config],
  )

  return { debates, active: activeID ? debates[activeID] ?? null : null, activeID, setActiveID, start, stop, error }
}
