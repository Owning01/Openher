import { memo, useCallback, useEffect, useState } from "react"
import { useT } from "../i18n-context"
import { shell, type ZenGoKeySource, type ZenGoUsage, type ZenGoWindow } from "../shell"
import { RefreshIcon, ChevronDownIcon, ChevronRightIcon, EyeIcon, EyeOffIcon } from "../Icons"
import { GO_MODELS_REF, formatReset, usageTone } from "../data/goModels"

type ZenGoModelLite = { id: string }

const TONE_COLOR: Record<string, string> = { ok: "#59d4a0", warn: "#e0b15e", bad: "#f2777a" }

function WindowRow({ label, window }: { label: string; window: ZenGoWindow }) {
  const t = useT()
  const pct = Math.max(0, Math.min(100, Math.round(window.percent ?? 0)))
  const tone = usageTone(pct)
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{label}</span>
        <span style={{ fontSize: "0.8rem" }}>
          <strong style={{ color: TONE_COLOR[tone] }}>{pct}%</strong>
          <span style={{ color: "var(--muted)" }}> · {t("go.resets")} {formatReset(window.resetsAt)}</span>
          {window.status && window.status !== "ok" ? (
            <span style={{ color: TONE_COLOR.bad }}> · {window.status}</span>
          ) : null}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ height: 6, borderRadius: 3, background: "var(--surface-2, #2a2f3a)", overflow: "hidden" }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: TONE_COLOR[tone], transition: "width 0.3s" }} />
      </div>
    </div>
  )
}

export type GoUsageState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; usage: ZenGoUsage; models: ZenGoModelLite[]; source: ZenGoKeySource | null }

/** Carga uso + modelos + origen de key de Go por el puente del desktop. */
export function useGoUsage() {
  const t = useT()
  const [state, setState] = useState<GoUsageState>({ kind: "loading" })

  const load = useCallback(() => {
    setState({ kind: "loading" })
    Promise.all([
      shell.zenGo.usage(),
      shell.zenGo.models(),
      shell.zenGo.keyStatus().catch(() => null),
    ])
      .then(([usage, models, keyStatus]) => {
        const u = usage?.usage
        const list = Array.isArray(models?.data) ? models.data : []
        if (!u || !u.rolling || !u.weekly || !u.monthly) {
          setState({ kind: "error", message: t("go.badResponse") })
          return
        }
        setState({
          kind: "ready",
          usage,
          models: list.map((m) => ({ id: String(m.id) })),
          source: keyStatus?.source ?? null,
        })
      })
      .catch((e) => setState({ kind: "error", message: (e as Error)?.message || t("go.unavailable") }))
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  return { state, reload: load }
}

export const GoUsagePanel = memo(function GoUsagePanel() {
  const t = useT()
  const { state, reload } = useGoUsage()
  const [showModels, setShowModels] = useState(false)
  const [editingKey, setEditingKey] = useState(false)
  const [keyDraft, setKeyDraft] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [keyBusy, setKeyBusy] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)

  const saveKey = useCallback(() => {
    const value = keyDraft.trim()
    if (!value || keyBusy) return
    setKeyBusy(true)
    setKeyError(null)
    shell.zenGo
      .setKey(value)
      .then(() => {
        setKeyDraft("")
        setEditingKey(false)
        reload()
      })
      .catch((e) => setKeyError((e as Error)?.message || t("go.unavailable")))
      .finally(() => setKeyBusy(false))
  }, [keyDraft, keyBusy, reload, t])

  const clearKey = useCallback(() => {
    if (keyBusy) return
    setKeyBusy(true)
    setKeyError(null)
    shell.zenGo
      .clearKey()
      .then(() => reload())
      .catch((e) => setKeyError((e as Error)?.message || t("go.unavailable")))
      .finally(() => setKeyBusy(false))
  }, [keyBusy, reload, t])

  return (
    <div className="setting-item-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <span className="setting-item-title">{t("go.title")}</span>
          <p className="setting-item-desc">{t("go.subtitle")}</p>
        </div>
        <button className="ag-btn-open" onClick={reload} aria-label={t("go.refresh")}>
          <RefreshIcon size={14} /> {t("go.refresh")}
        </button>
      </div>

      {state.kind === "loading" && <p className="subtle" style={{ fontSize: "0.82rem" }}>{t("go.loading")}</p>}
      {state.kind === "error" && (
        <>
          <div className="notice error">{state.message}</div>
          <button
            className="setting-item-link"
            onClick={() => { setEditingKey((v) => !v); setKeyError(null) }}
            style={{ marginTop: 6, alignSelf: "flex-start", cursor: "pointer", background: "none", border: "none" }}
          >
            {t("go.changeKey")}
          </button>
        </>
      )}
      {state.kind === "ready" && (
        <>
          {state.source ? (
            <p className="subtle" style={{ fontSize: "0.8rem", margin: "0 0 8px" }}>
              {state.source === "custom" ? t("go.sourceCustom") : t("go.sourceAuth")}{" "}
              <button
                className="setting-item-link"
                onClick={() => { setEditingKey((v) => !v); setKeyError(null) }}
                style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
              >
                {t("go.changeKey")}
              </button>
              {state.source === "custom" ? (
                <>
                  {" · "}
                  <button
                    className="setting-item-link"
                    onClick={clearKey}
                    disabled={keyBusy}
                    style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
                  >
                    {t("go.useTuiKey")}
                  </button>
                </>
              ) : null}
            </p>
          ) : null}
          <WindowRow label={t("go.rolling")} window={state.usage.usage.rolling} />
          <WindowRow label={t("go.weekly")} window={state.usage.usage.weekly} />
          <WindowRow label={t("go.monthly")} window={state.usage.usage.monthly} />
          <button
            className="setting-item-link"
            onClick={() => setShowModels((v) => !v)}
            style={{ marginTop: 4, alignSelf: "flex-start", cursor: "pointer", background: "none", border: "none", display: "flex", alignItems: "center", gap: 4 }}
          >
            {showModels ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
            {t("go.models", { count: state.models.length })}
          </button>
          {showModels && (
            <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, fontSize: "0.8rem" }}>
              {state.models.map((m) => {
                const ref = GO_MODELS_REF[m.id]
                return (
                  <li
                    key={m.id}
                    style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border, #2a2f3a)" }}
                  >
                    <span style={{ fontFamily: "monospace" }}>{m.id}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {ref ? t("go.modelLimit", { limit: ref.limit, input: ref.input, output: ref.output }) : t("go.modelNew")}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
      {editingKey ? (
        <div style={{ marginBottom: 10 }}>
          <div className="password-wrapper">
            <input
              type={showKey ? "text" : "password"}
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder={t("go.keyPlaceholder")}
              disabled={keyBusy}
              className="input"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
            <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowKey((v) => !v)} tabIndex={-1} disabled={keyBusy} aria-label="Toggle key visibility">
              {showKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>
          {keyError ? <div className="notice error" style={{ marginTop: 6 }}>{keyError}</div> : null}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn-primary" onClick={saveKey} disabled={!keyDraft.trim() || keyBusy}>
              {t("go.save")}
            </button>
            <button className="btn-cancel" onClick={() => { setEditingKey(false); setKeyDraft(""); setKeyError(null) }} disabled={keyBusy}>
              {t("settings.cancel")}
            </button>
          </div>
          <p className="subtle" style={{ fontSize: "0.78rem", marginTop: 6 }}>{t("go.keyDesc")}</p>
        </div>
      ) : null}
    </div>
  )
})
