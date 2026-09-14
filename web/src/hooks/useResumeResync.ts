import { useEffect, useRef } from "react"

/**
 * Dispara `onResume` al volver a primer plano si la página estuvo oculta al
 * menos `minAwayMs`. En Android el WebView se suspende en segundo plano y la
 * conexión SSE puede quedar medio-abierta (sin error ni eventos): el chat se
 * ve "parado" aunque el server siga trabajando. Los consumidores reconectan
 * y reconcilian estado ahí.
 */
export function useResumeResync(onResume: () => void, minAwayMs = 2000) {
  const onResumeRef = useRef(onResume)
  onResumeRef.current = onResume

  useEffect(() => {
    let hiddenAt = 0
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now()
        return
      }
      const away = hiddenAt ? Date.now() - hiddenAt : 0
      hiddenAt = 0
      // Cambiar de app un instante (compartir, cámara) no justifica reconectar.
      if (away >= minAwayMs) onResumeRef.current()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [minAwayMs])
}
