// ChatTerminalDock — terminal plegable al pie del chat.
// Reutiliza SingleTerminal: el PTY vive en terminalPtyStore keyed por tabId,
// así ocultar desmonta sin matar el proceso y la X lo elimina vía
// killTerminalPty. xterm se descarga diferido (lazy) solo al abrirlo.
import { memo, Suspense, lazy } from "react"
import { CloseIcon, ChevronDownIcon, TerminalIcon } from "../Icons"
import { useT } from "../i18n-context"

const SingleTerminal = lazy(() => import("./shellPanels").then((m) => ({ default: m.SingleTerminal })))

type Props = {
  tabId: string
  cwd: string
  onHide: () => void
  onKill: () => void
}

export const ChatTerminalDock = memo(function ChatTerminalDock({ tabId, cwd, onHide, onKill }: Props) {
  const t = useT()
  return (
    <div className="chat-terminal-dock" role="region" aria-label={t("session.terminal")}>
      <div className="chat-terminal-dock-head">
        <span className="chat-terminal-dock-title">
          <TerminalIcon size={13} /> {t("session.terminal")}
        </span>
        <span className="chat-terminal-dock-actions">
          <button
            type="button"
            className="btn-icon compact"
            onClick={onHide}
            title={t("desktop.collapseSidebar")}
            aria-label={t("desktop.collapseSidebar")}
          >
            <ChevronDownIcon size={12} />
          </button>
          <button
            type="button"
            className="btn-icon compact"
            onClick={onKill}
            title={t("panel.close")}
            aria-label={t("panel.close")}
          >
            <CloseIcon size={12} />
          </button>
        </span>
      </div>
      <div className="chat-terminal-dock-body">
        <Suspense fallback={<div className="chat-terminal-dock-loading">…</div>}>
          <SingleTerminal cwd={cwd} tabId={tabId} />
        </Suspense>
      </div>
    </div>
  )
})
