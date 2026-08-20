import { useEffect, useState, useRef, useMemo } from "react"
import { useT } from "../i18n-context"
import { useQuickChat } from "../hooks/useQuickChat"
import { STORAGE_KEYS } from "../constants"
import { CEREBRAS_MODELS } from "../providers/cerebras"
import { GROQ_MODELS } from "../providers/groq"
import type { QuickChatProviderId } from "../providers/types"
import type { ModelOption, ProviderInfo } from "../types"
import { Markdown } from "./Markdown"
import { BrainIcon, SettingsIcon, TrashIcon } from "../Icons"
import "../styles/quickchat.css"

type Props = {
  cerebrasKey: string
  groqKey?: string
  config: any
  modelOptions?: ModelOption[]
  providers?: ProviderInfo[]
  onOpenSettings?: () => void
}

export function QuickChatPanel({ cerebrasKey, groqKey = "", config, modelOptions = [], providers = [], onOpenSettings }: Props) {
  const t = useT()
  const [provider, setProvider] = useState<QuickChatProviderId>(() => (localStorage.getItem(STORAGE_KEYS.QUICKCHAT_PROVIDER) as QuickChatProviderId) || "groq")
  const [model, setModel] = useState(() => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_MODEL) || GROQ_MODELS[0].id)
  const [searchEnabled, setSearchEnabled] = useState(() => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_SEARCH) === "1")
  const [input, setInput] = useState("")
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [tempKey, setTempKey] = useState(provider === "groq" ? groqKey : cerebrasKey)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.QUICKCHAT_PROVIDER, provider) } catch {} }, [provider])
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.QUICKCHAT_MODEL, model) } catch {} }, [model])
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.QUICKCHAT_SEARCH, searchEnabled ? "1" : "0") } catch {} }, [searchEnabled])
  useEffect(() => setTempKey(provider === "groq" ? groqKey : cerebrasKey), [cerebrasKey, groqKey, provider])

  const { messages, send, clear, abort, busy, error } = useQuickChat({ provider, model, cerebrasKey, groqKey, config, searchEnabled })

  // Derive models for active provider — only expose what API has
  const availableModels = useMemo(() => {
    if (provider === "cerebras") return CEREBRAS_MODELS
    if (provider === "groq") return GROQ_MODELS
    const filtered = modelOptions.filter(m => m.providerID === provider || (m.providerID === "opencode-go" && provider === "opencode-go"))
    if (filtered.length === 0 && provider === "opencode-go") {
      return [{ id: "opencode-go/muse-spark-1.2-contributor", label: "Muse Spark" } as any]
    }
    if (filtered.length === 0) return []
    return filtered.map(m => ({ id: `${m.providerID}/${m.modelID}`, label: m.modelName || m.modelID, provider: m.providerID }))
  }, [provider, modelOptions])

  // Keep selected model valid for current provider
  useEffect(() => {
    const ids = availableModels.map((m: any) => m.id)
    if (ids.length && !ids.includes(model)) setModel(ids[0])
  }, [provider, availableModels])

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }) }, [messages, busy])

  const onSend = () => {
    const v = input.trim()
    if (!v) return
    setInput("")
    void send(v)
  }

  const needsCerebrasKey = provider === "cerebras" && !cerebrasKey
  const needsGroqKey = provider === "groq" && !groqKey
  const providerInfo = providers.find(p => p.id === provider)
  const needsProviderConfig = provider !== "cerebras" && provider !== "groq" && providerInfo && !providerInfo.connected && availableModels.length === 0

  const handleSaveKey = async () => {
    if (!tempKey.trim()) return
    try {
      const { shell } = await import("../shell")
      const patch = provider === "groq" ? { groq_api_key: tempKey.trim() } : { cerebras_api_key: tempKey.trim() }
      await shell.config.patch(patch as any)
      setShowKeyInput(false)
      window.location.reload()
    } catch {}
  }

  return (
    <div className="qc-panel">
      <div className="qc-header">
        <div className="qc-header-icon"><BrainIcon size={18} /></div>
        <div className="qc-header-text">
          <div className="qc-header-title">{t("quickchat.title")}</div>
          <div className="qc-header-subtitle">{t("quickchat.subtitle")}</div>
        </div>
        <div className="qc-header-actions">
          <button className="qc-icon-btn" onClick={clear} title={t("quickchat.clear")} aria-label={t("quickchat.clear")}><TrashIcon size={14} /></button>
          {onOpenSettings && <button className="qc-icon-btn" onClick={onOpenSettings} title={t("nav.settings")} aria-label={t("nav.settings")}><SettingsIcon size={14} /></button>}
        </div>
      </div>

      <div className="qc-controls">
        <label className="qc-control-group">
          <span>{t("quickchat.provider")}</span>
          <select className="qc-select" value={provider} onChange={e => setProvider(e.target.value as QuickChatProviderId)}>
            <option value="groq">{t("quickchat.providerGroq")}</option>
            <option value="cerebras">{t("quickchat.providerCerebras")}</option>
            {providers.filter(p => p.connected && p.id !== "groq" && p.id !== "cerebras").map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            {!providers.some(p => p.id === "opencode-go") && <option value="opencode-go">{t("quickchat.providerOpencode")}</option>}
          </select>
        </label>
        <label className="qc-control-group">
          <span>{t("quickchat.model")}</span>
          <select className="qc-select" value={model} onChange={e => setModel(e.target.value)}>
            {availableModels.length === 0 ? <option value="">{t("settings.noProviders")}</option> : availableModels.map((m: any) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <label className="qc-switch">
          <input type="checkbox" checked={searchEnabled} onChange={e => setSearchEnabled(e.target.checked)} />
          <span>{t("quickchat.search")}</span>
          <span style={{ opacity: 0.6, fontSize: 11 }}>{searchEnabled ? t("quickchat.searchOn") : t("quickchat.searchOff")}</span>
        </label>
      </div>

      {(needsCerebrasKey || needsGroqKey) && (
        <div className="qc-config-banner">
          <span>⚠️ {needsGroqKey ? t("quickchat.errorNoKeyGroq") : t("quickchat.errorNoKey")}</span>
          {!showKeyInput ? (
            <button className="qc-config-btn" onClick={() => setShowKeyInput(true)}>{t("settings.connect")}</button>
          ) : (
            <span style={{ display: "flex", gap: 6, flex: 1 }}>
              <input value={tempKey} onChange={e => setTempKey(e.target.value)} placeholder={needsGroqKey ? t("quickchat.settingsKeyGroqPlaceholder") : t("quickchat.settingsKeyPlaceholder")} style={{ flex: 1, minHeight: 32, fontSize: 12 }} />
              <button className="qc-send" style={{ minHeight: 32, padding: "0 12px" }} onClick={handleSaveKey}>{t("settings.save")}</button>
            </span>
          )}
          {onOpenSettings && <button className="qc-config-btn" onClick={onOpenSettings}>{t("settings.title")}</button>}
        </div>
      )}

      {needsProviderConfig && (
        <div className="qc-config-banner">
          <span>{t("settings.notConnected")} — {provider}</span>
          {onOpenSettings && <button className="qc-config-btn" onClick={onOpenSettings}>{t("settings.connect")}</button>}
        </div>
      )}

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
                {m.searchResults.map(r => <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="qc-search-link">↗ {r.title}</a>)}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="qc-thinking">{t("quickchat.thinking")}</div>}
        {error && <div className="qc-error">{t(error as any) || error}</div>}
      </div>

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
          <button className="qc-send" onClick={onSend} disabled={!input.trim()}>{t("quickchat.send")} →</button>
        )}
      </div>
    </div>
  )
}
