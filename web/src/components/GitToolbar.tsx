import { memo, useState } from "react"
import { useT } from "../i18n-context"
import type { VcsStatus } from "../types"

type Props = {
  vcs: VcsStatus | null
  onStage?: () => void
  onCommit?: (message: string) => void
}

export const GitToolbar = memo(function GitToolbar({ vcs, onStage, onCommit }: Props) {
  const t = useT()
  const [msg, setMsg] = useState("")
  const [showInput, setShowInput] = useState(false)

  if (!vcs) return null

  return (
    <div className="git-toolbar">
      <span className="git-branch">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v12"/><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
        {vcs.branch || "—"}
      </span>
      {vcs.ahead !== undefined && vcs.ahead > 0 && (
        <span className="git-ahead">↑{vcs.ahead}</span>
      )}
      {vcs.behind !== undefined && vcs.behind > 0 && (
        <span className="git-behind">↓{vcs.behind}</span>
      )}
      <div className="git-actions">
        {onStage && <button className="btn-sm" onClick={onStage}>{t('detail.git.stage')}</button>}
        {onCommit && (
          <>
            {showInput ? (
              <div className="git-commit-row">
                <input
                  type="text"
                  className="git-commit-input"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder={t('detail.git.commitMessage')}
                  onKeyDown={(e) => { if (e.key === "Enter" && msg.trim()) { onCommit(msg.trim()); setMsg(""); setShowInput(false) } }}
                  autoFocus
                />
                <button className="btn-sm btn-primary" onClick={() => { if (msg.trim()) { onCommit(msg.trim()); setMsg(""); setShowInput(false) } }}>
                  {t('detail.git.commit')}
                </button>
              </div>
            ) : (
              <button className="btn-sm" onClick={() => setShowInput(true)}>{t('detail.git.commit')}</button>
            )}
          </>
        )}
      </div>
    </div>
  )
})

export default GitToolbar
