import { useEffect, useState, useRef, useMemo } from "react"
import { useT } from "../i18n-context"
import { useQuickChat } from "../hooks/useQuickChat"
import { STORAGE_KEYS } from "../constants"
import { CEREBRAS_MODELS } from "../providers/cerebras"
import { GROQ_MODELS, createGroqProvider } from "../providers/groq"
import { createOpencodeGoProvider } from "../providers/opencodeGo"
import { createCustomProvider } from "../providers/custom"
import type { QuickChatProviderId } from "../providers/types"
import type { ModelOption, ProviderInfo } from "../types"
import { Markdown } from "./Markdown"
import { LedSwitch } from "./LedSwitch"
import { BrainIcon, SettingsIcon, TrashIcon, CloseIcon } from "../Icons"
import { useDialog } from "./DialogProvider"
import "../styles/quickchat.css"

type Props = {
  cerebrasKey: string
  groqKey?: string
  goKey?: string
  customKey?: string
  customUrl?: string
  config: any
  modelOptions?: ModelOption[]
  providers?: ProviderInfo[]
  onOpenSettings?: () => void
}

function parseThinkContent(raw: string): { think: string | null; response: string } {
  if (!raw) return { think: null, response: "" }
  
  // Case 1: Complete <think>...</think>
  const match = raw.match(/<think>([\s\S]*?)<\/think>/i)
  if (match) {
    const think = match[1].trim()
    const response = raw.replace(/<think>[\s\S]*?<\/think>/i, "").trim()
    return { think, response }
  }

  // Case 2: In-progress streaming <think>... (no closing tag yet)
  const openMatch = raw.match(/<think>([\s\S]*)$/i)
  if (openMatch) {
    return { think: openMatch[1].trim(), response: "" }
  }

  return { think: null, response: raw }
}

function AssistantBubbleContent({ content }: { content: string }) {
  const { think, response } = useMemo(() => parseThinkContent(content), [content])
  const [thinkExpanded, setThinkExpanded] = useState(false)

  return (
    <div>
      {think && (
        <div style={{
          marginBottom: 8,
          borderRadius: 6,
          background: "var(--surface-subtle)",
          border: "1px solid var(--border)",
          padding: "6px 8px",
          fontSize: 12,
        }}>
          <div
            onClick={() => setThinkExpanded(!thinkExpanded)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              userSelect: "none",
              color: "var(--muted)",
              fontWeight: 600,
            }}
          >
            <span> Razonamiento {thinkExpanded ? "▲" : "▼"}</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{think.length} chars</span>
          </div>
          {thinkExpanded && (
            <div style={{
              maxHeight: 130,
              overflowY: "auto",
              marginTop: 6,
              paddingTop: 6,
              borderTop: "1px solid var(--border)",
              color: "var(--muted)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 12,
              whiteSpace: "pre-wrap",
              lineHeight: 1.4,
            }}>
              {think}
            </div>
          )}
        </div>
      )}
      {response ? (
        <Markdown text={response} />
      ) : (
        think && !response ? <span style={{ fontStyle: "italic", opacity: 0.7 }}>Pensando…</span> : null
      )}
    </div>
  )
}

export function QuickChatPanel({
  cerebrasKey,
  groqKey = "",
  goKey = "",
  customKey = "",
  customUrl = "https://api.openai.com/v1",
  config,
  modelOptions = [],
  providers = [],
  onOpenSettings,
}: Props) {
  const t = useT()
  const { alert } = useDialog()
  const [provider, setProvider] = useState<QuickChatProviderId>(() => (localStorage.getItem(STORAGE_KEYS.QUICKCHAT_PROVIDER) as QuickChatProviderId) || "groq")
  const [model, setModel] = useState(() => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_MODEL) || "")
  const [goModels, setGoModels] = useState<{ id: string; label: string }[]>([])
  const [groqModels, setGroqModels] = useState<{ id: string; label: string }[]>(GROQ_MODELS)
  const [customModels, setCustomModels] = useState<{ id: string; label: string }[]>([])
  const [searchEnabled, setSearchEnabled] = useState(() => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_SEARCH) === "1")
  const [input, setInput] = useState("")

  // Quick settings modal/popover (ruedita)
  const [showConfig, setShowConfig] = useState(false)
  const [showKeySecret, setShowKeySecret] = useState(false)
  const [tempKey, setTempKey] = useState("")
  const [tempUrl, setTempUrl] = useState("")
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle")
  const [testError, setTestError] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement>(null)

  // Current active key based on selected provider
  const activeKey = useMemo(() => {
    if (provider === "groq") return groqKey || localStorage.getItem(STORAGE_KEYS.QUICKCHAT_KEY_GROQ) || ""
    if (provider === "cerebras") return cerebrasKey || localStorage.getItem(STORAGE_KEYS.QUICKCHAT_KEY_CEREBRAS) || ""
    if (provider === "opencode-go") return goKey || ""
    if (provider === "custom") return customKey || localStorage.getItem(STORAGE_KEYS.QUICKCHAT_KEY_CUSTOM) || ""
    return ""
  }, [provider, groqKey, cerebrasKey, goKey, customKey])

  const activeCustomUrl = useMemo(() => {
    return customUrl || localStorage.getItem(STORAGE_KEYS.QUICKCHAT_CUSTOM_URL) || "https://api.openai.com/v1"
  }, [customUrl])

  // Sync temp inputs when opening config or changing provider
  useEffect(() => {
    setTempKey(activeKey)
    setTempUrl(activeCustomUrl)
    setTestStatus("idle")
    setTestError(null)
  }, [activeKey, activeCustomUrl, provider, showConfig])

  // Fetch Groq dynamic models when groqKey changes
  useEffect(() => {
    if (provider === "groq") {
      createGroqProvider(activeKey).listModels().then(setGroqModels).catch(() => setGroqModels(GROQ_MODELS))
    }
  }, [provider, activeKey])

  // Fetch Custom models when custom URL/key changes
  useEffect(() => {
    if (provider === "custom") {
      createCustomProvider(activeKey, activeCustomUrl).listModels().then(setCustomModels).catch(() => setCustomModels([]))
    }
  }, [provider, activeKey, activeCustomUrl])

  // Fetch Go models when needed
  useEffect(() => {
    if (provider === "opencode-go" && goKey) {
      createOpencodeGoProvider(goKey).listModels().then(setGoModels).catch(() => setGoModels([]))
    } else {
      setGoModels([])
    }
  }, [provider, goKey])

  // Derive models for active provider
  const availableModels = useMemo(() => {
    if (provider === "cerebras") return CEREBRAS_MODELS
    if (provider === "groq") return groqModels.length > 0 ? groqModels : GROQ_MODELS
    if (provider === "opencode-go") return goModels
    if (provider === "custom") return customModels.length > 0 ? customModels : [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "deepseek-chat", label: "DeepSeek V3" },
      { id: "deepseek-reasoner", label: "DeepSeek R1" },
      { id: "llama3", label: "Llama 3 (Local)" },
    ]
    const filtered = modelOptions.filter(m => m.providerID === provider)
    if (filtered.length === 0) return []
    return filtered.map(m => ({ id: `${m.providerID}/${m.modelID}`, label: m.modelName || m.modelID, provider: m.providerID }))
  }, [provider, modelOptions, goModels, groqModels, customModels])

  // Auto-select first model if empty or invalid for provider
  useEffect(() => {
    const ids = availableModels.map((m: any) => m.id)
    if (ids.length > 0 && (!model || !ids.includes(model))) {
      const fallback = ids[0]
      setModel(fallback)
      try { localStorage.setItem(STORAGE_KEYS.QUICKCHAT_MODEL, fallback) } catch {}
    }
  }, [provider, availableModels, model])

  // Persist selections
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.QUICKCHAT_PROVIDER, provider) } catch {} }, [provider])
  useEffect(() => { if (model) try { localStorage.setItem(STORAGE_KEYS.QUICKCHAT_MODEL, model) } catch {} }, [model])
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.QUICKCHAT_SEARCH, searchEnabled ? "1" : "0") } catch {} }, [searchEnabled])

  const { messages, send, clear, abort, busy, error } = useQuickChat({
    provider,
    model,
    cerebrasKey: activeKey,
    groqKey: activeKey,
    goKey,
    customKey: activeKey,
    customUrl: activeCustomUrl,
    config,
    searchEnabled,
  })

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, busy])

  const onSend = () => {
    const v = input.trim()
    if (!v || !model) return
    setInput("")
    void send(v)
  }

  const handleNewChat = () => {
    clear()
    setInput("")
  }

  const needsKey = (provider === "groq" && !activeKey) || (provider === "cerebras" && !activeKey) || (provider === "opencode-go" && !goKey)

  const activeModelLabel = useMemo(() => {
    const found = availableModels.find((m: any) => m.id === model)
    return found ? found.label : model || "Sin modelo"
  }, [availableModels, model])

  const handleSaveConfig = async () => {
    const val = tempKey.trim()
    const urlVal = tempUrl.trim()
    try {
      if (provider === "groq") {
        localStorage.setItem(STORAGE_KEYS.QUICKCHAT_KEY_GROQ, val)
        try {
          const { shell } = await import("../shell")
          await shell.config.patch({ groq_api_key: val } as any)
        } catch {}
      } else if (provider === "cerebras") {
        localStorage.setItem(STORAGE_KEYS.QUICKCHAT_KEY_CEREBRAS, val)
        try {
          const { shell } = await import("../shell")
          await shell.config.patch({ cerebras_api_key: val } as any)
        } catch {}
      } else if (provider === "opencode-go") {
        const { saveGoAccounts } = await import("../goUsage")
        await saveGoAccounts([val])
      } else if (provider === "custom") {
        localStorage.setItem(STORAGE_KEYS.QUICKCHAT_KEY_CUSTOM, val)
        if (urlVal) localStorage.setItem(STORAGE_KEYS.QUICKCHAT_CUSTOM_URL, urlVal)
      }
      setShowConfig(false)
      window.dispatchEvent(new CustomEvent("quickchat:key-saved"))
    } catch (err: any) {
      void alert({ title: t("common.error") ?? "Error", message: "Error al guardar: " + (err?.message || String(err)) })
    }
  }

  const handleTestConnection = async () => {
    setTestStatus("testing")
    setTestError(null)
    try {
      const val = tempKey.trim()
      const urlVal = tempUrl.trim() || activeCustomUrl
      if (provider === "groq") {
        if (!val) throw new Error("Ingresá una API Key de Groq")
        const p = createGroqProvider(val)
        const models = await p.listModels()
        if (models.length > 0) setTestStatus("ok")
        else throw new Error("No se obtuvieron modelos")
      } else if (provider === "custom") {
        const p = createCustomProvider(val, urlVal)
        const models = await p.listModels()
        if (models.length > 0) setTestStatus("ok")
        else throw new Error("No se pudo conectar al endpoint")
      } else if (provider === "cerebras") {
        if (!val) throw new Error("Ingresá una API Key de Cerebras")
        setTestStatus("ok")
      } else {
        setTestStatus("ok")
      }
    } catch (e: any) {
      setTestStatus("error")
      setTestError(e?.message || String(e))
    }
  }

  return (
    <div className="qc-panel">
      {/* Header Limpio con Ruedita y Botón Nuevo Chat */}
      <div className="qc-header">
        <div className="qc-header-icon"><BrainIcon size={18} /></div>
        <div className="qc-header-text">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="qc-header-title">{t("quickchat.title")}</span>
            <span className="qc-badge" style={{ fontSize: 12, padding: "1px 6px" }} title={`${provider} / ${model}`}>
              {activeModelLabel}
            </span>
          </div>
          <div className="qc-header-subtitle">{t("quickchat.subtitle")}</div>
        </div>
        <div className="qc-header-actions">
          <button
            className="qc-icon-btn"
            onClick={handleNewChat}
            title="Nuevo chat (limpiar todo)"
            aria-label="Nuevo chat"
            style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", width: "auto", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}
          >
            <span>+</span> Nuevo
          </button>
          <button className="qc-icon-btn" onClick={clear} title={t("quickchat.clear")} aria-label={t("quickchat.clear")}><TrashIcon size={14} /></button>
          <button
            className={`qc-icon-btn${showConfig ? " active" : ""}`}
            onClick={() => setShowConfig(!showConfig)}
            title="Configuración de Proveedor y Modelo"
            aria-label="Configurar chat"
          >
            <SettingsIcon size={14} />
          </button>
          {onOpenSettings && (
            <button className="qc-icon-btn" onClick={onOpenSettings} title={t("nav.settings")} aria-label={t("nav.settings")}>
              
            </button>
          )}
        </div>
      </div>

      {/* Config Panel Popover / Modal dentro de la Ruedita */}
      {showConfig && (
        <div style={{ background: "var(--surface-subtle)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, margin: "8px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
               Configuración de Chat Rápido
            </span>
            <button className="btn-icon compact" onClick={() => setShowConfig(false)}><CloseIcon size={12} /></button>
          </div>

          {/* Selector de Proveedor y Modelo dentro de la ruedita */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12 }}>
              <span style={{ color: "var(--muted)" }}>{t("quickchat.provider")}:</span>
              <select
                className="qc-select"
                value={provider}
                onChange={e => setProvider(e.target.value as QuickChatProviderId)}
                style={{ width: "100%", fontSize: 12, padding: "4px 8px" }}
              >
                <option value="groq">{t("quickchat.providerGroq")} (Ultra Rápido)</option>
                <option value="cerebras">{t("quickchat.providerCerebras")}</option>
                <option value="custom">{t("quickchat.providerCustom")}</option>
                {providers.filter(p => p.connected && p.id !== "groq" && p.id !== "cerebras" && p.id !== "custom").map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                {!providers.some(p => p.id === "opencode-go") && <option value="opencode-go">{t("quickchat.providerOpencode")}</option>}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12 }}>
              <span style={{ color: "var(--muted)" }}>{t("quickchat.model")}:</span>
              <select
                className="qc-select"
                value={model}
                onChange={e => setModel(e.target.value)}
                style={{ width: "100%", fontSize: 12, padding: "4px 8px" }}
              >
                <option value="" disabled>{availableModels.length === 0 ? t("settings.noProviders") : t("detail.modelSelectLabel")}</option>
                {availableModels.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="qc-switch" style={{ fontSize: 12, padding: "4px 0" }}>
            <LedSwitch label={t("quickchat.search")} checked={searchEnabled} onChange={setSearchEnabled} />
            <span>{t("quickchat.search")}</span>
            <span style={{ opacity: 0.6, fontSize: 12 }}>{searchEnabled ? t("quickchat.searchOn") : t("quickchat.searchOff")}</span>
          </label>

          {provider === "custom" && (
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              <span style={{ color: "var(--muted)" }}>{t("quickchat.customUrl")}:</span>
              <input
                type="text"
                value={tempUrl}
                onChange={e => setTempUrl(e.target.value)}
                placeholder="https://api.openai.com/v1 o http://localhost:11434/v1"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", fontSize: 12, color: "var(--text)" }}
              />
            </label>
          )}

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span style={{ color: "var(--muted)" }}>
              {provider === "groq" ? "Groq API Key (gsk_...)" : provider === "cerebras" ? "Cerebras API Key (csk-...)" : provider === "custom" ? "API Key (opcional si es Ollama/local)" : "API Key"}:
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type={showKeySecret ? "text" : "password"}
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                placeholder={provider === "groq" ? "gsk_..." : provider === "cerebras" ? "csk-..." : "sk-..."}
                style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", fontSize: 12, color: "var(--text)" }}
              />
              <button className="btn-secondary compact" type="button" onClick={() => setShowKeySecret(!showKeySecret)} title={showKeySecret ? "Ocultar" : "Mostrar"}>
                {showKeySecret ? "" : ""}
              </button>
            </div>
          </label>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button className="btn-secondary compact" type="button" onClick={handleTestConnection} disabled={testStatus === "testing"}>
                {testStatus === "testing" ? "Probando..." : t("quickchat.testConnection")}
              </button>
              {testStatus === "ok" && <span style={{ color: "var(--success)", fontSize: 12, fontWeight: 600 }}> {t("quickchat.connected")}</span>}
              {testStatus === "error" && <span style={{ color: "var(--danger)", fontSize: 12 }} title={testError || ""}> Error de conexión</span>}
            </div>

            <button className="btn-primary compact" type="button" onClick={handleSaveConfig} style={{ padding: "6px 14px" }}>
              {t("settings.save")}
            </button>
          </div>
        </div>
      )}

      {/* Warning banner when key is missing */}
      {needsKey && !showConfig && (
        <div className="qc-config-banner">
          <span>️ {provider === "groq" ? t("quickchat.errorNoKeyGroq") : provider === "cerebras" ? t("quickchat.errorNoKey") : "Configurá tu clave de API"}</span>
          <button className="qc-config-btn" onClick={() => setShowConfig(true)}>
            {t("settings.connect")}
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={listRef} className="qc-messages">
        {messages.length === 0 && (
          <div className="qc-empty">
            <div className="qc-empty-icon"></div>
            <div className="qc-empty-text">{t("quickchat.empty")}</div>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`qc-bubble ${m.role === "user" ? "user" : "assistant"}`}>
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {m.role === "assistant" ? (
                <AssistantBubbleContent content={m.content} />
              ) : (
                m.content
              )}
            </div>
            {m.cached && <div className="qc-bubble-meta"><span className="qc-badge">{t("quickchat.cached")}</span></div>}
            {m.searchResults && m.searchResults.length > 0 && (
              <div className="qc-search-results">
                {m.searchResults.map(r => (
                  <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="qc-search-link">
                    ↗ {r.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="qc-thinking">{t("quickchat.thinking")}</div>}
        {error && <div className="qc-error">{t(error as any) || error}</div>}
      </div>

      {/* Composer */}
      <div className="qc-composer">
        <textarea
          className="qc-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend() } }}
          placeholder={t("quickchat.placeholder")}
          rows={1}
          aria-label={t("quickchat.placeholder")}
        />
        {busy ? (
          <button className="qc-stop" onClick={abort}>{t("composer.stop")}</button>
        ) : (
          <button className="qc-send" onClick={onSend} disabled={!input.trim() || !model}>{t("quickchat.send")} →</button>
        )}
      </div>
    </div>
  )
}
