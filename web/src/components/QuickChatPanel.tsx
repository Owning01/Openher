import { useEffect, useState, useRef } from "react"
import { useT } from "../i18n-context"
import { useQuickChat } from "../hooks/useQuickChat"
import { STORAGE_KEYS } from "../constants"
import { CEREBRAS_MODELS } from "../providers/cerebras"
import type { QuickChatProviderId } from "../providers/types"
import type { ServerConfig } from "../types"
import { Markdown } from "./Markdown"

export function QuickChatPanel(props: { cerebrasKey: string; config: ServerConfig | null }) {
  const t = useT()
  const [provider, setProvider] = useState<QuickChatProviderId>(() => (localStorage.getItem(STORAGE_KEYS.QUICKCHAT_PROVIDER) as QuickChatProviderId) || "cerebras")
  const [model, setModel] = useState(() => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_MODEL) || CEREBRAS_MODELS[0].id)
  const [searchEnabled, setSearchEnabled] = useState(() => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_SEARCH) === "1")
  const [input, setInput] = useState("")
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.QUICKCHAT_PROVIDER, provider) } catch {} }, [provider])
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.QUICKCHAT_MODEL, model) } catch {} }, [model])
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.QUICKCHAT_SEARCH, searchEnabled ? "1" : "0") } catch {} }, [searchEnabled])

  const { messages, send, clear, abort, busy, error } = useQuickChat({ provider, model, cerebrasKey: props.cerebrasKey, config: props.config, searchEnabled })

  useEffect(() => {
    const validIds = provider === "cerebras" ? CEREBRAS_MODELS.map(m => m.id) : ["opencode-go/muse-spark-1.2-contributor", "opencode-go/deepseek-v4-flash"]
    if (!validIds.includes(model)) setModel(validIds[0])
  }, [provider])

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }) }, [messages, busy])

  const onSend = () => {
    const v = input.trim()
    if (!v) return
    setInput("")
    void send(v)
  }

  const models = provider === "cerebras" ? CEREBRAS_MODELS : [{ id: "opencode-go", label: "OpenCode Go" }]

  return (
    <div className="qc-panel" style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8, padding: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ fontSize: 13 }}>{t("quickchat.title")}</strong>
        <span style={{ fontSize: 12, opacity: 0.6 }}>{t("quickchat.subtitle")}</span>
        <span style={{ flex: 1 }} />
        <button className="btn-icon" onClick={clear} title={t("quickchat.clear")} aria-label={t("quickchat.clear")} style={{ fontSize: 12 }}>✕</button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ fontSize: 12, display: "flex", gap: 4, alignItems: "center" }}>
          {t("quickchat.provider")}
          <select value={provider} onChange={e => setProvider(e.target.value as QuickChatProviderId)} style={{ fontSize: 12, padding: "2px 4px" }}>
            <option value="cerebras">{t("quickchat.providerCerebras")}</option>
            <option value="opencode-go">{t("quickchat.providerOpencode")}</option>
          </select>
        </label>
        <label style={{ fontSize: 12, display: "flex", gap: 4, alignItems: "center" }}>
          {t("quickchat.model")}
          <select value={model} onChange={e => setModel(e.target.value)} style={{ fontSize: 12, padding: "2px 4px", maxWidth: 160 }}>
            {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" className="switch-checkbox" checked={searchEnabled} onChange={e => setSearchEnabled(e.target.checked)} />
          {t("quickchat.search")} <span style={{ opacity: 0.7, fontSize: 11 }}>{searchEnabled ? t("quickchat.searchOn") : t("quickchat.searchOff")}</span>
        </label>
      </div>

      <div ref={listRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "6px 2px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-muted, #fafafa)" }}>
        {messages.length === 0 && <div style={{ fontSize: 13, opacity: 0.6, padding: 12, textAlign: "center" }}>{t("quickchat.empty")}</div>}
        {messages.map(m => (
          <div key={m.id} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%", padding: "8px 10px", borderRadius: 12,
            background: m.role === "user" ? "var(--accent, #3b82f6)" : "var(--card, #fff)",
            color: m.role === "user" ? "#fff" : "inherit",
            fontSize: 13, lineHeight: 1.4, boxShadow: "0 1px 2px rgba(0,0,0,0.06)"
          }}>
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {m.role === "assistant" ? <Markdown text={m.content} /> : m.content}
            </div>
            {m.cached && <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>{t("quickchat.cached")}</div>}
            {m.searchResults && m.searchResults.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, opacity: 0.8 }}>
                {m.searchResults.map(r => <div key={r.url}><a href={r.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>{r.title}</a></div>)}
              </div>
            )}
          </div>
        ))}
        {busy && <div style={{ fontSize: 12, opacity: 0.6, padding: "4px 8px" }}>{t("quickchat.thinking")}</div>}
        {error && <div style={{ fontSize: 12, color: "var(--danger, #ef4444)", padding: "4px 8px" }}>{t(error as any) || error}</div>}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend() } }}
          placeholder={t("quickchat.placeholder")}
          rows={2}
          style={{ flex: 1, resize: "none", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
          aria-label={t("quickchat.placeholder")}
        />
        {busy ? (
          <button onClick={abort} style={{ padding: "0 12px", borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer" }}>{t("composer.stop")}</button>
        ) : (
          <button onClick={onSend} disabled={!input.trim()} style={{ padding: "0 14px", borderRadius: 8, border: "none", background: "var(--accent, #3b82f6)", color: "#fff", cursor: input.trim() ? "pointer" : "not-allowed", opacity: input.trim() ? 1 : 0.6 }}>{t("quickchat.send")}</button>
        )}
      </div>
    </div>
  )
}
