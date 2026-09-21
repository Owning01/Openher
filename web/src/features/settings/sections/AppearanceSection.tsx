// AppearanceSection — idioma, tema, clima, picker de tema, modelo por defecto
// y nivel de pensamiento (F4-P4). Extraído de SettingsPanel.tsx sin cambios de
// conducta: el contenedor deriva `selected`/`thinkingVariants` y aquí solo se
// pinta.
import { useT } from "../../../i18n-context"
import type { LanguageCode } from "../../../i18n"
import type { ModelOption } from "../../../types"
import { WeatherSettings } from "../../../components/WeatherSettings"
import { ThinkingLevels } from "../../../components/ThinkingLevels"

type AppearanceSectionProps = {
  language: LanguageCode
  onLanguageChange: (lang: LanguageCode) => void
  languageOptions: Array<{ code: LanguageCode; label: string }>
  theme: string
  onThemeChange: (theme: "system" | "light" | "dark" | "scheduled") => void
  onOpenThemePicker?: () => void
  onOpenThemeCreator?: () => void
  uniqueModels: ModelOption[]
  selectedModelKey: string | null
  onChangeModel: (key: string, variant?: string | null) => void
  modelKey: (model: { providerID: string; modelID: string; variant?: string }) => string
  selected: ModelOption | undefined
  thinkingVariants: ModelOption[]
  selectedVariant: string | null
}

export function AppearanceSection({
  language, onLanguageChange, languageOptions,
  theme, onThemeChange, onOpenThemePicker, onOpenThemeCreator,
  uniqueModels, selectedModelKey, onChangeModel, modelKey: mk,
  selected, thinkingVariants, selectedVariant,
}: AppearanceSectionProps) {
  const t = useT()
  return (
    <>
     <p className="settings-group-heading">Appearance & Interface</p>
     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">{t('settings.language')}</span>
       <p className="setting-item-desc">Selecciona el idioma principal de la aplicación.</p>
      </div>
      <div className="setting-item-control">
       <select
        className="ag-select"
        name="language"
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
       >
        {languageOptions.map((option) => (
         <option key={option.code} value={option.code}>{option.label}</option>
        ))}
       </select>
      </div>
     </div>

     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">{t('settings.theme')}</span>
       <p className="setting-item-desc">Modo visual (sistema, claro, oscuro o programado).</p>
      </div>
      <div className="setting-item-control">
       <select
        className="ag-select"
        name="theme"
        value={theme}
        onChange={(e) => onThemeChange(e.target.value as "system" | "light" | "dark" | "scheduled")}
       >
        <option value="system">{t('settings.themeSystem')}</option>
        <option value="light">{t('settings.themeLight')}</option>
        <option value="dark">{t('settings.themeDark')}</option>
        <option value="scheduled">{t('settings.themeScheduled')}</option>
       </select>
      </div>
     </div>

     <WeatherSettings />

     {onOpenThemePicker && (
      <div className="setting-item-row">
       <div className="setting-item-info">
        <span className="setting-item-title">{t('settings.visualTheme')}</span>
        <p className="setting-item-desc">Explora y activa paletas de temas visuales predefinidos.</p>
       </div>
       <div className="setting-item-control">
        <button type="button" className="ag-btn-open" onClick={onOpenThemePicker}>
         {t('settings.switchTheme')} (33 temas)
        </button>
        {onOpenThemeCreator && (
         <button type="button" className="ag-btn-open" onClick={onOpenThemeCreator}>
          {t('session.themeCreator')}
         </button>
        )}
       </div>
      </div>
     )}

     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">{t('settings.defaultModel')}</span>
       <p className="setting-item-desc">Modelo de lenguaje predeterminado para nuevas conversaciones.</p>
      </div>
      <div className="setting-item-control">
       <select
        className="ag-select"
        value={selectedModelKey || ""}
        onChange={(e) => onChangeModel(e.target.value)}
       >
        {uniqueModels.map((opt) => (
         <option key={mk(opt)} value={mk(opt)}>
          {opt.modelName || opt.modelID} ({opt.providerName})
         </option>
        ))}
       </select>
      </div>
     </div>

     {selected && thinkingVariants.length > 1 && (
      <div className="setting-item-row">
       <div className="setting-item-info">
        <span className="setting-item-title">Nivel de Pensamiento (Thinking)</span>
        <p className="setting-item-desc">{selected.modelName || selected.modelID} · {selected.providerName}</p>
       </div>
       <div className="setting-item-control">
        <ThinkingLevels base={selected} variants={thinkingVariants} activeVariant={selectedVariant} onChange={onChangeModel} hideLabel />
       </div>
      </div>
     )}
    </>
  )
}
