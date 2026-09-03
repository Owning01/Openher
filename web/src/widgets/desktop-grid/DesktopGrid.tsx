import React, { memo, useEffect, useRef, useState } from "react"
import type { SessionView, ServerConfig, ConnectionState, DataMode } from "../../types"
import type { ChatViewProps } from "../../components/ChatView"
import { SessionChatPanel } from "../../components/SessionChatPanel"
import { TabBar } from "../../components/TabBar"
import { DesktopPanelRenderer } from "./DesktopPanelRenderer"
import { calcDropZone, isOverTabBar, compactLayout, type DropZone } from "./model"

export type DesktopGridProps = {
  desktopLayout: import("../../types").DesktopLayout
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

  // Limpieza global: si el drag termina fuera del grid (Esc, drop fuera, ventana), quitar overlay
  useEffect(() => {
    const clear = () => setGridDragOver(null)
    window.addEventListener("dragend", clear)
    window.addEventListener("drop", clear)
    // Cuando cambia el layout (split/close) el índice viejo queda huérfano
    return () => {
      window.removeEventListener("dragend", clear)
      window.removeEventListener("drop", clear)
    }
  }, [])

  // Si cols/rows cambian, el índice previo puede apuntar a celda inexistente
  useEffect(() => {
    setGridDragOver(null)
  }, [desktopLayout.cols, desktopLayout.rows, desktopLayout.sessions.length])

  // Ponytail: compactar layout persistido con filas/columnas vacías que dejan hueco negro 50% ([Image 1] cortada abajo)
  useEffect(() => {
    const total = desktopLayout.cols * desktopLayout.rows
    if (total <= 1) return
    const isEmpty = (i: number) => {
      if (desktopLayout.sessions[i]) return false
      if ((tabStacks[i]?.length ?? 0) > 0) return false
      const kind = desktopLayout.panelKinds[i]
      if (kind === "editor") {
        const edt = (desktopLayout as any).panelEditorTabStacks?.[i] as string[] | undefined
        if (edt && edt.length > 0) return false
        if ((desktopLayout as any).panelEditorPaths?.[i]) return false
        return true
      }
      if (kind !== "session") return false
      return true
    }
    let needsCompact = false
    for (let r = 0; r < desktopLayout.rows; r++) {
      if (Array.from({ length: desktopLayout.cols }, (_, c) => r * desktopLayout.cols + c).every(isEmpty)) { needsCompact = true; break }
    }
    if (!needsCompact) {
      for (let c = 0; c < desktopLayout.cols; c++) {
        if (Array.from({ length: desktopLayout.rows }, (_, r) => r * desktopLayout.cols + c).every(isEmpty)) { needsCompact = true; break }
      }
    }
    if (!needsCompact) return
    const t = setTimeout(() => {
      onSetDesktopLayout((prev: any) => {
        const next = compactLayout(prev as any, tabStacks)
        if (next.cols === prev.cols && next.rows === prev.rows) return prev
        return { ...prev, ...next }
      })
    }, 0)
    return () => clearTimeout(t)
  }, [desktopLayout.cols, desktopLayout.rows, desktopLayout.sessions, desktopLayout.panelKinds, tabStacks, onSetDesktopLayout])

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
      window.removeEventListener("blur", onUp as any)
      onSetDesktopLayout((prev: any) => ({ ...prev, colSizes: sizes }))
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    window.addEventListener("blur", onUp as any, { once: true } as any)
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
      window.removeEventListener("blur", onUp as any)
      onSetDesktopLayout((prev: any) => ({ ...prev, rowSizes: sizes }))
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    window.addEventListener("blur", onUp as any, { once: true } as any)
  }

  const totalPanels = desktopLayout.cols * desktopLayout.rows
  // Defensa: si el estado persistido quedó corrupto — normalizar en efecto, no durante render
  useEffect(() => {
    if (
      desktopLayout.sessions.length === totalPanels &&
      desktopLayout.panelKinds.length === totalPanels &&
      desktopLayout.panelIds.length === totalPanels
    ) return
    onSetDesktopLayout((prev: any) => {
      const total = prev.cols * prev.rows
      if (prev.sessions.length === total && prev.panelKinds.length === total && prev.panelIds.length === total) return prev
      const sessions = [...prev.sessions]
      const kinds = [...prev.panelKinds]
      const ids = [...prev.panelIds]
      while (sessions.length < total) sessions.push(null)
      while (sessions.length > total) sessions.pop()
      while (kinds.length < total) kinds.push("session")
      while (kinds.length > total) kinds.pop()
      while (ids.length < total) ids.push(`panel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`)
      while (ids.length > total) ids.pop()
      return { ...prev, sessions, panelKinds: kinds, panelIds: ids }
    })
  }, [desktopLayout.sessions.length, desktopLayout.panelKinds.length, desktopLayout.panelIds.length, totalPanels, onSetDesktopLayout])

  const isSplit = desktopLayout.cols > 1 || desktopLayout.rows > 1
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
    const editorTabs = (desktopLayout as any).panelEditorTabStacks?.[i] as string[] | undefined
    const editorActive = (desktopLayout as any).panelEditorActive?.[i] as number | undefined
    const editorPath = (desktopLayout as any).panelEditorPaths?.[i] as string | undefined ?? editorTabs?.[editorActive ?? 0] ?? null
    const effectiveFilePath = kind === "editor" ? (editorPath ?? fileEditorPath) : fileEditorPath

    return (
      <div
        key={panelId}
        style={placement}
        className="desktop-cell"
        data-split={isSplit ? "true" : "false"}
        onClick={() => setActivePanel(i)}
      >
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
          fileEditorPath={effectiveFilePath}
          editorTabs={editorTabs}
          editorActive={editorActive}
          desktopLayout={desktopLayout}
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
          onSetDesktopLayout={onSetDesktopLayout}
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
        <div className="desktop-maximized" data-split="false" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {(() => {
            const stack = tabStacks?.[maximizedIndex]?.length
              ? tabStacks[maximizedIndex]
              : maximizedSession
              ? [maximizedSession.id]
              : []
            const allWithSpecial = [...sessions] as any[]
            for (const tid of stack) {
              if (tid.startsWith("terminal") && !allWithSpecial.find((s) => s.id === tid)) {
                allWithSpecial.push({ id: tid, title: `Terminal ${tid.slice(9, 13)}`, directory: "" })
              }
            }
            return (
              <TabBar
                tabs={stack}
                activeIndex={Math.max(0, stack.indexOf(maximizedSession.id))}
                sessions={allWithSpecial}
                busySessionIds={busySessions}
                onSwitch={(idx) => onSwitchTab(maximizedIndex, idx)}
                onClose={(idx) => onRemoveTab(maximizedIndex, idx)}
                onAdd={() => onAddTerminal(maximizedIndex)}
                onMoveTab={(from, to) => onMoveTab(maximizedIndex, from, to)}
                panelIndex={maximizedIndex}
              />
            )
          })()}
          <div style={{ flex: 1, minHeight: 0 }}>
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
        </div>
      ) : (
        <div
          className="desktop-grid"
          ref={gridRef}
          data-cols={desktopLayout.cols}
          data-rows={desktopLayout.rows}
          data-split={isSplit ? "true" : "false"}
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
            const isTabDrag = e.dataTransfer.types.includes("application/x-opencode-tab-index")
            const hasPath = e.dataTransfer.types.includes("application/x-opencode-path")
            if (!isTabDrag && !hasPath) {
              setGridDragOver(null)
              return
            }
            const target = (e.target as HTMLElement).closest(".desktop-cell") as HTMLElement | null
            if (!target || (e.target as HTMLElement).closest(".desktop-shell-cell-wrapper, .desktop-cell-placeholder")) {
              setGridDragOver(null)
              return
            }
            const rect = target.getBoundingClientRect()
            // Banda de 40px superior: drag de pestaña hacia la barra → delegar a TabBar, sin overlay split
            if (isTabDrag && ((e.target as HTMLElement).closest(".tab-bar") || isOverTabBar(e.clientY, rect))) {
              setGridDragOver(null)
              return
            }
            if ((e.target as HTMLElement).closest(".tab-bar")) {
              setGridDragOver(null)
              return
            }
            e.preventDefault()
            e.dataTransfer.dropEffect = "move"
            const allCells = Array.from(gridRef.current?.querySelectorAll(".desktop-cell") ?? [])
            const idx = allCells.indexOf(target)
            if (idx === -1) {
              setGridDragOver(null)
              return
            }
            const zone = calcDropZone(e.clientX, e.clientY, rect, "session")
            setGridDragOver({ idx, zone })
          }}
          onDragLeave={(e) => {
            // Solo limpiar al salir realmente del grid, no al pasar entre celdas hijas
            const rt = e.relatedTarget as Node | null
            if (!rt || !e.currentTarget.contains(rt)) {
              setGridDragOver(null)
            }
          }}
          onDrop={(e) => {
            e.preventDefault()
            setGridDragOver(null)
            const raw = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("application/x-opencode-browser-tab") || ""
            if (!raw) return
            const isUrl = /^https?:\/\//i.test(raw) || raw.startsWith("browser:") || (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(raw) && !raw.includes("kind:") && !raw.includes("terminal"))
            if (isUrl) {
              const target = (e.target as HTMLElement).closest(".desktop-cell") as HTMLElement | null
              if (!target) return
              const allCells = Array.from(gridRef.current?.querySelectorAll(".desktop-cell") ?? [])
              const idx = allCells.indexOf(target)
              if (idx !== -1) { const url = raw.startsWith("browser:") ? raw.slice(8) : raw.startsWith("http") ? raw : `https://${raw}`; onOpenBrowser(url, idx) }
              return
            }
            const isTabDrag =
              e.dataTransfer.types.includes("application/x-opencode-tab-index") ||
              raw.startsWith("panel:") ||
              raw.startsWith("kind:") ||
              raw.startsWith("terminal") ||
              raw.includes("terminal-tab:")
            if ((e.target as HTMLElement).closest(".desktop-shell-cell-wrapper, .desktop-cell-placeholder")) return
            const target = (e.target as HTMLElement).closest(".desktop-cell") as HTMLElement | null
            if (!target) return
            const rect = target.getBoundingClientRect()
            const overBar = !!(e.target as HTMLElement).closest(".tab-bar") || isOverTabBar(e.clientY, rect)
            // Banda superior 40px o .tab-bar: pestaña → reorder (no split). TabBar ya maneja si cae exacto, pero gap queda sin handler → hacerlo aquí
            if (isTabDrag && overBar) {
              if (raw.includes("terminal-tab:")) {
                const allCellsForTerm = Array.from(gridRef.current?.querySelectorAll(".desktop-cell") ?? [])
                const idxTerm = allCellsForTerm.indexOf(target)
                if (idxTerm !== -1) onDockSession(idxTerm, "center", raw)
                return
              }
              if (raw.includes("kind:terminal")) {
                const allCellsForTerm2 = Array.from(gridRef.current?.querySelectorAll(".desktop-cell") ?? [])
                const idxTerm2 = allCellsForTerm2.indexOf(target)
                if (idxTerm2 !== -1) onDockSession(idxTerm2, "center", raw)
                return
              }
              // Reordenar en la barra del panel destino
              const bar = target.querySelector(".tab-bar") as HTMLElement | null
              let at = 0
              if (bar) {
                const els = Array.from(bar.querySelectorAll<HTMLDivElement>('[role="tab"]'))
                if (els.length === 0) at = 0
                else {
                  at = els.length
                  for (let k = 0; k < els.length; k++) {
                    const r = els[k]!.getBoundingClientRect()
                    if (e.clientX < r.left + r.width / 2) { at = k; break }
                  }
                }
              }
              const tabIdxStr = e.dataTransfer.getData("application/x-opencode-tab-index")
              const srcPanelStr = (e.dataTransfer.getData("application/x-opencode-tab-src") || "").split("|")[0]
              const originIdx = parseInt(tabIdxStr, 10)
              const originPanel = parseInt(srcPanelStr, 10)
              const allCellsForReorder = Array.from(gridRef.current?.querySelectorAll(".desktop-cell") ?? [])
              const idxReorder = allCellsForReorder.indexOf(target)
              if (idxReorder === -1) return
              if (!isNaN(originIdx)) {
                const fromPanel = isNaN(originPanel) ? -1 : originPanel
                if (fromPanel === -1 || fromPanel === idxReorder) {
                  let to = at
                  if (originIdx < to) to -= 1
                  if (to !== originIdx && to >= 0) onMoveTab(idxReorder, originIdx, to)
                } else {
                  onTransferTab(fromPanel, originIdx, idxReorder, at)
                }
              }
              return
            }
            if ((e.target as HTMLElement).closest(".tab-bar")) return
            if (!isTabDrag) return
            const allCells = Array.from(gridRef.current?.querySelectorAll(".desktop-cell") ?? [])
            const idx = allCells.indexOf(target)
            if (idx === -1) return
            const zone = calcDropZone(e.clientX, e.clientY, rect, "session")
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
                background: "rgba(244, 244, 245, 0.18)",
                border: "2px dashed #a1a1aa",
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
              return <div style={style} role="region" aria-label="Soltar aquí" aria-live="polite" />
            })()}
          {colHandles}
          {rowHandles}
        </div>
      )}
    </div>
  )
})
