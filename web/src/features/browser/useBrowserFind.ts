import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { buildFindCountScript } from "../../components/browserSync"

type Args = {
  isDesktop: boolean
  currentSrc: string
  iframeRef: RefObject<HTMLIFrameElement | null>
  // Inyecta código en la página nativa (desktop); ya trae el catch silencioso.
  evalInPage: (code: string) => void
}

// Findbar: estado, foco y búsqueda en la página (nativa o iframe).
export function useBrowserFind({ isDesktop, currentSrc, iframeRef, evalInPage }: Args) {
  const [findOpen, setFindOpen] = useState(false)
  const [findQuery, setFindQuery] = useState("")
  const [findCase, setFindCase] = useState(false)
  const [findTotal, setFindTotal] = useState<number | null>(null)
  const findInputRef = useRef<HTMLInputElement | null>(null)

  const applyFind = useCallback((q: string, cs: boolean) => {
    if (!q) return
    setFindTotal(null)
    const code = cs
      ? `window.find(${JSON.stringify(q)}, false, false, true, false, false, false)`
      : `window.find(${JSON.stringify(q)}, false, false, false, false, false, false)`
    if (isDesktop) {
      evalInPage(code)
      // Contador aparte: /eval no retorna valores, vuelve por IPC (find-count).
      evalInPage(buildFindCountScript(q, cs))
    } else {
      try {
        const w = iframeRef.current?.contentWindow as any
        if (w?.find) w.find(q, false, false, !cs, false, false, false)
        const doc = iframeRef.current?.contentDocument as any
        const txt: string = doc?.body?.innerText ?? ""
        if (txt && q) {
          const hay = cs ? txt : txt.toLowerCase()
          const needle = cs ? q : q.toLowerCase()
          let n = 0
          let i = -1
          while ((i = hay.indexOf(needle, i + 1)) >= 0 && n < 9999) n++
          setFindTotal(n)
        } else {
          setFindTotal(0)
        }
      } catch {
        setFindTotal(null)
      }
    }
  }, [isDesktop, iframeRef, evalInPage])

  const openFind = useCallback(() => {
    setFindOpen(true)
    requestAnimationFrame(() => findInputRef.current?.focus())
  }, [])

  // Al cambiar de página el contador anterior ya no vale.
  useEffect(() => { setFindTotal(null) }, [currentSrc])

  return {
    findOpen,
    setFindOpen,
    findQuery,
    setFindQuery,
    findCase,
    setFindCase,
    findTotal,
    setFindTotal,
    findInputRef,
    applyFind,
    openFind,
  }
}
