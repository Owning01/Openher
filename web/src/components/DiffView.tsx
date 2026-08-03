import { memo } from "react"

export type DiffStat = { add: number; del: number }

// Cuenta líneas +/− de un unified diff, ignorando cabeceras (+++/---) y hunks (@@).
export function parseDiffStat(patch?: string): DiffStat {
  if (!patch) return { add: 0, del: 0 }
  let add = 0
  let del = 0
  for (const line of patch.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) add++
    else if (line.startsWith("-") && !line.startsWith("---")) del++
  }
  return { add, del }
}

export function sumDiffStat(diffs: Array<{ additions?: number; deletions?: number }>): DiffStat {
  let add = 0
  let del = 0
  for (const d of diffs) {
    add += d.additions ?? 0
    del += d.deletions ?? 0
  }
  return { add, del }
}

// Para `write` (el server no calcula diff por part): el archivo es nuevo, todas
// las líneas del content son adiciones.
export function synthesizeWritePatch(content: string): string {
  const lines = content.split("\n")
  const header = `@@ -0,0 +1,${lines.length} @@`
  const body = lines.map((l) => `+${l}`).join("\n")
  return `${header}\n${body}`
}

export const DiffView = memo(function DiffView({ patch }: { patch: string }) {
  if (!patch) return null
  const lines = patch.split("\n")
  return (
    <pre className="diff-view" role="img" aria-label="Diff">
      {lines.map((line, i) => {
        let cls = "diff-ctx"
        if (line.startsWith("@@")) cls = "diff-hunk"
        else if (line.startsWith("+") && !line.startsWith("+++")) cls = "diff-add"
        else if (line.startsWith("-") && !line.startsWith("---")) cls = "diff-del"
        return (
          <div key={i} className={cls}>
            {line || "\u00A0"}
          </div>
        )
      })}
    </pre>
  )
})
