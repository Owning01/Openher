// Disparador de automatizaciones: un solo tick en el scheduler central revisa
// qué venció y lo corre. Los dos tipos usan piezas ya existentes:
//   - prompt → `api.sendPrompt` (la misma ruta que el composer, sin UI).
//   - shell  → escribe en el pty del tab y espera idle (`terminalRead`, que
//              lee el espejo de salida del cliente; no toca `ptyx`).
import { useRef } from "react"
import { api } from "../api"
import { shell } from "../shell"
import { useScheduled } from "./useScheduled"
import { useStore } from "../shared/lib/store"
import { readTerminal, waitForIdle } from "../utils/terminalRead"
import { terminalPtyStore } from "../utils/terminalStore"
import { automationStore, isAutomationDue, markAutomationRun, type Automation } from "../stores/automationStore"
import type { ServerConfig } from "../types"

function errorText(e: unknown): string {
  if (e instanceof Error) return e.message
  return typeof e === "string" ? e : "error desconocido"
}

async function runPrompt(config: ServerConfig, a: Automation, directory?: string): Promise<void> {
  await api.sendPrompt(config, a.sessionID, a.prompt, directory)
}

async function runShell(a: Automation): Promise<string> {
  const entry = terminalPtyStore.get(a.terminalTabId)
  if (!entry) throw new Error(`terminal ${a.terminalTabId} no está abierto`)
  await shell.pty.write(entry.ptyId, `${a.command}\r`)
  await waitForIdle(a.terminalTabId, { idleMs: 800, timeoutMs: 10 * 60_000 })
  return readTerminal(a.terminalTabId, 1500)
}

export function useAutomationRunner(opts: { config: ServerConfig | null | undefined; directory?: string }) {
  const automations = useStore(automationStore)
  const busyRef = useRef(false)
  const configRef = useRef(opts.config)
  configRef.current = opts.config
  const dirRef = useRef(opts.directory)
  dirRef.current = opts.directory

  // El tick corre siempre (también con la pestaña oculta: es un programador).
  useScheduled(
    "automations",
    15_000,
    async () => {
      if (busyRef.current) return
      const due = automations.filter((a) => isAutomationDue(a))
      if (due.length === 0) return
      busyRef.current = true
      try {
        for (const a of due) {
          markAutomationRun(a.id, "running")
          try {
            if (a.kind === "shell") {
              const output = await runShell(a)
              markAutomationRun(a.id, "ok", { output })
            } else {
              const cfg = configRef.current
              if (!cfg) throw new Error("sin servidor configurado")
              await runPrompt(cfg, a, dirRef.current)
              markAutomationRun(a.id, "ok")
            }
          } catch (e) {
            markAutomationRun(a.id, "error", { error: errorText(e) })
          }
        }
      } finally {
        busyRef.current = false
      }
    },
    { onlyWhenVisible: false, enabled: opts.config !== undefined }
  )
}
