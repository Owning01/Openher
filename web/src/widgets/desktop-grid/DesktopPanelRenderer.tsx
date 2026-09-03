import React, { Suspense, memo } from "react"
import type { SessionView, ServerConfig, ConnectionState, DataMode } from "../../types"
import type { ShellPanelKind } from "../../shell"
import { TabBar } from "../../components/TabBar"
import { SessionChatPanel } from "../../components/SessionChatPanel"
import type { ChatViewProps } from "../../components/ChatView"
import { ShellPanelCell } from "./ShellPanelCell"
import { DesktopCellPlaceholder } from "./DesktopCellPlaceholder"
import { ExternalIframePanel } from "../../features/external-plugins/ExternalIframePanel"
import { EXTERNAL_PROJECTS } from "../../features/external-plugins/config"
import { tabRegistry } from "../../plugins"
import {
  SingleTerminal,
  StatsPanel,
  KanbanPanel,
  FileEditorPanel,
} from "../../components/shellPanels"
import { BrowserPanel } from "../../components/BrowserPanel"
import LearningPage from "../../features/learning/LearningPage"
import { PCFilesPanel } from "../../features/pc-files/PCFilesPanel"
import { QuickChatPanel } from "../../components/QuickChatPanel"

export const PANEL_SUSPENSE_FALLBACK = (
  <div className="panel-loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Cargando…</div>
)

export type DesktopPanelRendererProps = {
  index: number
  panelId: string
  kind: ShellPanelKind | "editor"
  session: SessionView | null
  sid: string | null
  tabStack: string[]
  active: boolean
  config: ServerConfig | null
  dataMode: DataMode
  connectionState: ConnectionState
  baseChatProps: ChatViewProps
  sessions: SessionView[]
  busySessions: Set<string>
  browserTabUrls: Record<string, string>
  explorerCwd?: string
  activeDir?: string
  activeSessionDir?: string
  selectedSessionDir?: string
  fileEditorPath: string | null
  editorTabs?: string[]
  editorActive?: number
  desktopLayout?: import("../../types").DesktopLayout
  quickChatKeys: { cerebras: string; groq: string; go: string; custom: string; customUrl: string }
  modelOptions: any[]
  providerList: any[]
  vs: any
  onActivate: () => void
  onClose: () => void
  onSwitchTab: (tabIdx: number) => void
  onRemoveTab: (tabIdx: number) => void
  onMoveTab: (from: number, to: number) => void
  onTransferTab: (fromPanel: number, fromIdx: number, toIdx: number) => void
  onAddTerminal: () => void
  onDetachTab?: (tabIdx: number, dir?: "right" | "bottom") => void
  onCloseOthers: (keep: number) => void
  onCloseRight: (idx: number) => void
  onCloseLeft: (idx: number) => void
  onCloseAll: () => void
  onDockSession: (index: number, dir: "left" | "right" | "top" | "bottom" | "center", specificId?: string) => void
  onSettleSession: (id: string, dir: string) => Promise<void> | void
  onRefreshSessions: () => void
  onSetCommands: (cmds: any) => void
  onRecordPrompt: (_text: string) => void
  onQueueAction: (action: any) => void
  onShellExecute: (cmd: string, sid?: string, dir?: string) => void
  onChangeAgent: (agentId: string) => void
  onOpenInThisPanel: (id: string) => void
  onSwapPanels: (a: number, b: number) => void
  onOpenFile: (file: string) => void
  onOpenConnect: () => void
  onOpenBrowser: (url: string, panelIndex?: number) => void
  onOpenSessionDir: (dir: string) => void
  onNavigateSettings: () => void
  onToggleInspectTool: (tool: "picker" | "pod") => void
  onBrowserVisualPick: (url: string, el: any) => void
  onSetDesktopLayout?: React.Dispatch<React.SetStateAction<any>>
}

export const DesktopPanelRenderer = memo(function DesktopPanelRenderer(props: DesktopPanelRendererProps) {
  const {
    index: i,
    panelId,
    kind,
    session,
    sid,
    tabStack: stack,
    active,
    config,
    dataMode,
    connectionState,
    baseChatProps,
    sessions,
    busySessions,
    browserTabUrls,
    fileEditorPath,
    editorTabs,
    editorActive,
    quickChatKeys,
    modelOptions,
    providerList,
    vs,
    onActivate,
    onClose,
    onSwitchTab,
    onRemoveTab,
    onMoveTab,
    onTransferTab,
    onAddTerminal,
    onDetachTab,
    onCloseOthers,
    onCloseRight,
    onCloseLeft,
    onCloseAll,
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
  } = props

  // Paneles de sesión y pestañas virtuales
  if (kind === "session") {
    if (!sid) {
      return (
        <DesktopCellPlaceholder
          index={i}
          style={{ height: "100%" }}
          onActivate={onActivate}
          onOpenFile={onOpenFile}
          onSwapPanels={onSwapPanels}
          onDock={onDockSession}
          onClose={onClose}
          label="Selecciona una sesión"
        />
      )
    }

    const isSinglePanel = (props.desktopLayout?.cols ?? 1) * (props.desktopLayout?.rows ?? 1) === 1
    // Terminal tab
    if (sid.startsWith("terminal")) {
      const ptyId = sid.replace(/^terminal[:\-]/, "")
      const tSessions = [...sessions] as any[]
      for (const tid of stack) {
        if (tid.startsWith("terminal") && !tSessions.find((s) => s.id === tid)) {
          tSessions.push({ id: tid, title: `Terminal ${tid.slice(9, 13)}`, directory: "" })
        }
      }
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {!isSinglePanel && <TabBar
            tabs={stack}
            activeIndex={Math.max(0, stack.indexOf(sid))}
            sessions={tSessions}
            busySessionIds={busySessions}
            onSwitch={onSwitchTab}
            onClose={onRemoveTab}
            onAdd={onAddTerminal}
            onMoveTab={onMoveTab}
            onTransferTab={(fp, fi, ti) => onTransferTab(fp, fi, ti)}
            panelIndex={i}
            onDropTerminal={onAddTerminal}
            onDropTerminalTab={(raw) => onDockSession(i, "center", raw)}
            onDropUrl={(url) => onOpenBrowser(url, i)}
            onDetach={onDetachTab}
            onCloseOthers={onCloseOthers}
            onCloseRight={onCloseRight}
            onCloseLeft={onCloseLeft}
            onCloseAll={onCloseAll}
          />}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
              <SingleTerminal tabId={ptyId} cwd={session?.directory} />
            </Suspense>
          </div>
        </div>
      )
    }

    // Virtual tabs (__kanban__, __stats__, __learning__, __pcFiles__) — legacy __design__/__reports__/__screenshots__ kept for migration
    const isVirtual = sid.startsWith("__")
    if (isVirtual) {
      const allWithVirtual = [...sessions] as any[]
      if (stack.includes("__kanban__") && !allWithVirtual.find((s) => s.id === "__kanban__")) {
        allWithVirtual.push({ id: "__kanban__", title: "Kanban", directory: "" })
      }
      if (stack.includes("__stats__") && !allWithVirtual.find((s) => s.id === "__stats__")) {
        allWithVirtual.push({ id: "__stats__", title: "Estadísticas", directory: "" })
      }
      if (stack.includes("__learning__") && !allWithVirtual.find((s) => s.id === "__learning__")) {
        allWithVirtual.push({ id: "__learning__", title: "Aprendizaje", directory: "" })
      }
      if (stack.includes("__pcFiles__") && !allWithVirtual.find((s) => s.id === "__pcFiles__")) {
        allWithVirtual.push({ id: "__pcFiles__", title: "Archivos PC", directory: "" })
      }
      // legacy tabs also pushed for tabBar rendering if stack still contains them
      if (stack.includes("__reports__") && !allWithVirtual.find((s) => s.id === "__reports__")) {
        allWithVirtual.push({ id: "__reports__", title: "Aprendizaje", directory: "" })
      }
      if (stack.includes("__design__") && !allWithVirtual.find((s) => s.id === "__design__")) {
        allWithVirtual.push({ id: "__design__", title: "Open Design", directory: "" })
      }
      if (stack.includes("__screenshots__") && !allWithVirtual.find((s) => s.id === "__screenshots__")) {
        allWithVirtual.push({ id: "__screenshots__", title: "Screenshots", directory: "" })
      }

      let vComp: React.ReactNode = null
      if (sid === "__kanban__") vComp = <KanbanPanel />
      else if (sid === "__stats__") vComp = <StatsPanel />
      else if (sid === "__learning__") vComp = <LearningPage />
      else if (sid === "__pcFiles__") vComp = <PCFilesPanel onOpenFile={props.onOpenFile} />
      else if (sid === "__design__") vComp = <Suspense fallback={PANEL_SUSPENSE_FALLBACK}><ExternalIframePanel name="opendesign" title="Open Design" url="http://127.0.0.1:3000" /></Suspense>
      else if (sid === "__reports__") vComp = <LearningPage />
      else if (sid === "__screenshots__") vComp = <Suspense fallback={PANEL_SUSPENSE_FALLBACK}><ExternalIframePanel name="screenshots" title="Screenshots" url="http://127.0.0.1:3002" /></Suspense>

      const isScrollableVirtual = sid === "__pcFiles__" || sid === "__kanban__" || sid === "__stats__"
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {!isSinglePanel && <TabBar
            tabs={stack}
            activeIndex={Math.max(0, stack.indexOf(sid))}
            sessions={allWithVirtual}
            busySessionIds={busySessions}
            onSwitch={onSwitchTab}
            onClose={onRemoveTab}
            onAdd={onAddTerminal}
            onMoveTab={onMoveTab}
            onTransferTab={(fp, fi, ti) => onTransferTab(fp, fi, ti)}
            panelIndex={i}
            onDropTerminal={onAddTerminal}
            onDropTerminalTab={(raw) => onDockSession(i, "center", raw)}
            onDropUrl={(url) => onOpenBrowser(url, i)}
            onDetach={onDetachTab}
            onCloseOthers={onCloseOthers}
            onCloseRight={onCloseRight}
            onCloseLeft={onCloseLeft}
            onCloseAll={onCloseAll}
          />}
          <div style={{ flex: 1, minHeight: 0, overflow: isScrollableVirtual ? "hidden" : "auto", display: isScrollableVirtual ? "flex" : undefined, flexDirection: isScrollableVirtual ? "column" as const : undefined }}>
            <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>{vComp}</Suspense>
          </div>
        </div>
      )
    }

    // Browser tab — sin pestañas internas (única barra TitleBar/TabBar externa)
    if (sid.startsWith("browser:")) {
      const url = browserTabUrls[sid] || "https://www.google.com"
      const bSessions = [...sessions] as any[]
      for (const bid of stack) {
        if (bid.startsWith("browser:") && !bSessions.find((s) => s.id === bid)) {
          const u = browserTabUrls[bid] || url
          try {
            const host = new URL(u).hostname
            bSessions.push({ id: bid, title: host, directory: "" })
          } catch {
            bSessions.push({ id: bid, title: u.slice(0, 20), directory: "" })
          }
        }
      }
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {!isSinglePanel && <TabBar
            tabs={stack}
            activeIndex={Math.max(0, stack.indexOf(sid))}
            sessions={bSessions}
            busySessionIds={busySessions}
            onSwitch={onSwitchTab}
            onClose={onRemoveTab}
            onAdd={() => onOpenBrowser("https://www.google.com", i)}
            onMoveTab={onMoveTab}
            onTransferTab={(fp, fi, ti) => onTransferTab(fp, fi, ti)}
            panelIndex={i}
            onDropTerminal={onAddTerminal}
            onDropTerminalTab={(raw) => onDockSession(i, "center", raw)}
            onDropUrl={(url) => onOpenBrowser(url, i)}
            onDetach={onDetachTab}
            onCloseOthers={onCloseOthers}
            onCloseRight={onCloseRight}
            onCloseLeft={onCloseLeft}
            onCloseAll={onCloseAll}
          />}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
              <BrowserPanel
                initialUrl={url}
                isActive={active}
                hideTabBar
                onClose={() => onRemoveTab(stack.indexOf(sid))}
                onUrlChange={(newUrl: string) => props.onSetDesktopLayout?.((prev: any) => ({ ...prev, browserTabUrls: { ...(prev.browserTabUrls ?? {}), [sid]: newUrl } }))}
                visualSelection={vs.selection}
                inspectMode={vs.inspectMode}
                onVisualPick={(el: any) => onBrowserVisualPick(url, el)}
                onToggleInspect={vs.toggleInspect}
                onClearVisual={vs.clearAnnotations}
                annotations={vs.annotations}
                onAnnotationComment={vs.setAnnotationComment}
                onRemoveAnnotation={vs.removeAnnotation}
                onAnnotationStyle={vs.setAnnotationStyle}
                onAnnotationStyleBefore={vs.setAnnotationStyleBefore}
                inspectTool={vs.inspectTool}
                onToggleInspectTool={onToggleInspectTool}
              />
            </Suspense>
          </div>
        </div>
      )
    }

    // Plugin tab
    if (sid.startsWith("plugin:")) {
      const pluginKey = sid.slice(7)
      const pSessions = [...sessions] as any[]
      for (const pid of stack) {
        if (pid.startsWith("plugin:") && !pSessions.find((s) => s.id === pid)) {
          pSessions.push({ id: pid, title: pid.slice(7).split(":").pop() || pid, directory: "" })
        }
      }
      if (pluginKey.startsWith("external:")) {
        // Keep all external iframes mounted (hidden) to avoid reload on tab switch
        const externalPlugins = stack
          .filter((id) => id.startsWith("plugin:external:"))
          .map((id) => {
            const n = id.slice(16)
            return EXTERNAL_PROJECTS.find((p) => p.name === n)
          })
          .filter((p): p is NonNullable<typeof p> => !!p)
        const activeProj = EXTERNAL_PROJECTS.find((p) => p.name === pluginKey.slice(9))
        const allProjs = externalPlugins.length > 0 ? externalPlugins : activeProj ? [activeProj] : []
        if (allProjs.length > 0) {
          return (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {!isSinglePanel && <TabBar
                tabs={stack}
                activeIndex={Math.max(0, stack.indexOf(sid))}
                sessions={pSessions}
                busySessionIds={busySessions}
                onSwitch={onSwitchTab}
                onClose={onRemoveTab}
                onAdd={() => {}}
                onMoveTab={onMoveTab}
                onTransferTab={(fp, fi, ti) => onTransferTab(fp, fi, ti)}
                panelIndex={i}
                onDropTerminalTab={(raw) => onDockSession(i, "center", raw)}
                onDropUrl={(url) => onOpenBrowser(url, i)}
                onDetach={onDetachTab}
            onCloseOthers={onCloseOthers}
                onCloseRight={onCloseRight}
                onCloseLeft={onCloseLeft}
                onCloseAll={onCloseAll}
              />}
              <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
                {allProjs.map((proj) => {
                  const isActive = `plugin:external:${proj.name}` === sid
                  return (
                    <div
                      key={proj.name}
                      style={{
                        position: "absolute",
                        inset: 0,
                        visibility: isActive ? "visible" : "hidden",
                        pointerEvents: isActive ? "auto" : "none",
                        zIndex: isActive ? 1 : 0,
                      }}
                    >
                      <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
                        <ExternalIframePanel name={proj.name} title={proj.title} url={proj.url} isWidget={proj.isWidget} />
                      </Suspense>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }
      }
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {!isSinglePanel && <TabBar
            tabs={stack}
            activeIndex={Math.max(0, stack.indexOf(sid))}
            sessions={pSessions}
            busySessionIds={busySessions}
            onSwitch={onSwitchTab}
            onClose={onRemoveTab}
            onAdd={() => {}}
            onMoveTab={onMoveTab}
            onTransferTab={(fp, fi, ti) => onTransferTab(fp, fi, ti)}
            panelIndex={i}
            onDropTerminalTab={(raw) => onDockSession(i, "center", raw)}
            onDropUrl={(url) => onOpenBrowser(url, i)}
                onDetach={onDetachTab}
            onCloseOthers={onCloseOthers}
            onCloseRight={onCloseRight}
            onCloseLeft={onCloseLeft}
            onCloseAll={onCloseAll}
          />}
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 12 }}>
            <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
              {(() => {
                try {
                  const d = tabRegistry.get(pluginKey)
                  return d ? d.render({}) : <div style={{ color: "var(--muted)" }}>Plugin no encontrado: {pluginKey}</div>
                } catch {
                  return <div style={{ color: "var(--muted)" }}>Plugin: {pluginKey}</div>
                }
              })()}
            </Suspense>
          </div>
        </div>
      )
    }

    // Default: Session Chat Panel
    if (!session) {
      return (
        <DesktopCellPlaceholder
          index={i}
          style={{ height: "100%" }}
          onActivate={onActivate}
          onOpenFile={onOpenFile}
          onSwapPanels={onSwapPanels}
          onDock={onDockSession}
          onClose={onClose}
          label="Selecciona una sesión"
        />
      )
    }

    return (
      <SessionChatPanel
        session={session}
        config={config!}
        dataMode={dataMode}
        baseProps={baseChatProps}
        active={active}
        connectionState={connectionState}
        panelIndex={i}
        onActivate={onActivate}
        onClose={onClose}
        onSplitSession={onDockSession}
        onSettled={onSettleSession}
        onRefreshSessions={onRefreshSessions}
        onSetCommands={onSetCommands}
        onRecordPrompt={onRecordPrompt}
        onQueueAction={onQueueAction}
        onShellExecute={onShellExecute}
        onChangeAgentGlobal={onChangeAgent}
        onOpenInThisPanel={onOpenInThisPanel}
        onSwapPanels={onSwapPanels}
        onOpenFile={onOpenFile}
        onOpenConnect={onOpenConnect}
        onOpenBrowser={onOpenBrowser}
        tabStack={isSinglePanel ? [] : stack}
        allSessions={sessions}
        busySessionIds={busySessions}
        onTabSwitch={(_, idx) => onSwitchTab(idx)}
        onTabClose={(_, idx) => onRemoveTab(idx)}
        onTabAdd={onAddTerminal}
        onTabMove={onMoveTab}
        visualSelection={vs.selection}
        visualPromptContext={vs.promptContext}
        onClearVisualSelection={vs.clear}
        onFocusVisualFile={onOpenFile}
      />
    )
  }

  if (kind === "editor") {
    // Controlado por panelEditorTabStacks del layout: si FileEditorPanel
    // corriera no-controlado, sus tabs internos se desincronizarían del estado
    // persistido (abrir/cerrar archivo no se refleja y viceversa).
    const ctrlTabs = editorTabs ?? (fileEditorPath ? [fileEditorPath] : [])
    const activeIdx = editorActive != null && editorActive >= 0 && editorActive < ctrlTabs.length ? editorActive : 0
    const ctrlActive = ctrlTabs[activeIdx] ?? fileEditorPath ?? ctrlTabs[0]
    const selectEditorTab = (p: string) => {
      props.onSetDesktopLayout?.((prev: any) => ({
        ...prev,
        panelEditorActive: { ...prev.panelEditorActive, [i]: Math.max(0, ctrlTabs.indexOf(p)) },
        panelEditorPaths: { ...prev.panelEditorPaths, [i]: p },
      }))
    }
    const closeEditorTab = (p: string) => {
      const closedIdx = ctrlTabs.indexOf(p)
      const next = ctrlTabs.filter((t) => t !== p)
      if (next.length === 0) {
        // Sin archivos: cerrar el panel (colapsa el split como closePanel)
        props.onSetDesktopLayout?.((prev: any) => {
          const paths = { ...prev.panelEditorPaths } as Record<number, string>
          const stacks = { ...prev.panelEditorTabStacks } as Record<number, string[]>
          const act = { ...prev.panelEditorActive } as Record<number, number>
          delete paths[i]
          delete stacks[i]
          delete act[i]
          return { ...prev, panelEditorPaths: paths, panelEditorTabStacks: stacks, panelEditorActive: act }
        })
        onClose()
        return
      }
      const nextIdx = Math.min(Math.max(0, closedIdx - 1), next.length - 1)
      props.onSetDesktopLayout?.((prev: any) => ({
        ...prev,
        panelEditorTabStacks: { ...prev.panelEditorTabStacks, [i]: next },
        panelEditorActive: { ...prev.panelEditorActive, [i]: nextIdx },
        panelEditorPaths: { ...prev.panelEditorPaths, [i]: next[nextIdx] },
      }))
    }
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
            <FileEditorPanel
              path={fileEditorPath || ""}
              tabs={ctrlTabs}
              activePath={ctrlActive}
              onTabSelect={selectEditorTab}
              onTabClose={closeEditorTab}
              onClose={onClose}
            />
          </Suspense>
        </div>
      </div>
    )
  }

  if (kind === "quickchat") {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
          <span>QuickChat</span>
          <button className="btn-icon compact" onClick={onClose} aria-label="Cerrar panel">×</button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <QuickChatPanel
            cerebrasKey={quickChatKeys.cerebras}
            groqKey={quickChatKeys.groq}
            goKey={quickChatKeys.go}
            customKey={quickChatKeys.custom}
            customUrl={quickChatKeys.customUrl}
            config={config}
            modelOptions={modelOptions}
            providers={providerList}
            onOpenSettings={onNavigateSettings}
          />
        </div>
      </div>
    )
  }

  // Shell panel cell (terminal, explorador, kanban, stats, etc.)
  return (
    <ShellPanelCell
      index={i}
      panelId={panelId}
      kind={kind}
      cwd={session?.directory || props.activeSessionDir || props.selectedSessionDir || sessions[0]?.directory}
      sessionID={session?.id}
      active={active}
      onActivate={onActivate}
      onClose={onClose}
      onOpenSessionDir={onOpenSessionDir}
      onSplitSession={onDockSession}
      onSwapPanels={onSwapPanels}
      onOpenFile={onOpenFile}
    />
  )
}, (a, b) => a.sid === b.sid && a.active === b.active && a.tabStack === b.tabStack && a.vs?.inspectMode === b.vs?.inspectMode && a.vs?.inspectTool === b.vs?.inspectTool && a.browserTabUrls === b.browserTabUrls && a.index === b.index && a.panelId === b.panelId && a.baseChatProps.activeAgentID === b.baseChatProps.activeAgentID && a.baseChatProps.getModelForSession === b.baseChatProps.getModelForSession)
