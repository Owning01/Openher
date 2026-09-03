import { memo, useId } from "react"

// Switch on/off estilo LED (rojo apagado / verde encendido), adaptado a fila
// de configuración (84x30). Misma idea que el diseño 210x50: pista oscura,
// pastilla deslizante con agarre y punto LED con glow.
export const LedSwitch = memo(function LedSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  const id = useId()
  return (
    <div className="led-switch">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <label className="led-toggle" htmlFor={id} aria-hidden="true">
        <i />
      </label>
    </div>
  )
})
