// useShellViewport — breakpoints del shell desktop que no coinciden con el
// layout móvil: <600px (solo rail + contenido) y <=1100px (QuickChat overlay).
// buildGridTemplate los usa para no reservar columnas de sidebars que el CSS
// ya oculta o saca del flujo; con matchMedia solo se re-renderiza al cruzar el
// breakpoint, no en cada píxel del resize.
import { useSyncExternalStore } from "react"

const NARROW_MQ = "(max-width: 600px)"
const OVERLAY_MQ = "(max-width: 1100px)"

export type ShellViewport = {
  /** Ventana <600px: sidebars fuera del grid (rail + contenido). */
  narrow: boolean
  /** Ventana <=1100px: la sidebar derecha se posiciona como overlay. */
  rightOverlay: boolean
}

let narrowMql: MediaQueryList | null = null
let overlayMql: MediaQueryList | null = null

function getMqls(): [MediaQueryList, MediaQueryList] {
  if (!narrowMql) narrowMql = window.matchMedia(NARROW_MQ)
  if (!overlayMql) overlayMql = window.matchMedia(OVERLAY_MQ)
  return [narrowMql, overlayMql]
}

let cache: ShellViewport = { narrow: false, rightOverlay: false }

function subscribe(onChange: () => void): () => void {
  const [narrow, overlay] = getMqls()
  narrow.addEventListener("change", onChange)
  overlay.addEventListener("change", onChange)
  return () => {
    narrow.removeEventListener("change", onChange)
    overlay.removeEventListener("change", onChange)
  }
}

function getSnapshot(): ShellViewport {
  const [narrow, overlay] = getMqls()
  if (cache.narrow !== narrow.matches || cache.rightOverlay !== overlay.matches) {
    cache = { narrow: narrow.matches, rightOverlay: overlay.matches }
  }
  return cache
}

const SERVER_SNAPSHOT: ShellViewport = { narrow: false, rightOverlay: false }

export function useShellViewport(): ShellViewport {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT)
}
