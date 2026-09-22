// Runs: fan-out de agentes en worktrees aislados, con gate humano (merge o
// descarte). El fan-out se apoya en `git worktree` del desktop y en sesiones
// nuevas por tarea (el prompt se manda con el directorio del worktree).
import { useState } from "react"
import { useT } from "../../../i18n-context"
import { useStore } from "../../../shared/lib/store"
import { useScheduled } from "../../../hooks/useScheduled"
import { useOptionalDialog, type DialogOptions, type AlertOptions } from "../../../components/DialogProvider"
import { shell } from "../../../shell"
import { createRun, removeRun, runProgress, runStore, updateRun, type Run } from "../../../stores/runStore"
import { discardTask, dispatchRun, mergeTask, pollRun } from "../../../utils/runDispatch"
import type { ServerConfig } from "../../../types"

type Props = {
  config: ServerConfig
  /** Directorio del repo actual (prefill). */
  repoPath?: string
}

const TASK_NAMES = ["alfa", "beta", "gamma", "delta", "epsilon", "zeta"]

export function RunsSection({ config, repoPath }: Props) {
  const t = useT()
  // Provider opcional: en prod DialogProvider siempre está (App.tsx); montar
  // sin él (tests aislados) no debe reventar — cae al diálogo nativo.
  const dialogs = useOptionalDialog()
  const confirm = dialogs?.confirm ?? ((o: DialogOptions | string) =>
    Promise.resolve(window.confirm(typeof o === "string" ? o : o.message)))
  const alert = dialogs?.alert ?? ((o: AlertOptions | string) => {
    window.alert(typeof o === "string" ? o : o.message)
  })
  const runs = useStore(runStore)
  const [name, setName] = useState("")
  const [prompt, setPrompt] = useState("")
  const [repo, setRepo] = useState(repoPath ?? "")
  const [count, setCount] = useState(2)
  const [busy, setBusy] = useState(false)
  // Guard de vuelo para merge/discard: un doble clic no debe lanzar dos
  // operaciones concurrentes (la segunda puede pisar "discarded" con "error").
  const [flightTask, setFlightTask] = useState<string | null>(null)

  // El poll solo corre si hay tareas vivas (no gasta requests al pedo).
  const hasActive = runs.some((r) => r.tasks.some((task) => task.state === "running" || task.state === "creating"))
  useScheduled(
    "runs-poll",
    10_000,
    () => {
      for (const r of runStore.get()) void pollRun(r.id, config)
    },
    { onlyWhenVisible: false, enabled: hasActive }
  )

  const add = () => {
    if (!prompt.trim() || !repo.trim()) return
    createRun({
      name: name.trim() || prompt.trim().slice(0, 30),
      prompt: prompt.trim(),
      repoPath: repo.trim(),
      taskNames: TASK_NAMES.slice(0, count),
    })
    setName("")
    setPrompt("")
  }

  const dispatch = async (id: string) => {
    setBusy(true)
    try {
      await dispatchRun(id, config)
    } finally {
      setBusy(false)
    }
  }

  const runTaskAction = async (taskID: string, action: () => Promise<unknown>) => {
    if (flightTask) return
    setFlightTask(taskID)
    try {
      await action()
    } finally {
      setFlightTask(null)
    }
  }

  // Borrado con confirmación: si el run tiene worktrees, avisar y (cuando no
  // hay trabajo propio sin mergear) limpiarlos; si lo hay, se conservan en
  // disco y el aviso lo dice (no se tira trabajo del agente sin preguntar).
  const removeFlow = async (run: Run) => {
    // Worktrees que DEBERÍAN existir en disco: las descartadas ya se borraron
    // en su momento (contarlas o reintentarlo daría falsas alertas).
    const toClean = run.tasks.filter((task) => task.worktreePath && task.state !== "discarded")
    const unmerged = toClean.filter((task) => task.state !== "merged")
    if (toClean.length > 0) {
      const ok = await confirm({
        message: unmerged.length > 0
          ? t("settings.runRemoveUnmerged", { count: unmerged.length })
          : t("settings.runRemoveWt", { count: toClean.length }),
        variant: "danger",
        confirmText: t("settings.runRemove"),
      })
      if (!ok) return
      if (unmerged.length === 0) {
        let failed = 0
        for (const task of toClean) {
          try {
            await shell.git.worktreeRemove(run.repoPath, task.worktreePath, true)
          } catch (e) {
            // "worktree desconocido" = ya no existe: limpieza cumplida, no es fallo.
            if (!String(e).includes("desconocido")) failed++
          }
        }
        if (failed > 0) await alert(t("settings.runRemoveWtFail", { count: failed }))
      }
    }
    removeRun(run.id)
  }

  return (
    <>
      <p className="settings-group-heading">{t("settings.sectionRuns")}</p>
      <p className="setting-item-desc">{t("settings.runsDesc")}</p>

      {runs.length === 0 && <p className="setting-item-desc">{t("settings.runsEmpty")}</p>}

      {runs.map((run) => {
        const prog = runProgress(run)
        return (
          <div key={run.id} className="setting-item-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
            <div className="setting-item-info">
              <span className="setting-item-title">
                {run.name} · {prog.done}/{prog.total} · {run.gate === "open" ? t("settings.runGateOpen") : t("settings.runGateClosed")}
              </span>
              <p className="setting-item-desc">{run.prompt}</p>
              <p className="setting-item-desc">
                {run.repoPath}
                {run.base ? ` · base ${run.base}` : ""}
                {prog.failed > 0 ? ` · ${prog.failed} ${t("settings.runFailed")}` : ""}
              </p>
            </div>
            <div className="setting-item-control" style={{ flexWrap: "wrap", gap: 6 }}>
              <button type="button" className="btn-icon btn-ghost" disabled={busy} onClick={() => void dispatch(run.id)}>
                {t("settings.runDispatch")}
              </button>
              <button type="button" className="btn-icon btn-ghost" onClick={() => updateRun(run.id, { gate: run.gate === "open" ? "closed" : "open" })}>
                {run.gate === "open" ? t("settings.runCloseGate") : t("settings.runOpenGate")}
              </button>
              <button type="button" className="btn-icon btn-ghost" onClick={() => void removeFlow(run)}>
                {t("settings.runRemove")}
              </button>
            </div>
            {run.tasks.map((task) => (
              <div key={task.id} className="setting-item-row">
                <div className="setting-item-info">
                  <span className="setting-item-title">
                    {task.name} · {task.state}
                  </span>
                  <p className="setting-item-desc">
                    {task.branch || "—"}
                    {task.error ? ` · ${task.error}` : ""}
                  </p>
                </div>
                <div className="setting-item-control" style={{ gap: 6 }}>
                  <button
                    type="button"
                    className="btn-icon btn-ghost"
                    disabled={run.gate !== "open" || !task.branch || task.state === "merged" || flightTask !== null}
                    onClick={() => void runTaskAction(task.id, () => mergeTask(run.id, task.id))}
                  >
                    {t("settings.runMerge")}
                  </button>
                  <button
                    type="button"
                    className="btn-icon btn-ghost"
                    disabled={run.gate !== "open" || !task.worktreePath || flightTask !== null}
                    onClick={() => void runTaskAction(task.id, () => discardTask(run.id, task.id))}
                  >
                    {t("settings.runDiscard")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      })}

      <div className="setting-item-row">
        <div className="setting-item-info">
          <span className="setting-item-title">{t("settings.runNew")}</span>
          <p className="setting-item-desc">{t("settings.runNewDesc")}</p>
        </div>
        <div className="setting-item-control" style={{ flexWrap: "wrap", gap: 6 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("settings.runName")} style={{ width: 130 }} />
          <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder={t("settings.runRepo")} style={{ minWidth: 220, flex: 1 }} />
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{`${n} ${t("settings.runAgents")}`}</option>
            ))}
          </select>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("settings.runPrompt")}
            style={{ minWidth: 220, flex: 1 }}
          />
          <button type="button" className="btn-icon btn-ghost" onClick={add} disabled={!prompt.trim() || !repo.trim()}>
            {t("settings.runCreate")}
          </button>
        </div>
      </div>
    </>
  )
}
