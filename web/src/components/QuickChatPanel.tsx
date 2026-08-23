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
import { BrainIcon, SettingsIcon, TrashIcon } from "../Icons"
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
  const [provider, setProvider] = useState<QuickChatProviderId>(() => (localStorage.getItem(STORAGE_KEYS.QUICKCHAT_PROVIDER) as QuickChatProviderId) || "groq")
  const [model, setModel] = useState(() => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_MODEL) || "")
  const [goModels, setGoModels] = useState<{ id: string; label: string }[]>([])
  const [groqModels, setGroqModels] = useState<{ id: string; label: string }[]>(GROQ_MODELS)
  const [customModels, setCustomModels] = useState<{ id: string; label: string }[]>([])
  const [searchEnabled, setSearchEnabled] = useState(() => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_SEARCH) === "1")
  const [input, setInput] = useState("")

  // Quick settings modal/popover
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

  const needsKey = (provider === "groq" && !activeKey) || (provider === "cerebras" && !activeKey) || (provider === "opencode-go" && !goKey)

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
      alert("Error al guardar: " + (err?.message || String(err)))
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
      {/* Header */}
      <div className="qc-header">
        <div className="qc-header-icon"><BrainIcon size={18} /></div>
        <div className="qc-header-text">
          <div className="qc-header-title">{t("quickchat.title")}</div>
          <div className="qc-header-subtitle">{t("quickchat.subtitle")}</div>
        </div>
        <div className="qc-header-actions">
          <button className="qc-icon-btn" onClick={clear} title={t("quickchat.clear")} aria-label={t("quickchat.clear")}><TrashIcon size={14} /></button>
          <button
            className={`qc-icon-btn${showConfig ? " active" : ""}`}
            onClick={() => setShowConfig(!showConfig)}
            title="Configurar conexión del proveedor"
            aria-label="Configuración de conexión"
          >
            <SettingsIcon size={14} />
          </button>
          {onOpenSettings && (
            <button className="qc-icon-btn" onClick={onOpenSettings} title={t("nav.settings")} aria-label={t("nav.settings")}>
              ⚙
            </button>
          )}
        </div>
      </div>

      {/* Selector Controls */}
      <div className="qc-controls">
        <label className="qc-control-group">
          <span>{t("quickchat.provider")}</span>
          <select className="qc-select" value={provider} onChange={e => setProvider(e.target.value as QuickChatProviderId)}>
            <option value="groq">{t("quickchat.providerGroq")} (Ultra Rápido)</option>
            <option value="cerebras">{t("quickchat.providerCerebras")}</option>
            <option value="custom">{t("quickchat.providerCustom")}</option>
            {providers.filter(p => p.connected && p.id !== "groq" && p.id !== "cerebras" && p.id !== "custom").map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            {!providers.some(p => p.id === "opencode-go") && <option value="opencode-go">{t("quickchat.providerOpencode")}</option>}
          </select>
        </label>

        <label className="qc-control-group">
          <span>{t("quickchat.model")}</span>
          <select className="qc-select" value={model} onChange={e => setModel(e.target.value)}>
            <option value="" disabled>{availableModels.length === 0 ? t("settings.noProviders") : t("detail.modelSelectLabel")}</option>
            {availableModels.map((m: any) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </label>

        <label className="qc-switch">
          <input type="checkbox" checked={searchEnabled} onChange={e => setSearchEnabled(e.target.checked)} />
          <span>{t("quickchat.search")}</span>
          <span style={{ opacity: 0.6, fontSize: 11 }}>{searchEnabled ? t("quickchat.searchOn") : t("quickchat.searchOff")}</span>
        </label>
      </div>

      {/* Config Panel Popover / Inline Card */}
      {showConfig && (
        <div style={{ background: "var(--surface-subtle)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, margin: "8px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
              ⚙ Configuración de {provider === "groq" ? "Groq" : provider === "cerebras" ? "Cerebras" : provider === "custom" ? "API Personalizada (OpenAI / Ollama)" : "Proveedor"}
            </span>
            <button className="btn-icon compact" onClick={() => setShowConfig(false)}>✕</button>
          </div>

          {provider === "custom" && (
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
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

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
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
                {showKeySecret ? "🙈" : "👁"}
              </button>
            </div>
          </label>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button className="btn-secondary compact" type="button" onClick={handleTestConnection} disabled={testStatus === "testing"}>
                {testStatus === "testing" ? "Probando..." : t("quickchat.testConnection")}
              </button>
              {testStatus === "ok" && <span style={{ color: "#3fb950", fontSize: 11, fontWeight: 600 }}>✓ {t("quickchat.connected")}</span>}
              {testStatus === "error" && <span style={{ color: "#f85149", fontSize: 11 }} title={testError || ""}>✗ Error de conexión</span>}
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
          <span>⚠️ {provider === "groq" ? t("quickchat.errorNoKeyGroq") : provider === "cerebras" ? t("quickchat.errorNoKey") : "Configurá tu clave de API"}</span>
          <button className="qc-config-btn" onClick={() => setShowConfig(true)}>
            {t("settings.connect")}
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={listRef} className="qc-messages">
        {messages.length === 0 && (
          <div className="qc-empty">
            <div className="qc-empty-icon">💬</div>
            <div className="qc-empty-text">{t("quickchat.empty")}</div>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`qc-bubble ${m.role === "user" ? "user" : "assistant"}`}>
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {m.role === "assistant" ? <Markdown text={m.content} /> : m.content}
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
