import { memo } from "react"
import { ArrowLeftIcon } from "../Icons"
import type { SessionView } from "../types"

type SubagentFooterProps = {
  session: SessionView
  onGoBack: () => void
}

export const SubagentFooter = memo(function SubagentFooter({ session, onGoBack }: SubagentFooterProps) {
  const tokens = session.tokens
  const totalTokens = tokens
    ? tokens.input + tokens.output + tokens.reasoning + (tokens.cache?.read ?? 0) + (tokens.cache?.write ?? 0)
    : 0

  return (
    <div className="subagent-footer">
      <div className="subagent-footer-left">
        <button className="subagent-footer-back" onClick={onGoBack}>
          <ArrowLeftIcon size={14} />
          <span>Parent</span>
        </button>
      </div>
      <div className="subagent-footer-center">
        <span className={`subagent-footer-label${session.status === "busy" ? " working" : ""}`}>
          {session.status === "busy" ? <span className="subagent-footer-spinner" /> : null}
          {session.status === "busy" ? "Subagent working…" : "Subagent"}
        </span>
        {tokens && (
          <span className="subagent-footer-tokens">
            {totalTokens >= 1000 ? `${(totalTokens / 1000).toFixed(1)}K` : totalTokens} tokens
          </span>
        )}
        {session.cost !== undefined && session.cost > 0 && (
          <span className="subagent-footer-cost">
            ${session.cost < 0.01 ? session.cost.toFixed(6) : session.cost.toFixed(4)}
          </span>
        )}
      </div>
    </div>
  )
})

export default SubagentFooter
