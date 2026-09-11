import type { FileDiff } from "../types"
import { parseDiffStat, synthesizeWritePatch, synthesizeEditPatch } from "../components/DiffView"

const FILE_TOOLS = new Set(["write", "edit", "apply_patch", "patch"])

export type FileToolPartInput = {
  tool?: string | null
  state?: {
    input?: unknown
    metadata?: Record<string, unknown> | null
    title?: string | null
  } | null
}

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined)

// El server manda additions/deletions a veces como string ("2"): coercear,
// si no los += concatenan ("02") y los badges/turnos muestran basura.
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}

/**
 * Deriva el FileDiff de un tool part de archivo (write/edit/apply_patch).
 * Lógica extraída de ToolPart (verbatim en precedencia) para reusarla sin
 * ciclo de imports: ToolPart la consume y groupTurnDiffs también.
 */
export function toolPartFileDiff(
  part: FileToolPartInput,
  textFilePath?: string | null,
): FileDiff | null {
  const toolName = part.tool ?? null
  if (!toolName || !FILE_TOOLS.has(toolName)) return null
  const metadata = part.state?.metadata ?? null
  const input = part.state?.input
  const inputObj = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : null
  const inp = (k: string): unknown => (inputObj ? inputObj[k] : undefined)

  const fileOf = (fallback = "file"): string =>
    str(metadata?.filepath) ??
    str((metadata?.filediff as { file?: unknown } | undefined)?.file) ??
    str(((metadata?.files as Array<{ filePath?: unknown; file?: unknown }> | undefined)?.[0]?.filePath)) ??
    str(((metadata?.files as Array<{ filePath?: unknown; file?: unknown }> | undefined)?.[0]?.file)) ??
    str(part.state?.title) ??
    str(inp("filePath") ?? inp("file") ?? inp("path")) ??
    textFilePath ??
    fallback

  const filesMeta = metadata?.files as Array<{ file?: unknown; filePath?: unknown; patch?: unknown; additions?: unknown; deletions?: unknown }> | undefined
  const firstFile = Array.isArray(filesMeta) ? filesMeta[0] : undefined
  const firstFilePatch = typeof firstFile?.patch === "string" && firstFile.patch ? firstFile.patch : undefined

  if (toolName === "edit") {
    const fd = metadata?.filediff as { patch?: unknown; additions?: unknown; deletions?: unknown } | undefined
    if (fd && typeof fd.patch === "string") {
      const st = parseDiffStat(fd.patch)
      return { file: fileOf(), additions: num(fd.additions) ?? st.add, deletions: num(fd.deletions) ?? st.del, patch: fd.patch }
    }
    const diff = metadata?.diff as string | undefined
    if (typeof diff === "string" && diff) {
      const st = parseDiffStat(diff)
      return { file: fileOf(), additions: st.add, deletions: st.del, patch: diff }
    }
    // opencode v2 manda el patch en metadata.files[0] (con additions/
    // deletions a veces como string). El código original no lo miraba y
    // estos edits quedaban sin diff visible.
    if (firstFilePatch) {
      const st = parseDiffStat(firstFilePatch)
      return {
        file: str(firstFile?.file) ?? str(firstFile?.filePath) ?? fileOf(),
        additions: num(firstFile?.additions) ?? st.add,
        deletions: num(firstFile?.deletions) ?? st.del,
        patch: firstFilePatch,
      }
    }
    const oldStr = str(inp("oldString") ?? inp("old_string") ?? inp("oldText") ?? inp("old_text") ?? inp("old_content"))
    const newStr = str(inp("newString") ?? inp("new_string") ?? inp("newText") ?? inp("new_text") ?? inp("content"))
    if (oldStr !== undefined || newStr !== undefined) {
      const o = oldStr ?? ""
      const n = newStr ?? ""
      if (o || n) {
        const patch = synthesizeEditPatch(o, n, str(inp("filePath") ?? inp("file") ?? inp("path")) ?? "file")
        const st = parseDiffStat(patch)
        return { file: fileOf(), additions: st.add, deletions: st.del, patch }
      }
    }
    const directPatch = inp("patch") ?? inp("edits") ?? inp("diff")
    if (typeof directPatch === "string" && directPatch.includes("@@")) {
      const st = parseDiffStat(directPatch)
      return { file: fileOf(), additions: st.add, deletions: st.del, patch: directPatch }
    }
    return null
  }

  if (toolName === "apply_patch" || toolName === "patch") {
    const files = metadata?.files as Array<{ additions?: unknown; deletions?: unknown }> | undefined
    const diff = (metadata?.diff ?? inp("patch") ?? inp("diff") ?? firstFilePatch) as string | undefined
    let add = 0
    let del = 0
    if (Array.isArray(files)) {
      for (const f of files) {
        add += num(f.additions) ?? 0
        del += num(f.deletions) ?? 0
      }
    } else if (typeof diff === "string" && diff) {
      const st = parseDiffStat(diff)
      add = st.add
      del = st.del
    }
    if (typeof diff === "string" && diff.includes("@@")) {
      return { file: fileOf(), additions: add || parseDiffStat(diff).add, deletions: del || parseDiffStat(diff).del, patch: diff }
    }
    const patchContent = str(inp("content") ?? inp("patch"))
    if (patchContent && patchContent.length > 0) {
      return { file: fileOf(), additions: patchContent.split("\n").length, deletions: 0, patch: synthesizeWritePatch(patchContent) }
    }
    return add || del ? { file: fileOf(), additions: add, deletions: del, patch: diff } : null
  }

  const content = typeof input === "string" ? input : str(inputObj?.content)
  if (typeof content === "string" && content.length > 0) {
    return { file: fileOf(), additions: content.split("\n").length, deletions: 0, patch: synthesizeWritePatch(content) }
  }
  return null
}
