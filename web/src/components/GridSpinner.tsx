import { memo } from "react"

// Spinner de 9 cuadrados (3×3): la animación recorre en secuencia los 8
// cuadrados del borde; el del centro queda fijo, sin tocar. `size` escala el
// conjunto (los cuadrados = (size - gaps) / 3).
export const GridSpinner = memo(function GridSpinner({ label, title, size = 22 }: { label: string; title?: string; size?: number }) {
  const cell = Math.max(3, Math.round((size - 4) / 3))
  return (
    <div
      className="grid-spinner"
      style={{ width: size, height: size, gridTemplateColumns: `repeat(3, ${cell}px)`, gridTemplateRows: `repeat(3, ${cell}px)` }}
      role="status" aria-label={label} title={title}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className={`gs gs-${i}`} />
      ))}
    </div>
  )
})
