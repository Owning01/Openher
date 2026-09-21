import { memo, useCallback, useMemo, useState } from "react"
import { ArrowLeftIcon, PaintIcon, TerminalIcon, HistoryIcon, NoteIcon, ClockIcon,
  PencilIcon, SettingsIcon, SearchIcon, UndoIcon, RedoIcon, CompressIcon, ShareIcon,
  FolderIcon, BrainIcon, EyeIcon, GlobeIcon, ForkIcon } from "../Icons"
import { useT } from "../i18n-context"
import { InlineRename } from "./InlineRename"
import { DebateChip } from "../features/debate/DebateChip"
import { GoChip } from "./GoChip"
import { ChatOverflowMenu, type ChatOverflowItem } from "./ChatOverflowMenu"
import { DropdownMenu } from "./DropdownMenu"
import { api } from "../api"
import { subagentBackground, isForegroundRunningSubagent, activeSubagentSessions } from "../utils/subagentBackground"
import type { SessionView, RenderedMessage, ServerConfig, FeatureFlags, DiffFile, FileDiff } from "../types"

export type ChatHeaderProps = {
  selectedSession: SessionView | null
  messages: RenderedMessage[]
  busySessionIds?: ReadonlySet<string>
  /** Todas las sesiones: para listar los hijos activos del seleccionado. */
  sessions?: SessionView[]
  config?: ServerConfig
  onViewSubagents: (subagentID?: string) => void
  renamingSessionID: string | null
  renameValue: string
  onRenameChange: (value: string) => void
  onRenameConfirm: (id: string, title: string, dir: string) => void
  onRenameCancel: () => void
  onBackToSessions: () => void
  pendingCount: number
  onReopenQuestions?: () => void
  diffFiles: DiffFile[]
  onOpenADEDiff?: (diffs?: FileDiff[], file?: string) => void
  canCustomizeChat: boolean
  onOpenChatCustomizer: () => void
  chatTermOpen: boolean
  onToggleChatTerm: () => void
  showHistory: boolean
  onToggleHistory: () => void
  showNotes: boolean
  onToggleNotes: () => void
  isWorking: boolean
  onUndo?: () => void
  onRedo?: () => void
  onCompact?: () => void
  onExportMarkdownTo?: (path: string) => Promise<boolean>
  onOpenExport: () => void
  onToggleSearch: () => void
  flags: FeatureFlags
  onOpenFileBrowser?: () => void
  onOpenOpenCodeHub?: () => void
  readingMode: boolean
  onToggleReadingMode: () => void
  onOpenTerminal?: () => void
  onOpenRemoteDesktop?: () => void
  onOpenMCPBrowser?: () => void
  onInsertPrompt?: (text: string) => void
  onOpenPrompts: () => void
  onForkSession?: () => void
  onStartRename: (session: SessionView) => void
  onOpenSettings?: () => void
}

export const ChatHeader = memo(function ChatHeader({
  selectedSession, messages, busySessionIds, sessions, config, onViewSubagents,
  renamingSessionID, renameValue, onRenameChange, onRenameConfirm, onRenameCancel,
  onBackToSessions, pendingCount, onReopenQuestions, diffFiles, onOpenADEDiff,
  canCustomizeChat, onOpenChatCustomizer, chatTermOpen, onToggleChatTerm,
  showHistory, onToggleHistory, showNotes, onToggleNotes,
  isWorking, onUndo, onRedo, onCompact, onExportMarkdownTo, onOpenExport, onToggleSearch,
  flags, onOpenFileBrowser, onOpenOpenCodeHub, readingMode, onToggleReadingMode,
  onOpenTerminal, onOpenRemoteDesktop, onOpenMCPBrowser, onInsertPrompt, onOpenPrompts,
  onForkSession, onStartRename, onOpenSettings
}: ChatHeaderProps) {
  const t = useT()

  // Subagentes en background aún vivos (sesión hija activa en el server). El
  // chip del header evita perderlos de vista con scroll o al cambiar de chat.
  const backgroundSubagents = useMemo(() => {
    const out: Array<{ id: string; childSessionID: string; title: string }> = []
    for (const m of messages) {
      for (const tp of m.toolParts ?? []) {
        const info = subagentBackground(tp)
        if (!info.isBackground || !info.childSessionID || !busySessionIds?.has(info.childSessionID)) continue
        const input = tp.state?.input as { description?: string } | undefined
        const meta = tp.state?.metadata as { description?: string } | undefined
        out.push({
          id: tp.id,
          childSessionID: info.childSessionID,
          title: input?.description ?? meta?.description ?? t('toolpart.subagent'),
        })
      }
    }
    return out
  }, [messages, busySessionIds, t])

  // Subagentes que corren en primer plano (bloqueando el turno). El server
  // puede desacoplarlos a background (Ctrl+B en la TUI): el botón del header
  // dispara experimental.session.background y luego el SSE marca
  // metadata.background en los parts.
  const foregroundSubagents = useMemo(() => {
    let count = 0
    for (const m of messages) {
      for (const tp of m.toolParts ?? []) {
        if (isForegroundRunningSubagent(tp)) count++
      }
    }
    return count
  }, [messages])

  // Chats activos de subagentes DE ESTA SESIÓN (hijos vivos en el server).
  // Acceso rápido desde la parte superior: despliega la lista y abre el
  // elegido con onViewSubagents. Solo cuando hay al menos uno activo.
  const activeSubagents = useMemo(
    () => activeSubagentSessions(sessions ?? [], selectedSession?.id, busySessionIds),
    [sessions, selectedSession?.id, busySessionIds]
  )

  const [promotingBg, setPromotingBg] = useState(false)
  const [bgActionSupported, setBgActionSupported] = useState(true)
  const promoteToBackground = useCallback(async () => {
    if (!config || !selectedSession || promotingBg) return
    setPromotingBg(true)
    try {
      const ok = await api.promoteSessionBackground(config, selectedSession.id, selectedSession.directory)
      // false = el server no tiene la feature (o no había nada que promover).
      if (ok === false) setBgActionSupported(false)
    } catch {
      // Endpoint experimental ausente (server viejo) o red: no insistir.
      setBgActionSupported(false)
    } finally {
      setPromotingBg(false)
    }
  }, [config, selectedSession, promotingBg])

  const items: ChatOverflowItem[] = []
  if (selectedSession) {
    if (renamingSessionID !== selectedSession.id) {
      items.push({ id: "rename", label: t('session.rename'), icon: <PencilIcon size={14} />, onSelect: () => onStartRename(selectedSession) })
    }
    if (onOpenSettings) {
      items.push({ id: "settings", label: t('nav.settings'), icon: <SettingsIcon size={14} />, onSelect: onOpenSettings })
    }
    items.push({ id: "search", label: t('session.searchMessages'), icon: <SearchIcon size={14} />, onSelect: onToggleSearch })
    items.push({ id: "undo", label: t('session.undo'), icon: <UndoIcon size={14} />, disabled: isWorking, onSelect: () => onUndo?.() })
    if (selectedSession.revert) {
      items.push({ id: "redo", label: t('session.redo'), icon: <RedoIcon size={14} />, onSelect: () => onRedo?.() })
    }
    items.push({ id: "compact", label: t('session.compact'), icon: <CompressIcon size={14} />, disabled: isWorking, onSelect: () => onCompact?.() })
    if (onExportMarkdownTo) {
      items.push({ id: "export", label: t('session.exportMd'), icon: <ShareIcon size={14} />, onSelect: onOpenExport })
    }
    if (flags.fileBrowser && onOpenFileBrowser) {
      items.push({ id: "browse", label: t('session.browseFiles'), icon: <FolderIcon size={14} />, onSelect: onOpenFileBrowser })
    }
    items.push({ id: "hub", label: t('session.opencodeHub'), icon: <BrainIcon size={14} />, onSelect: () => onOpenOpenCodeHub?.() })
    items.push({ id: "reading", label: readingMode ? t('detail.readingModeOff') : t('detail.readingModeOn'), icon: <EyeIcon size={14} />, onSelect: onToggleReadingMode })
    if (onOpenTerminal) {
      items.push({ id: "terminal", label: t('session.terminal'), icon: <TerminalIcon size={14} />, onSelect: onOpenTerminal })
    }
    if (onOpenRemoteDesktop) {
      items.push({ id: "remote", label: t('session.remoteDesktop'), icon: <GlobeIcon size={14} />, onSelect: onOpenRemoteDesktop })
    }
    if (onOpenMCPBrowser) {
      items.push({ id: "mcp", label: t('mcp.title'), icon: <GlobeIcon size={14} />, onSelect: onOpenMCPBrowser })
    }
    if (onInsertPrompt) {
      items.push({ id: "prompts", label: t('chat.prompts'), onSelect: onOpenPrompts })
    }
    if (onForkSession) {
      items.push({ id: "fork", label: t('session.fork'), icon: <ForkIcon size={14} />, onSelect: onForkSession })
    }
  }

  return (
    <div className="header-row detail-header">
      <h2>
        {selectedSession ? (
          <div className="detail-title-row">
            <button className="btn-icon btn-ghost back-btn" onClick={onBackToSessions} aria-label={t('detail.backToSessions')} title={t('detail.backToSessions')}>
              <ArrowLeftIcon size={20} />
            </button>
            {renamingSessionID === selectedSession.id && (
              <InlineRename value={renameValue} original={selectedSession.title}
                onChange={onRenameChange}
                onConfirm={() => onRenameConfirm(selectedSession.id, renameValue, selectedSession.directory)}
                onCancel={onRenameCancel}
                placeholder={t('session.renamePlaceholder')} />
            )}
          </div>
        ) : (
          t('detail.selectSession')
        )}
      </h2>
      {selectedSession && (
        <div className="detail-header-actions">
          {selectedSession && <DebateChip originSessionID={selectedSession.id} />}
          <GoChip />
          {activeSubagents.length > 0 && (
            <DropdownMenu
              align="right"
              width={220}
              className="fade-in"
              wrapClassName="header-overflow"
              wrapStyle={{ position: "relative", flexShrink: 0 }}
              trigger={(open) => (
                <button
                  type="button"
                  className="header-bg-pill"
                  title={t('chat.activeSubagentsHint')}
                  aria-expanded={open}
                  aria-haspopup="menu"
                >
                  <ClockIcon size={12} />
                  <span>{t('chat.activeSubagents', { count: activeSubagents.length })}</span>
                </button>
              )}
            >
              {activeSubagents.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="overflow-item"
                  title={s.title}
                  onClick={() => onViewSubagents(s.id)}
                >
                  <ClockIcon size={12} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{s.title || s.id.slice(0, 8)}</span>
                </button>
              ))}
            </DropdownMenu>
          )}
          {foregroundSubagents > 0 && bgActionSupported && selectedSession && (
            <button
              type="button"
              className="header-bg-pill action"
              disabled={promotingBg}
              onClick={promoteToBackground}
              title={t('chat.moveToBackgroundHint')}
            >
              <ClockIcon size={12} />
              <span>{t('chat.moveToBackground')}</span>
            </button>
          )}
          {backgroundSubagents.length > 0 && (
            <button
              type="button"
              className="header-bg-pill"
              title={backgroundSubagents.map((s) => s.title).join("\n")}
              onClick={() => onViewSubagents(backgroundSubagents[0]!.childSessionID)}
            >
              <ClockIcon size={12} />
              <span>{t('chat.backgroundActive', { count: backgroundSubagents.length })}</span>
            </button>
          )}
          {pendingCount > 0 && (
            <button
              type="button"
              className="pending-badge"
              title={t('session.pendingCount', { count: pendingCount })}
              onClick={onReopenQuestions}
              disabled={!onReopenQuestions}
            >
              {pendingCount}
            </button>
          )}
          {diffFiles && diffFiles.length > 0 && onOpenADEDiff && (
            <button
              type="button"
              className="btn-secondary compact header-diff-pill"
              onClick={() => onOpenADEDiff()}
              title="Abrir panel de diffs"
            >
              <span className="diff-pill-dot">●</span>
              <span>Diffs ({diffFiles.length})</span>
            </button>
          )}
          <ChatOverflowMenu
            title={t('session.more')}
            items={items}
            leading={
              <>
                {canCustomizeChat && (
                  <button className="btn-icon compact chat-customize-btn"
                    onClick={(e) => { e.stopPropagation(); onOpenChatCustomizer() }}
                    title={t('detail.customizeChat')}
                    aria-label={t('detail.customizeChat')}>
                    <PaintIcon size={14} />
                  </button>
                )}
                {selectedSession && (
                  <button className={`btn-icon compact chat-term-btn${chatTermOpen ? " active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); onToggleChatTerm() }}
                    title={t('session.terminal')}
                    aria-label={t('session.terminal')}
                    aria-pressed={chatTermOpen}>
                    <TerminalIcon size={14} />
                  </button>
                )}
                {selectedSession && (
                  <button className={`btn-icon compact chat-history-btn${showHistory ? " active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); onToggleHistory() }}
                    title={t('session.promptHistory')}
                    aria-label={t('session.promptHistory')}
                    aria-pressed={showHistory}>
                    <HistoryIcon size={14} />
                  </button>
                )}
                {selectedSession && (
                  <button className={`btn-icon compact chat-notes-btn${showNotes ? " active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); onToggleNotes() }}
                    title={t('session.notes')}
                    aria-label={t('session.notes')}
                    aria-pressed={showNotes}
                    aria-expanded={showNotes}>
                    <NoteIcon size={14} />
                  </button>
                )}
              </>
            }
          />
        </div>
      )}
    </div>
  )
})
