import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { STORAGE_KEYS, QUICKCHAT_CACHE_TTL_MS } from "../constants"
import { shell } from "../shell"
import { getQuickChatProvider, type QuickChatMessage, type QuickChatProviderId } from "../providers"
import type { ServerConfig } from "../types"
import { QC_SYSTEM_PROMPT, QC_SYSTEM_PROMPT_RESEARCH } from "../utils/promptCache"

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
  researchMode?: boolean
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
    // Investigación profunda: web search + contexto enriquecido
    // CRÍTICO para prompt caching: el searchBlock NO va como system nuevo (invalidaría el prefix cacheado).
    // Se fusiona al ÚLTIMO user message → prefix (system + historial) queda estable y cacheable.
    let searchResults: { title: string; url: string; snippet: string }[] | undefined
    let searchBlock = ""
    const needSearch = opts.searchEnabled || opts.researchMode
    if (needSearch) {
      try {
        const r = await shell.search.query(q).catch(() => null) as any
        const arr = r?.results ?? r?.data?.results ?? r?.data ?? []
        const list = Array.isArray(arr) ? arr : Array.isArray(r) ? r : []
        if (list.length) {
          searchResults = list.slice(0, opts.researchMode ? 5 : 3)
          const header = opts.researchMode
            ? "Contexto web ampliado (usa para investigar, cita URLs, genera diagrama mermaid si ayuda):"
            : "Contexto web (usa si responde la pregunta, cita URLs si es útil):"
          searchBlock = `${header}\n${searchResults.map(r => `- ${r.title}: ${r.snippet} (${r.url})`).join("\n")}`
          // En modo investigación, intentar enriquecer el top result vía proxy (texto real)
          if (opts.researchMode && searchResults[0]?.url) {
            try {
              const prox = await shell.proxy.fetch(searchResults[0].url, { headers: { Accept: "text/html" } } as any).then(rr => rr.text()).catch(() => "")
              if (prox && prox.length > 500) {
                // extraer texto plano básico sin traer todo el HTML (truncado 4k)
                const textOnly = prox.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000)
                if (textOnly.length > 400) searchBlock += `\n\n[Contenido ampliado de ${searchResults[0].title}]:\n${textOnly.slice(0, 3500)}`
              }
            } catch {}
          }
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
      // Harness caching: historial estable + system cacheado, searchBlock fusionado al último user
      const isOpencode = opts.provider === "opencode"
      // Para opencode-local, no reenviamos historial (la sesión del server ya lo tiene) — solo el prompt nuevo con search
      let toSend: QuickChatMessage[]
      if (isOpencode) {
        const enriched = searchBlock ? `${q}\n\n${searchBlock}` : q
        toSend = [{ role: "user", content: enriched }]
        // pero el provider ignorará historia y usará solo esto; igual lo pasamos consistente
      } else {
        const hist: QuickChatMessage[] = [...messages, userMsg].map(m => ({ role: m.role as any, content: m.content }))
        if (searchBlock) {
          // Fusionar al último user para no romper prefix cacheable
          const lastIdx = hist.length - 1
          hist[lastIdx] = { ...hist[lastIdx]!, content: `${hist[lastIdx]!.content}\n\n${searchBlock}` }
        }
        // Ventana 8, system inyectado por el provider (no aquí) — aquí mandamos solo user/assistant
        toSend = hist.slice(-8)
      }
      const assistantId = `a${Date.now()}`
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", searchResults }])
      let acc = ""
      const systemPrompt = opts.researchMode ? QC_SYSTEM_PROMPT_RESEARCH : QC_SYSTEM_PROMPT
      const res = await provider.chat(toSend, {
        model: opts.model,
        signal: ac.signal,
        systemPrompt,
        onChunk: (chunk: string) => {
          acc += chunk
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: acc } : m))
        },
      } as any)
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
  }, [busy, getCachedAnswer, messages, opts.model, opts.searchEnabled, opts.researchMode, provider, setCachedAnswer])

  const clear = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    try { localStorage.removeItem(STORAGE_KEYS.QUICKCHAT) } catch {}
  }, [])

  const abort = useCallback(() => { abortRef.current?.abort(); setBusy(false) }, [])

  return { messages, send, clear, abort, busy, error, setMessages }
}
