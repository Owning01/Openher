// WeatherChip — pill de clima casi gratis en RAM.
// Un solo fetch tiny (~300B, Open-Meteo sin key) cada 30 min y solo con la
// pestaña visible; entre polls no hay timers ni listeners. Cachea el último
// valor en localStorage para pintar instantáneo sin red.
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useWeatherPrefs } from "../hooks/useWeatherPrefs"
import { useScheduled } from "../hooks/useScheduled"
import { scheduler } from "../utils/scheduler"

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
  const weatherOn = !!prefs.enabled && !!loc && !!key
  const ctrlRef = useRef<AbortController | null>(null)
  useEffect(() => () => ctrlRef.current?.abort(), [])

  const load = useCallback(async (): Promise<void> => {
    if (!loc || !key) return
    if (document.visibilityState !== "visible") return
    ctrlRef.current?.abort()
    const ctrl = new AbortController()
    ctrlRef.current = ctrl
    try {
      const c = await fetchCurrent(loc.lat, loc.lon, ctrl.signal)
      writeCache(key, c)
      setCur(c)
    } catch {
      // Sin red: se queda el cacheado (o nada). Sin reintentos agresivos.
    }
  }, [loc, key])

  // Pintado instantáneo desde cache al cambiar ubicación.
  useEffect(() => {
    if (!weatherOn || !key) {
      setCur(null)
      return
    }
    setCur(readCache(key))
  }, [weatherOn, key])

  // Reloj central (Plan 3) con poll inmediato; al volver a visible, trigger.
  useScheduled(`weather:${key}`, POLL_MS, load, { enabled: weatherOn, runOnRegister: true })
  useEffect(() => {
    if (!weatherOn) return
    const onVis = (): void => {
      if (document.visibilityState === "visible") scheduler.trigger(`weather:${key}`)
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [weatherOn, key])

  if (!prefs.enabled || !loc || !cur) return null
  return (
    <span className="weather-chip" title={loc.name} aria-label={`Clima en ${loc.name}: ${cur.temp} grados`}>
      {cur.temp}°
    </span>
  )
})
