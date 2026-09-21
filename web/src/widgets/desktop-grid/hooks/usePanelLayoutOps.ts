import { useCallback } from "react"
import type { ShellPanelKind } from "../../../shell"
import type { DesktopLayout } from "../../../types"
import { genPanelId } from "../../../hooks/useDesktopLayoutState"
import type { UseDesktopGridActionsParams } from "./types"

/** Operaciones sobre la estructura de la grilla: dividir, agregar, cerrar y
 * swapear paneles. No toca las pilas de pestañas (viven en `useTabStackOps`). */
export function usePanelLayoutOps({
  setDesktopLayout,
  setTabStacks,
  setActivePanel,
  tabStacks,
  setDesktopState,
}: Pick<
  UseDesktopGridActionsParams,
  "setDesktopLayout" | "setTabStacks" | "setActivePanel" | "tabStacks" | "setDesktopState"
>) {
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

  return { splitPanel, addPanel, closePanel, handleSwapPanels }
}
