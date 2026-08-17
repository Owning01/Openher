import { memo, useLayoutEffect, useRef } from "react"

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

export function diffLineClass(line: string): "diff-hunk" | "diff-add" | "diff-del" | "diff-ctx" {
  if (line.startsWith("@@")) return "diff-hunk"
  if (line.startsWith("+") && !line.startsWith("+++")) return "diff-add"
  if (line.startsWith("-") && !line.startsWith("---")) return "diff-del"
  return "diff-ctx"
}

export const DiffView = memo(function DiffView({ patch, autoScroll = false }: { patch: string; autoScroll?: boolean }) {
  const containerRef = useRef<HTMLPreElement>(null)

  // Al abrir un diff expandido, centra el primer cambio (la primera línea +/−
  // en orden del archivo) dentro del contenedor scrollable, sin tocar el scroll del chat.
  useLayoutEffect(() => {
    if (!autoScroll) return
    const container = containerRef.current
    if (!container) return
    const firstChange = container.querySelector<HTMLDivElement>(".diff-add, .diff-del")
    if (!firstChange) return
    container.scrollTop = Math.max(0, firstChange.offsetTop - container.clientHeight / 2)
  }, [patch, autoScroll])

  if (!patch) return null
  const lines = patch.split("\n")
  return (
    <pre
      ref={containerRef}
      className="diff-view"
      role="img"
      aria-label="Diff"
      onWheel={(e) => {
        if (e.shiftKey && e.deltaY !== 0 && e.deltaX === 0) {
          e.currentTarget.scrollLeft += e.deltaY
        }
      }}
    >
      {lines.map((line, i) => (
        <div key={i} className={diffLineClass(line)}>
          {line || "\u00A0"}
        </div>
      ))}
    </pre>
  )
})
