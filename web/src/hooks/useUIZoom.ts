import { useEffect } from "react"

const ZOOM_KEY = "openher.ui_zoom"

/**
 * Zoom general de la interfaz con Ctrl + Ruedita y atajos de teclado (Ctrl + / Ctrl - / Ctrl 0)
 * Escala uniforme (rem + px cromado) y notifica a xterm para evitar duplicación de glifos.
 */
export function useUIZoom() {
  useEffect(() => {
    const saved = localStorage.getItem(ZOOM_KEY)
    let currentZoom = saved ? Math.min(2.0, Math.max(0.7, parseFloat(saved))) : 1

    const applyZoom = (z: number) => {
      try {
        ;(document.documentElement.style as any).zoom = ""
      } catch {}
      const basePx = Math.round(16 * z * 10) / 10
      document.documentElement.style.fontSize = `${basePx}px`
      document.documentElement.style.setProperty("--ui-scale", `${z}`)
      try {
        window.dispatchEvent(new CustomEvent("ui-zoom", { detail: { zoom: z } }))
        window.dispatchEvent(new Event("resize"))
      } catch {}
    }

    applyZoom(currentZoom)

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY < 0 ? 0.05 : -0.05
        currentZoom = Math.min(2.0, Math.max(0.7, Math.round((currentZoom + delta) * 100) / 100))
        if (Math.abs(currentZoom - 1) < 0.02) currentZoom = 1
        applyZoom(currentZoom)
        localStorage.setItem(ZOOM_KEY, String(currentZoom))
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault()
          currentZoom = Math.min(2.0, Math.round((currentZoom + 0.1) * 10) / 10)
          applyZoom(currentZoom)
          localStorage.setItem(ZOOM_KEY, String(currentZoom))
        } else if (e.key === "-") {
          e.preventDefault()
          currentZoom = Math.max(0.7, Math.round((currentZoom - 0.1) * 10) / 10)
          applyZoom(currentZoom)
          localStorage.setItem(ZOOM_KEY, String(currentZoom))
        } else if (e.key === "0") {
          e.preventDefault()
          currentZoom = 1
          applyZoom(1)
          localStorage.setItem(ZOOM_KEY, "1")
        }
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])
}
