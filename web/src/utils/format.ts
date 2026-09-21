// Formateadores únicos de bytes y de tiempo.
// `formatBytes` tenía dos formatos distintos en el repo; el parámetro `style`
// es explícito para que cada call site conserve EXACTAMENTE el suyo:
//   - "data":    "1.5 KB" / "150 KB" / "0 B"  (dataUsage, con espacio y decimales)
//   - "memory":  "1K" / "5m" / "512B"         (useMemoryUsage, redondeado)
// `formatTime` idem:
//   - "full":    fecha+hora local ("-" si epoch inválido)
//   - "clock":   solo HH:MM, "" si no hay valor (PromptHistoryPanel)

export type ByteStyle = "data" | "memory"

export function formatBytes(bytes: number, style: ByteStyle = "data"): string {
  if (style === "memory") {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`
    return `${(bytes / (1024 * 1024)).toFixed(0)}m`
  }
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unit = units[0]
  for (let i = 1; i < units.length && value >= 1024; i++) {
    value /= 1024
    unit = units[i]
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`
}

/** Igual que `formatBytes(b, "memory")`, con referencia estable para props/memos. */
export function formatBytesMemory(bytes: number): string {
  return formatBytes(bytes, "memory")
}

export type TimeStyle = "full" | "clock"

export function formatTime(epoch: number, style: TimeStyle = "full"): string {
  if (style === "clock") {
    if (!epoch) return ""
    try {
      return new Date(epoch).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ""
    }
  }
  if (!epoch || epoch <= 0) return "-"
  return new Date(epoch).toLocaleString()
}
