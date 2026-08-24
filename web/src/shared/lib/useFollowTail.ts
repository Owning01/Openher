import { useEffect, useRef, useState, useCallback, type RefObject } from "react"

type UseFollowTailOptions = {
  threshold?: number
  smoothDelay?: number
  autoDelay?: number
}

/**
 * Stick-to-bottom derivado de posición (no IntersectionObserver).
 * Mantiene isAtBottom preciso aunque el contenido crezca por streaming
 * sin disparar eventos scroll, y evita parpadeo del botón durante
 * scrollTo programático (ledger por deadline).
 */
export function useFollowTail(
  containerRef: RefObject<HTMLElement | null>,
  options: UseFollowTailOptions = {},
) {
  const { threshold = 120, smoothDelay = 700, autoDelay = 150 } = options
  const [isAtBottom, setIsAtBottom] = useState(true)
  const programmaticUntilRef = useRef(0)

  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const recompute = () => {
      const near = root.scrollHeight - root.scrollTop - root.clientHeight < threshold
      setIsAtBottom((prev) => {
        if (!near && prev && Date.now() < programmaticUntilRef.current) return prev
        return near
      })
    }
    recompute()
    root.addEventListener("scroll", recompute, { passive: true })
    return () => root.removeEventListener("scroll", recompute)
  }, [containerRef, threshold])

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      setIsAtBottom(true)
      programmaticUntilRef.current = Date.now() + (behavior === "smooth" ? smoothDelay : autoDelay)
      const container = containerRef.current
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior })
        requestAnimationFrame(() => {
          const c = containerRef.current
          if (c) c.scrollTo({ top: c.scrollHeight, behavior })
        })
      } else {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const c = containerRef.current
            if (c) c.scrollTo({ top: c.scrollHeight, behavior })
          })
        })
      }
    },
    [containerRef, smoothDelay, autoDelay],
  )

  const isNearBottom = useCallback(
    (extraThreshold = 400) => {
      const c = containerRef.current
      if (!c) return false
      return c.scrollHeight - c.scrollTop - c.clientHeight < extraThreshold
    },
    [containerRef],
  )

  return { isAtBottom, setIsAtBottom, scrollToBottom, isNearBottom, programmaticUntilRef }
}
