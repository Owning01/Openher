import type { ReactNode } from "react"

type Props = {
  title: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: ReactNode
}

/** Boton de toolbar solo-icono con tooltip nativo. Para acciones universales
    (deshacer, borrar, enviar); lo ambiguo conserva texto. */
export function ToolBtn({ title, onClick, active, disabled, children }: Props) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "var(--primary-soft, var(--surface))" : "var(--surface)",
        border: active ? "1px solid var(--primary)" : "1px solid var(--border)",
        borderRadius: 6,
        color: "var(--text)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}
