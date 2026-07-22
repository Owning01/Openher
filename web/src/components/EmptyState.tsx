import { memo, type ReactNode } from "react"

type Props = {
  icon: ReactNode
  title: string
  hint?: string
}

export const EmptyState = memo(function EmptyState({ icon, title, hint }: Props) {
  return (
    <div className="empty-state">
      {icon}
      <p>{title}</p>
      {hint && <p className="subtle">{hint}</p>}
    </div>
  )
})
