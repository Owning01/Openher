import { useCallback, useEffect, useState } from "react"

export interface WeatherLoc {
  name: string
  lat: number
  lon: number
}

export interface WeatherPrefs {
  enabled: boolean
  loc: WeatherLoc | null
}

const KEY = "opencode.weather.prefs"
const EVT = "opencode:weather-prefs-change"

function readPrefs(): WeatherPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<WeatherPrefs>
      const loc =
        p.loc && typeof p.loc.name === "string" && Number.isFinite(p.loc.lat) && Number.isFinite(p.loc.lon)
          ? { name: p.loc.name.slice(0, 80), lat: p.loc.lat, lon: p.loc.lon }
          : null
      return { enabled: !!p.enabled, loc }
    }
  } catch {}
  return { enabled: false, loc: null }
}

function writePrefs(p: WeatherPrefs): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch {}
  try { window.dispatchEvent(new Event(EVT)) } catch {}
}

/**
 * Prefs del clima: mostrar/ocultar + ubicación. Solo localStorage
 * (cero RAM sostenida); sincronizado entre Ajustes y chips vía evento.
 */
export function useWeatherPrefs(): {
  prefs: WeatherPrefs
  setEnabled: (v: boolean) => void
  setLoc: (loc: WeatherLoc | null) => void
} {
  const [prefs, setPrefs] = useState<WeatherPrefs>(readPrefs)

  useEffect(() => {
    const sync = (): void => setPrefs(readPrefs())
    window.addEventListener("storage", sync)
    window.addEventListener(EVT, sync as EventListener)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener(EVT, sync as EventListener)
    }
  }, [])

  const setEnabled = useCallback((enabled: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, enabled }
      writePrefs(next)
      return next
    })
  }, [])

  const setLoc = useCallback((loc: WeatherLoc | null) => {
    setPrefs((prev) => {
      const next = { ...prev, loc }
      writePrefs(next)
      return next
    })
  }, [])

  return { prefs, setEnabled, setLoc }
}
