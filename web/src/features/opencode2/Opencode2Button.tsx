import { memo, useCallback, useEffect, useState } from "react"
import { useT } from "../../i18n-context"
import { shell } from "../../shell"

type Opencode2State = "unknown" | "working" | "running" | "stopped" | "failed"

/**
 * Botón único para el servidor opencode2 (:4098).
 * Un clic hace todo: activa el arranque con Windows (headless, sin consola)
 * y levanta el server ahora en background. Muestra el estado en vivo.
 */
export const Opencode2Button = memo(function Opencode2Button({ compact = false }: { compact?: boolean }) {
  const t = useT()
  const [state, setState] = useState<Opencode2State>("unknown")

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const s = await shell.opencode2.status()
      setState(s.running ? "running" : "stopped")
      return s.running
    } catch {
      setState("stopped")
      return false
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const start = useCallback(async () => {
    setState("working")
    // autostart best-effort: si falla (p. ej. APK sin shell), igual se intenta levantar
    await shell.opencode2.autostartSet(true).catch(() => null)
    await shell.opencode2.ensure().catch(() => null)
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500))
      try {
        const s = await shell.opencode2.status()
        if (s.running) {
          setState("running")
          return
        }
      } catch {}
    }
    setState("failed")
  }, [])

  const btnClass = compact ? "btn-primary compact" : "btn-primary"

  if (state === "running") {
    return (
      <span title={t("shell.opencode2Active")}>
        <span style={{ color: "var(--success, #22c55e)" }}>●</span> {t("shell.opencode2Active")}
      </span>
    )
  }

  return (
    <>
      <span>
        {state === "failed" ? (
          <span style={{ color: "var(--danger, #ef4444)" }}>○ {t("shell.opencode2Fail")}</span>
        ) : (
          <span>○ {t("shell.opencode2Server")}</span>
        )}
      </span>
      <button type="button" className={btnClass} disabled={state === "unknown" || state === "working"} onClick={start}>
        {state === "working" || state === "unknown" ? t("shell.opencode2Starting") : t("shell.opencode2Start")}
      </button>
    </>
  )
})
