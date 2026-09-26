// Shimmer de texto para el título "Working" mientras el turno corre.
// PORTE de anim-lab: `ldg-text-shimmer-wave` (id en src/catalog/loadingui.ts),
// fuente Loading UI (MIT) — https://www.loading-ui.com
// Original: G:\Proyectos\anim-lab\src\vendor\loadingui\text-shimmer-wave\
// El original usa `motion/react` (una dependencia de 40 kB que este repo no
// tiene y no va a agregar): el efecto es el mismo, en CSS puro. Cada letra es un
// <span> con el MISMO keyframe que el original, escalonado por `--i`:
//   translateZ 0→10→0, translateX 0→2→0, translateY 0→-2→0,
//   scale 1→1.1→1, rotateY 0→10→0 y el color base→brillo→base.
//   El original: duration 1, easeInOut, repeat Infinity, delay i*duration/largo.
import { memo, type CSSProperties } from "react"

type Props = {
  text: string
  className?: string
}

/** Clave de animación determinista: la misma palabra siempre ondula igual. */
function delayFor(i: number, len: number): string {
  return `-${((i * 0.05) / Math.max(1, len)).toFixed(3)}s`
}

export const ShimmerText = memo(function ShimmerText({ text, className }: Props) {
  const chars = [...text]
  return (
    <span className={`shimmer-text${className ? " " + className : ""}`} aria-label={text} role="text">
      {chars.map((char, i) => (
        <span key={`${char}-${i}`} className="shimmer-char" style={{ "--shimmer-delay": delayFor(i, chars.length) } as CSSProperties}>
          {char === " " ? "\u00a0" : char}
        </span>
      ))}
    </span>
  )
})
