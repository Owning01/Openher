import { describe, it, expect, afterEach, vi } from "vitest"
import { scheduler } from "./scheduler"

afterEach(() => scheduler.reset())

describe("scheduler central", () => {
  it("dispara la tarea vencida en tick", async () => {
    let now = 0
    scheduler.setNowFn(() => now)
    const fn = vi.fn()
    scheduler.register("a", 5000, fn)
    now = 4999
    await scheduler.tick()
    expect(fn).not.toHaveBeenCalled()
    now = 5000
    await scheduler.tick()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("no solapa ejecuciones lentas", async () => {
    let now = 0
    scheduler.setNowFn(() => now)
    let release!: () => void
    const gate = new Promise<void>((r) => { release = r })
    const fn = vi.fn(() => gate)
    scheduler.register("slow", 1000, fn)
    now = 1000
    const t1 = scheduler.tick()
    now = 5000
    await scheduler.tick()
    expect(fn).toHaveBeenCalledTimes(1)
    release()
    await t1
    now = 6000
    await scheduler.tick()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("respeta intervalo por tarea", async () => {
    let now = 0
    scheduler.setNowFn(() => now)
    const fast = vi.fn()
    const slow = vi.fn()
    scheduler.register("fast", 1000, fast)
    scheduler.register("slow", 5000, slow)
    now = 3000
    await scheduler.tick()
    expect(fast).toHaveBeenCalledTimes(1)
    expect(slow).not.toHaveBeenCalled()
  })

  it("unregister detiene la tarea", async () => {
    let now = 0
    scheduler.setNowFn(() => now)
    const fn = vi.fn()
    scheduler.register("tmp", 1000, fn)
    scheduler.unregister("tmp")
    expect(scheduler.pendingCount()).toBe(0)
    now = 10000
    await scheduler.tick()
    expect(fn).not.toHaveBeenCalled()
  })

  it("runOnRegister dispara en el primer tick", async () => {
    let now = 0
    scheduler.setNowFn(() => now)
    const fn = vi.fn()
    scheduler.register("eager", 60000, fn, { runOnRegister: true })
    await scheduler.tick()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("trigger manual dispara sin esperar intervalo", async () => {
    let now = 0
    scheduler.setNowFn(() => now)
    const fn = vi.fn()
    scheduler.register("m", 60000, fn)
    scheduler.trigger("m")
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
