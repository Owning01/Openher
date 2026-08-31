import { useCallback } from "react"
import type { ShellPanelKind } from "../shell"
import type { DesktopLayout, ViewType } from "../types"

export type VirtualTabId = "__design__" | "__kanban__" | "__learning__" | "__reports__" | "__screenshots__" | (string & {})

export interface UseVirtualTabsOptions {
  isDesktop: boolean
  desktopLayout: DesktopLayout
  activePanel: number
  tabStacks: Array<Array<string>> | undefined
  setTabStacks: (updater: (prev: Array<Array<string>>) => Array<Array<string>>) => void
  setDesktopLayout: (updater: (prev: DesktopLayout) => DesktopLayout) => void
  setActivePanel: (idx: number) => void
  addPanel?: (kind: ShellPanelKind) => void
  handleNavigate?: (view: ViewType) => void
}

export function useVirtualTabs({
  isDesktop,
  desktopLayout,
  activePanel,
  tabStacks,
  setTabStacks,
  setDesktopLayout,
  setActivePanel,
  addPanel: _addPanel,
  handleNavigate,
}: UseVirtualTabsOptions): {
  openVirtualTab: (id: VirtualTabId) => void
  handleOpenDesign: () => void
  handleOpenKanban: () => void
  handleOpenLearning: () => void
  handleOpenReports: () => void
  handleOpenScreenshots: () => void
} {
  const openVirtualTab = useCallback(
    (id: VirtualTabId): void => {
      if (!isDesktop) {
        if (id === "__learning__") handleNavigate?.("learning")
        return
      }

      handleNavigate?.("detail")

      if (id === "__design__" || id === "__kanban__") {
        const kind: ShellPanelKind = id === "__design__" ? "design" : "kanban"
        const existingPanelIdx = desktopLayout.panelKinds.indexOf(kind)
        if (existingPanelIdx >= 0) {
          setActivePanel(existingPanelIdx)
          return
        }
      }

      const existingTabIdx = tabStacks?.findIndex((stack) => stack.includes(id))
      if (existingTabIdx !== undefined && existingTabIdx >= 0) {
        setActivePanel(existingTabIdx)
        setDesktopLayout((prev) => {
          const sessions = [...prev.sessions]
          sessions[existingTabIdx] = id
          const panelKinds = [...prev.panelKinds] as Array<ShellPanelKind | "editor">
          panelKinds[existingTabIdx] = "session"
          return { ...prev, sessions, panelKinds }
        })
        return
      }

      const hasSession = desktopLayout.sessions.some(Boolean)
      if (hasSession) {
        const targetIdx = Math.min(activePanel, desktopLayout.cols * desktopLayout.rows - 1)
        setTabStacks((prev) => {
          const next = (prev ?? []).map((s) => [...s])
          while (next.length <= targetIdx) next.push([])
          if (!next[targetIdx]!.includes(id)) next[targetIdx] = [...next[targetIdx]!, id]
          return next
        })
        setDesktopLayout((prev) => {
          const sessions = [...prev.sessions]
          sessions[targetIdx] = id
          const panelKinds = [...prev.panelKinds] as Array<ShellPanelKind | "editor">
          panelKinds[targetIdx] = "session"
          return { ...prev, sessions, panelKinds }
        })
        setActivePanel(targetIdx)
        return
      }

      const targetIdx = 0
      setTabStacks((prev) => {
        const next = (prev ?? []).map((s) => [...s])
        while (next.length <= targetIdx) next.push([])
        if (!next[targetIdx]!.includes(id)) next[targetIdx] = [...next[targetIdx]!, id]
        return next
      })
      setDesktopLayout((prev) => {
        const sessions = [...prev.sessions]
        sessions[targetIdx] = id
        const panelKinds = [...prev.panelKinds] as Array<ShellPanelKind | "editor">
        panelKinds[targetIdx] = "session"
        return { ...prev, sessions, panelKinds }
      })
      setActivePanel(targetIdx)
    },
    [isDesktop, desktopLayout, activePanel, tabStacks, setTabStacks, setDesktopLayout, setActivePanel, handleNavigate],
  )

  const handleOpenDesign = useCallback(() => openVirtualTab("__design__"), [openVirtualTab])
  const handleOpenKanban = useCallback(() => openVirtualTab("__kanban__"), [openVirtualTab])
  const handleOpenLearning = useCallback(() => openVirtualTab("__learning__"), [openVirtualTab])
  const handleOpenReports = useCallback(() => openVirtualTab("__reports__"), [openVirtualTab])
  const handleOpenScreenshots = useCallback(() => openVirtualTab("__screenshots__"), [openVirtualTab])

  // _addPanel kept for API compatibility (panel dedicado fallback ya cubierto por tabs)
  void _addPanel

  return { openVirtualTab, handleOpenDesign, handleOpenKanban, handleOpenLearning, handleOpenReports, handleOpenScreenshots }
}
