import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { STORAGE_KEYS, QUICKCHAT_CACHE_TTL_MS } from "../constants"
import { shell } from "../shell"
import { getQuickChatProvider, type QuickChatMessage, type QuickChatProviderId } from "../providers"
import type { ServerConfig } from "../types"

type QCState = QuickChatMessage & { id: string }

function hashKey(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return String(h)
}

function loadStored(): QCState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUICKCHAT)
    if (!raw) return []
    const arr = JSON.parse(raw) as QCState[]
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function useQuickChat(opts: {
  provider: QuickChatProviderId
  model: string
  cerebrasKey: string
  groqKey?: string
  goKey?: string
  customKey?: string
  customUrl?: string
  config: ServerConfig | null
  searchEnabled: boolean
}) {
  const [messages, setMessages] = useState<QCState[]>(() => loadStored())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.QUICKCHAT, JSON.stringify(messages.slice(-30))) } catch {}
  }, [messages])

  const provider = useMemo(
    () =>
      getQuickChatProvider(opts.provider, {
        cerebrasKey: opts.cerebrasKey,
        groqKey: opts.groqKey ?? "",
        goKey: opts.goKey ?? "",
        customKey: opts.customKey ?? "",
        customUrl: opts.customUrl,
        config: opts.config,
      }),
    [opts.provider, opts.cerebrasKey, opts.groqKey, opts.goKey, opts.customKey, opts.customUrl, opts.config]
  )

  // simple answer cache in localStorage (hash -> {text,time})
  const getCachedAnswer = useCallback((question: string, searchSnippets: string): string | null => {
    try {
      const key = `qc:${hashKey(opts.provider + "|" + opts.model + "|" + question + "|" + searchSnippets)}`
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const obj = JSON.parse(raw) as { text: string; t: number }
      if (Date.now() - obj.t > QUICKCHAT_CACHE_TTL_MS) { localStorage.removeItem(key); return null }
      return obj.text
    } catch { return null }
  }, [opts.provider, opts.model])

  const setCachedAnswer = useCallback((question: string, searchSnippets: string, text: string) => {
    try {
      const key = `qc:${hashKey(opts.provider + "|" + opts.model + "|" + question + "|" + searchSnippets)}`
      localStorage.setItem(key, JSON.stringify({ text, t: Date.now() }))
    } catch {}
  }, [opts.provider, opts.model])

  const send = useCallback(async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    setError(null)
    const userMsg: QCState = { id: `u${Date.now()}`, role: "user", content: q }
    setMessages(prev => [...prev, userMsg])
    // web search if enabled
    let searchResults: { title: string; url: string; snippet: string }[] | undefined
    let searchBlock = ""
    if (opts.searchEnabled) {
      try {
        const r = await shell.search.query(q).catch(() => null) as any
        const arr = r?.results ?? r?.data?.results ?? []
        if (Array.isArray(arr) && arr.length) {
          searchResults = arr.slice(0, 3)
          searchBlock = searchResults.map(r => `- ${r.title}: ${r.snippet} (${r.url})`).join("\n")
        }
      } catch {}
    }
    const cached = getCachedAnswer(q, searchBlock)
    if (cached) {
      setMessages(prev => [...prev, { id: `a${Date.now()}`, role: "assistant", content: cached, cached: true, searchResults }])
      return
    }
    setBusy(true)
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    try {
      const hist: QuickChatMessage[] = [...messages, userMsg].map(m => ({ role: m.role as any, content: m.content }))
      const toSend: QuickChatMessage[] = searchBlock
        ? [{ role: "system", content: `Contexto web (usa si responde la pregunta, cita URLs si es útil):\n${searchBlock}` }, ...hist.slice(-6)]
        : hist.slice(-8)

      const assistantId = `a${Date.now()}`
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", searchResults }])
      let acc = ""
      const res = await provider.chat(toSend, {
        model: opts.model,
        signal: ac.signal,
        onChunk: (chunk: string) => {
          acc += chunk
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: acc } : m))
        },
      })
      const finalText = (res.text || acc).trim()
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: finalText } : m))
      setCachedAnswer(q, searchBlock, finalText)
    } catch (e: any) {
      const msg = e?.message ?? String(e)
      if (msg === "NO_KEY" || msg === "NO_KEY_GROQ") setError(provider.id === "groq" ? "quickchat.errorNoKeyGroq" : "quickchat.errorNoKey")
      else if (msg.includes("Rate limit")) setError("quickchat.errorRateLimit")
      else setError(msg)
    } finally {
      setBusy(false)
    }
  }, [busy, getCachedAnswer, messages, opts.model, opts.searchEnabled, provider, setCachedAnswer])

  const clear = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    try { localStorage.removeItem(STORAGE_KEYS.QUICKCHAT) } catch {}
  }, [])

  const abort = useCallback(() => { abortRef.current?.abort(); setBusy(false) }, [])

  return { messages, send, clear, abort, busy, error, setMessages }
}
