import { memo, useId } from "react"

// Checkbox circular gris (sin azul): vacío grisáceo apagado, degradado gris
// con tilde blanca al activar. Mismo diseño que el pedido (checkmark en
// círculo), adaptado a fila de settings y con clases propias para no chocar
// con .container global.
export const GrayCheck = memo(function GrayCheck({
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
    <label className="graycheck" htmlFor={id}>
      <input
        id={id}
        checked={checked}
        type="checkbox"
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <div className="graycheck-mark" aria-hidden="true" />
    </label>
  )
})
