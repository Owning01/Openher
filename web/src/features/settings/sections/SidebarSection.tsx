// SidebarSection — posición y visibilidad de los botones del rail (F4-P4).
// Extraído de SettingsPanel.tsx sin cambios de conducta.
import { useT } from "../../../i18n-context"
import { LedSwitch } from "../../../components/LedSwitch"
import { SIDEBAR_ITEM_IDS, type SidebarPosition } from "../../../hooks/useSidebarPrefs"

type SidebarSectionProps = {
  position: SidebarPosition
  hidden: string[]
  onSetPosition: (position: SidebarPosition) => void
  onToggleItem: (id: string) => void
}

export function SidebarSection({ position, hidden, onSetPosition, onToggleItem }: SidebarSectionProps) {
  const t = useT()
  return (
    <>
     <p className="settings-group-heading">Navigation & Interface</p>
     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">Posición de Barra Lateral</span>
       <p className="setting-item-desc">Ubicación de la barra de navegación en pantalla.</p>
      </div>
      <div className="setting-item-control">
       <div className="ag-segmented">
        {(["left", "top", "right"] as const).map((p) => (
         <button
          key={p}
          type="button"
          className={`ag-segmented-btn${position === p ? " active" : ""}`}
          onClick={() => onSetPosition(p)}
         >
          {t(`settings.pos_${p}`)}
         </button>
        ))}
       </div>
      </div>
     </div>

     {SIDEBAR_ITEM_IDS.map((id) => {
      const visible = !hidden.includes(id)
      return (
       <div key={id} className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">{t(`settings.sb_${id}`)}</span>
         <p className="setting-item-desc">Mostrar botón en la barra lateral.</p>
        </div>
        <div className="setting-item-control">
         <LedSwitch
          label={t(`settings.sb_${id}`)}
          checked={visible}
          onChange={() => onToggleItem(id)}
         />
        </div>
       </div>
      )
     })}
    </>
  )
}
