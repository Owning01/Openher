import { describe, it, expect, vi, afterEach } from "vitest"
import { captureRegionToPng } from "./screenCapture"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("captureRegionToPng", () => {
  it("no llama al backend con un rect inválido", async () => {
    const spy = vi.spyOn(globalThis, "fetch")
    expect(await captureRegionToPng({ x: 0, y: 0, w: 0, h: 50 })).toBeNull()
    expect(await captureRegionToPng({ x: 0, y: 0, w: 50, h: 0 })).toBeNull()
    expect(spy).not.toHaveBeenCalled()
  })

  it("devuelve null si el endpoint falla (no rompe el pick)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 500 }))
    expect(await captureRegionToPng({ x: 10, y: 10, w: 100, h: 40 })).toBeNull()
  })

  it("devuelve null si la respuesta no trae bmp", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, w: 10, h: 10 }), { status: 200, headers: { "Content-Type": "application/json" } })
    )
    expect(await captureRegionToPng({ x: 10, y: 10, w: 100, h: 40 })).toBeNull()
  })

  it("manda el rect con padding y el dpr de la ventana", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }))
    await captureRegionToPng({ x: 100, y: 50, w: 200, h: 80 }, 10)
    expect(spy).toHaveBeenCalledTimes(1)
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("/shell/browser/screenshot")
    const body = JSON.parse(String(init.body))
    expect(body.x).toBe(90)
    expect(body.y).toBe(40)
    expect(body.w).toBe(220)
    expect(body.h).toBe(100)
    expect(body.dpr).toBeGreaterThan(0)
  })
})
