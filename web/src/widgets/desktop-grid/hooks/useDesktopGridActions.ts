import { useCallback, useRef } from "react"
import type { ShellPanelKind } from "../../../shell"
import type { DesktopLayout } from "../../../types"
import { parseDockPayload } from "../../../utils/drag"
import { killTerminalPty, transferTerminalTab } from "../../../utils/terminalStore"

export function genPanelId(): string {
  return `panel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export type UseDesktopGridActionsParams = {
  isDesktop: boolean
  desktopLayout: DesktopLayout
  desktopLayoutRef: React.MutableRefObject<DesktopLayout>
  setDesktopLayout: (updater: (prev: DesktopLayout) => DesktopLayout) => void
  tabStacks: string[][]
  setTabStacks: (updater: (prev: string[][]) => string[][]) => void
  activePanel: number
  setActivePanel: (idx: number | ((prev: number) => number)) => void
  setShowTerminal?: React.Dispatch<React.SetStateAction<boolean>>
  setFileEditorPath: (path: string | null) => void
  setDesktopState?: React.Dispatch<React.SetStateAction<any>>
}

export function useDesktopGridActions({
  isDesktop,
  desktopLayout,
  desktopLayoutRef,
  setDesktopLayout,
  tabStacks,
  setTabStacks,
  activePanel,
  setActivePanel,
  setShowTerminal: _setShowTerminal,
  setFileEditorPath,
  setDesktopState,
}: UseDesktopGridActionsParams) {
  const draggedSessionRef = useRef<{ id: string; dir: string } | null>(null)

  const handleSessionDragStart = useCallback((id: string, dir: string) => {
    draggedSessionRef.current = { id, dir }
  }, [])

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
        id === "__stats__" ||
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
      setTabStacks((prev: string[][]) => {
        const next = prev.map((s: string[]) => [...s])
        while (next.length <= toPanel) next.push([])
        const sourceStack = next[fromPanel]
        if (!sourceStack || fromIdx < 0 || fromIdx >= sourceStack.length) return prev
        const [moved] = sourceStack.splice(fromIdx, 1)
        if (!moved) return prev
        const destStack = next[toPanel] ?? []
        destStack.splice(toIdx, 0, moved)
        next[toPanel] = destStack
        return next
      })
      setDesktopLayout((prev: DesktopLayout) => {
        const sessions = [...prev.sessions]
        const fromTab = tabStacks[fromPanel]?.[fromIdx]
        if (fromTab && sessions[fromPanel] === fromTab) {
          sessions[fromPanel] = tabStacks[fromPanel]?.filter((_, i) => i !== fromIdx)[0] ?? null
        }
        if (fromTab) sessions[toPanel] = fromTab
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

  const splitPanel = useCallback(
    (index: number, dir: "right" | "bottom") => {
      setDesktopLayout((prev: DesktopLayout) => {
        const kindsOf = (r: number, c: number) => prev.panelKinds[r * prev.cols + c] ?? "session"
        if (dir === "right") {
          const cols = prev.cols + 1
          const col = index % prev.cols
          const sessions: Array<string | null> = []
          const panelKinds: Array<ShellPanelKind | "editor"> = []
          const panelIds: Array<string> = []
          for (let r = 0; r < prev.rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (c <= col) {
                sessions.push(prev.sessions[r * prev.cols + c] ?? null)
                panelKinds.push(kindsOf(r, c))
                panelIds.push(prev.panelIds[r * prev.cols + c]!)
              } else if (c === col + 1) {
                sessions.push(null)
                panelKinds.push("session")
                panelIds.push(genPanelId())
              } else {
                sessions.push(prev.sessions[r * prev.cols + (c - 1)] ?? null)
                panelKinds.push(kindsOf(r, c - 1))
                panelIds.push(prev.panelIds[r * prev.cols + (c - 1)]!)
              }
            }
          }
          const colSizes = [...prev.colSizes]
          colSizes.splice(col + 1, 0, null)
          return { ...prev, cols, sessions, panelKinds, panelIds, colSizes }
        }
        const rows = prev.rows + 1
        const row = Math.floor(index / prev.cols)
        const sessions: Array<string | null> = []
        const panelKinds: Array<ShellPanelKind | "editor"> = []
        const panelIds: Array<string> = []
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < prev.cols; c++) {
            if (r <= row) {
              sessions.push(prev.sessions[r * prev.cols + c] ?? null)
              panelKinds.push(kindsOf(r, c))
              panelIds.push(prev.panelIds[r * prev.cols + c]!)
            } else if (r === row + 1) {
              sessions.push(null)
              panelKinds.push("session")
              panelIds.push(genPanelId())
            } else {
              sessions.push(prev.sessions[(r - 1) * prev.cols + c] ?? null)
              panelKinds.push(kindsOf(r - 1, c))
              panelIds.push(prev.panelIds[(r - 1) * prev.cols + c]!)
            }
          }
        }
        const rowSizes = [...prev.rowSizes]
        rowSizes.splice(row + 1, 0, null)
        return { ...prev, rows, sessions, panelKinds, panelIds, rowSizes }
      })
    },
    [setDesktopLayout]
  )

  const addPanel = useCallback(
    (kind: ShellPanelKind) => {
      setDesktopLayout((prev: DesktopLayout) => {
        if (kind === "stats" && prev.panelKinds.includes("stats")) return prev
        const total = prev.cols * prev.rows
        const emptySlot = prev.sessions.findIndex(
          (s: string | null, i: number) => s === null && prev.panelKinds[i] === "session"
        )
        if (emptySlot >= 0) {
          const sessions = [...prev.sessions]
          const panelKinds = [...prev.panelKinds]
          const panelIds = [...prev.panelIds]
          panelKinds[emptySlot] = kind
          return { ...prev, sessions, panelKinds, panelIds }
        }
        let cols = prev.cols
        let rows = prev.rows
        if (cols < 3) cols += 1
        else if (rows < 2) rows += 1
        else (cols = 2), (rows = 2)
        const sessions: Array<string | null> = new Array(cols * rows).fill(null)
        const panelKinds: Array<ShellPanelKind | "editor"> = new Array(cols * rows).fill("session")
        const panelIds: Array<string> = new Array(cols * rows)
          .fill(null)
          .map(() => genPanelId())
        for (let i = 0; i < Math.min(total, cols * rows); i++) {
          sessions[i] = prev.sessions[i] ?? null
          panelKinds[i] = prev.panelKinds[i] ?? "session"
          panelIds[i] = prev.panelIds[i] ?? genPanelId()
        }
        panelKinds[sessions.length - 1] = kind
        const colSizes = new Array(cols).fill(null)
        const rowSizes = new Array(rows).fill(null)
        return { ...prev, cols, rows, sessions, panelKinds, panelIds, colSizes, rowSizes }
      })
    },
    [setDesktopLayout]
  )

  const closePanel = useCallback(
    (index: number) => {
      const applyClose = (prev: DesktopLayout, prevStacks: string[][]) => {
        const total = prev.cols * prev.rows
        if (index < 0 || index >= total) return { layout: prev, tabStacks: prevStacks }
        const closedInfo = {
          index,
          kind: prev.panelKinds[index] ?? "session",
          sessionId: prev.sessions[index] ?? null,
        }
        const activeRemaining = prev.sessions
          .map((s, i) => ({ s, i, k: prev.panelKinds[i] }))
          .filter(({ s, i, k }) => i !== index && (s !== null || k !== "session"))
          .map(({ i }) => i)

        if (activeRemaining.length === 0) {
          return {
            lastClosedPanel: closedInfo,
            tabStacks: [[]],
            layout: {
              ...prev,
              cols: 1,
              rows: 1,
              sessions: [null],
              panelKinds: ["session" as const],
              panelIds: [genPanelId()],
              panelEditorPaths: {},
              panelEditorTabStacks: {},
              panelEditorActive: {},
              colSizes: [null],
              rowSizes: [null],
            },
          }
        }

        let sessions = [...prev.sessions]
        let panelKinds = [...prev.panelKinds]
        let panelIds = [...prev.panelIds]
        let nextStacks = [...(prevStacks ?? Array.from({ length: total }, () => [] as string[]))]
        while (nextStacks.length < total) nextStacks.push([])
        const panelEditorPaths = { ...prev.panelEditorPaths } as Record<number, string>
        const panelEditorTabStacks = { ...prev.panelEditorTabStacks } as Record<number, string[]>
        const panelEditorActive = { ...prev.panelEditorActive } as Record<number, number>
        delete panelEditorPaths[index]
        delete panelEditorTabStacks[index]
        delete panelEditorActive[index]
        sessions[index] = null
        panelKinds[index] = "session"
        nextStacks[index] = []

        let { cols, rows, colSizes, rowSizes } = prev
        const isEmpty = (i: number) => {
          if (sessions[i]) return false
          if ((nextStacks[i]?.length ?? 0) > 0) return false
          const kind = panelKinds[i]
          if (kind === "editor") {
            if ((prev as any).panelEditorTabStacks?.[i]?.length) return false
            if ((prev as any).panelEditorPaths?.[i]) return false
            return true
          }
          if (kind !== "session") return false
          return true
        }
        let changed = true
        while (changed) {
          changed = false
          for (let r = 0; r < rows; r++) {
            const rowEmpty = sessions
              .slice(r * cols, r * cols + cols)
              .every((_, i) => isEmpty(r * cols + i))
            if (rowEmpty && rows > 1) {
              sessions = sessions.filter((_, i) => Math.floor(i / cols) !== r)
              panelKinds = panelKinds.filter((_, i) => Math.floor(i / cols) !== r)
              panelIds = panelIds.filter((_, i) => Math.floor(i / cols) !== r)
              nextStacks = nextStacks.filter((_, i) => Math.floor(i / cols) !== r)
              rows -= 1
              rowSizes = rowSizes.filter((_, i) => i !== r)
              changed = true
              break
            }
          }
          if (changed) continue
          const emptyCols: number[] = []
          for (let c = 0; c < cols; c++) {
            const colEmpty = Array.from({ length: rows }, (_, r) => r * cols + c).every((i) =>
              isEmpty(i)
            )
            if (colEmpty) emptyCols.push(c)
          }
          if (emptyCols.length > 0 && cols > emptyCols.length) {
            const removeSet = new Set(emptyCols)
            sessions = sessions.filter((_, i) => !removeSet.has(i % cols))
            panelKinds = panelKinds.filter((_, i) => !removeSet.has(i % cols))
            panelIds = panelIds.filter((_, i) => !removeSet.has(i % cols))
            nextStacks = nextStacks.filter((_, i) => !removeSet.has(i % cols))
            cols -= emptyCols.length
            colSizes = colSizes.filter((_, i) => !removeSet.has(i))
            changed = true
          }
          if (cols === 1) colSizes = [null]
          if (rows === 1) rowSizes = [null]
        }

        return {
          lastClosedPanel: closedInfo,
          tabStacks: nextStacks,
          layout: {
            ...prev,
            cols,
            rows,
            sessions,
            panelKinds,
            panelIds,
            panelEditorPaths,
            panelEditorTabStacks,
            panelEditorActive,
            colSizes,
            rowSizes,
          },
        }
      }

      if (setDesktopState) {
        setDesktopState((prevState: any) => {
          const res = applyClose(prevState.layout, prevState.tabStacks ?? [])
          return { ...prevState, ...res }
        })
      } else {
        setDesktopLayout((prev: DesktopLayout) => {
          const res = applyClose(prev, tabStacks)
          setTabStacks(() => res.tabStacks)
          return res.layout
        })
      }
      setActivePanel((prev) => (prev >= index ? Math.max(0, prev - 1) : prev))
    },
    [
      tabStacks,
      setDesktopLayout,
      setTabStacks,
      setDesktopState,
      setActivePanel,
    ]
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

  const handleSwapPanels = useCallback(
    (from: number, to: number) => {
      if (from === to) return
      setDesktopLayout((prev: DesktopLayout) => {
        const sessions = [...prev.sessions]
        const panelKinds = [...prev.panelKinds]
        const panelIds = [...prev.panelIds]
        ;[sessions[from], sessions[to]] = [sessions[to] ?? null, sessions[from] ?? null]
        ;[panelKinds[from], panelKinds[to]] = [panelKinds[to] ?? "session", panelKinds[from] ?? "session"]
        ;[panelIds[from], panelIds[to]] = [panelIds[to] ?? genPanelId(), panelIds[from] ?? genPanelId()]
        return { ...prev, sessions, panelKinds, panelIds }
      })
      setTabStacks((prev: string[][]) => {
        const next = prev.map((s: string[]) => [...s])
        while (next.length <= Math.max(from, to)) next.push([])
        ;[next[from], next[to]] = [next[to] ?? [], next[from] ?? []]
        return next
      })
      setActivePanel(to)
    },
    [setDesktopLayout, setTabStacks, setActivePanel]
  )

  const handleDockSession = useCallback(
    (index: number, dir: "left" | "right" | "top" | "bottom" | "center", specificId?: string) => {
      const drag = draggedSessionRef.current
      const rawId = specificId || drag?.id
      if (!rawId) return
      draggedSessionRef.current = null

      const dock = parseDockPayload(rawId)
      const targetKind = dock.targetKind as ShellPanelKind | "editor"
      const targetSessionId = dock.targetSessionId
      const fromIndex = dock.fromIndex
      const tabId = dock.tabId
      const fromPanelId = dock.fromPanelId
      const isSingleTab = dock.isSingleTab

      if (isSingleTab && tabId && fromPanelId) {
        transferTerminalTab(fromPanelId, tabId, `panel-${index}-term`)
      }

      if (dir === "center") {
        setDesktopLayout((prev: DesktopLayout) => {
          const sessions = [...prev.sessions]
          const panelKinds = [...prev.panelKinds]
          if (fromIndex !== null && fromIndex !== index && fromIndex < sessions.length) {
            sessions[fromIndex] = null
            panelKinds[fromIndex] = "session"
          }
          sessions[index] = targetSessionId
          panelKinds[index] = targetKind
          return { ...prev, sessions, panelKinds }
        })
        if (targetSessionId) {
          setTabStacks((prev: string[][]) => {
            const next = prev.map((s: string[]) => s.filter((sid: string) => sid !== targetSessionId))
            while (next.length <= index) next.push([])
            if (!next[index]?.includes(targetSessionId)) {
              next[index] = [...(next[index] ?? []), targetSessionId]
            }
            return next
          })
        }
        setActivePanel(index)
        return
      }

      if (dir === "left" || dir === "right") {
        setDesktopLayout((prev: DesktopLayout) => {
          let baseSessions = [...prev.sessions]
          let baseKinds = [...prev.panelKinds]
          let baseIds = [...prev.panelIds]
          let movedId: string | null = null

          if (targetSessionId) {
            baseSessions = baseSessions.map((s, pIdx) => {
              if (s === targetSessionId) {
                const rem = tabStacks?.[pIdx]?.filter((sid) => sid !== targetSessionId) ?? []
                return rem.length > 0 ? rem[0] ?? null : null
              }
              return s
            })
          } else if (fromIndex !== null && fromIndex < baseKinds.length) {
            baseKinds[fromIndex] = "session"
            baseSessions[fromIndex] = null
            movedId = baseIds[fromIndex] ?? null
            baseIds[fromIndex] = ""
          }

          const cols = prev.cols + 1
          const col = index % prev.cols
          const row = Math.floor(index / prev.cols)
          const insertCol = dir === "left" ? col : col + 1
          const sessions: Array<string | null> = []
          const panelKinds: Array<ShellPanelKind | "editor"> = []
          const panelIds: Array<string> = []

          for (let r = 0; r < prev.rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (c < insertCol) {
                sessions.push(baseSessions[r * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + c] ?? "session")
                panelIds.push(baseIds[r * prev.cols + c] || genPanelId())
              } else if (c === insertCol) {
                const isTarget = r === row
                sessions.push(isTarget ? targetSessionId : null)
                panelKinds.push(isTarget ? targetKind : "session")
                panelIds.push(isTarget ? movedId ?? genPanelId() : genPanelId())
              } else {
                sessions.push(baseSessions[r * prev.cols + (c - 1)] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + (c - 1)] ?? "session")
                panelIds.push(baseIds[r * prev.cols + (c - 1)] || genPanelId())
              }
            }
          }
          const colSizes = new Array(cols).fill(null)
          return { ...prev, cols, sessions, panelKinds, panelIds, colSizes }
        })

        if (targetSessionId) {
          setTabStacks((prev: string[][]) => {
            const prevCols = desktopLayoutRef.current.cols
            const prevRows = desktopLayoutRef.current.rows
            const filtered = prev.map((s: string[]) => s.filter((sid: string) => sid !== targetSessionId))
            const cols = prevCols + 1
            const col = index % prevCols
            const row = Math.floor(index / prevCols)
            const insertCol = dir === "left" ? col : col + 1
            const newStacks: Array<string[]> = []
            for (let r = 0; r < prevRows; r++) {
              for (let c = 0; c < cols; c++) {
                if (c < insertCol) {
                  newStacks.push(filtered[r * prevCols + c] ?? [])
                } else if (c === insertCol) {
                  newStacks.push(r === row ? [targetSessionId] : [])
                } else {
                  newStacks.push(filtered[r * prevCols + (c - 1)] ?? [])
                }
              }
            }
            return newStacks
          })
        }
        setActivePanel(dir === "right" ? index + 1 : index)
        return
      }

      if (dir === "top" || dir === "bottom") {
        setDesktopLayout((prev: DesktopLayout) => {
          let baseSessions = [...prev.sessions]
          let baseKinds = [...prev.panelKinds]
          let baseIds = [...prev.panelIds]
          let movedId: string | null = null
          if (targetSessionId) {
            baseSessions = baseSessions.map((s, pIdx) => {
              if (s === targetSessionId) {
                const rem = tabStacks?.[pIdx]?.filter((sid) => sid !== targetSessionId) ?? []
                return rem.length > 0 ? rem[0] ?? null : null
              }
              return s
            })
          } else if (fromIndex !== null && fromIndex < baseKinds.length) {
            baseKinds[fromIndex] = "session"
            baseSessions[fromIndex] = null
            movedId = baseIds[fromIndex] ?? null
            baseIds[fromIndex] = ""
          }

          const rows = prev.rows + 1
          const row = Math.floor(index / prev.cols)
          const col = index % prev.cols
          const sessions: Array<string | null> = []
          const panelKinds: Array<ShellPanelKind | "editor"> = []
          const panelIds: Array<string> = []

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < prev.cols; c++) {
              if (dir === "bottom") {
                if (r <= row) {
                  sessions.push(baseSessions[r * prev.cols + c] ?? null)
                  panelKinds.push(baseKinds[r * prev.cols + c] ?? "session")
                  panelIds.push(baseIds[r * prev.cols + c] || genPanelId())
                } else if (r === row + 1) {
                  const isTarget = c === col
                  sessions.push(isTarget ? targetSessionId : null)
                  panelKinds.push(isTarget ? targetKind : "session")
                  panelIds.push(isTarget ? movedId ?? genPanelId() : genPanelId())
                } else {
                  sessions.push(baseSessions[(r - 1) * prev.cols + c] ?? null)
                  panelKinds.push(baseKinds[(r - 1) * prev.cols + c] ?? "session")
                  panelIds.push(baseIds[(r - 1) * prev.cols + c] || genPanelId())
                }
              } else {
                if (r === row) {
                  const isTarget = c === col
                  sessions.push(isTarget ? targetSessionId : null)
                  panelKinds.push(isTarget ? targetKind : "session")
                  panelIds.push(isTarget ? movedId ?? genPanelId() : genPanelId())
                } else if (r < row) {
                  sessions.push(baseSessions[r * prev.cols + c] ?? null)
                  panelKinds.push(baseKinds[r * prev.cols + c] ?? "session")
                  panelIds.push(baseIds[r * prev.cols + c] || genPanelId())
                } else {
                  sessions.push(baseSessions[(r - 1) * prev.cols + c] ?? null)
                  panelKinds.push(baseKinds[(r - 1) * prev.cols + c] ?? "session")
                  panelIds.push(baseIds[(r - 1) * prev.cols + c] || genPanelId())
                }
              }
            }
          }
          const rowSizes = new Array(rows).fill(null)
          return { ...prev, rows, sessions, panelKinds, panelIds, rowSizes }
        })

        if (targetSessionId) {
          setTabStacks((prev: string[][]) => {
            const prevCols = desktopLayoutRef.current.cols
            const prevRows = desktopLayoutRef.current.rows
            const filtered = prev.map((s: string[]) => s.filter((sid: string) => sid !== targetSessionId))
            const rows = prevRows + 1
            const row = Math.floor(index / prevCols)
            const col = index % prevCols
            const newStacks: Array<string[]> = []
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < prevCols; c++) {
                if (dir === "bottom") {
                  if (r <= row) {
                    newStacks.push(filtered[r * prevCols + c] ?? [])
                  } else if (r === row + 1) {
                    newStacks.push(c === col ? [targetSessionId] : [])
                  } else {
                    newStacks.push(filtered[(r - 1) * prevCols + c] ?? [])
                  }
                } else {
                  if (r === row) {
                    newStacks.push(c === col ? [targetSessionId] : [])
                  } else if (r < row) {
                    newStacks.push(filtered[r * prevCols + c] ?? [])
                  } else {
                    newStacks.push(filtered[(r - 1) * prevCols + c] ?? [])
                  }
                }
              }
            }
            return newStacks
          })
        }
        setActivePanel(index)
      }
    },
    [tabStacks, setTabStacks, setDesktopLayout, setActivePanel, desktopLayoutRef]
  )

  const handleOpenFile = useCallback(
    (
      filePath: string,
      targetIndex?: number,
      zone?: "left" | "right" | "top" | "bottom" | "center"
    ) => {
      if (!isDesktop) {
        setFileEditorPath(filePath)
        return
      }

      setDesktopLayout((prev: DesktopLayout) => {
        if (
          targetIndex != null &&
          prev.panelKinds[targetIndex] === "editor" &&
          (!zone || zone === "center")
        ) {
          const prevTabs =
            prev.panelEditorTabStacks?.[targetIndex] ??
            (prev.panelEditorPaths?.[targetIndex] ? [prev.panelEditorPaths[targetIndex]] : [])
          const nextTabs = prevTabs.includes(filePath) ? prevTabs : [...prevTabs, filePath]
          const nextActive = nextTabs.indexOf(filePath)
          return {
            ...prev,
            panelEditorTabStacks: { ...prev.panelEditorTabStacks, [targetIndex]: nextTabs },
            panelEditorActive: { ...prev.panelEditorActive, [targetIndex]: nextActive },
            panelEditorPaths: { ...prev.panelEditorPaths, [targetIndex]: filePath },
          }
        }

        const effectiveIndex = targetIndex ?? activePanel
        const splitDir =
          zone === "left" || zone === "top" || zone === "bottom" ? zone : "right"

        if (
          targetIndex != null &&
          (zone === "left" || zone === "right" || zone === "top" || zone === "bottom")
        ) {
          const cols = prev.cols + 1
          const col = effectiveIndex % prev.cols
          const insertCol = splitDir === "left" ? col : col + 1
          const sessions: Array<string | null> = []
          const panelKinds: Array<ShellPanelKind | "editor"> = []
          const panelIds: Array<string> = []
          const panelEditorPaths: Record<number, string> = {}
          const panelEditorTabStacks: Record<number, string[]> = {}
          const panelEditorActive: Record<number, number> = {}

          for (let r = 0; r < prev.rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (c < insertCol) {
                const oldIdx = r * prev.cols + c
                sessions.push(prev.sessions[oldIdx] ?? null)
                panelKinds.push(prev.panelKinds[oldIdx] ?? "session")
                panelIds.push(prev.panelIds[oldIdx] ?? genPanelId())
                if (prev.panelEditorPaths?.[oldIdx])
                  panelEditorPaths[sessions.length - 1] = prev.panelEditorPaths[oldIdx]
                if (prev.panelEditorTabStacks?.[oldIdx])
                  panelEditorTabStacks[sessions.length - 1] = prev.panelEditorTabStacks[oldIdx]
                if (prev.panelEditorActive?.[oldIdx] != null)
                  panelEditorActive[sessions.length - 1] = prev.panelEditorActive[oldIdx]!
              } else if (c === insertCol) {
                sessions.push(null)
                panelKinds.push("editor")
                panelIds.push(genPanelId())
                panelEditorPaths[sessions.length - 1] = filePath
                panelEditorTabStacks[sessions.length - 1] = [filePath]
                panelEditorActive[sessions.length - 1] = 0
              } else {
                const oldIdx = r * prev.cols + (c - 1)
                sessions.push(prev.sessions[oldIdx] ?? null)
                panelKinds.push(prev.panelKinds[oldIdx] ?? "session")
                panelIds.push(prev.panelIds[oldIdx] ?? genPanelId())
                if (prev.panelEditorPaths?.[oldIdx])
                  panelEditorPaths[sessions.length - 1] = prev.panelEditorPaths[oldIdx]
                if (prev.panelEditorTabStacks?.[oldIdx])
                  panelEditorTabStacks[sessions.length - 1] = prev.panelEditorTabStacks[oldIdx]
                if (prev.panelEditorActive?.[oldIdx] != null)
                  panelEditorActive[sessions.length - 1] = prev.panelEditorActive[oldIdx]!
              }
            }
          }
          return {
            ...prev,
            cols,
            sessions,
            panelKinds,
            panelIds,
            panelEditorPaths,
            panelEditorTabStacks,
            panelEditorActive,
            colSizes: new Array(cols).fill(null),
          }
        }

        // Si ya está abierto en algún editor, enfocarlo en vez de duplicar
        for (const [k, tabs] of Object.entries(prev.panelEditorTabStacks ?? {})) {
          const idx = Number(k)
          if (Array.isArray(tabs) && tabs.includes(filePath)) {
            return {
              ...prev,
              panelEditorActive: { ...prev.panelEditorActive, [idx]: tabs.indexOf(filePath) },
              panelEditorPaths: { ...prev.panelEditorPaths, [idx]: filePath },
            }
          }
        }
        for (const [, p] of Object.entries(prev.panelEditorPaths ?? {})) {
          if (p === filePath) return prev
        }
        const existingEditorIdx = prev.panelKinds.indexOf("editor")
        if (existingEditorIdx >= 0) {
          const prevTabs =
            prev.panelEditorTabStacks?.[existingEditorIdx] ??
            (prev.panelEditorPaths?.[existingEditorIdx] ? [prev.panelEditorPaths[existingEditorIdx]] : [])
          const nextTabs = prevTabs.includes(filePath) ? prevTabs : [...prevTabs, filePath]
          const nextActive = nextTabs.indexOf(filePath)
          return {
            ...prev,
            panelEditorTabStacks: { ...prev.panelEditorTabStacks, [existingEditorIdx]: nextTabs },
            panelEditorActive: { ...prev.panelEditorActive, [existingEditorIdx]: nextActive },
            panelEditorPaths: { ...prev.panelEditorPaths, [existingEditorIdx]: filePath },
          }
        }

        const cols = prev.cols + 1
        const col = effectiveIndex % prev.cols
        const insertCol = col + 1
        const sessions: Array<string | null> = []
        const panelKinds: Array<ShellPanelKind | "editor"> = []
        const panelIds: Array<string> = []
        const panelEditorPaths: Record<number, string> = {}
        const panelEditorTabStacks: Record<number, string[]> = {}
        const panelEditorActive: Record<number, number> = {}

        for (let r = 0; r < prev.rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (c < insertCol) {
              const oldIdx = r * prev.cols + c
              sessions.push(prev.sessions[oldIdx] ?? null)
              panelKinds.push(prev.panelKinds[oldIdx] ?? "session")
              panelIds.push(prev.panelIds[oldIdx] ?? genPanelId())
              if (prev.panelEditorPaths?.[oldIdx])
                panelEditorPaths[sessions.length - 1] = prev.panelEditorPaths[oldIdx]
              if (prev.panelEditorTabStacks?.[oldIdx])
                panelEditorTabStacks[sessions.length - 1] = prev.panelEditorTabStacks[oldIdx]
              if (prev.panelEditorActive?.[oldIdx] != null)
                panelEditorActive[sessions.length - 1] = prev.panelEditorActive[oldIdx]!
            } else if (c === insertCol) {
              sessions.push(null)
              panelKinds.push("editor")
              panelIds.push(genPanelId())
              panelEditorPaths[sessions.length - 1] = filePath
              panelEditorTabStacks[sessions.length - 1] = [filePath]
              panelEditorActive[sessions.length - 1] = 0
            } else {
              const oldIdx = r * prev.cols + (c - 1)
              sessions.push(prev.sessions[oldIdx] ?? null)
              panelKinds.push(prev.panelKinds[oldIdx] ?? "session")
              panelIds.push(prev.panelIds[oldIdx] ?? genPanelId())
              if (prev.panelEditorPaths?.[oldIdx])
                panelEditorPaths[sessions.length - 1] = prev.panelEditorPaths[oldIdx]
              if (prev.panelEditorTabStacks?.[oldIdx])
                panelEditorTabStacks[sessions.length - 1] = prev.panelEditorTabStacks[oldIdx]
              if (prev.panelEditorActive?.[oldIdx] != null)
                panelEditorActive[sessions.length - 1] = prev.panelEditorActive[oldIdx]!
            }
          }
        }
        return {
          ...prev,
          cols,
          sessions,
          panelKinds,
          panelIds,
          panelEditorPaths,
          panelEditorTabStacks,
          panelEditorActive,
          colSizes: new Array(cols).fill(null),
        }
      })
    },
    [isDesktop, activePanel, setFileEditorPath, setDesktopLayout]
  )

  return {
    openInPanel,
    switchTab,
    removeTab,
    moveTab,
    transferTab,
    addTerminalToPanel,
    splitPanel,
    addPanel,
    closePanel,
    closeOthers,
    closeRight,
    closeLeft,
    closeAll,
    handleSessionDragStart,
    handleSwapPanels,
    handleDockSession,
    handleOpenFile,
  }
}
