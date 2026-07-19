import { SaveIcon, CloseIcon } from "../Icons"
import { useT } from "../i18n-context"

type InlineRenameProps = {
  value: string
  original: string
  onChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  placeholder?: string
}

export function InlineRename({ value, original, onChange, onConfirm, onCancel, placeholder }: InlineRenameProps) {
  const t = useT()
  return (
    <div className="rename-inline" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <input value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); onConfirm() }
          else if (e.key === "Escape") onCancel()
        }}
        onBlur={() => { if (value === original || !value.trim()) onCancel() }}
        placeholder={placeholder}
        className="rename-input" autoComplete="off" />
      <button className="btn-primary compact" onClick={(e) => { e.stopPropagation(); onConfirm() }}
        onMouseDown={(e) => e.preventDefault()} title={t('session.renameConfirm')}>
        <SaveIcon size={14} />
      </button>
      <button className="btn-secondary compact" onClick={(e) => { e.stopPropagation(); onCancel() }} title={t('session.cancel')}>
        <CloseIcon size={14} />
      </button>
    </div>
  )
}
