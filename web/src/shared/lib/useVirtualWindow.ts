import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/**
 * Ventana de filas para listas largas dentro de un contenedor con scroll.
 *
 * Por qué existe: la lista de Recientes montaba TODAS las tarjetas dentro de un
 * scroller de 220px. Medido en la app viva (600 sesiones principales): 8073
 * nodos totales, ~7800 de esa lista, para ~7 filas visibles. Acá se montan solo
 * las filas de la ventana + `overscan` y dos huecos (`topPad`/`bottomPad`)
 * conservan la altura total para que la barra de scroll siga siendo real (no es
 * un tope: la sesión 599 sigue alcanzable scrolleando).
 *
 * `rowPitch` es el paso entre filas (alto + gap), no el alto de la tarjeta:
 * medido, el scrollHeight de 600 filas fue 19206 = 600 × 32.01 con tarjetas de
 * 30px y `gap: 2px` en el CSS. Si cambia el CSS de la lista, medí de nuevo.
 *
 * Si no se puede medir el contenedor (jsdom, primer render antes del layout) se
 * asume un viewport de `VIEWPORT_FALLBACK_ROWS` filas: es preferible montar de
 * más que dejar la lista vacía.
 */
export type VirtualWindow = {
  /** Índice de la primera fila montada. */
  startIndex: number
  /** Índice EXCLUSIVO de la última fila montada. */
  endIndex: number
  /** Alto del hueco que reemplaza las filas de arriba. */
  topPad: number
  /** Alto del hueco que reemplaza las filas de abajo. */
  bottomPad: number
  /** Ref del contenedor con scroll (callback ref: mide y escucha al montar). */
  containerRef: (node: HTMLElement | null) => void
  /** Lleva una fila a la ventana (rename in-place, búsqueda, foco). */
  scrollToIndex: (index: number) => void
}

const VIEWPORT_FALLBACK_ROWS = 8
const OVERSCAN_ROWS = 6

export function useVirtualWindow(itemCount: number, rowPitch: number, overscan = OVERSCAN_ROWS): VirtualWindow {
  const nodeRef = useRef<HTMLElement | null>(null)
  const rafRef = useRef(0)
  const observerRef = useRef<ResizeObserver | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(0)

  const handleScroll = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      setScrollTop(nodeRef.current?.scrollTop ?? 0)
    })
  }, [])

  const containerRef = useCallback((node: HTMLElement | null) => {
    const prev = nodeRef.current
    if (prev === node) return
    observerRef.current?.disconnect()
    observerRef.current = null
    if (prev) prev.removeEventListener("scroll", handleScroll)
    nodeRef.current = node
    if (!node) return
    node.addEventListener("scroll", handleScroll, { passive: true })
    setScrollTop(node.scrollTop)
    setViewport(node.clientHeight)
    // jsdom no implementa ResizeObserver: sin guarda, el render de tests revienta.
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => setViewport(node.clientHeight))
    observer.observe(node)
    observerRef.current = observer
  }, [handleScroll])

  useEffect(() => () => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    nodeRef.current?.removeEventListener("scroll", handleScroll)
    nodeRef.current = null
  }, [handleScroll])

  const pitch = rowPitch > 0 ? rowPitch : 32
  const visibleRows = Math.max(1, Math.ceil((viewport || pitch * VIEWPORT_FALLBACK_ROWS) / pitch))
  const windowRows = visibleRows + overscan * 2
  // Al tope: nunca dejar el hueco de abajo sin filas montadas (una lista
  // encogida con scroll viejo montaba cero tarjetas y el panel quedaba vacío).
  const maxStart = Math.max(0, itemCount - windowRows)
  const startIndex = Math.min(Math.max(0, Math.floor(scrollTop / pitch) - overscan), maxStart)
  const endIndex = Math.min(itemCount, startIndex + windowRows)

  const scrollToIndex = useCallback((index: number) => {
    const node = nodeRef.current
    if (!node || index < 0) return
    node.scrollTop = Math.max(0, index * pitch - pitch)
  }, [pitch])

  return useMemo(() => ({
    startIndex,
    endIndex,
    topPad: startIndex * pitch,
    bottomPad: Math.max(0, (itemCount - endIndex) * pitch),
    containerRef,
    scrollToIndex,
  }), [startIndex, endIndex, pitch, itemCount, containerRef, scrollToIndex])
}
