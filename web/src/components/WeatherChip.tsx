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

// WMO weather_code → glifo SVG (sin emojis, 14px, hereda color).
function WeatherGlyph({ code }: { code: number }) {
  const s = 14
  if (code >= 95) {
    // Tormenta
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
      </svg>
    )
  }
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) {
    // Nieve
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <line x1="12" y1="2" x2="12" y2="22" /><line x1="3.3" y1="7" x2="20.7" y2="17" /><line x1="3.3" y1="17" x2="20.7" y2="7" />
      </svg>
    )
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    // Lluvia / llovizna
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 15.5a4.5 4.5 0 0 0-1-8.9A6 6 0 0 0 7.2 7.6 4 4 0 0 0 8 15.5h12z" />
        <line x1="8" y1="18" x2="7" y2="21" /><line x1="12" y1="18" x2="11" y2="21" /><line x1="16" y1="18" x2="15" y2="21" />
      </svg>
    )
  }
  if (code === 45 || code === 48) {
    // Niebla
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <line x1="4" y1="10" x2="20" y2="10" /><line x1="6" y1="14" x2="18" y2="14" /><line x1="8" y1="18" x2="16" y2="18" />
      </svg>
    )
  }
  if (code >= 1) {
    // Nublado
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17.5 18a4.5 4.5 0 0 0 .9-8.9A6 6 0 0 0 6.6 8.7 4.2 4.2 0 0 0 7 17h10.5z" />
      </svg>
    )
  }
  // Despejado
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="7" y2="7" /><line x1="17" y1="17" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="7" y2="17" /><line x1="17" y1="7" x2="19.1" y2="4.9" />
    </svg>
  )
}

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
      <WeatherGlyph code={cur.code} />
      <span className="weather-temp">{cur.temp}°</span>
    </span>
  )
})
