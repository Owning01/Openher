import type { FsEntry } from "../../shell"

// Campo de renombrado in-place del explorer: mismo markup y conducta para
// filas de archivo (FileRow) y de carpeta (TreeFolder). Enter/blur confirman,
// Escape cancela, el foco selecciona el texto para escribir directo.
export function InlineRename({
  entry,
  value,
  onChange,
  onCommit,
  onCancel,
}: {
  entry: FsEntry
  value: string
  onChange?: (v: string) => void
  onCommit?: (entry: FsEntry) => void
  onCancel?: () => void
}) {
  return (
    <input
      className="pcf-inline-input"
      value={value}
      autoFocus
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          onCommit?.(entry)
        } else if (e.key === "Escape") {
          e.preventDefault()
          onCancel?.()
        }
      }}
      onBlur={() => onCommit?.(entry)}
      onClick={(e) => e.stopPropagation()}
      onFocus={(e) => e.currentTarget.select()}
    />
  )
}
