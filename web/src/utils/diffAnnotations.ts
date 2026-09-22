// Anotaciones sobre un diff listas para mandar al agente (equivalente al
// "annotate AI diffs" de Orca): se comenta una línea del diff y el comentario
// viaja en el prompt siguiente, con archivo y línea para que el agente sepa
// exactamente de qué habla.
export type DiffNote = {
  /** Archivo del diff (cuando se conoce). */
  file?: string
  /** Línea nueva si existe; si no, la vieja. */
  line: number
  /** Texto de la línea comentada, sin el signo del diff. */
  code?: string
  /** Comentario del usuario. */
  note: string
}

/** Línea del diff que se comenta: la nueva manda, si no la vieja. */
export function diffRowLine(row: { newLine?: number | null; oldLine?: number | null }): number {
  return row.newLine ?? row.oldLine ?? 0
}

/** Bloque de prompt con las anotaciones; "" si no hay ninguna con texto. */
export function formatDiffNotes(notes: DiffNote[]): string {
  const clean = notes.filter((n) => n.note.trim().length > 0)
  if (clean.length === 0) return ""
  const items = clean.map((n) => {
    const where = n.file ? `${n.file}:${n.line}` : `línea ${n.line}`
    const code = (n.code ?? "").trim()
    const head = `- ${where} — ${n.note.trim()}`
    return code ? `${head}\n  \`${code}\`` : head
  })
  return [
    "Comentarios sobre el diff (revisión de código). Aplicalos donde correspondan:",
    "",
    ...items,
  ].join("\n")
}
