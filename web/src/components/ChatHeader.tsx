import { memo, useMemo } from "react"
import { ArrowLeftIcon, PaintIcon, TerminalIcon, HistoryIcon, NoteIcon, ClockIcon,
  PencilIcon, SettingsIcon, SearchIcon, UndoIcon, RedoIcon, CompressIcon, ShareIcon,
  FolderIcon, BrainIcon, GlobeIcon, ForkIcon, ZapIcon, ToolIcon } from "../Icons"
import { useT } from "../i18n-context"
import { InlineRename } from "./InlineRename"
import { DebateChip } from "../features/debate/DebateChip"
import { GoChip } from "./GoChip"
import { ChatOverflowMenu, type ChatOverflowItem } from "./ChatOverflowMenu"
import { DropdownMenu } from "./DropdownMenu"
import { subagentBackground, activeSubagentSessions } from "../utils/subagentBackground"
import type { SessionView, RenderedMessage, FeatureFlags, DiffFile, FileDiff } from "../types"

export type ChatHeaderProps = {
  selectedSession: SessionView | null
  messages: RenderedMessage[]
  busySessionIds?: ReadonlySet<string>
  /** Todas las sesiones: para listar los hijos activos del seleccionado. */
  sessions?: SessionView[]
  // El modo lectura se sacó del menú (25-sep): readingMode y
  // onToggleReadingMode quedan en el tipo porque ChatView los pasa, pero el
  // header ya no los lee.
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
  onOpenMCPBrowser?: () => void
  onInsertPrompt?: (text: string) => void
  onOpenPrompts: () => void
  onForkSession?: () => void
  onStartRename: (session: SessionView) => void
  onOpenSettings?: () => void
  // El contador de contexto NO va en el header (25-sep): queda solo en la fila
  // de metadatos del composer, `[modo] modelo 123K (12.3%)`. Estaba duplicado.
}

export const ChatHeader = memo(function ChatHeader({
  selectedSession, messages, busySessionIds, sessions, onViewSubagents,
  renamingSessionID, renameValue, onRenameChange, onRenameConfirm, onRenameCancel,
  onBackToSessions, pendingCount, onReopenQuestions, diffFiles, onOpenADEDiff,
  canCustomizeChat, onOpenChatCustomizer, chatTermOpen, onToggleChatTerm,
  onToggleHistory, showNotes, onToggleNotes,
  isWorking, onUndo, onRedo, onCompact, onExportMarkdownTo, onOpenExport, onToggleSearch,
  flags, onOpenFileBrowser, onOpenOpenCodeHub,
  onOpenMCPBrowser, onOpenPrompts, onForkSession, onStartRename, onOpenSettings
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

  // Chats activos de subagentes DE ESTA SESIÓN (hijos vivos en el server).
  // Acceso rápido desde la parte superior: despliega la lista y abre el
  // elegido con onViewSubagents. Solo cuando hay al menos uno activo.
  const activeSubagents = useMemo(
    () => activeSubagentSessions(sessions ?? [], selectedSession?.id, busySessionIds),
    [sessions, selectedSession?.id, busySessionIds]
  )

  // Orden fijo del menú "⋯": grupo `tools` primero (accordion) y el resto en
  // raíz con Configuración separada. En móvil los botones de `leading` están
  // ocultos (≤780px), así que el menú es la única entrada a todo: por eso
  // Terminal y Personalizar chat también están acá, aunque tengan botón.
  const toolGroups = useMemo(() => [
    { id: "tools", label: t('chat.toolsMenu'), icon: <ToolIcon size={14} /> },
  ], [t])

  const items: ChatOverflowItem[] = []
  if (selectedSession) {
    if (renamingSessionID !== selectedSession.id) {
      items.push({ id: "rename", group: "tools", label: t('session.rename'), icon: <PencilIcon size={14} />, onSelect: () => onStartRename(selectedSession) })
    }
    items.push({ id: "undo", group: "tools", label: t('session.undo'), icon: <UndoIcon size={14} />, disabled: isWorking, onSelect: () => onUndo?.() })
    if (selectedSession.revert) {
      items.push({ id: "redo", group: "tools", label: t('session.redo'), icon: <RedoIcon size={14} />, onSelect: () => onRedo?.() })
    }
    items.push({ id: "compact", group: "tools", label: t('session.compact'), icon: <CompressIcon size={14} />, disabled: isWorking, onSelect: () => onCompact?.() })
    if (onExportMarkdownTo) {
      items.push({ id: "export", group: "tools", label: t('session.exportMd'), icon: <ShareIcon size={14} />, onSelect: onOpenExport })
    }
    if (onForkSession) {
      items.push({ id: "fork", group: "tools", label: t('session.fork'), icon: <ForkIcon size={14} />, onSelect: onForkSession })
    }
    items.push({ id: "search", group: "tools", label: t('session.searchMessages'), icon: <SearchIcon size={14} />, onSelect: onToggleSearch })
    items.push({ id: "prompts", group: "tools", label: t('chat.prompts'), icon: <ZapIcon size={14} />, onSelect: onOpenPrompts })
    items.push({ id: "history", group: "tools", label: t('session.promptHistory'), icon: <HistoryIcon size={14} />, onSelect: onToggleHistory })
    // Mismo handler que el botón del header: en móvil ese botón no existe.
    items.push({ id: "terminal", label: t('session.terminal'), icon: <TerminalIcon size={14} />, onSelect: onToggleChatTerm })
    if (flags.fileBrowser && onOpenFileBrowser) {
      items.push({ id: "browse", label: t('session.browseFiles'), icon: <FolderIcon size={14} />, onSelect: onOpenFileBrowser })
    }
    if (onOpenMCPBrowser) {
      items.push({ id: "mcp", label: t('mcp.title'), icon: <GlobeIcon size={14} />, tag: t('chat.viewTag'), onSelect: onOpenMCPBrowser })
    }
    items.push({ id: "notes", label: t('session.notes'), icon: <NoteIcon size={14} />, onSelect: onToggleNotes })
    items.push({ id: "hub", label: t('session.opencodeHub'), icon: <BrainIcon size={14} />, tag: t('chat.viewTag'), onSelect: () => onOpenOpenCodeHub?.() })
    if (canCustomizeChat) {
      items.push({ id: "customize", label: t('detail.customizeChat'), icon: <PaintIcon size={14} />, onSelect: onOpenChatCustomizer })
    }
    if (onOpenSettings) {
      items.push({ id: "settings", label: t('nav.settings'), icon: <SettingsIcon size={14} />, separatorBefore: true, onSelect: onOpenSettings })
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
            {renamingSessionID === selectedSession.id ? (
              <InlineRename value={renameValue} original={selectedSession.title}
                onChange={onRenameChange}
                onConfirm={() => onRenameConfirm(selectedSession.id, renameValue, selectedSession.directory)}
                onCancel={onRenameCancel}
                placeholder={t('session.renamePlaceholder')} />
            ) : (
              <span className="detail-session-title" title={selectedSession.title || selectedSession.id}>
                {selectedSession.title || selectedSession.id.slice(0, 8)}
              </span>
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
            groups={toolGroups}
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
