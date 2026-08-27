import React, { memo, useRef, useState } from "react"
import type { SessionView, ServerConfig, ConnectionState, DataMode } from "../../types"
import type { ShellPanelKind } from "../../shell"
import type { ChatViewProps } from "../../components/ChatView"
import { SessionChatPanel } from "../../components/SessionChatPanel"
import { DesktopPanelRenderer } from "./DesktopPanelRenderer"
import { calcDropZone, type DropZone } from "./model"

export type DesktopGridProps = {
  desktopLayout: {
    cols: number
    rows: number
    colSizes: Array<number | null>
    rowSizes: Array<number | null>
    panelKinds: Array<ShellPanelKind | "editor">
    panelIds: string[]
    sessions: Array<string | null>
    browserTabUrls?: Record<string, string>
  }
  tabStacks: string[][]
  activePanel: number
  maximizedPanel: number | null
  sessions: SessionView[]
  busySessions: Set<string>
  config: ServerConfig | null
  dataMode: DataMode
  connectionState: ConnectionState
  baseChatProps: ChatViewProps
  explorerCwd?: string
  activeSessionDir?: string
  selectedSessionDir?: string
  fileEditorPath: string | null
  quickChatKeys: { cerebras: string; groq: string; go: string; custom: string; customUrl: string }
  modelOptions: any[]
  providerList: any[]
  vs: any
  onSetDesktopLayout: React.Dispatch<React.SetStateAction<any>>
  setActivePanel: (idx: number) => void
  setMaximizedPanel: (idx: number | null) => void
  onRemoveTab: (panelIdx: number, tabIdx: number) => void
  onMoveTab: (panelIdx: number, from: number, to: number) => void
  onTransferTab: (fromPanel: number, fromIdx: number, toPanel: number, toIdx: number) => void
  onAddTerminal: (panelIdx: number) => void
  onCloseOthers: (panelIdx: number, keep: number) => void
  onCloseRight: (panelIdx: number, idx: number) => void
  onCloseLeft: (panelIdx: number, idx: number) => void
  onCloseAll: (panelIdx: number) => void
  onClosePanel: (panelIdx: number) => void
  onDockSession: (index: number, dir: "left" | "right" | "top" | "bottom" | "center", specificId?: string) => void
  onSettleSession: (id: string, dir: string) => Promise<void> | void
  onRefreshSessions: () => void
  onSetCommands: (cmds: any) => void
  onRecordPrompt: (_text: string) => void
  onQueueAction: (action: any) => void
  onShellExecute: (cmd: string, sid?: string, dir?: string) => void
  onChangeAgent: (agentId: string) => void
  onOpenInThisPanel: (panelIdx: number, id: string) => void
  onSwapPanels: (a: number, b: number) => void
  onOpenFile: (file: string) => void
  onOpenConnect: () => void
  onOpenBrowser: (url: string, targetPanel?: number) => void
  onOpenSessionDir: (dir: string) => void
  onNavigateSettings: () => void
  onToggleInspectTool: (tool: "picker" | "pod") => void
  onBrowserVisualPick: (url: string, el: any) => void
  onSwitchTab: (panelIdx: number, tabIdx: number) => void
}

export const DesktopGrid = memo(function DesktopGrid(props: DesktopGridProps) {
  const {
    desktopLayout,
    tabStacks,
    activePanel,
    maximizedPanel,
    sessions,
    busySessions,
    config,
    dataMode,
    connectionState,
    baseChatProps,
    fileEditorPath,
    quickChatKeys,
    modelOptions,
    providerList,
    vs,
    onSetDesktopLayout,
    setActivePanel,
    setMaximizedPanel,
    onRemoveTab,
    onMoveTab,
    onTransferTab,
    onAddTerminal,
    onCloseOthers,
    onCloseRight,
    onCloseLeft,
    onCloseAll,
    onClosePanel,
    onDockSession,
    onSettleSession,
    onRefreshSessions,
    onSetCommands,
    onRecordPrompt,
    onQueueAction,
    onShellExecute,
    onChangeAgent,
    onOpenInThisPanel,
    onSwapPanels,
    onOpenFile,
    onOpenConnect,
    onOpenBrowser,
    onOpenSessionDir,
    onNavigateSettings,
    onToggleInspectTool,
    onBrowserVisualPick,
    onSwitchTab,
  } = props

  const gridRef = useRef<HTMLDivElement | null>(null)
  const [gridDragOver, setGridDragOver] = useState<{ idx: number; zone: DropZone } | null>(null)

  const gridCols: Array<number | null | "handle"> = []
  if (desktopLayout.cols === 1) {
    gridCols.push(null)
  } else {
    desktopLayout.colSizes.forEach((s, i) => {
      if (i > 0) gridCols.push("handle")
      gridCols.push(s)
    })
  }

  const gridRows: Array<number | null | "handle"> = []
  if (desktopLayout.rows === 1) {
    gridRows.push(null)
  } else {
    desktopLayout.rowSizes.forEach((s, i) => {
      if (i > 0) gridRows.push("handle")
      gridRows.push(s)
    })
  }

  const startColResize = (colIndex: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startSize =
      desktopLayout.colSizes[colIndex] ??
      e.currentTarget.parentElement!.getBoundingClientRect().width / desktopLayout.cols
    const sizes = [...desktopLayout.colSizes]
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"

    const apply = () => {
      if (!gridRef.current) return
      const cols: Array<number | null | "handle"> = []
      sizes.forEach((s, i) => {
        if (i > 0) cols.push("handle")
        cols.push(s)
      })
      gridRef.current.style.gridTemplateColumns = cols
        .map((x) => (x === "handle" ? "4px" : x ? `${x}px` : "1fr"))
        .join(" ")
    }

    const onMove = (ev: PointerEvent) => {
      sizes[colIndex] = Math.max(220, Math.min(900, startSize + (ev.clientX - startX)))
      apply()
    }

    let committed = false
    const onUp = () => {
      if (committed) return
      committed = true
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      onSetDesktopLayout((prev: any) => ({ ...prev, colSizes: sizes }))
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
  }

  const startRowResize = (rowIndex: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startY = e.clientY
    const startSize =
      desktopLayout.rowSizes[rowIndex] ??
      e.currentTarget.parentElement!.getBoundingClientRect().height / desktopLayout.rows
    const sizes = [...desktopLayout.rowSizes]
    document.body.style.userSelect = "none"
    document.body.style.cursor = "row-resize"

    const apply = () => {
      if (!gridRef.current) return
      const rows: Array<number | null | "handle"> = []
      sizes.forEach((s, i) => {
        if (i > 0) rows.push("handle")
        rows.push(s)
      })
      gridRef.current.style.gridTemplateRows = rows
        .map((x) => (x === "handle" ? "4px" : x ? `${x}px` : "1fr"))
        .join(" ")
    }

    const onMove = (ev: PointerEvent) => {
      sizes[rowIndex] = Math.max(140, Math.min(700, startSize + (ev.clientY - startY)))
      apply()
    }

    let committed = false
    const onUp = () => {
      if (committed) return
      committed = true
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      onSetDesktopLayout((prev: any) => ({ ...prev, rowSizes: sizes }))
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
  }

  const totalPanels = desktopLayout.cols * desktopLayout.rows
  const cells = Array.from({ length: totalPanels }).map((_, i) => {
    const col = i % desktopLayout.cols
    const row = Math.floor(i / desktopLayout.cols)
    const sid = desktopLayout.sessions[i] ?? null
    const session = sid ? sessions.find((s) => s.id === sid) ?? null : null
    const kind = desktopLayout.panelKinds[i] ?? "session"
    const panelId = desktopLayout.panelIds[i] ?? `cell-${i}`

    const placement: React.CSSProperties = {
      gridColumn: `${col * 2 + 1} / ${col * 2 + 2}`,
      gridRow: `${row * 2 + 1} / ${row * 2 + 2}`,
      minWidth: 0,
      minHeight: 0,
    }

    const stack = tabStacks?.[i] ?? (session ? [session.id] : [])

    return (
      <div key={panelId} style={placement} className="desktop-cell" onClick={() => setActivePanel(i)}>
        <DesktopPanelRenderer
          index={i}
          panelId={panelId}
          kind={kind}
          session={session}
          sid={sid}
          tabStack={stack}
          active={activePanel === i}
          config={config}
          dataMode={dataMode}
          connectionState={connectionState}
          baseChatProps={baseChatProps}
          sessions={sessions}
          busySessions={busySessions}
          browserTabUrls={desktopLayout.browserTabUrls ?? {}}
          fileEditorPath={fileEditorPath}
          quickChatKeys={quickChatKeys}
          modelOptions={modelOptions}
          providerList={providerList}
          vs={vs}
          onActivate={() => setActivePanel(i)}
          onClose={() => {
            onClosePanel(i)
            if (maximizedPanel === i) setMaximizedPanel(null)
          }}
          onSwitchTab={(tabIdx) => onSwitchTab(i, tabIdx)}
          onRemoveTab={(tabIdx) => onRemoveTab(i, tabIdx)}
          onMoveTab={(from, to) => onMoveTab(i, from, to)}
          onTransferTab={(fp, fi, ti) => onTransferTab(fp, fi, i, ti)}
          onAddTerminal={() => onAddTerminal(i)}
          onCloseOthers={(keep) => onCloseOthers(i, keep)}
          onCloseRight={(idx) => onCloseRight(i, idx)}
          onCloseLeft={(idx) => onCloseLeft(i, idx)}
          onCloseAll={() => onCloseAll(i)}
          onDockSession={onDockSession}
          onSettleSession={onSettleSession}
          onRefreshSessions={onRefreshSessions}
          onSetCommands={onSetCommands}
          onRecordPrompt={onRecordPrompt}
          onQueueAction={onQueueAction}
          onShellExecute={onShellExecute}
          onChangeAgent={onChangeAgent}
          onOpenInThisPanel={(id) => onOpenInThisPanel(i, id)}
          onSwapPanels={onSwapPanels}
          onOpenFile={onOpenFile}
          onOpenConnect={onOpenConnect}
          onOpenBrowser={(url) => onOpenBrowser(url, i)}
          onOpenSessionDir={onOpenSessionDir}
          onNavigateSettings={onNavigateSettings}
          onToggleInspectTool={onToggleInspectTool}
          onBrowserVisualPick={onBrowserVisualPick}
        />
      </div>
    )
  })

  const colHandles =
    desktopLayout.cols > 1
      ? Array.from({ length: desktopLayout.cols - 1 }).map((_, h) => (
          <div
            key={`ch-${h}`}
            className="desktop-resize-col"
            style={{ gridColumn: h * 2 + 2, gridRow: "1 / -1" }}
            onPointerDown={startColResize(h)}
          />
        ))
      : null

  const rowHandles =
    desktopLayout.rows > 1
      ? Array.from({ length: desktopLayout.rows - 1 }).map((_, h) => (
          <div
            key={`rh-${h}`}
            className="desktop-resize-row"
            style={{ gridRow: h * 2 + 2, gridColumn: "1 / -1" }}
            onPointerDown={startRowResize(h)}
          />
        ))
      : null

  const maximizedIndex =
    maximizedPanel !== null && maximizedPanel < desktopLayout.cols * desktopLayout.rows ? maximizedPanel : null
  const maximizedSession =
    maximizedIndex !== null ? sessions.find((s) => s.id === desktopLayout.sessions[maximizedIndex]) ?? null : null

  return (
    <div className="desktop-layout-area">
      {maximizedSession && maximizedIndex !== null ? (
        <div className="desktop-maximized">
          <SessionChatPanel
            session={maximizedSession}
            config={config!}
            dataMode={dataMode}
            baseProps={baseChatProps}
            active={activePanel === maximizedIndex}
            connectionState={connectionState}
            panelIndex={maximizedIndex}
            onActivate={() => setActivePanel(maximizedIndex)}
            onClose={() => {
              onClosePanel(maximizedIndex)
              setMaximizedPanel(null)
            }}
            onSplitSession={onDockSession}
            onSettled={onSettleSession}
            onRefreshSessions={onRefreshSessions}
            onSetCommands={onSetCommands}
            onRecordPrompt={onRecordPrompt}
            onQueueAction={onQueueAction}
            onShellExecute={onShellExecute}
            onChangeAgentGlobal={onChangeAgent}
            onOpenInThisPanel={(id) => onOpenInThisPanel(maximizedIndex, id)}
            onSwapPanels={onSwapPanels}
            onOpenFile={onOpenFile}
            onOpenConnect={onOpenConnect}
            onOpenBrowser={(url) => onOpenBrowser(url, maximizedIndex)}
            tabStack={
              tabStacks?.[maximizedIndex]?.length
                ? tabStacks[maximizedIndex]
                : maximizedSession
                ? [maximizedSession.id]
                : []
            }
            allSessions={sessions}
            busySessionIds={busySessions}
            onTabSwitch={(_, idx) => onSwitchTab(maximizedIndex, idx)}
            onTabClose={(_, idx) => onRemoveTab(maximizedIndex, idx)}
            onTabAdd={() => onAddTerminal(maximizedIndex)}
            onTabMove={(from, to) => onMoveTab(maximizedIndex, from, to)}
            visualSelection={vs.selection}
            visualPromptContext={vs.promptContext}
            onClearVisualSelection={vs.clear}
            onFocusVisualFile={onOpenFile}
          />
        </div>
      ) : (
        <div
          className="desktop-grid"
          ref={gridRef}
          data-cols={desktopLayout.cols}
          style={{
            position: "relative",
            gridTemplateColumns: gridCols
              .map((x) => (x === "handle" ? "4px" : x ? `${x}px` : "minmax(0, 1fr)"))
              .join(" "),
            gridTemplateRows: gridRows
              .map((x) => (x === "handle" ? "4px" : x ? `${x}px` : "minmax(0, 1fr)"))
              .join(" "),
          }}
          onDragOver={(e) => {
            const raw = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain")
            const isTabDrag =
              e.dataTransfer.types.includes("application/x-opencode-tab-index") || raw.startsWith("panel:")
            if (!isTabDrag) {
              setGridDragOver(null)
              return
            }
            e.preventDefault()
            e.dataTransfer.dropEffect = "move"
            const target = (e.target as HTMLElement).closest(".desktop-cell") as HTMLElement | null
            if (!target || (e.target as HTMLElement).closest(".desktop-shell-cell-wrapper, .desktop-cell-placeholder")) {
              setGridDragOver(null)
              return
            }
            const allCells = Array.from(gridRef.current?.querySelectorAll(".desktop-cell") ?? [])
            const idx = allCells.indexOf(target)
            if (idx === -1) {
              setGridDragOver(null)
              return
            }
            const zone = calcDropZone(e.clientX, e.clientY, target.getBoundingClientRect(), "session")
            setGridDragOver({ idx, zone })
          }}
          onDragLeave={() => setGridDragOver(null)}
          onDrop={(e) => {
            e.preventDefault()
            const wasTabDrag = gridDragOver !== null
            setGridDragOver(null)
            if (!wasTabDrag) return
            const raw = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain")
            if (!raw) return
            const isTabDrag =
              e.dataTransfer.types.includes("application/x-opencode-tab-index") || raw.startsWith("panel:")
            if (!isTabDrag) return
            if ((e.target as HTMLElement).closest(".desktop-shell-cell-wrapper, .desktop-cell-placeholder")) return
            const target = (e.target as HTMLElement).closest(".desktop-cell") as HTMLElement | null
            if (!target) return
            const allCells = Array.from(gridRef.current?.querySelectorAll(".desktop-cell") ?? [])
            const idx = allCells.indexOf(target)
            if (idx === -1) return
            const zone = calcDropZone(e.clientX, e.clientY, target.getBoundingClientRect(), "session")
            onDockSession(idx, zone, raw)
          }}
        >
          {cells}
          {gridDragOver &&
            (() => {
              const target = gridRef.current?.querySelectorAll(".desktop-cell")[gridDragOver.idx] as HTMLElement | null
              if (!target || !gridRef.current) return null
              const cellRect = target.getBoundingClientRect()
              const gridRect = gridRef.current.getBoundingClientRect()
              const zone = gridDragOver.zone
              const left = cellRect.left - gridRect.left
              const top = cellRect.top - gridRect.top
              const width = cellRect.width
              const height = cellRect.height
              const style: React.CSSProperties = {
                position: "absolute",
                zIndex: 100,
                pointerEvents: "none",
                background: "rgba(88, 166, 255, 0.25)",
                border: "2px dashed #58a6ff",
                borderRadius: "var(--radius-md)",
                left,
                top,
                width,
                height,
              }
              if (zone === "left") style.width = width / 2
              else if (zone === "right") {
                style.left = left + width / 2
                style.width = width / 2
              } else if (zone === "top") style.height = height / 2
              else if (zone === "bottom") {
                style.top = top + height / 2
                style.height = height / 2
              }
              return <div style={style} />
            })()}
          {colHandles}
          {rowHandles}
        </div>
      )}
    </div>
  )
})
