import { memo, useMemo, useRef, useState } from "react"
import { useT } from "../i18n-context"
import type { ModelOption } from "../types"
import { useOutsideClick } from "../hooks/useOutsideClick"

type DefaultModelPickerProps = {
  modelOptions: ModelOption[]
  selectedModelKey: string | null
  onChangeModel: (key: string, variant?: string | null) => void
  modelKey: (m: { providerID: string; modelID: string; variant?: string }) => string
  isBlocked: (key: string) => boolean
}

// Selector del modelo predeterminado: desplegable agrupado por proveedor
// (título + sus modelos) con buscador. Solo lista modelos visibles: respeta
// los ocultos en Modelos (blocked). Se usa en Apariencia y en General.
export const DefaultModelPicker = memo(function DefaultModelPicker({
  modelOptions, selectedModelKey, onChangeModel, modelKey: mk, isBlocked,
}: DefaultModelPickerProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const wrapRef = useRef<HTMLDivElement | null>(null)
  useOutsideClick(wrapRef, () => setOpen(false), open)

  const selected = useMemo(
    () => modelOptions.find((o) => mk(o) === selectedModelKey) ?? null,
    [modelOptions, selectedModelKey, mk]
  )
  const selectedHidden = selected ? isBlocked(mk(selected)) : false
  const selectedLabel = selected
    ? `${selected.modelName || selected.modelID} (${selected.providerName || selected.providerID})${selectedHidden ? ` ${t("settings.defaultModelHidden")}` : ""}`
    : (selectedModelKey ?? "")

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const map = new Map<string, { name: string; items: ModelOption[] }>()
    for (const opt of modelOptions) {
      const key = mk(opt)
      if (isBlocked(key)) continue
      if (q) {
        const hay = `${opt.modelName ?? ""} ${opt.modelID ?? ""} ${opt.providerName ?? ""} ${opt.providerID ?? ""}`.toLowerCase()
        if (!hay.includes(q)) continue
      }
      const pid = opt.providerID
      let g = map.get(pid)
      if (!g) {
        g = { name: opt.providerName || pid, items: [] }
        map.set(pid, g)
      }
      g.items.push(opt)
    }
    return [...map.values()]
  }, [modelOptions, mk, isBlocked, query])

  return (
    <div
      ref={wrapRef}
      className="dmp-wrap"
      onKeyDown={(e) => { if (e.key === "Escape") setOpen(false) }}
    >
      <button
        type="button"
        className="ag-select dmp-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title={selectedLabel}
      >
        <span className="dmp-btn-label">{selectedLabel}</span>
      </button>
      {open && (
        <div className="dmp-pop" role="listbox" aria-label={t("settings.defaultModel")}>
          <input
            type="search"
            className="dmp-search"
            placeholder={t("settings.defaultModelSearch")}
            aria-label={t("settings.defaultModelSearch")}
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="dmp-list">
            {groups.length === 0 && (
              <p className="dmp-empty">{t("settings.defaultModelNoResults")}</p>
            )}
            {groups.map((g) => (
              <div key={g.name} className="dmp-group">
                <p className="dmp-group-title">{g.name}</p>
                {g.items.map((opt) => {
                  const key = mk(opt)
                  const active = key === selectedModelKey
                  return (
                    <button
                      key={key}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`dmp-item${active ? " active" : ""}`}
                      onClick={() => { onChangeModel(key); setOpen(false); setQuery("") }}
                    >
                      <span className="dmp-item-name">{opt.modelName || opt.modelID}</span>
                      {opt.variant && <small className="dmp-item-variant">{opt.variant}</small>}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
