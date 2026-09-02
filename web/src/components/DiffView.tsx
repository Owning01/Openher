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

export function synthesizeEditPatch(oldContent: string, newContent: string, fileName = "file"): string {
  const oldLines = oldContent.split("\n")
  const newLines = newContent.split("\n")
  // Diff simple por LCS para hunks legibles; si el archivo es grande (>3000 líneas) fallback a bloques
  if (oldLines.length > 3000 || newLines.length > 3000) {
    const header = `@@ -1,${oldLines.length} +1,${newLines.length} @@`
    const body = [...oldLines.map((l) => `-${l}`), ...newLines.map((l) => `+${l}`)].join("\n")
    return `--- a/${fileName}\n+++ b/${fileName}\n${header}\n${body}`
  }
  // LCS DP
  const m = oldLines.length
  const n = newLines.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) dp[i][j] = dp[i + 1][j + 1] + 1
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const ops: Array<{ type: "ctx" | "add" | "del"; line: string }> = []
  let i = 0, j = 0
  while (i < m || j < n) {
    if (i < m && j < n && oldLines[i] === newLines[j]) {
      ops.push({ type: "ctx", line: oldLines[i] })
      i++; j++
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      ops.push({ type: "add", line: newLines[j] })
      j++
    } else if (i < m) {
      ops.push({ type: "del", line: oldLines[i] })
      i++
    }
  }
  // Si no hay cambios, no mostrar diff
  if (!ops.some((o) => o.type !== "ctx")) return `--- a/${fileName}\n+++ b/${fileName}\n@@ -1,${m} +1,${n} @@\n${ops.map((o) => ` ${o.line}`).join("\n")}`
  // Construir hunks con contexto 3 líneas como git
  const hunks: string[] = []
  hunks.push(`--- a/${fileName}`)
  hunks.push(`+++ b/${fileName}`)
  let hunkStart = 0
  // Agrupar ops en hunks separados por >6 ctx consecutivos
  let cur: typeof ops = []
  let ctxStreak = 0
  const flush = () => {
    if (cur.length === 0) return
    // recortar ctx inicial/final a 3 líneas
    let start = 0
    while (start < cur.length && cur[start].type === "ctx" && start < 3) start++
    // Actually we want to keep at most 3 ctx at boundaries for readability; simpler: keep all but trim large ctx blocks
    const oldCount = cur.filter((o) => o.type !== "add").length
    const newCount = cur.filter((o) => o.type !== "del").length
    const header = `@@ -${hunkStart + 1},${oldCount} +${hunkStart + 1},${newCount} @@`
    const body = cur.map((o) => o.type === "ctx" ? ` ${o.line}` : o.type === "add" ? `+${o.line}` : `-${o.line}`).join("\n")
    hunks.push(`${header}\n${body}`)
    cur = []
  }
  for (let idx = 0; idx < ops.length; idx++) {
    const op = ops[idx]
    cur.push(op)
    if (op.type === "ctx") {
      ctxStreak++
      if (ctxStreak > 6 && ops.slice(idx + 1).some((o) => o.type !== "ctx")) {
        // cortar hunk aquí si hay más cambios adelante
        // mantener 3 ctx finales para próximo hunk
        const ctxTail = cur.splice(cur.length - 3)
        flush()
        cur = ctxTail
        ctxStreak = ctxTail.length
      }
    } else {
      ctxStreak = 0
      hunkStart = idx - cur.length + 1
    }
  }
  flush()
  return hunks.join("\n")
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
