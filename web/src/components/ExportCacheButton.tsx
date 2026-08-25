import { memo } from "react"
export const ExportCacheButton = memo(function ExportCacheButton({ small, label }: { small?: boolean; label?: string }) {
  return (
    <button type="button" className="btn-secondary compact" style={small ? { fontSize: "0.78rem" } : undefined} title={label || "Exportar"}>
      {label || "Exportar .md"}
    </button>
  )
})
