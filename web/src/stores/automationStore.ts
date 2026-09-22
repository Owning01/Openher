// Automatizaciones programadas: prompts recurrentes contra una sesión y
// comandos de shell en un terminal (con espera de idle, ver `terminalRead`).
// Persisten en localStorage (mismo criterio que outbox/drafts). Este módulo es
// solo estado + helpers puros: el disparo vive en `useAutomationRunner`.
import { createStore } from "../shared/lib/store"

export type AutomationKind = "prompt" | "shell"
export type AutomationStatus = "ok" | "error" | "running"

export type Automation = {
  id: string
  name: string
  kind: AutomationKind
  /** kind=prompt: texto que se manda a la sesión. */
  prompt: string
  /** kind=prompt: sesión destino. */
  sessionID: string
  /** kind=shell: tab de terminal destino. */
  terminalTabId: string
  /** kind=shell: comando a escribir (se agrega el Enter). */
  command: string
  intervalMinutes: number
  enabled: boolean
  lastRunAt?: number
  lastStatus?: AutomationStatus
  lastError?: string
  /** kind=shell: cola de la salida del último run. */
  lastOutput?: string
}

export const AUTOMATION_KEY = "opencode.automations"
export const MIN_INTERVAL_MINUTES = 1
export const MAX_INTERVAL_MINUTES = 24 * 60
export const MAX_AUTOMATIONS = 20

export const AUTOMATION_INTERVALS = [5, 15, 30, 60, 120, 240, 480, 1440]

function clampInterval(minutes: unknown): number {
  const n = typeof minutes === "number" && Number.isFinite(minutes) ? Math.round(minutes) : 30
  return Math.max(MIN_INTERVAL_MINUTES, Math.min(MAX_INTERVAL_MINUTES, n))
}

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined)
const num = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined)

function normalize(raw: unknown): Automation | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const kind: AutomationKind = r.kind === "shell" ? "shell" : "prompt"
  const prompt = str(r.prompt) ?? ""
  const command = str(r.command) ?? ""
  if (kind === "prompt" && !prompt.trim()) return null
  if (kind === "shell" && !command.trim()) return null
  const rawName = str(r.name)
  return {
    id: str(r.id) || `auto_${Math.random().toString(36).slice(2, 8)}`,
    name: rawName?.trim() ? rawName.trim().slice(0, 60) : kind === "shell" ? "Comando" : "Prompt",
    kind,
    prompt,
    sessionID: str(r.sessionID) ?? "",
    terminalTabId: str(r.terminalTabId) ?? "",
    command,
    intervalMinutes: clampInterval(r.intervalMinutes),
    enabled: r.enabled !== false,
    lastRunAt: num(r.lastRunAt),
    lastStatus: r.lastStatus === "ok" || r.lastStatus === "error" || r.lastStatus === "running" ? r.lastStatus : undefined,
    lastError: str(r.lastError)?.slice(0, 300),
    lastOutput: str(r.lastOutput)?.slice(0, 2000),
  }
}

/** Parsea y normaliza la lista persistida. Una corrida "running" que sobrevivió
 *  a una recarga quedó huérfana (el proceso murió con ella): sin limpiarla,
 *  `isAutomationDue` la salta para siempre y la automatización muere en
 *  silencio — se limpia acá, al hidratar. */
export function hydrateAutomations(raw: string | null): Automation[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .map(normalize)
      .filter((a): a is Automation => a !== null)
      .slice(0, MAX_AUTOMATIONS)
      .map((a) => (a.lastStatus === "running" ? { ...a, lastStatus: undefined } : a))
  } catch {
    return []
  }
}

function load(): Automation[] {
  try {
    return hydrateAutomations(localStorage.getItem(AUTOMATION_KEY))
  } catch {
    return []
  }
}

export const automationStore = createStore<Automation[]>(typeof localStorage === "undefined" ? [] : load())

/** Reemplaza la lista y persiste (único escritor de la clave). */
export function persistAutomations(list: Automation[]): void {
  automationStore.set(list.slice(0, MAX_AUTOMATIONS))
  try {
    localStorage.setItem(AUTOMATION_KEY, JSON.stringify(automationStore.get()))
  } catch {
    // sin persistencia (modo privado): la lista vive en memoria
  }
}

export function addAutomation(input: Partial<Automation> & { name: string }): Automation | null {
  const created = normalize({ ...input, id: `auto_${Date.now().toString(36)}` })
  if (!created) return null
  persistAutomations([...automationStore.get(), created])
  return created
}

export function updateAutomation(id: string, patch: Partial<Automation>): void {
  persistAutomations(
    automationStore.get().map((a) => {
      if (a.id !== id) return a
      const merged = normalize({ ...a, ...patch, id: a.id })
      return merged ?? a
    })
  )
}

export function removeAutomation(id: string): void {
  persistAutomations(automationStore.get().filter((a) => a.id !== id))
}

/** Marca el resultado de una corrida (nunca borra la definición). */
export function markAutomationRun(id: string, status: AutomationStatus, detail?: { error?: string; output?: string }): void {
  persistAutomations(
    automationStore.get().map((a) =>
      a.id === id
        ? {
            ...a,
            lastRunAt: status === "running" ? a.lastRunAt : Date.now(),
            lastStatus: status,
            lastError: status === "error" ? (detail?.error ?? "error").slice(0, 300) : undefined,
            lastOutput: detail?.output !== undefined ? detail.output.slice(0, 2000) : a.lastOutput,
          }
        : a
    )
  )
}

/** ¿Le toca correr? (enabled + habilitada por kind + venció el intervalo). */
export function isAutomationDue(a: Automation, now = Date.now()): boolean {
  if (!a.enabled) return false
  if (a.kind === "prompt" && !a.sessionID) return false
  if (a.kind === "shell" && !a.terminalTabId) return false
  if (a.lastStatus === "running") return false
  const last = a.lastRunAt ?? 0
  return now - last >= a.intervalMinutes * 60_000
}

/** Próxima corrida (epoch ms) o null si está apagada/incompleta. */
export function nextAutomationRunAt(a: Automation): number | null {
  if (!a.enabled) return null
  if (a.kind === "prompt" && !a.sessionID) return null
  if (a.kind === "shell" && !a.terminalTabId) return null
  return (a.lastRunAt ?? 0) + a.intervalMinutes * 60_000
}

type IntervalT = (
  key: "settings.automationEveryMin" | "settings.automationEveryH",
  params?: Record<string, string | number>
) => string

/** "cada 30 min" / "cada 2 h" / "cada 24 h". La UI pasa siempre `t` (keys
 *  i18n en/en-es); sin traductor cae al literal en español. */
export function automationIntervalLabel(minutes: number, t?: IntervalT): string {
  const m = clampInterval(minutes)
  if (m < 60) return t ? t("settings.automationEveryMin", { m }) : `cada ${m} min`
  const h = Math.round((m / 60) * 10) / 10
  return t ? t("settings.automationEveryH", { h }) : `cada ${h} h`
}
