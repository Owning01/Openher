import { useEffect, useRef, type FocusEvent } from "react"

type InlineRenameProps = {
  value: string
  original: string
  onChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  placeholder?: string
  ariaLabel?: string
}

// Edición in-place estilo Windows: el propio título se convierte en campo
// editable (sin botones). Enter/blur confirma, Escape cancela. Al montar,
// foco + texto seleccionado para escribir directamente.
export function InlineRename({ value, original, onChange, onConfirm, onCancel, placeholder, ariaLabel }: InlineRenameProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const doneRef = useRef(false)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    el.select()
    try {
      el.scrollIntoView({ block: "nearest" })
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const confirmOnce = () => {
    if (doneRef.current) return
    doneRef.current = true
    const trimmed = value.trim()
    if (!trimmed || trimmed === original) onCancel()
    else onConfirm()
  }

  const cancelOnce = () => {
    if (doneRef.current) return
    doneRef.current = true
    onCancel()
  }

  // La misma sesión puede estar visible en dos listas a la vez (p. ej.
  // recientes + proyecto, o cabecera + lista): se montan dos campos y el
  // primero pierde el foco en favor del segundo. Ese blur interno no debe
  // confirmar ni cancelar; solo el blur hacia fuera del rename confirma.
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const next = e.relatedTarget as HTMLElement | null
    if (next?.classList?.contains("rename-input")) return
    try {
      const active = document.activeElement as HTMLElement | null
      if (active && active !== inputRef.current && active.classList?.contains("rename-input")) return
    } catch { /* ignore */ }
    confirmOnce()
  }

  return (
    <span className="rename-inline"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}>
      <input ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); confirmOnce() }
          else if (e.key === "Escape") { e.preventDefault(); cancelOnce() }
          e.stopPropagation()
        }}
        // `doneRef` protege del doble confirm (blur + Enter), pero el input puede
        // quedar montado de un rename anterior (misma sesion visible en dos listas,
        // listas memoizadas): ahi doneRef seguia en true y Enter no hacia NADA
        // (bug reportado: "cambio el nombre, doy Enter y no pasa nada"). Se
        // re-arma al enfocar: si el usuario esta escribiendo, Enter confirma.
        onFocus={() => { doneRef.current = false }}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder ?? original}
        className="rename-input"
        autoComplete="off"
        spellCheck={false} />
    </span>
  )
}
