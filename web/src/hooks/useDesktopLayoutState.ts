import { useState, useCallback, useEffect, useRef } from "react"
import type { DesktopLayout, ShellPanelKind } from "../types"
import type { DesktopActivity } from "../widgets/activity-bar/ActivityBar"

export const DESKTOP_STATE_KEY = "opencode.desktop.state.v2"

let panelIdCounter = 0
export function genPanelId(): string {
  panelIdCounter += 1
  return `panel-${Date.now().toString(36)}-${panelIdCounter}`
}

export type DesktopState = {
  layout: DesktopLayout
  sidebarWidth: number
  sidebarCollapsed: boolean
  activity: DesktopActivity
  activePanel?: number
  desktopDiffOpen?: boolean
  desktopDiffWidth?: number
  showTerminal?: boolean
  terminalDocked?: boolean
  terminalHeight?: number
  lastClosedPanel?: { index: number; kind: ShellPanelKind; sessionId: string | null } | null
  tabStacks?: Array<Array<string>>
  rightSidebarWidth?: number
  rightSidebarCollapsed?: boolean
}

export function loadDesktopState(fallbackSessionID: string | null): DesktopState {
  const fallback: DesktopState = {
    layout: {
      cols: 1,
      rows: 1,
      sessions: [fallbackSessionID],
      panelKinds: ["session"],
      panelIds: [genPanelId()],
      colSizes: [null],
      rowSizes: [null],
    } as DesktopLayout,
    sidebarWidth: 340,
    sidebarCollapsed: false,
    rightSidebarWidth: 340,
    rightSidebarCollapsed: true,
    activity: "sessions" as DesktopActivity,
    activePanel: 0,
    desktopDiffOpen: false,
    desktopDiffWidth: 440,
    showTerminal: false,
    terminalDocked: true,
    terminalHeight: 280,
    lastClosedPanel: null,
  }

  try {
    const raw = JSON.parse(localStorage.getItem(DESKTOP_STATE_KEY) ?? "null") as Partial<DesktopState> | null
    const layout = raw?.layout
    if (
      layout &&
      layout.cols >= 1 &&
      layout.rows >= 1 &&
      Array.isArray(layout.sessions) &&
      layout.sessions.length === layout.cols * layout.rows
    ) {
      const total = layout.cols * layout.rows
      const kinds: Array<ShellPanelKind | "editor"> =
        Array.isArray(layout.panelKinds) && layout.panelKinds.length === total
          ? layout.panelKinds.map((k: any) =>
              k === "session" ||
              k === "editor" ||
              k === "terminal" ||
              k === "explorer" ||
              k === "kanban" ||
              k === "stats" ||
              k === "config" ||
              k === "browser" ||
              k === "doc" ||
              k === "quickchat"
                ? k
                : "session"
            )
          : new Array(total).fill("session")

      // Migrate old flat sessions to tab stacks
      const tabStacks: Array<Array<string>> = layout.sessions.map((s: any) => {
        if (Array.isArray(s)) return s.filter((x: any) => typeof x === "string")
        return typeof s === "string" ? [s] : []
      })
      const rawTabStacks = raw?.tabStacks
      const finalTabStacks: Array<Array<string>> =
        Array.isArray(rawTabStacks) && rawTabStacks.length === total
          ? rawTabStacks.map((s: any) => (Array.isArray(s) ? s.filter((x: any) => typeof x === "string") : []))
          : tabStacks

      // Stable panel ids: preserve persisted ids, else generate fresh ones
      const rawPanelIds = (layout as any).panelIds
      const panelIds: Array<string> =
        Array.isArray(rawPanelIds) && rawPanelIds.length === total
          ? rawPanelIds.map((p: any) => (typeof p === "string" ? p : genPanelId()))
          : new Array(total).fill(null).map(() => genPanelId())

      const rawEditorPaths = (layout as any).panelEditorPaths as Record<string, string> | undefined
      const rawEditorTabStacks = (layout as any).panelEditorTabStacks as Record<string, string[]> | undefined
      const rawEditorActive = (layout as any).panelEditorActive as Record<string, number> | undefined
      const editorTabStacks: Record<number, string[]> = {}
      const editorActive: Record<number, number> = {}

      if (rawEditorTabStacks && typeof rawEditorTabStacks === "object") {
        for (const [k, v] of Object.entries(rawEditorTabStacks)) {
          if (Array.isArray(v)) editorTabStacks[Number(k)] = v.filter((s: any) => typeof s === "string")
        }
      }
      if (rawEditorActive && typeof rawEditorActive === "object") {
        for (const [k, v] of Object.entries(rawEditorActive)) editorActive[Number(k)] = Number(v) || 0
      }
      if (rawEditorPaths && typeof rawEditorPaths === "object") {
        for (const [k, path] of Object.entries(rawEditorPaths)) {
          const idx = Number(k)
          if (!editorTabStacks[idx] && typeof path === "string") {
            editorTabStacks[idx] = [path]
            editorActive[idx] = 0
          }
        }
      }

      // Normalizar índices fuera de rango tras resize
      for (const k of Object.keys(editorTabStacks)) {
        if (Number(k) >= total) {
          delete editorTabStacks[Number(k)]
          delete editorActive[Number(k)]
        }
      }

      // Migrar browserTabUrls + stats activity → tab
      const rawBrowserTabUrls = (layout as any).browserTabUrls as Record<string, string> | undefined
      const browserTabUrls: Record<string, string> =
        rawBrowserTabUrls && typeof rawBrowserTabUrls === "object" ? { ...rawBrowserTabUrls } : {}

      let migratedTabStacks = finalTabStacks
      const rawActivity = (raw as any)?.activity as string | undefined
      if (rawActivity === "stats" || rawActivity === "quickchat") {
        if (rawActivity === "stats") {
          const hasStats = migratedTabStacks.some((s) => s.includes("__stats__"))
          if (!hasStats) {
            migratedTabStacks = migratedTabStacks.map((s, idx) => (idx === 0 ? [...s, "__stats__"] : [...s]))
            if (migratedTabStacks[0] && !migratedTabStacks[0].includes("__stats__"))
              migratedTabStacks[0].push("__stats__")
          }
        }
      }

      let migratedSessions = layout.sessions.map((s: any) => (typeof s === "string" ? s : null)) as Array<string | null>
      let migratedKinds = [...kinds] as Array<ShellPanelKind | "editor">
      for (let idx = 0; idx < total; idx++) {
        if ((migratedKinds[idx] as any) === "stats") {
          if (!migratedTabStacks[idx]?.includes("__stats__")) {
            migratedTabStacks[idx] = [...(migratedTabStacks[idx] ?? []), "__stats__"]
          }
          migratedKinds[idx] = "session"
          if (!migratedSessions[idx]) migratedSessions[idx] = "__stats__"
        }
        if ((migratedKinds[idx] as any) === "browser") {
          const legacyUrl =
            (layout as any).panelBrowserUrls?.[String(idx)] ??
            (layout as any).panelBrowserUrls?.[idx] ??
            "https://www.google.com"
          const bId = `browser:${Date.now().toString(36)}-${idx}-${Math.random().toString(36).slice(2, 4)}`
          browserTabUrls[bId] = String(legacyUrl)
          migratedTabStacks[idx] = [...(migratedTabStacks[idx] ?? []), bId]
          migratedKinds[idx] = "session"
          if (!migratedSessions[idx]) migratedSessions[idx] = bId
        }
      }

      return {
        layout: {
          cols: layout.cols,
          rows: layout.rows,
          sessions: migratedSessions,
          panelKinds: migratedKinds,
          panelIds,
          panelEditorTabStacks: editorTabStacks,
          panelEditorActive: editorActive,
          panelEditorPaths: rawEditorPaths,
          panelBrowserUrls: (layout as any).panelBrowserUrls,
          browserTabUrls,
          colSizes:
            layout.cols === 1
              ? [null]
              : Array.isArray(layout.colSizes) && layout.colSizes.length === layout.cols
              ? layout.colSizes
              : new Array(layout.cols).fill(null),
          rowSizes:
            layout.rows === 1
              ? [null]
              : Array.isArray(layout.rowSizes) && layout.rowSizes.length === layout.rows
              ? layout.rowSizes
              : new Array(layout.rows).fill(null),
        },
        tabStacks: migratedTabStacks,
        sidebarWidth: Math.max(200, Math.min(480, raw?.sidebarWidth ?? 340)),
        sidebarCollapsed: !!raw?.sidebarCollapsed,
        rightSidebarWidth: Math.max(250, Math.min(480, (raw as any)?.rightSidebarWidth ?? 340)),
        rightSidebarCollapsed: (raw as any)?.rightSidebarCollapsed !== false,
        activity: (["sessions", "explorer", "kanban", "config", "design"].includes(
          rawActivity === "quickchat" || rawActivity === "stats" ? "sessions" : rawActivity ?? ""
        )
          ? rawActivity === "quickchat" || rawActivity === "stats"
            ? ("sessions" as DesktopActivity)
            : (raw!.activity! as DesktopActivity)
          : "sessions") as DesktopActivity,
        activePanel: typeof raw?.activePanel === "number" ? raw.activePanel : 0,
        desktopDiffOpen: !!raw?.desktopDiffOpen,
        desktopDiffWidth: Math.max(280, Math.min(800, raw?.desktopDiffWidth ?? 440)),
        showTerminal: !!raw?.showTerminal,
        terminalDocked: raw?.terminalDocked !== false,
        terminalHeight: Math.max(140, Math.min(650, raw?.terminalHeight ?? 280)),
        lastClosedPanel: raw?.lastClosedPanel ?? null,
      }
    }
  } catch {
    /* ignore */
  }
  return fallback
}

export function useDesktopLayoutState(isDesktop: boolean, fallbackSessionID: string | null) {
  const [desktopState, setDesktopState] = useState<DesktopState>(() => loadDesktopState(fallbackSessionID))
  const [activePanel, setActivePanel] = useState<number>(() => desktopState.activePanel ?? 0)
  const [desktopDiffOpen, setDesktopDiffOpen] = useState<boolean>(() => !!desktopState.desktopDiffOpen)
  const [desktopDiffWidth, setDesktopDiffWidth] = useState<number>(() => desktopState.desktopDiffWidth ?? 440)
  const [showTerminal, setShowTerminal] = useState<boolean>(() => !!desktopState.showTerminal)
  const [terminalDocked, setTerminalDocked] = useState<boolean>(() => desktopState.terminalDocked !== false)
  const [terminalHeight, setTerminalHeight] = useState<number>(() => desktopState.terminalHeight ?? 280)

  const desktopLayout = desktopState.layout
  const desktopLayoutRef = useRef(desktopLayout)
  desktopLayoutRef.current = desktopLayout
  const setDesktopLayout = useCallback((updater: (prev: DesktopLayout) => DesktopLayout) => {
    setDesktopState((prev) => ({ ...prev, layout: updater(prev.layout) }))
  }, [])

  const tabStacks = desktopState.tabStacks
  const setTabStacks = useCallback((updater: (prev: Array<Array<string>>) => Array<Array<string>>) => {
    setDesktopState((prev) => ({ ...prev, tabStacks: updater(prev.tabStacks ?? []) }))
  }, [])

  const setActivity = useCallback((a: DesktopActivity) => {
    setDesktopState((prev) => ({ ...prev, activity: a }))
  }, [])

  const setSidebarWidth = useCallback((w: number) => {
    setDesktopState((prev) => ({ ...prev, sidebarWidth: w }))
  }, [])

  const setSidebarCollapsed = useCallback((collapsed: boolean | ((v: boolean) => boolean)) => {
    const apply = () =>
      setDesktopState((prev) => ({
        ...prev,
        sidebarCollapsed: typeof collapsed === "function" ? collapsed(prev.sidebarCollapsed) : collapsed,
      }))
    const doc: any = document
    if (doc.startViewTransition) doc.startViewTransition(apply)
    else apply()
  }, [])

  const setRightSidebarWidth = useCallback((w: number) => {
    setDesktopState((prev) => ({ ...prev, rightSidebarWidth: w }))
  }, [])

  const setRightSidebarCollapsed = useCallback((collapsed: boolean | ((v: boolean) => boolean)) => {
    const apply = () =>
      setDesktopState((prev) => ({
        ...prev,
        rightSidebarCollapsed:
          typeof collapsed === "function" ? (collapsed as any)(prev.rightSidebarCollapsed ?? true) : collapsed,
      }))
    const doc: any = document
    if (doc.startViewTransition) doc.startViewTransition(apply)
    else apply()
  }, [])

  // Persistencia con debounce de 300ms
  useEffect(() => {
    if (!isDesktop) return
    const id = setTimeout(() => {
      try {
        const fullState: DesktopState = {
          ...desktopState,
          activePanel,
          desktopDiffOpen,
          desktopDiffWidth,
          showTerminal,
          terminalDocked,
          terminalHeight,
        }
        localStorage.setItem(DESKTOP_STATE_KEY, JSON.stringify(fullState))
      } catch {
        /* ignore */
      }
    }, 300)
    return () => clearTimeout(id)
  }, [
    desktopState,
    isDesktop,
    activePanel,
    desktopDiffOpen,
    desktopDiffWidth,
    showTerminal,
    terminalDocked,
    terminalHeight,
  ])

  return {
    desktopState,
    setDesktopState,
    desktopLayout,
    desktopLayoutRef,
    setDesktopLayout,
    tabStacks,
    setTabStacks,
    activePanel,
    setActivePanel,
    sidebarWidth: desktopState.sidebarWidth,
    sidebarCollapsed: desktopState.sidebarCollapsed,
    setSidebarWidth,
    setSidebarCollapsed,
    rightSidebarWidth: desktopState.rightSidebarWidth ?? 340,
    rightSidebarCollapsed: desktopState.rightSidebarCollapsed ?? true,
    setRightSidebarWidth,
    setRightSidebarCollapsed,
    activity: desktopState.activity,
    setActivity,
    desktopDiffOpen,
    setDesktopDiffOpen,
    desktopDiffWidth,
    setDesktopDiffWidth,
    showTerminal,
    setShowTerminal,
    terminalDocked,
    setTerminalDocked,
    terminalHeight,
    setTerminalHeight,
  }
}
