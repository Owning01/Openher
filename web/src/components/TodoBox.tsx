import { memo } from "react"
import type { TodoItem } from "../types"
import { useT } from "../i18n-context"

type TodoBoxProps = {
  todos: TodoItem[]
  expanded: boolean
  onToggle: () => void
}

export const TodoBox = memo(function TodoBox({ todos, expanded, onToggle }: TodoBoxProps) {
  const t = useT()
  if (todos.length === 0) return null

  return (
    <div className="todo-box">
      <div className="todo-header-row">
        <h3>
          <span style={{ marginRight: 'var(--space-2)' }}>📋</span>
          {t('todo.title')}
        </h3>
        <button type="button" className="todo-toggle-btn" onClick={onToggle} aria-expanded={expanded} aria-controls="todo-items-content">
          {expanded ? t('todo.hide') : t('todo.show')}
        </button>
      </div>
      {expanded && (
        <div id="todo-items-content">
          {todos.slice(0, 6).map((item) => (
            <div key={item.id} className="todo-item">
              <span className={`todo-status ${item.status}`}>
                {item.status === 'completed' ? '✓' : '○'}
              </span>
              <span>{item.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
