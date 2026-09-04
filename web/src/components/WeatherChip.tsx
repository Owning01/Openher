// WeatherChip — pill de clima casi gratis en RAM.
// Un solo fetch tiny (~300B, Open-Meteo sin key) cada 30 min y solo con la
// pestaña visible; entre polls no hay timers ni listeners. Cachea el último
// valor en localStorage para pintar instantáneo sin red.
import { memo, useEffect, useState } from "react"
import { useWeatherPrefs } from "../hooks/useWeatherPrefs"

const POLL_MS = 30 * 60 * 1000
const CACHE_KEY = "opencode.weather.cache"

type Cur = { temp: number; code: number }

function readCache(key: string): Cur | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as { temp: number; code: number; key: string }
    if (c.key !== key || !Number.isFinite(c.temp) || !Number.isFinite(c.code)) return null
    return { temp: Math.round(c.temp), code: c.code }
  } catch {
    return null
  }
}

function writeCache(key: string, c: Cur): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...c, key }))
  } catch {}
}

async function fetchCurrent(lat: number, lon: number, signal: AbortSignal): Promise<Cur> {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto&forecast_days=1`,
    { signal }
  )
  if (!r.ok) throw new Error(`clima ${r.status}`)
  const j = (await r.json()) as { current?: { temperature_2m?: number; weather_code?: number } }
  const temp = j.current?.temperature_2m
  if (!Number.isFinite(temp)) throw new Error("clima vacío")
  return { temp: Math.round(temp as number), code: j.current?.weather_code ?? 0 }
}

// Ultra minimalista: solo grados, nada más.
export const WeatherChip = memo(function WeatherChip() {
  const { prefs } = useWeatherPrefs()
  const loc = prefs.loc
  const key = loc ? `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}` : null
  const [cur, setCur] = useState<Cur | null>(() => (key ? readCache(key) : null))

  useEffect(() => {
    if (!prefs.enabled || !loc || !key) {
      setCur(null)
      return
    }
    setCur(readCache(key))
    let alive = true
    const ctrl = new AbortController()
    const load = async (): Promise<void> => {
      if (document.visibilityState !== "visible") return
      try {
        const c = await fetchCurrent(loc.lat, loc.lon, ctrl.signal)
        if (!alive) return
        writeCache(key, c)
        setCur(c)
      } catch {
        if (!alive) return
        // Sin red: se queda el cacheado (o nada). Sin reintentos agresivos.
      }
    }
    void load()
    const id = window.setInterval(() => void load(), POLL_MS)
    const onVis = (): void => {
      if (document.visibilityState === "visible") void load()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      alive = false
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVis)
      ctrl.abort()
    }
  }, [prefs.enabled, loc?.lat, loc?.lon, key]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!prefs.enabled || !loc || !cur) return null
  return (
    <span className="weather-chip" title={loc.name} aria-label={`Clima en ${loc.name}: ${cur.temp} grados`}>
      {cur.temp}°
    </span>
  )
})
