import { useCallback, useRef } from "react"
import type { ShellPanelKind } from "../../../shell"
import type { DesktopLayout } from "../../../types"
import { parseDockPayload } from "../../../utils/drag"
import { insertSplitSize } from "../model"
import { transferTerminalTab } from "../../../utils/terminalStore"
import { genPanelId } from "../../../hooks/useDesktopLayoutState"
import type { UseDesktopGridActionsParams } from "./types"

/** Docking por drag & drop sobre la grilla y apertura de archivos en paneles
 * editor (split o reuso del editor existente). */
export function usePanelDock({
  isDesktop,
  activePanel,
  desktopLayoutRef,
  tabStacks,
  setTabStacks,
  setDesktopLayout,
  setActivePanel,
  setFileEditorPath,
}: Pick<
  UseDesktopGridActionsParams,
  | "isDesktop"
  | "activePanel"
  | "desktopLayoutRef"
  | "tabStacks"
  | "setTabStacks"
  | "setDesktopLayout"
  | "setActivePanel"
  | "setFileEditorPath"
>) {
  const draggedSessionRef = useRef<{ id: string; dir: string } | null>(null)

  const handleSessionDragStart = useCallback((id: string, dir: string) => {
    draggedSessionRef.current = { id, dir }
  }, [])

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
          const colSizes = insertSplitSize(prev.colSizes, prev.cols, insertCol)
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
          const rowSizes = insertSplitSize(prev.rowSizes, prev.rows, dir === "bottom" ? row + 1 : row)
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
            colSizes: insertSplitSize(prev.colSizes, prev.cols, insertCol),
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
          colSizes: insertSplitSize(prev.colSizes, prev.cols, insertCol),
        }
      })
    },
    [isDesktop, activePanel, setFileEditorPath, setDesktopLayout]
  )

  return { handleSessionDragStart, handleDockSession, handleOpenFile }
}
