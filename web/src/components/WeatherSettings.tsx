// WeatherSettings — bloque de Ajustes para el clima.
// Solo corre red mientras el usuario escribe (geocoding con debounce +
// abort); en reposo son 2 strings en localStorage. Cero costo sostenido.
import { memo, useEffect, useRef, useState } from "react"
import { LedSwitch } from "./LedSwitch"
import { useT } from "../i18n-context"
import { useWeatherPrefs, type WeatherLoc } from "../hooks/useWeatherPrefs"

type GeoHit = WeatherLoc & { country?: string; admin?: string }

async function searchPlaces(q: string, signal: AbortSignal): Promise<GeoHit[]> {
  const r = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=es&format=json`,
    { signal }
  )
  if (!r.ok) throw new Error(`geo ${r.status}`)
  const j = (await r.json()) as { results?: Array<{ name: string; latitude: number; longitude: number; country?: string; admin1?: string }> }
  return (j.results ?? []).map((x) => ({
    name: x.name,
    lat: x.latitude,
    lon: x.longitude,
    country: x.country,
    admin: x.admin1,
  }))
}

export const WeatherSettings = memo(function WeatherSettings() {
  const t = useT()
  const { prefs, setEnabled, setLoc } = useWeatherPrefs()
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<GeoHit[]>([])
  const [searching, setSearching] = useState(false)
  const ctrlRef = useRef<AbortController | null>(null)
  const timerRef = useRef(0)

  useEffect(() => () => {
    window.clearTimeout(timerRef.current)
    ctrlRef.current?.abort()
  }, [])

  const onQuery = (v: string): void => {
    setQ(v)
    window.clearTimeout(timerRef.current)
    ctrlRef.current?.abort()
    if (v.trim().length < 2) {
      setHits([])
      setSearching(false)
      return
    }
    setSearching(true)
    timerRef.current = window.setTimeout(() => {
      const c = new AbortController()
      ctrlRef.current = c
      searchPlaces(v.trim(), c.signal)
        .then((r) => {
          if (!c.signal.aborted) setHits(r)
        })
        .catch(() => {
          if (!c.signal.aborted) setHits([])
        })
        .finally(() => {
          if (!c.signal.aborted) setSearching(false)
        })
    }, 400)
  }

  return (
    <>
      <div className="setting-item-row">
        <div className="setting-item-info">
          <span className="setting-item-title">{t("weather.title")}</span>
          <p className="setting-item-desc">{t("weather.desc")}</p>
        </div>
        <div className="setting-item-control">
          <LedSwitch
            label={t("weather.title")}
            checked={prefs.enabled}
            onChange={() => setEnabled(!prefs.enabled)}
          />
        </div>
      </div>
      {prefs.enabled && (
        <div className="setting-item-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
          {prefs.loc && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span className="setting-item-title" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {prefs.loc.name}
              </span>
              <button type="button" className="btn-link" onClick={() => { setLoc(null); setHits([]); setQ("") }}>
                {t("weather.clear")}
              </button>
            </div>
          )}
          <input
            className="settings-search-input"
            value={q}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={t("weather.searchPlaceholder")}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={t("weather.searchPlaceholder")}
          />
          {searching && <p className="subtle" style={{ margin: "6px 0 0" }}>…</p>}
          {!searching && q.trim().length >= 2 && hits.length === 0 && (
            <p className="subtle" style={{ margin: "6px 0 0" }}>{t("weather.noResults")}</p>
          )}
          {hits.map((h) => (
            <button
              key={`${h.lat},${h.lon}`}
              type="button"
              className="overflow-item"
              style={{ display: "flex", justifyContent: "space-between", gap: 8, width: "100%" }}
              onClick={() => { setLoc({ name: h.name, lat: h.lat, lon: h.lon }); setHits([]); setQ("") }}
              title={`${h.lat.toFixed(2)}, ${h.lon.toFixed(2)}`}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
              <span className="subtle" style={{ flexShrink: 0 }}>
                {[h.admin, h.country].filter(Boolean).join(", ")}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  )
})
