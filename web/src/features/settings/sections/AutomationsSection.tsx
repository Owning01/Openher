// Automatizaciones: prompts recurrentes contra una sesión y comandos de shell
// en un terminal (con espera de idle). La lista vive en `automationStore`
// (persistida) y el disparo en `useAutomationRunner`.
import { useMemo, useState } from "react"
import { useT } from "../../../i18n-context"
import { useStore } from "../../../shared/lib/store"
import { LedSwitch } from "../../../components/LedSwitch"
import {
  AUTOMATION_INTERVALS,
  addAutomation,
  automationIntervalLabel,
  automationStore,
  nextAutomationRunAt,
  removeAutomation,
  updateAutomation,
  type AutomationKind,
} from "../../../stores/automationStore"
import { terminalPtyStore } from "../../../utils/terminalStore"

export function AutomationsSection() {
  const t = useT()
  const automations = useStore(automationStore)
  const [kind, setKind] = useState<AutomationKind>("prompt")
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [intervalMinutes, setIntervalMinutes] = useState(30)
  const [target, setTarget] = useState("")

  // Tabs de terminal abiertos (destino posible de un comando).
  const terminalTabs = useMemo(() => Array.from(terminalPtyStore.keys()), [automations.length])
  const defaultTarget = kind === "prompt" ? "" : (terminalTabs[0] ?? "")

  const add = () => {
    const clean = text.trim()
    if (!clean) return
    const dest = (target || defaultTarget).trim()
    addAutomation({
      name: name.trim() || clean.slice(0, 40),
      kind,
      prompt: kind === "prompt" ? clean : "",
      command: kind === "shell" ? clean : "",
      sessionID: kind === "prompt" ? dest : "",
      terminalTabId: kind === "shell" ? dest : "",
      intervalMinutes,
      enabled: true,
    })
    setName("")
    setText("")
    setTarget("")
  }

  const runNow = (id: string) => {
    // Marca vencida la próxima corrida: el tick (15s) la toma enseguida.
    updateAutomation(id, { lastRunAt: 0, enabled: true, lastStatus: undefined })
  }

  return (
    <>
      <p className="settings-group-heading">{t("settings.sectionAutomations")}</p>
      <p className="setting-item-desc">{t("settings.automationsDesc")}</p>

      {automations.length === 0 && <p className="setting-item-desc">{t("settings.automationEmpty")}</p>}

      {automations.map((a) => (
        <div key={a.id} className="setting-item-row">
          <div className="setting-item-info">
            <span className="setting-item-title">
              {a.name} · {a.kind === "shell" ? t("settings.automationKindShell") : t("settings.automationKindPrompt")} · {automationIntervalLabel(a.intervalMinutes)}
            </span>
            <p className="setting-item-desc">
              {a.kind === "shell" ? `${a.command} (${a.terminalTabId})` : a.prompt}
            </p>
            <p className="setting-item-desc">
              {t("settings.automationLastRun")}: {a.lastRunAt ? new Date(a.lastRunAt).toLocaleString() : t("settings.automationNever")}
              {a.lastStatus === "running" && ` · ${t("settings.automationStatusRunning")}`}
              {a.lastStatus === "ok" && ` · ${t("settings.automationStatusOk")}`}
              {a.lastStatus === "error" && ` · ${t("settings.automationStatusError")}: ${a.lastError ?? ""}`}
              {(() => {
                const next = nextAutomationRunAt(a)
                return next ? ` · ${new Date(next).toLocaleTimeString()}` : ""
              })()}
            </p>
          </div>
          <div className="setting-item-control">
            <button type="button" className="btn-icon btn-ghost" title={t("settings.automationRunNow")} onClick={() => runNow(a.id)}>
              {t("settings.automationRunNow")}
            </button>
            <LedSwitch
              label={`${a.name} ${t("settings.automationEnabled")}`}
              checked={a.enabled}
              onChange={(v) => updateAutomation(a.id, { enabled: v })}
            />
            <button type="button" className="btn-icon btn-ghost" title={t("settings.automationRemove")} onClick={() => removeAutomation(a.id)}>
              {t("settings.automationRemove")}
            </button>
          </div>
        </div>
      ))}

      <div className="setting-item-row">
        <div className="setting-item-info">
          <span className="setting-item-title">{t("settings.automationAdd")}</span>
          <p className="setting-item-desc">{t("settings.automationTarget")}</p>
        </div>
        <div className="setting-item-control" style={{ flexWrap: "wrap", gap: 6 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("settings.automationName")}
            style={{ width: 130 }}
          />
          <select value={kind} onChange={(e) => { setKind(e.target.value as AutomationKind); setTarget("") }}>
            <option value="prompt">{t("settings.automationKindPrompt")}</option>
            <option value="shell">{t("settings.automationKindShell")}</option>
          </select>
          <select value={intervalMinutes} onChange={(e) => setIntervalMinutes(Number(e.target.value))}>
            {AUTOMATION_INTERVALS.map((m) => (
              <option key={m} value={m}>{automationIntervalLabel(m)}</option>
            ))}
          </select>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={defaultTarget || (kind === "prompt" ? "ses_…" : "tab")}
            style={{ width: 150 }}
          />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={kind === "shell" ? t("settings.automationCommand") : t("settings.automationPrompt")}
            style={{ minWidth: 220, flex: 1 }}
          />
          <button type="button" className="btn-icon btn-ghost" onClick={add} disabled={!text.trim()}>
            {t("settings.automationAdd")}
          </button>
        </div>
      </div>
    </>
  )
}
