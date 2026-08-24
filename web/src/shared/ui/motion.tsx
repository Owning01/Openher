import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

type MotionTarget = {
  opacity?: number
  x?: number
  y?: number
  scale?: number
}

type MotionProps = {
  initial?: MotionTarget | false
  animate: MotionTarget
  transition?: { duration?: number; delay?: number; ease?: string }
  style?: CSSProperties
  className?: string
  children?: ReactNode
}

function targetToStyle(t: MotionTarget): CSSProperties {
  const s: CSSProperties = {}
  if (t.opacity !== undefined) (s as any).opacity = t.opacity
  const transforms: string[] = []
  if (t.x !== undefined) transforms.push(`translateX(${t.x}px)`)
  if (t.y !== undefined) transforms.push(`translateY(${t.y}px)`)
  if (t.scale !== undefined) transforms.push(`scale(${t.scale})`)
  if (transforms.length) (s as any).transform = transforms.join(" ")
  return s
}

/**
 * Ligero wrapper tipo motion.div: interpola vía CSS transition en compositor,
 * sin JS por frame (concepto GPUI motion.div adaptado a web).
 * Respeta prefers-reduced-motion automáticamente (media query en motion.css).
 */
export function Motion({ initial, animate, transition, style, className, children }: MotionProps) {
  const { duration = 0.22, delay = 0, ease = "cubic-bezier(0.16, 1, 0.3, 1)" } = transition ?? {}
  const initialStyle = initial === false ? targetToStyle(animate) : initial ? targetToStyle(initial) : {}
  const animateStyle = targetToStyle(animate)
  const [active, setActive] = useState(initial === false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (initial === false) return
    const id = requestAnimationFrame(() => setActive(true))
    return () => cancelAnimationFrame(id)
  }, [initial])

  const merged: CSSProperties = {
    ...style,
    ...(active ? animateStyle : initialStyle),
    transition: `opacity ${duration}s ${ease} ${delay}s, transform ${duration}s ${ease} ${delay}s`,
    willChange: "opacity, transform",
  } as CSSProperties

  return (
    <div ref={ref} style={merged} className={className}>
      {children}
    </div>
  )
}

/**
 * Helper para View Transitions API en cambios de layout (sidebar, etc).
 * Uso: wrapAction(() => setCollapsed(v))
 */
export function wrapViewTransition(action: () => void) {
  const doc: any = document
  if (doc.startViewTransition) {
    doc.startViewTransition(action)
  } else {
    action()
  }
}
