import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, waitFor } from "@testing-library/react"
import { WeatherChip } from "./WeatherChip"

const PKEY = "opencode.weather.prefs"
const CKEY = "opencode.weather.cache"

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown) => {
      const url = String(input)
      if (url.includes("api.open-meteo.com")) {
        return new Response(JSON.stringify({ current: { temperature_2m: 21.4, weather_code: 2 } }), { status: 200 })
      }
      return new Response(JSON.stringify({}), { status: 200 })
    })
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe("WeatherChip", () => {
  it("no renderiza nada si está deshabilitado (cero side-effects)", () => {
    localStorage.setItem(PKEY, JSON.stringify({ enabled: false, loc: { name: "Madrid", lat: 40.4, lon: -3.7 } }))
    const { container } = render(<WeatherChip />)
    expect(container.querySelector(".weather-chip")).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it("muestra la temperatura de la ubicación elegida", async () => {
    localStorage.setItem(PKEY, JSON.stringify({ enabled: true, loc: { name: "Madrid", lat: 40.4, lon: -3.7 } }))
    render(<WeatherChip />)
    await waitFor(() => expect(screen.getByLabelText(/Madrid/)).toBeTruthy())
    expect(screen.getByText("21°")).toBeTruthy()
  })

  it("pinta cache instantáneo aunque falle la red", async () => {
    localStorage.setItem(PKEY, JSON.stringify({ enabled: true, loc: { name: "Lima", lat: -12.0, lon: -77.0 } }))
    localStorage.setItem(CKEY, JSON.stringify({ temp: 18, code: 0, key: "-12.00,-77.00" }))
    vi.stubGlobal("fetch", async () => {
      throw new Error("offline")
    })
    render(<WeatherChip />)
    await waitFor(() => expect(screen.getByText("18°")).toBeTruthy())
  })
})
