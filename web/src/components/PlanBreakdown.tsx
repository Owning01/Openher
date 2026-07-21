import { memo, useState } from "react"
import { useT } from "../i18n-context"

type PlanTask = {
  id: string
  title: string
  status: "pending" | "in_progress" | "completed"
}

type Props = {
  tasks: PlanTask[]
}

export const PlanBreakdown = memo(function PlanBreakdown({ tasks }: Props) {
  const t = useT()
  const [open, setOpen] = useState(true)

  if (tasks.length === 0) return null

  const pending = tasks.filter((tk) => tk.status !== "completed").length

  return (
    <div className="plan-breakdown">
      <button className="plan-breakdown-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="plan-breakdown-icon">{open ? "−" : "+"}</span>
        <span className="plan-breakdown-label">{t('detail.plan.tasks')}</span>
        <span className="plan-breakdown-count">{t('detail.plan.pendingCount', { count: pending })}</span>
      </button>
      {open && (
        <div className="plan-breakdown-body">
          {tasks.map((tk) => (
            <div key={tk.id} className={`plan-task plan-task-${tk.status}`}>
              <span className="plan-task-status">
                {tk.status === "completed" ? "✓" : tk.status === "in_progress" ? "◌" : "○"}
              </span>
              <span className="plan-task-title">{tk.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

export default PlanBreakdown
