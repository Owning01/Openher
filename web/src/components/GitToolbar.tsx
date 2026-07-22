import { memo, useState } from "react"
import { BranchIcon } from "../Icons"
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
        <BranchIcon size={12} />
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
