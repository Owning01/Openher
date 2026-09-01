import { useCallback } from "react"
import type { ShellPanelKind } from "../shell"
import type { DesktopLayout, ViewType } from "../types"

export type VirtualTabId = "__kanban__" | "__learning__" | (string & {})

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
  handleOpenKanban: () => void
  handleOpenLearning: () => void
} {
  const openVirtualTab = useCallback(
    (id: VirtualTabId): void => {
      if (!isDesktop) {
        if (id === "__learning__") handleNavigate?.("learning")
        return
      }

      handleNavigate?.("detail")

      if (id === "__kanban__") {
        const kind: ShellPanelKind = "kanban"
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

  const handleOpenKanban = useCallback(() => openVirtualTab("__kanban__"), [openVirtualTab])
  const handleOpenLearning = useCallback(() => openVirtualTab("__learning__"), [openVirtualTab])

  void _addPanel

  return { openVirtualTab, handleOpenKanban, handleOpenLearning }
}
