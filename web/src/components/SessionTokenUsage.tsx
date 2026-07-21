import type { TokenUsage } from "../types"

type Props = {
  tokens: TokenUsage
  cost?: number
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function bar(value: number, max: number, color: string) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="token-bar-track" title={`${formatNum(value)} tokens`}>
      <div className={`token-bar-fill ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

export function SessionTokenUsage({ tokens, cost }: Props) {
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
        {cost !== undefined && cost > 0 && <span className="token-stat token-stat-cost">{formatCost(cost)}</span>}
      </div>
    </div>
  )
}

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(6)}`
  return `$${cost.toFixed(4)}`
}
