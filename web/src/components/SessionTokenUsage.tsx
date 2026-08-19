import type { TokenUsage } from "../types"
import { formatCompact as formatNum, formatCost } from "../utils"

type Props = {
  tokens: TokenUsage
  cost?: number
  tps?: string
}

function bar(value: number, max: number, color: string) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="token-bar-track" title={`${formatNum(value)} tokens`}>
      <div className={`token-bar-fill ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

export function SessionTokenUsage({ tokens, cost, tps }: Props) {
  const total = tokens.input + tokens.output
  const maxBar = Math.max(tokens.input, tokens.output, 1)

  return (
    <div className="token-usage">
      <div className="token-bars">
        {bar(tokens.input, maxBar, "token-input")}
        {bar(tokens.output, maxBar, "token-output")}
        {tokens.reasoning > 0 && bar(tokens.reasoning, maxBar, "token-reasoning")}
      </div>
      <div className="token-stats">
        <span className="token-stat token-stat-input">{formatNum(tokens.input)} in</span>
        <span className="token-stat token-stat-output">{formatNum(tokens.output)} out</span>
        {tokens.reasoning > 0 && <span className="token-stat token-stat-reasoning">{formatNum(tokens.reasoning)} thought</span>}
        <span className="token-stat token-stat-total">{formatNum(total)} total</span>
        {tps && <span className="token-stat token-stat-tps" style={{ color: "var(--primary)", fontWeight: 700 }}>{tps} tok/s</span>}
        {cost !== undefined && cost > 0 && <span className="token-stat token-stat-cost">{formatCost(cost)}</span>}
      </div>
    </div>
  )
}
