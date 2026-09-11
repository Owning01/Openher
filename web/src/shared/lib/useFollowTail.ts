import { useEffect, useRef, useState, useCallback, type RefObject } from "react"

type UseFollowTailOptions = {
  threshold?: number
  smoothDelay?: number
  autoDelay?: number
  // Memoria de posición por sesión (p. ej. selectedID): minimizo/restauro,
  // rotación o resize colapsan el layout y el navegador re-clampea scrollTop;
  // sin memoria el chat reaparece en otra ubicación. Se guarda distancia al
  // fondo en cada scroll y se re-afirma tras resize/visibilidad.
  persistKey?: string | null
  // Puerta de persistencia: si es false, NO se escribe memoria (el listado
  // está montado con datos stale o en pleno asentamiento). Evita envenenar
  // la posición de la sesión nueva con la geometría de la anterior — causa
  // histórica del "entra arriba" al cambiar de chat.
  canPersistRef?: RefObject<boolean>
}

// Distancia al fondo por sesión + cuándo se guardó. Persiste por sesión:
// cambiar de conversación y volver restaura donde lo dejaste si te habías
// quedado a mitad (dist>80); si estabas al fondo, siempre abajo. Ventana 2h.
const scrollMemory = new Map<string, { dist: number; ts: number; mid?: string; moff?: number }>()
function rememberScroll(key: string, dist: number, mid?: string, moff?: number) {
  if (!scrollMemory.has(key) && scrollMemory.size >= 300) {
    const oldest = scrollMemory.keys().next().value
    if (oldest !== undefined) scrollMemory.delete(oldest)
  }
  const prev = scrollMemory.get(key)
  // Preservar ancla previa si la nueva no trae mid (throttle)
  const curMid = mid !== undefined ? mid : prev?.mid
  const curMoff = moff !== undefined ? moff : prev?.moff
  scrollMemory.set(key, { dist, ts: Date.now(), mid: curMid, moff: curMoff })
}

// Persistencia en sessionStorage: sobrevive a un reload (el SO puede matar
// el WebView al minimizar). Ventana de retorno 2h: más viejo = entrada
// fresca abajo, como siempre. v3: purga memorias envenenadas por montajes
// con datos stale (v2 guardaba la geometría del chat anterior bajo la sesión
// nueva y la entrada clavaba arriba al no poder representar esa distancia).
const SCROLL_MEM_KEY = "openher.chatScroll.v3"
const RETURN_WINDOW_MS = 2 * 60 * 60 * 1000
function loadPersisted(): { mem: Record<string, { dist: number; ts: number; mid?: string; moff?: number }>; lastSel: string | null } {
  try {
    const raw = sessionStorage.getItem(SCROLL_MEM_KEY)
    if (raw) {
      const p = JSON.parse(raw) as { mem?: Record<string, { dist: number; ts: number; mid?: string; moff?: number }>; lastSel?: string | null }
      if (p && typeof p === "object") return { mem: p.mem ?? {}, lastSel: p.lastSel ?? null }
    }
  } catch {
    /* privado o sin storage */
  }
  return { mem: {}, lastSel: null }
}
function flushPersisted() {
  try {
    const mem: Record<string, { dist: number; ts: number; mid?: string; moff?: number }> = {}
    for (const [k, v] of scrollMemory) mem[k] = v
    sessionStorage.setItem(SCROLL_MEM_KEY, JSON.stringify({ mem, lastSel: lastEntryKey }))
  } catch {
    /* privado o sin storage */
  }
}
let lastEntryKey: string | null = null
try {
  lastEntryKey = loadPersisted().lastSel
} catch {
  /* privado o sin storage */
}
// Solo tests: limpiar memoria entre casos (el módulo es singleton).
export function __clearScrollMemory() {
  scrollMemory.clear()
  lastEntryKey = null
  try { sessionStorage.removeItem(SCROLL_MEM_KEY) } catch {}
}
function hydratedGet(key: string): { dist: number; ts: number; mid?: string; moff?: number } | null {
  const m = scrollMemory.get(key)
  if (m) return m
  const s = loadPersisted().mem[key]
  if (s && typeof s.dist === "number" && typeof s.ts === "number") {
    scrollMemory.set(key, s as { dist: number; ts: number; mid?: string; moff?: number })
    return s as { dist: number; ts: number; mid?: string; moff?: number }
  }
  return null
}

/**
 * Entrada a sesión: si hay memoria reciente a mitad (>80px del fondo, <2h),
 * restaura donde lo dejaste (por mensaje si existe, sino por distancia) —
 * válido incluso tras cambiar de conversación y volver. Si estabas al fondo
 * o la memoria expiró / no existe, entra abajo.
 * Nota: lastEntryKey se conserva solo para compatibilidad con flushPersisted,
 * ya no decide el fresh (el test legacy de "cambiar de chat siempre fresco"
 * se actualizó para reflejar la preservación por sesión).
 */
export function resolveSessionEntry(key: string): { kind: "return"; dist: number; mid?: string; moff?: number } | { kind: "fresh" } {
  lastEntryKey = key
  const s = hydratedGet(key)
  if (s && s.dist > 80 && Date.now() - s.ts < RETURN_WINDOW_MS) {
    return { kind: "return", dist: s.dist, mid: s.mid, moff: s.moff }
  }
  return { kind: "fresh" }
}

// Primer mensaje visible + offset de su top al top del contenedor.
function captureAnchor(root: HTMLElement): { id: string; off: number } | null {
  try {
    const cTop = root.getBoundingClientRect().top
    const rows = root.querySelectorAll("[data-message-id]")
    for (const node of rows) {
      const el = node as HTMLElement
      const r = el.getBoundingClientRect()
      if (r.bottom > cTop + 1 && r.top < cTop + root.clientHeight) {
        const id = el.getAttribute("data-message-id") ?? ""
        if (id) return { id, off: Math.round(r.top - cTop) }
      }
    }
  } catch {
    /* detached */
  }
  return null
}

/**
 * Reposiciona el contenedor sobre la posición guardada. Primero por MENSAJE
 * (inmune a que el chat crezca arriba o abajo mientras estábamos fuera, p.
 * ej. streaming minimizado); si el mensaje ya no existe, por distancia.
 */
export function anchorScrollToSaved(
  root: HTMLElement,
  saved: { dist: number; mid?: string; moff?: number },
): boolean {
  if (saved.mid) {
    try {
      let sel = `[data-message-id="${saved.mid}"]`
      try {
        sel = `[data-message-id="${CSS.escape(saved.mid)}"]`
      } catch {
        /* ids generados: el fallback plano vale */
      }
      const node = root.querySelector(sel) as HTMLElement | null
      if (node) {
        const cTop = root.getBoundingClientRect().top
        const r = node.getBoundingClientRect()
        const target = root.scrollTop + (r.top - cTop) - (saved.moff ?? 0)
        root.scrollTop = Math.max(0, Math.min(target, root.scrollHeight - root.clientHeight))
        return true
      }
    } catch {
      /* detached → fallback por distancia */
    }
  }
  try {
    const max = root.scrollHeight - root.clientHeight
    if (saved.dist <= 2) {
      root.scrollTop = root.scrollHeight
      return true
    }
    const target = max - saved.dist
    // La posición guardada queda POR ENCIMA del contenido cargado (memoria
    // vieja de una lista más larga o envenenada): no clavar arriba. Devolver
    // false deja que el llamador decida (entrada → fondo).
    if (target < 0) return false
    root.scrollTop = Math.min(target, max)
    return true
  } catch {
    return false
  }
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
  const { threshold = 120, smoothDelay = 700, autoDelay = 150, persistKey = null, canPersistRef } = options
  const [isAtBottom, setIsAtBottom] = useState(true)
  const programmaticUntilRef = useRef(0)
  // Congelar guardados mientras el layout está inestable (restore en curso):
  // el clamp intermedio generaría una distancia falsa que envenena la memoria.
  const freezeUntilRef = useRef(0)
  const frozenSnapRef = useRef<{ dist: number; ts: number; mid?: string; moff?: number } | null>(null)
  const lastAnchorAtRef = useRef(0)

  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const recompute = () => {
      const now = Date.now()
      const dist = root.scrollHeight - root.scrollTop - root.clientHeight
      // Con viewport colapsado (minimizado/oculto) el clamp a 0 daría una
      // distancia falsa: no contaminar la memoria. Tampoco durante el freeze
      // ni con datos stale / a medio asentar (canPersistRef).
      const allow = !canPersistRef || canPersistRef.current
      if (persistKey && allow && root.clientHeight > 0 && now >= freezeUntilRef.current) {
        // Capturar ancla throttled 100ms (antes 500ms se quedaba stale al minimizar rápido)
        let mid: string | undefined
        let moff: number | undefined
        if (now - lastAnchorAtRef.current > 100) {
          lastAnchorAtRef.current = now
          const a = captureAnchor(root)
          if (a) {
            mid = a.id
            moff = a.off
          }
        }
        // Si no hay nueva ancla, preservar la previa vía rememberScroll
        rememberScroll(persistKey, dist, mid, moff)
      }
      const near = dist < threshold
      setIsAtBottom((prev) => {
        if (!near && prev && now < programmaticUntilRef.current) return prev
        return near
      })
    }
    recompute()
    root.addEventListener("scroll", recompute, { passive: true })
    return () => root.removeEventListener("scroll", recompute)
  }, [containerRef, threshold, persistKey, canPersistRef])

  // Entrada fresca abajo: limpiar ancla mid/moff vieja aunque dist=0, para
  // que un resize posterior no re-afirme una posición media de ayer.
  const resetSavedPosition = useCallback(() => {
    if (persistKey) {
      scrollMemory.set(persistKey, { dist: 0, ts: Date.now() })
      if (scrollMemory.size > 300) {
        const oldest = scrollMemory.keys().next().value
        if (oldest !== undefined && oldest !== persistKey) scrollMemory.delete(oldest)
      }
      flushPersisted()
    }
  }, [persistKey])

  const restoreSavedPosition = useCallback((snap?: { dist: number; ts: number; mid?: string; moff?: number } | null) => {
    const c = containerRef.current
    if (!c || !persistKey) return false
    const saved = snap ?? scrollMemory.get(persistKey) ?? null
    if (!saved) return false
    // Al confirmar fondo (dist<=2) se fija memoria en 0: sin esto un mid
    // stale sobrevivía y la próxima entrada (tab/minimizar/chat) restauraba
    // arriba aunque la última vista real fuera el fondo.
    const confirmBottom = (cc: HTMLElement) => {
      const d = cc.scrollHeight - cc.scrollTop - cc.clientHeight
      const at = d <= 2
      setIsAtBottom(at)
      if (at) resetSavedPosition()
    }
    // Si el layout aún está colapsado (restore temprano con height 0), reintentar
    // hasta 10 frames en vez de fallar silencioso y dejar el scroll arriba.
    const fallbackBottom = (cc: HTMLElement) => {
      cc.scrollTop = cc.scrollHeight
      setIsAtBottom(true)
      resetSavedPosition()
    }
    if (c.clientHeight === 0) {
      let tries = 0
      const retry = () => {
        const cc = containerRef.current
        if (!cc || cc.clientHeight === 0) {
          if (tries++ < 10) requestAnimationFrame(retry)
          return
        }
        programmaticUntilRef.current = Date.now() + autoDelay
        const ok2 = anchorScrollToSaved(cc, saved)
        if (ok2) confirmBottom(cc)
        else fallbackBottom(cc)
      }
      requestAnimationFrame(retry)
      return false
    }
    programmaticUntilRef.current = Date.now() + autoDelay
    const ok = anchorScrollToSaved(c, saved)
    if (ok) confirmBottom(c)
    // Posición guardada irrepresentable (memoria vieja de una lista más
    // larga): restaurar al fondo en vez de quedar clavado arriba.
    else fallbackBottom(c)
    return ok
  }, [containerRef, persistKey, autoDelay, resetSavedPosition])

  // Minimizar/restaurar, rotar o redimensionar: tras estabilizar el layout
  // (debounce + 2 rAF para que el virtualizador re-mida) se re-afirma la
  // posición guardada en vez de dejar el clamp del navegador. Se aplica el
  // snapshot previo al freeze, no la lectura viva (el clamp intermedio ya la
  // habría envenenado). Al ocultar se vuelca a sessionStorage (el SO puede
  // matar el WebView al minimizar). Poll robusto: si el contenedor aún está a
  // 0 al re-afirmar, reintenta hasta que tenga altura.
  useEffect(() => {
    if (!persistKey) return
    let timer: ReturnType<typeof setTimeout> | null = null
    let raf = 0
    let pollRaf = 0
    const reassert = () => {
      // Capturar snapshot ANTES de congelar (lectura viva ya envenenada por clamp a 0)
      const snap = scrollMemory.get(persistKey) ?? null
      frozenSnapRef.current = snap ? { ...snap } : null
      freezeUntilRef.current = Date.now() + 1200
      if (timer) clearTimeout(timer)
      cancelAnimationFrame(raf)
      cancelAnimationFrame(pollRaf)
      timer = setTimeout(() => {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          raf = requestAnimationFrame(() => {
            const c = containerRef.current
            // Si aún colapsado, poll hasta tener altura (max ~500ms)
            if (c && c.clientHeight === 0) {
              let tries = 0
              const poll = () => {
                const cc2 = containerRef.current
                if (cc2 && cc2.clientHeight > 0) {
                  restoreSavedPosition(frozenSnapRef.current)
                  freezeUntilRef.current = Date.now() + 300
                  return
                }
                if (tries++ < 15) pollRaf = requestAnimationFrame(poll)
                else freezeUntilRef.current = Date.now() + 300
              }
              pollRaf = requestAnimationFrame(poll)
              return
            }
            restoreSavedPosition(frozenSnapRef.current)
            freezeUntilRef.current = Date.now() + 300
          })
        })
      }, 150)
    }
    const onVis = () => {
      if (document.hidden) flushPersisted()
      else reassert()
    }
    const onHide = () => flushPersisted()
    window.addEventListener("resize", reassert)
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("pagehide", onHide)
    // Desktop: el resize del WebView hijo no siempre burbujea como window resize;
    // ResizeObserver sobre el contenedor captura también el clamp del flex.
    let ro: ResizeObserver | null = null
    const el = containerRef.current
    if (el && typeof ResizeObserver !== "undefined") {
      let lastH = el.clientHeight
      ro = new ResizeObserver(() => {
        const h = el.clientHeight
        // 0 -> >0 es el restore crítico; clamp intermedio se ignora vía freeze
        if (lastH === 0 && h > 0) reassert()
        lastH = h
      })
      try { ro.observe(el) } catch {}
    }
    return () => {
      if (timer) clearTimeout(timer)
      cancelAnimationFrame(raf)
      cancelAnimationFrame(pollRaf)
      window.removeEventListener("resize", reassert)
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("pagehide", onHide)
      if (ro) try { ro.disconnect() } catch {}
    }
  }, [containerRef, persistKey, restoreSavedPosition])

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      setIsAtBottom(true)
      programmaticUntilRef.current = Date.now() + (behavior === "smooth" ? smoothDelay : autoDelay)
      const container = containerRef.current
      if (container) {
        // Anclas ("auto"): scrollTop directo = instantáneo SIEMPRE, sin
        // importar scroll-behavior CSS heredado. El scrollTo posterior conserva
        // el ledger/timing; con "smooth" (botón del usuario) no se toca.
        if (behavior !== "smooth") {
          try {
            container.scrollTop = container.scrollHeight
          } catch {
            /* contenedor detached: el scrollTo posterior lo intenta igual */
          }
        }
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

  return { isAtBottom, setIsAtBottom, scrollToBottom, isNearBottom, programmaticUntilRef, resetSavedPosition, restoreSavedPosition }
}
