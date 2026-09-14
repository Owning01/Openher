import { useEffect } from "react"

/** Evento que dispara el shell (`evaluate_script`) para abrir una carpeta. */
export const DESKTOP_OPEN_DIR_EVENT = "openher:open-dir"

declare global {
  interface Window {
    /** La setea main.rs con `--open-dir` antes de que React monte. */
    __OPENHER_OPEN_DIR__?: string | null
    /** Puente que define este hook para el `evaluate_script` del shell. */
    __openherOpenDir?: (dir: unknown) => void
  }
}

function consumeInitialDir(): string | null {
  if (typeof window === "undefined") return null

  // 1. Arranque con `--open-dir` (WebView): global inyectado en document-start.
  const globalDir = window.__OPENHER_OPEN_DIR__
  if (typeof globalDir === "string" && globalDir.trim()) {
    window.__OPENHER_OPEN_DIR__ = null
    return globalDir
  }

  // 2. Modo navegador (sin WebView2): `?openDir=`. Se limpia para no repetir
  //    la creación de la sesión en un refresh.
  try {
    const url = new URL(window.location.href)
    const param = url.searchParams.get("openDir")
    if (param && param.trim()) {
      url.searchParams.delete("openDir")
      window.history.replaceState({}, "", url.pathname + url.search + url.hash)
      return param
    }
  } catch {
    /* URL inválida: ignorar */
  }

  return null
}

/**
 * "Abrir sesión en OpenHer aquí" (menú contextual de Windows). Cubre los dos
 * caminos del shell:
 * - arranque nuevo con `--open-dir` → `window.__OPENHER_OPEN_DIR__` / `?openDir=`
 * - instancia ya viva → evento `openher:open-dir` vía `evaluate_script`
 *
 * Consume el valor inicial una sola vez (seguro bajo React.StrictMode).
 */
export function useDesktopOpenDir(onOpenDir: (dir: string) => void) {
  useEffect(() => {
    if (typeof window === "undefined") return

    // Puente para el shell: si React ya montó, va por evento; si no, deja el
    // global para que `consumeInitialDir` lo lea al montar.
    window.__openherOpenDir = (dir: unknown) => {
      if (typeof dir === "string" && dir.trim()) {
        window.dispatchEvent(new CustomEvent(DESKTOP_OPEN_DIR_EVENT, { detail: dir }))
      }
    }

    const initial = consumeInitialDir()
    if (initial) onOpenDir(initial)

    const listener = (event: Event) => {
      const dir = (event as CustomEvent).detail
      if (typeof dir === "string" && dir.trim()) onOpenDir(dir)
    }
    window.addEventListener(DESKTOP_OPEN_DIR_EVENT, listener)

    return () => {
      window.removeEventListener(DESKTOP_OPEN_DIR_EVENT, listener)
      delete window.__openherOpenDir
    }
  }, [onOpenDir])
}
