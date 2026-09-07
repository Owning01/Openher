/**
 * Scheduler central (Plan 3 — realtime único).
 *
 * Reemplaza los ~10 `setInterval` regados (TitleBar 1200ms, shellPanels
 * 2500/5000/6000/15000ms, BrowserPanel x3, Weather, memoria...): un solo
 * reloj base de 1s que dispara tareas vencidas, con pausa global en
 * `document.hidden` y anti-solapamiento por key.
 *
 * Los consumidores migran de a uno con `useScheduled`; este módulo no toca
 * ningún comportamiento existente por sí solo.
 */

type TaskFn = () => void | Promise<void>

type TaskOpts = {
  /** Si true (default), no dispara con la pestaña oculta. */
  onlyWhenVisible?: boolean
  /** Disparar una vez al registrar. Default false. */
  runOnRegister?: boolean
}

type Task = {
  key: string
  intervalMs: number
  fn: TaskFn
  onlyWhenVisible: boolean
  lastRun: number
  busy: boolean
  onError?: (e: unknown) => void
}

const TICK_MS = 1000

class Scheduler {
  private tasks = new Map<string, Task>()
  private timer: ReturnType<typeof setInterval> | null = null
  private visibilityHandler: (() => void) | null = null
  private nowFn: () => number = () => Date.now()

  /** Solo tests: reloj inyectable. */
  setNowFn(fn: () => number) {
    this.nowFn = fn
  }

  register(key: string, intervalMs: number, fn: TaskFn, opts: TaskOpts = {}, onError?: (e: unknown) => void) {
    this.tasks.set(key, {
      key,
      intervalMs: Math.max(intervalMs, TICK_MS),
      fn,
      onlyWhenVisible: opts.onlyWhenVisible ?? true,
      lastRun: opts.runOnRegister ? -Infinity : this.nowFn(),
      busy: false,
      onError,
    })
    this.ensureRunning()
  }

  unregister(key: string) {
    this.tasks.delete(key)
    if (this.tasks.size === 0) this.stop()
  }

  /** Disparo manual (ej. al volver a visible o pull-to-refresh). */
  trigger(key: string) {
    const t = this.tasks.get(key)
    if (t && !t.busy) void this.run(t)
  }

  pendingCount(): number {
    return this.tasks.size
  }

  private isHidden(): boolean {
    return typeof document !== "undefined" && document.visibilityState === "hidden"
  }

  private ensureRunning() {
    if (this.timer) return
    if (typeof document !== "undefined" && !this.visibilityHandler) {
      this.visibilityHandler = () => {
        // Al volver a visible, las tareas vencidas disparan en el próximo tick.
      }
      document.addEventListener("visibilitychange", this.visibilityHandler)
    }
    this.timer = setInterval(() => void this.tick(), TICK_MS)
    // El reloj central no debe mantener vivo el proceso en tests/node.
    if (typeof (this.timer as unknown as { unref?: () => void }).unref === "function") {
      ;(this.timer as unknown as { unref: () => void }).unref()
    }
  }

  private stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    if (typeof document !== "undefined" && this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler)
      this.visibilityHandler = null
    }
  }

  private async run(t: Task) {
    t.busy = true
    t.lastRun = this.nowFn()
    try {
      await t.fn()
    } catch (e) {
      t.onError?.(e)
    } finally {
      t.busy = false
    }
  }

  /** Tick público para tests (el intervalo real lo llama cada 1s). */
  async tick() {
    const now = this.nowFn()
    const hidden = this.isHidden()
    for (const t of this.tasks.values()) {
      if (t.busy) continue
      if (hidden && t.onlyWhenVisible) continue
      if (now - t.lastRun >= t.intervalMs) await this.run(t)
    }
  }

  /** Solo tests: resetea estado global. */
  reset() {
    this.stop()
    this.tasks.clear()
    this.nowFn = () => Date.now()
  }
}

export const scheduler = new Scheduler()
export type { TaskFn, TaskOpts }
