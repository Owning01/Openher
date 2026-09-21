import { memo } from "react"
import { CloseIcon } from "../Icons"
import { useT } from "../i18n-context"

type TodoItem = { id: string; status: string; priority: string; content: string }

type Props = {
  todos: TodoItem[]
  expanded: boolean
  onToggle: () => void
}

export const TodoPanel = memo(function TodoPanel({ todos, expanded, onToggle }: Props) {
  const t = useT()
  if (todos.length === 0) return null
  return (
    <div className={`todo-panel${expanded ? " open" : ""}`}>
      <div className="todo-panel-header">
        <span className="todo-panel-title">{t('todo.title')}</span>
        <button className="btn-icon btn-secondary compact" onClick={onToggle} aria-label="Cerrar">
          <CloseIcon size={12} />
        </button>
      </div>
      <div className="todo-panel-body">
        {todos.map((todo) => (
          <div key={todo.id} className={`todo-item ${todo.status}`}>
            <span className={`todo-priority priority-${todo.priority}`} />
            <span className="todo-text">{todo.content}</span>
            <span className={`todo-status-badge ${todo.status}`}>{todo.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
})
