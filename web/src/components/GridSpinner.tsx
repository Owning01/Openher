import { memo } from "react"

// Spinner de 9 cuadrados (3×3): la animación recorre en secuencia los 8
// cuadrados del borde; el del centro queda fijo, sin tocar.
export const GridSpinner = memo(function GridSpinner({ label, title }: { label: string; title?: string }) {
  return (
    <div className="grid-spinner" role="status" aria-label={label} title={title}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className={`gs gs-${i}`} />
      ))}
    </div>
  )
})
