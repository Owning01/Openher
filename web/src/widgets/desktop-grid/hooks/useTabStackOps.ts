import { useCallback } from "react"
import type { DesktopLayout } from "../../../types"
import { genPanelId } from "../../../hooks/useDesktopLayoutState"
import { killTerminalPty } from "../../../utils/terminalStore"
import type { UseDesktopGridActionsParams } from "./types"

/** Operaciones sobre las pilas de pestañas de cada panel: abrir, cambiar,
 * mover, transferir y cerrar pestañas. Cuando cerrar deja el panel vacío,
 * reusa el colapso de filas/columnas de la grilla. */
export function useTabStackOps({
  tabStacks,
  setTabStacks,
  setDesktopLayout,
  setActivePanel,
  desktopLayout,
}: Pick<
  UseDesktopGridActionsParams,
  "tabStacks" | "setTabStacks" | "setDesktopLayout" | "setActivePanel" | "desktopLayout"
>) {
  const openInPanel = useCallback(
    (panelIndex: number, sessionId: string) => {
      setDesktopLayout((prev: DesktopLayout) => {
        const sessions = [...prev.sessions]
        const panelKinds = [...prev.panelKinds]
        while (sessions.length <= panelIndex) sessions.push(null)
        while (panelKinds.length <= panelIndex) panelKinds.push("session")
        sessions[panelIndex] = sessionId
        panelKinds[panelIndex] = "session"
        return { ...prev, sessions, panelKinds }
      })
      setTabStacks((prev: string[][]) => {
        const next = prev.map((s: string[]) => [...s])
        while (next.length <= panelIndex) next.push([])
        for (let i = 0; i < next.length; i++) {
          if (i !== panelIndex) next[i] = next[i]!.filter((id: string) => id !== sessionId)
        }
        if (!next[panelIndex]?.includes(sessionId)) {
          next[panelIndex] = [...(next[panelIndex] ?? []), sessionId]
        }
        return next
      })
      setActivePanel(panelIndex)
    },
    [setDesktopLayout, setTabStacks, setActivePanel]
  )

  const switchTab = useCallback(
    (panelIndex: number, tabIndex: number) => {
      const stack = tabStacks?.[panelIndex]
      if (!stack || tabIndex < 0 || tabIndex >= stack.length) return
      const id = stack[tabIndex]
      if (!id) return
      if (
        id.startsWith("terminal") ||
        id.startsWith("browser:") ||
        id.startsWith("plugin:")
      ) {
        setDesktopLayout((prev: DesktopLayout) => {
          const sessions = [...prev.sessions]
          sessions[panelIndex] = id
          return { ...prev, sessions }
        })
        setActivePanel(panelIndex)
        return
      }
      openInPanel(panelIndex, id)
    },
    [tabStacks, openInPanel, setDesktopLayout, setActivePanel]
  )

  const removeTab = useCallback(
    (panelIndex: number, tabIndex: number) => {
      const stack = tabStacks?.[panelIndex]
      if (!stack || tabIndex < 0 || tabIndex >= stack.length) return
      const targetId = stack[tabIndex]
      const nextStack = stack.filter((_, i) => i !== tabIndex)
      // Si se cierra la última pestaña, cerrar el panel completo (como closePanel)
      if (nextStack.length === 0) {
        // Reusar lógica de closePanel: colapsar filas/columnas vacías
        const total = desktopLayout.cols * desktopLayout.rows
        if (panelIndex < 0 || panelIndex >= total) return
        const sessions = [...desktopLayout.sessions]
        const panelKinds = [...desktopLayout.panelKinds]
        const panelIds = [...desktopLayout.panelIds]
        // Verificar si quedaría al menos un panel no vacío
        const remaining = sessions
          .map((s, i) => ({ s, k: panelKinds[i], i }))
          .filter(({ s, k, i }) => i !== panelIndex && (s !== null || k !== "session"))
        if (remaining.length === 0) {
          setTabStacks(() => [[]])
          setDesktopLayout((prev) => ({
            ...prev,
            cols: 1,
            rows: 1,
            sessions: [null],
            panelKinds: ["session" as const],
            panelIds: [panelIds[panelIndex] ?? genPanelId()],
            panelEditorPaths: {},
            panelEditorTabStacks: {},
            panelEditorActive: {},
            colSizes: [null],
            rowSizes: [null],
          }))
          setActivePanel(0)
          return
        }
        // Panel vacío: aplicar colapso de filas/columnas (copiado de closePanel)
        let nextSessions = [...sessions]
        let nextKinds = [...panelKinds]
        let nextIds = [...panelIds]
        let nextStacks: string[][] = tabStacks.map((s) => [...s])
        while (nextStacks.length < total) nextStacks.push([])
        nextStacks[panelIndex] = []
        nextSessions[panelIndex] = null
        nextKinds[panelIndex] = "session"
        let { cols, rows, colSizes, rowSizes } = desktopLayout as unknown as DesktopLayout & {
          colSizes: (number | null)[]
          rowSizes: (number | null)[]
        }
        const isEmpty = (i: number) => {
          if (nextSessions[i]) return false
          if ((nextStacks[i]?.length ?? 0) > 0) return false
          const kind = nextKinds[i]
          if (kind === "editor") {
            // editor guarda tabs en layout, no en tabStacks
            const layoutAny = desktopLayout as any
            if (layoutAny.panelEditorTabStacks?.[i]?.length) return false
            if (layoutAny.panelEditorPaths?.[i]) return false
            return true
          }
          if (kind !== "session") return false
          return true
        }
        let changed = true
        while (changed) {
          changed = false
          for (let r = 0; r < rows; r++) {
            const rowEmpty = nextSessions.slice(r * cols, r * cols + cols).every((_, i) => isEmpty(r * cols + i))
            if (rowEmpty && rows > 1) {
              nextSessions = nextSessions.filter((_, i) => Math.floor(i / cols) !== r)
              nextKinds = nextKinds.filter((_, i) => Math.floor(i / cols) !== r)
              nextIds = nextIds.filter((_, i) => Math.floor(i / cols) !== r)
              nextStacks = nextStacks.filter((_, i) => Math.floor(i / cols) !== r)
              rows -= 1
              rowSizes = (rowSizes as (number | null)[]).filter((_, i) => i !== r)
              changed = true
              break
            }
          }
          if (changed) continue
          const emptyCols: number[] = []
          for (let c = 0; c < cols; c++) {
            const colEmpty = Array.from({ length: rows }, (_, r) => r * cols + c).every((i) => isEmpty(i))
            if (colEmpty) emptyCols.push(c)
          }
          if (emptyCols.length > 0 && cols > emptyCols.length) {
            const removeSet = new Set(emptyCols)
            nextSessions = nextSessions.filter((_, i) => !removeSet.has(i % cols))
            nextKinds = nextKinds.filter((_, i) => !removeSet.has(i % cols))
            nextIds = nextIds.filter((_, i) => !removeSet.has(i % cols))
            nextStacks = nextStacks.filter((_, i) => !removeSet.has(i % cols))
            cols -= emptyCols.length
            colSizes = (colSizes as (number | null)[]).filter((_, i) => !removeSet.has(i))
            changed = true
          }
          if (cols === 1) colSizes = [null]
          if (rows === 1) rowSizes = [null]
        }
        setTabStacks(() => nextStacks)
        setDesktopLayout((prev) => ({
          ...prev,
          cols,
          rows,
          sessions: nextSessions,
          panelKinds: nextKinds,
          panelIds: nextIds,
          colSizes: colSizes as any,
          rowSizes: rowSizes as any,
        }))
        setActivePanel((prev) => (prev >= panelIndex ? Math.max(0, prev - 1) : prev))
        return
      }
      setTabStacks((prev: string[][]) => {
        const next = prev.map((s: string[]) => [...s])
        next[panelIndex] = nextStack
        return next
      })
      setDesktopLayout((prev: DesktopLayout) => {
        const sessions = [...prev.sessions]
        if (sessions[panelIndex] === targetId) {
          sessions[panelIndex] = nextStack[Math.max(0, tabIndex - 1)] ?? null
        }
        return { ...prev, sessions }
      })
    },
    [tabStacks, desktopLayout, setTabStacks, setDesktopLayout, setActivePanel]
  )

  const moveTab = useCallback(
    (panelIndex: number, fromIdx: number, toIdx: number) => {
      setTabStacks((prev: string[][]) => {
        const next = prev.map((s: string[]) => [...s])
        const stack = next[panelIndex]
        if (!stack) return prev
        const [moved] = stack.splice(fromIdx, 1)
        if (moved) stack.splice(toIdx, 0, moved)
        return next
      })
    },
    [setTabStacks]
  )

  const transferTab = useCallback(
    (fromPanel: number, fromIdx: number, toPanel: number, toIdx: number) => {
      const moved = tabStacks[fromPanel]?.[fromIdx]
      if (!moved) return
      setTabStacks((prev: string[][]) => {
        const next = prev.map((s: string[]) => [...s])
        while (next.length <= toPanel) next.push([])
        const sourceStack = next[fromPanel]
        if (!sourceStack || fromIdx < 0 || fromIdx >= sourceStack.length) return prev
        // usar prev para validar moved real vs stale snapshot
        const movedFromPrev = prev[fromPanel]?.[fromIdx]
        if (movedFromPrev !== moved) {
          // stale: buscar moved real en prev
          const altIdx = prev[fromPanel]?.indexOf(moved) ?? -1
          if (altIdx === -1) return prev
          const [altMoved] = prev[fromPanel]!.splice(altIdx, 1) as any
          if (!altMoved) return prev
          const destStack = next[toPanel] ?? []
          destStack.splice(toIdx, 0, altMoved)
          next[toPanel] = destStack
          // reconstruir next desde prev correcto
          const corrected = prev.map((s: string[]) => [...s])
          while (corrected.length <= toPanel) corrected.push([])
          corrected[fromPanel]!.splice(altIdx, 1)
          corrected[toPanel]!.splice(toIdx, 0, altMoved)
          return corrected
        }
        const [m] = sourceStack.splice(fromIdx, 1)
        if (!m) return prev
        const destStack = next[toPanel] ?? []
        destStack.splice(toIdx, 0, m)
        next[toPanel] = destStack
        return next
      })
      setDesktopLayout((prev: DesktopLayout) => {
        const sessions = [...prev.sessions]
        if (sessions[fromPanel] === moved) {
          const remaining = (tabStacks[fromPanel] ?? []).filter((_, i) => i !== fromIdx)
          sessions[fromPanel] = remaining[0] ?? null
        }
        sessions[toPanel] = moved
        return { ...prev, sessions }
      })
      setActivePanel(toPanel)
    },
    [tabStacks, setTabStacks, setDesktopLayout, setActivePanel]
  )

  const addTerminalToPanel = useCallback(
    (panelIndex: number, _targetIndex?: number) => {
      const ptyId = `term-${Date.now()}`
      const terminalId = `terminal:${ptyId}`
      setTabStacks((prev: string[][]) => {
        const next = prev.map((s: string[]) => [...s])
        while (next.length <= panelIndex) next.push([])
        if (!next[panelIndex]) next[panelIndex] = []
        for (let i = 0; i < next.length; i++) {
          if (i !== panelIndex) next[i] = next[i]!.filter((tid: string) => tid !== terminalId)
        }
        next[panelIndex] = [...(next[panelIndex] ?? []), terminalId]
        return next
      })
      setDesktopLayout((prev: DesktopLayout) => {
        const sessions = [...prev.sessions]
        while (sessions.length <= panelIndex) sessions.push(null)
        sessions[panelIndex] = terminalId
        return { ...prev, sessions }
      })
      setActivePanel(panelIndex)
    },
    [setTabStacks, setDesktopLayout, setActivePanel]
  )

  const closeOthers = useCallback(
    (panelIndex: number, keepIdx: number) => {
      const stack = tabStacks[panelIndex] ?? []
      if (stack.length <= 1) return
      const keepId = stack[keepIdx]
      if (!keepId) return
      const toClose = stack.filter((_, i) => i !== keepIdx)
      for (const id of toClose) if (id.startsWith("terminal")) killTerminalPty(id.replace(/^terminal[:\-]/, ""))
      const browserToDelete = toClose.filter((id) => id.startsWith("browser:"))
      setTabStacks((prev) => {
        const next = prev.map((s) => [...s])
        if (!next[panelIndex]) return next
        next[panelIndex] = [keepId]
        return next
      })
      setDesktopLayout((prev) => {
        const sessions = [...prev.sessions]
        const urls = { ...(prev.browserTabUrls ?? {}) }
        for (const id of browserToDelete) delete urls[id]
        sessions[panelIndex] = keepId
        return { ...prev, sessions, browserTabUrls: urls }
      })
      setActivePanel(panelIndex)
    },
    [tabStacks, setTabStacks, setDesktopLayout, setActivePanel]
  )

  const closeRight = useCallback(
    (panelIndex: number, idx: number) => {
      const stack = tabStacks[panelIndex] ?? []
      if (idx >= stack.length - 1) return
      const toClose = stack.slice(idx + 1)
      for (const id of toClose) if (id.startsWith("terminal")) killTerminalPty(id.replace(/^terminal[:\-]/, ""))
      const browserToDelete = toClose.filter((id) => id.startsWith("browser:"))
      const activeId = desktopLayout.sessions[panelIndex]
      const activeClosing = activeId ? toClose.includes(activeId) : false
      setTabStacks((prev) => {
        const next = prev.map((s) => [...s])
        if (!next[panelIndex]) return next
        next[panelIndex] = next[panelIndex].slice(0, idx + 1)
        return next
      })
      if (activeClosing) {
        setDesktopLayout((prev) => {
          const sessions = [...prev.sessions]
          const urls = { ...(prev.browserTabUrls ?? {}) }
          for (const id of browserToDelete) delete urls[id]
          sessions[panelIndex] = stack[idx] ?? null
          return { ...prev, sessions, browserTabUrls: urls }
        })
      } else if (browserToDelete.length) {
        setDesktopLayout((prev) => {
          const urls = { ...(prev.browserTabUrls ?? {}) }
          for (const id of browserToDelete) delete urls[id]
          return { ...prev, browserTabUrls: urls }
        })
      }
    },
    [tabStacks, desktopLayout.sessions, setTabStacks, setDesktopLayout]
  )

  const closeLeft = useCallback(
    (panelIndex: number, idx: number) => {
      const stack = tabStacks[panelIndex] ?? []
      if (idx <= 0) return
      const toClose = stack.slice(0, idx)
      for (const id of toClose) if (id.startsWith("terminal")) killTerminalPty(id.replace(/^terminal[:\-]/, ""))
      const browserToDelete = toClose.filter((id) => id.startsWith("browser:"))
      const activeId = desktopLayout.sessions[panelIndex]
      const activeClosing = activeId ? toClose.includes(activeId) : false
      setTabStacks((prev) => {
        const next = prev.map((s) => [...s])
        if (!next[panelIndex]) return next
        next[panelIndex] = next[panelIndex].slice(idx)
        return next
      })
      if (activeClosing) {
        setDesktopLayout((prev) => {
          const sessions = [...prev.sessions]
          const urls = { ...(prev.browserTabUrls ?? {}) }
          for (const id of browserToDelete) delete urls[id]
          sessions[panelIndex] = stack[idx] ?? null
          return { ...prev, sessions, browserTabUrls: urls }
        })
      } else if (browserToDelete.length) {
        setDesktopLayout((prev) => {
          const urls = { ...(prev.browserTabUrls ?? {}) }
          for (const id of browserToDelete) delete urls[id]
          return { ...prev, browserTabUrls: urls }
        })
      }
    },
    [tabStacks, desktopLayout.sessions, setTabStacks, setDesktopLayout]
  )

  const closeAll = useCallback((panelIndex: number) => {
    const stack = tabStacks[panelIndex] ?? []
    if (stack.length === 0) return
    for (const id of stack) if (id.startsWith("terminal")) killTerminalPty(id.replace(/^terminal[:\-]/, ""))
    const browserToDelete = stack.filter((id) => id.startsWith("browser:"))
    // Reusar lógica de removeTab cuando queda vacío: colapsar panel en vez de dejar placeholder sin barra
    const total = desktopLayout.cols * desktopLayout.rows
    const sessions = [...desktopLayout.sessions]
    const panelKinds = [...desktopLayout.panelKinds]
    const panelIds = [...desktopLayout.panelIds]
    const remaining = sessions.map((s, i) => ({ s, k: panelKinds[i], i })).filter(({ s, k, i }) => i !== panelIndex && (s !== null || k !== "session"))
    if (remaining.length === 0) {
      setTabStacks(() => [[]])
      setDesktopLayout((prev) => ({
        ...prev,
        cols: 1,
        rows: 1,
        sessions: [null],
        panelKinds: ["session" as const],
        panelIds: [panelIds[panelIndex] ?? genPanelId()],
        panelEditorPaths: {},
        panelEditorTabStacks: {},
        panelEditorActive: {},
        colSizes: [null],
        rowSizes: [null],
        browserTabUrls: {},
      }))
      setActivePanel(0)
      return
    }
    // Colapsar filas/columnas vacías como en removeTab/closePanel
    let nextSessions = [...sessions]
    let nextKinds = [...panelKinds]
    let nextIds = [...panelIds]
    let nextStacks: string[][] = tabStacks.map((s) => [...s])
    while (nextStacks.length < total) nextStacks.push([])
    nextStacks[panelIndex] = []
    nextSessions[panelIndex] = null
    nextKinds[panelIndex] = "session"
    let { cols, rows, colSizes, rowSizes } = desktopLayout as unknown as DesktopLayout & { colSizes: (number | null)[]; rowSizes: (number | null)[] }
    const isEmpty = (i: number) => {
      if (nextSessions[i]) return false
      if ((nextStacks[i]?.length ?? 0) > 0) return false
      const kind = nextKinds[i]
      if (kind === "editor") {
        if ((desktopLayout as any).panelEditorTabStacks?.[i]?.length) return false
        if ((desktopLayout as any).panelEditorPaths?.[i]) return false
        return true
      }
      if (kind !== "session") return false
      return true
    }
    let changed = true
    while (changed) {
      changed = false
      for (let r = 0; r < rows; r++) {
        const rowEmpty = nextSessions.slice(r * cols, r * cols + cols).every((_, i) => isEmpty(r * cols + i))
        if (rowEmpty && rows > 1) {
          nextSessions = nextSessions.filter((_, i) => Math.floor(i / cols) !== r)
          nextKinds = nextKinds.filter((_, i) => Math.floor(i / cols) !== r)
          nextIds = nextIds.filter((_, i) => Math.floor(i / cols) !== r)
          nextStacks = nextStacks.filter((_, i) => Math.floor(i / cols) !== r)
          rows -= 1
          rowSizes = (rowSizes as (number | null)[]).filter((_, i) => i !== r)
          changed = true
          break
        }
      }
      if (changed) continue
      const emptyCols: number[] = []
      for (let c = 0; c < cols; c++) {
        const colEmpty = Array.from({ length: rows }, (_, r) => r * cols + c).every((i) => isEmpty(i))
        if (colEmpty) emptyCols.push(c)
      }
      if (emptyCols.length > 0 && cols > emptyCols.length) {
        const removeSet = new Set(emptyCols)
        nextSessions = nextSessions.filter((_, i) => !removeSet.has(i % cols))
        nextKinds = nextKinds.filter((_, i) => !removeSet.has(i % cols))
        nextIds = nextIds.filter((_, i) => !removeSet.has(i % cols))
        nextStacks = nextStacks.filter((_, i) => !removeSet.has(i % cols))
        cols -= emptyCols.length
        colSizes = (colSizes as (number | null)[]).filter((_, i) => !removeSet.has(i))
        changed = true
      }
      if (cols === 1) colSizes = [null]
      if (rows === 1) rowSizes = [null]
    }
    const urls: Record<string, string> = { ...(desktopLayout.browserTabUrls ?? {}) }
    for (const id of browserToDelete) delete urls[id]
    setTabStacks(() => nextStacks)
    setDesktopLayout((prev) => ({ ...prev, cols, rows, sessions: nextSessions, panelKinds: nextKinds, panelIds: nextIds, colSizes: colSizes as any, rowSizes: rowSizes as any, browserTabUrls: urls }))
    setActivePanel((prev) => (prev >= panelIndex ? Math.max(0, prev - 1) : prev))
  }, [tabStacks, desktopLayout, setTabStacks, setDesktopLayout, setActivePanel])

  const detachTab = useCallback((_panel: number, _tab: number) => {}, [])

  return {
    openInPanel,
    switchTab,
    removeTab,
    moveTab,
    transferTab,
    addTerminalToPanel,
    closeOthers,
    closeRight,
    closeLeft,
    closeAll,
    detachTab,
  }
}
