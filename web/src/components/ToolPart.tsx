import { memo, useMemo, useState, type ReactNode } from "react"
import type { ServerConfig, FileDiff } from "../types"
import { toolMeta } from "../utils/toolMeta"
import {
  detectToolName,
  isQuestionTool,
  isFileTool,
  isShellTool,
  toolCategory,
  toolIconKind,
  toolShortLabel,
  toolVerb,
} from "../utils/toolName"
import { QuestionPrompt } from "./QuestionPrompt"
import { CollapsibleSection } from "./CollapsibleSection"
import { DiffView } from "./DiffView"
import { useT } from "../i18n-context"
import { CodeIcon, FileIcon, SearchIcon, GlobeIcon, CloseIcon, ToolIcon } from "../Icons"
import { HighlightedCode } from "./HighlightedCode"
import { useQuestionSettled, useQuestionFloatingMode } from "../utils/questionStore"
import { toolPartFileDiff } from "../utils/toolFileDiff"

export type ToolPartData = {
  id: string
  type: string
  sessionID?: string
  text?: string
  callID?: string
  tool?: string
  state?: {
    status?: string
    input?: unknown
    output?: unknown
    error?: unknown
    duration?: number
    title?: string
    metadata?: Record<string, unknown>
  }
}

const toolLabels: Record<string, string> = {
  tool_use: "Tool call",
  tool_result: "Tool result",
  execution: "Execution",
  terminal: "Terminal",
  code_execution: "Code execution",
  tool_call: "Tool call",
  tool: "Tool",
}

function toolSvgIcon(toolName: string | null): ReactNode {
  const size = 13
  switch (toolIconKind(toolName)) {
    case "shell":
      return <span className="tool-icon-shell">&lt;&gt;</span>
    case "file":
      return <FileIcon size={size} />
    case "search":
      return <SearchIcon size={size} />
    case "web":
      return <GlobeIcon size={size} />
    default:
      return <CodeIcon size={size} />
  }
}

function getAntigravityFileIcon(path: string): ReactNode {
  if (/\.(tsx|jsx|ts|js)$/i.test(path)) {
    return <span className="tool-file-atom">⚛</span>
  }
  if (/\.(rs|go|py|c|cpp|h|hpp|cs|java|php|rb|css|json|yaml|yml|html|toml|scss|md|sql)$/i.test(path)) {
    return <span className="tool-file-brackets">{"{}"}</span>
  }
  return <FileIcon size={12} className="tool-file-default" />
}

function extractParam(text: string, name: string): string {
  const m = text.match(new RegExp(`<parameter\\s+name="${name}"[^>]*>(.*?)</parameter>`, "s"))
  return m ? m[1].trim() : ""
}

function extractJSONParam(text: string, name: string): unknown {
  const raw = extractParam(text, name)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function getResultText(text: string): string {
  const m = text.match(/<result>([\s\S]*)<\/result>/i)
  if (m) return m[1].trim()
  return text
}

function extractFilePath(text: string): string | null {
  const m = text.match(/filePath="([^"]+)"/)
  return m ? m[1] : null
}

export function toRelativePath(fullPath: string, baseDir?: string): string {
  if (!fullPath) return fullPath
  if (baseDir) {
    const normalize = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "")
    const nFull = normalize(fullPath)
    const nBase = normalize(baseDir)
    if (nFull.toLowerCase().startsWith(nBase.toLowerCase() + "/")) {
      let rel = nFull.slice(nBase.length + 1)
      if (fullPath.includes("\\")) rel = rel.replace(/\//g, "\\")
      return rel
    }
  }
  const webIdx = fullPath.search(/[\\/]web[\\/]/i)
  if (webIdx !== -1) {
    let rel = fullPath.slice(webIdx + 1)
    if (rel.startsWith("\\") || rel.startsWith("/")) rel = rel.slice(1)
    return rel
  }
  return fullPath
}

function previewLines(text: string, maxLines = 5): string {
  if (!text) return ""
  // Cortar a un límite razonable antes de hacer split para no fragmentar el heap con arrays gigantes
  const safeText = text.length > 30000 ? text.slice(0, 30000) : text
  const lines = safeText.split("\n")
  if (lines.length <= maxLines && text.length <= 30000) return text
  return lines.slice(0, maxLines).join("\n") + "\n..."
}

// Trunca en límite de palabra: evita cortar a mitad ("Unicod...").
// Si no hay espacio antes del límite, cae al corte duro.
function truncateAtWord(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max - 3)
  const lastSpace = cut.lastIndexOf(" ")
  if (lastSpace > max * 0.5) return cut.slice(0, lastSpace) + "..."
  return cut + "..."
}

// Oportunidades de quiebre en rutas Windows: el navegador no parte por "\",
// así que una ruta larga se desborda o parte a mitad de palabra ("abso/luto").
// El zero-width space tras cada separador deja partir ahí sin cambiar el texto
// visible ni el copiado.
function withBreakOpportunities(s: string): string {
  return s.replace(/([\\/])/g, "$1\u200b")
}

// El error del tool vive en state.error, no en state.output. Sin esto, un tool
// fallido mostraba el input repetido en vez del motivo del fallo.
function formatStateError(err: unknown): string {
  if (err == null) return ""
  if (typeof err === "string") return err
  if (err instanceof Error) return err.message || String(err)
  if (typeof err === "object") {
    const o = err as Record<string, unknown>
    const parts: string[] = []
    if (typeof o.message === "string" && o.message) parts.push(o.message)
    else if (typeof o.error === "string" && o.error) parts.push(o.error)
    else if (typeof o.text === "string" && o.text) parts.push(o.text)
    for (const k of ["code", "name", "exitCode", "exit_code"]) {
      if (o[k] != null && o[k] !== "" && typeof o[k] !== "object") parts.push(`${k}: ${String(o[k])}`)
    }
    if (parts.length) return parts.join("\n")
    try { return JSON.stringify(err, null, 2) } catch { return String(err) }
  }
  return String(err)
}

function formatInput(input: unknown, baseDir?: string): string {
  if (input == null) return ""
  if (typeof input === "string") return input
  if (typeof input === "object" && !Array.isArray(input)) {
    const obj = input as Record<string, unknown>
    // Shell tool: render as command line
    if ("command" in obj) {
      const cmd = typeof obj.command === "string" ? obj.command : String(obj.command ?? "")
      const args = Array.isArray(obj.args) ? obj.args.filter((a: unknown) => typeof a === "string").join(" ") : ""
      const base = args ? `${cmd} ${args}` : cmd
      const extra: string[] = []
      if (typeof obj.workdir === "string" && obj.workdir) extra.push(`workdir: ${toRelativePath(obj.workdir, baseDir)}`)
      if (typeof obj.title === "string" && obj.title) extra.push(`title: ${obj.title}`)
      if (typeof obj.description === "string" && obj.description) extra.push(`description: ${obj.description}`)
      if (typeof obj.notifyOnExit === "boolean") extra.push(`notifyOnExit: ${obj.notifyOnExit}`)
      if (typeof obj.timeoutSeconds === "number") extra.push(`timeout: ${obj.timeoutSeconds}s`)
      return extra.length ? `${base}\n${extra.join("\n")}` : base
    }
    // Generic object: key: value lines
    const lines: string[] = []
    for (const [k, v] of Object.entries(obj)) {
      if (v == null || v === false) continue
      if (v === true) { lines.push(k); continue }
      if (typeof v === "string") {
        const isPathKey = k === "filePath" || k === "file" || k === "path" || k === "filepath" || k === "workdir" || k === "directory" || k === "AbsolutePath" || k === "TargetFile"
        const displayV = isPathKey && baseDir ? toRelativePath(v, baseDir) : v
        // ZWSP tras separadores para que las rutas largas partan por "\" o "/"
        // en vez de a mitad de palabra dentro del <pre>.
        const wrappedV = isPathKey ? withBreakOpportunities(displayV) : displayV
        lines.push(wrappedV.includes("\n") ? `${k}:\n${wrappedV}` : `${k}: ${wrappedV}`); continue }
      if (Array.isArray(v)) {
        const items = v.map((x: unknown) => typeof x === "string" ? x : JSON.stringify(x)).join(", ")
        lines.push(`${k}: ${items}`)
        continue
      }
      lines.push(`${k}: ${JSON.stringify(v)}`)
    }
    if (lines.length) return lines.join("\n")
  }
  try {
    return JSON.stringify(input, null, 2)
  } catch {
    return String(input)
  }
}

export function DiffStatBadge({ add, del }: { add: number; del: number }) {
  if (add === 0 && del === 0) return null
  return (
    <span className="diff-badges" aria-hidden="true">
      {add > 0 && <span className="diff-badge add">+{add}</span>}
      {del > 0 && <span className="diff-badge del">−{del}</span>}
    </span>
  )
}

// `onViewSubagents` y `busySessionIds` ya no se usan acá: la navegación a la
// sesión del subagente la hace la fila `.subagent-row` de MessageBubble y el
// estado vivo se lee en la cabecera (ChatHeader). No volver a pasarlos.
export const ToolPart = memo(function ToolPart({ part, config, directory, sessionID, compact: _compact }: {
  part: ToolPartData
  config?: ServerConfig
  directory?: string
  sessionID?: string
  compact?: boolean
}) {
  const t = useT()
  const [locallyAnswered, setLocallyAnswered] = useState(false)
  const [localAnswers, setLocalAnswers] = useState<string[][] | undefined>(undefined)
  const text = part.text?.trim()
  const toolName = useMemo(() => part.tool ?? detectToolName(text ?? ""), [part.tool, text])
  const callID = useMemo(() => extractParam(text ?? "", "callID") || text?.match(/callID="([^"]+)"/)?.[1] || part.callID || part.id, [text, part.callID, part.id])
  const idCandidates = useMemo(() => [callID, part.callID, part.id, text?.match(/callID="([^"]+)"/)?.[1], extractParam(text ?? "", "callID")].filter((x): x is string => !!x), [callID, part.callID, part.id, text])
  // Deteccion temprana de "tool de pregunta": solo esos se suscriben al store
  // de preguntas (questionAuto/settled); el resto de los ToolPart ya no.
  const questionInput = part.state?.input as { questions?: unknown; answers?: unknown } | undefined
  const isQuestionByInput = Array.isArray(questionInput?.questions)
  const isQuestionByTool = toolName === "question"
  const isQuestionByXml = isQuestionTool(text ?? "")
  const isQuestionPart = (part.type === "tool_use" || part.type === "tool" || isQuestionByTool)
    && (isQuestionByTool || isQuestionByInput || isQuestionByXml)
  const settledInfo = useQuestionSettled(idCandidates, isQuestionPart)
  const questionFloating = useQuestionFloatingMode(isQuestionPart)
  const isSettled = !!settledInfo
  const [expanded, setExpanded] = useState(false)
  const meta = toolName ? toolMeta[toolName] : null
  const filePath = useMemo(() => extractFilePath(text ?? ""), [text])
  const displayFilePath = useMemo(() => filePath ? toRelativePath(filePath, directory) : null, [filePath, directory])
  const resultText = useMemo(() => getResultText(text ?? ""), [text])
  const preview = useMemo(() => previewLines(meta ? resultText : (text ?? "")), [meta, resultText, text])

  const status = part.state?.status ?? (part.type === "tool_result" ? "completed" : part.type === "tool_use" ? "running" : undefined)
  const isWorking = status === "pending" || status === "running"
  const isError = status === "error"
  const isDone = status === "completed" || status === "error"

  const inputText = useMemo(() => {
    if (part.state?.input != null) return formatInput(part.state.input, directory)
    return text ?? ""
  }, [part.state?.input, text, directory])

  // Cabeza del output para los regex de conteo: los outputs pueden ser MBs
  // (logs) y solo importan las primeras líneas para "N results/files".
  const outputText = useMemo(() => {
    if (part.state?.output != null) return formatInput(part.state.output, directory)
    return resultText
  }, [part.state?.output, resultText, directory])
  const outputHead = useMemo(
    () => (typeof outputText === "string" ? outputText.slice(0, 2048) : outputText),
    [outputText],
  )

  // Comandos de terminal: muestran el command en la línea del toggle (visible
  // sin expandir) y la salida al expandir.
  const shellTool = isShellTool(toolName)
  const bashCommand = useMemo(() => {
    if (!shellTool) return null
    const input = part.state?.input
    if (input && typeof input === "object" && "command" in input) {
      const obj = input as { command?: string; args?: string[] }
      const cmd = obj.command
      if (typeof cmd === "string" && cmd.trim()) {
        const args = Array.isArray(obj.args) ? obj.args.join(" ") : ""
        const full = args ? `${cmd} ${args}` : cmd
        return full.trim()
      }
    }
    return null
  }, [shellTool, part.state?.input])

  // ---- Diff por tool de archivo (write/edit/apply_patch) — estilo VS Code ----
  const metadata = part.state?.metadata
  const fileTool = isFileTool(toolName)
  const fileDiff = useMemo(() => {
    const r = toolPartFileDiff({ tool: toolName, state: part.state })
    return r ? { add: r.additions, del: r.deletions, patch: r.patch } : null
  }, [toolName, part.state])

  const diffPath = useMemo(() => {
    if (!fileTool) return null
    const fd = metadata?.filediff as FileDiff | undefined
    const files = metadata?.files as Array<{ filePath?: string }> | undefined
    const raw = (metadata?.filepath as string | undefined)
      ?? fd?.file
      ?? files?.[0]?.filePath
      ?? part.state?.title
      ?? (part.state?.input as { filePath?: string } | undefined)?.filePath
      ?? filePath
    return raw ? toRelativePath(raw, directory) : null
  }, [fileTool, metadata, part.state?.title, part.state?.input, filePath, directory])

  if (!text && !toolName && !inputText) return null

  // ---- Question tool (interactive) ----
  // El server actual manda el input como objeto (state.input.questions), no
  // como XML <invoke>/<parameter>. Soportar ambas formas; si no, el part cae
  // al render genérico y se ve el JSON crudo (bug reportado).
  {
    const inputQuestions = isQuestionByInput ? (questionInput!.questions as any[]) : null
    if (isQuestionPart) {
      const rawQuestions = inputQuestions ?? extractJSONParam(text ?? "", "questions")
      const answerData = (questionInput as { answers?: unknown } | undefined)?.answers
        ?? extractJSONParam(text ?? "", "answers")
        ?? (part.state?.output != null && typeof part.state.output === "object"
          ? (part.state.output as Record<string, unknown>).answers ?? null
          : null)
      // Respondida = el tool ya completó, trae respuestas no vacías, o fue respondida/saltada localmente o en el store.
      const hasAnswers = answerData != null && answerData !== false
        && !(Array.isArray(answerData) && answerData.length === 0)
      const answered = isDone || hasAnswers || locallyAnswered || isSettled
      const questions = Array.isArray(rawQuestions) ? rawQuestions.filter((q: any) => q?.question) : []
      const effectiveSessionID = part.sessionID ?? sessionID

      if (questions.length > 0 && !answered) {
        // Con questionAuto ON el modal flotante (ChatView) es la única
        // superficie interactiva; acá va un chip compacto para no duplicar.
        if (questionFloating) {
          return (
            <div className="tool-part tool-question waiting" role="status">
              <span className="tool-part-verb">{t('settings.questionPrompt')}</span>
              <span className="tool-part-target">
                <span className="tool-target-text">{questions[0]?.question ?? "question"}</span>
              </span>
            </div>
          )
        }
        return (
          <QuestionPrompt
            questions={questions.map((q: any) => ({
              header: q.header || q.question.slice(0, 30),
              question: q.question,
              options: Array.isArray(q.options) ? q.options : [],
              multiple: q.multiple === true,
              custom: q.custom !== false,
            }))}
            requestID={callID}
            config={config!}
            directory={directory}
            sessionID={effectiveSessionID}
            onDone={(_status, ans) => {
              setLocallyAnswered(true)
              if (ans) setLocalAnswers(ans)
            }}
          />
        )
      }
      if (questions.length > 0 && answered) {
        const storedAns = settledInfo?.answers ?? localAnswers
        const ansText = Array.isArray(answerData)
          ? answerData.map((a: unknown) => Array.isArray(a) ? a.join(", ") : String(a)).filter(Boolean).join(" · ")
          : typeof answerData === "string" && answerData
            ? answerData
            : Array.isArray(storedAns)
              ? storedAns.map((a: unknown) => Array.isArray(a) ? a.join(", ") : String(a)).filter(Boolean).join(" · ")
              : typeof storedAns === "object" && storedAns !== null
                ? Object.values(storedAns).map((v) => Array.isArray(v) ? v.join(", ") : String(v)).filter(Boolean).join(" · ")
                : (settledInfo?.status === "rejected" || (locallyAnswered && !localAnswers))
                  ? (t('settings.questionSkipped') || "Omitida")
                  : ""
        return (
          <div className="tool-part tool-question answered">
            <span className="tool-part-verb">Asked</span>
            <span className="tool-part-target">
              <span className="tool-target-text">{questions[0]?.question ?? "question"}</span>
              {ansText && <span className="tool-target-meta">({ansText.slice(0, 120)})</span>}
            </span>
          </div>
        )
      }
    }
  }

  const subtitle = bashCommand ?? meta?.label ?? null
  const label = toolLabels[part.type] || (toolName ? toolShortLabel(toolName) : "Tool")

  const headerIcon = toolSvgIcon(toolName ?? null)
  // Solo el error lleva icono: el spinner de "trabajando" se fue con el
  // componente (GridSpinner) porque duplicaba el de la caja de actividad del
  // turno, que es el único que dice que algo está pasando.
  const statusIcon = isError
    ? <span className="tool-status-icon tool-error-mark"><CloseIcon size={12} /></span>
    : null

  const antigravityInfo = useMemo(() => {
    const inputObj = (typeof part.state?.input === "object" && part.state?.input !== null)
      ? (part.state.input as Record<string, any>)
      : null
    // Categoria unica (toolName.ts): reemplaza los `includes()` duplicados.
    const kind = toolCategory(toolName)

    // 1. Shell commands (run_command, bash, execute, shell, terminal)
    if (kind === "shell") {
      const cmd = bashCommand || inputObj?.CommandLine || inputObj?.command || inputText
      let displayCmd = typeof cmd === "string" ? cmd.replace(/[\r\n]+/g, " ").trim() : "command"
      displayCmd = truncateAtWord(displayCmd, 95)
      return {
        verb: "Ran",
        icon: null,
        target: <span className="tool-target-text" title={typeof cmd === "string" ? cmd : undefined}>{displayCmd}</span>,
        badge: null,
      }
    }

    // 2. File edit/write (replace_file_content, write_to_file, edit, write, patch, apply_patch)
    if (kind === "edit") {
      const rawPath = inputObj?.TargetFile || inputObj?.filePath || inputObj?.file || inputObj?.path || diffPath || "file"
      const fileName = typeof rawPath === "string" ? rawPath.split(/[/\\]/).pop() || rawPath : "file"
      const add = fileDiff?.add
      const del = fileDiff?.del
      const badge = (add != null || del != null) ? (
        <span className="tool-diff-badge">
          {add != null && add > 0 && <span className="tool-diff-add">+{add}</span>}
          {del != null && del > 0 && <span className="tool-diff-del">-{del}</span>}
        </span>
      ) : null

      return {
        verb: "Edited",
        icon: getAntigravityFileIcon(fileName),
        target: <span className="tool-target-text">{fileName}</span>,
        badge,
      }
    }

    // 3. File read/view (view_file, read, readFile)
    if (kind === "read") {
      const rawPath = inputObj?.AbsolutePath || inputObj?.filePath || inputObj?.file || inputObj?.path || diffPath || "file"
      const fileName = typeof rawPath === "string" ? rawPath.split(/[/\\]/).pop() || rawPath : "file"
      const start = inputObj?.StartLine
      const end = inputObj?.EndLine
      const lineTag = (start != null && end != null) ? `#L${start}-${end}` : (start != null ? `#L${start}` : "")

      return {
        verb: "Analyzed",
        icon: getAntigravityFileIcon(fileName),
        target: (
          <>
            <span className="tool-target-text" title={typeof rawPath === "string" ? rawPath : undefined}>{fileName}</span>
            {lineTag && <span className="tool-target-line">{lineTag}</span>}
          </>
        ),
        badge: null,
      }
    }

    // 4. Search / Grep (grep_search, search_web, search)
    if (kind === "search") {
      const query = inputObj?.Query || inputObj?.query || inputObj?.pattern || inputText
      let resultCountTag: string | null = null
      if (typeof outputHead === "string") {
        const match = outputHead.match(/Found (\d+) matches|(\d+) results/i)
        if (match) resultCountTag = `${match[1] || match[2]} results`
      }
      return {
        verb: "Searched",
        icon: null,
        target: (
          <>
            <span className="tool-target-text">{typeof query === "string" ? query : JSON.stringify(query)}</span>
            {resultCountTag && <span className="tool-target-meta">{resultCountTag}</span>}
          </>
        ),
        badge: null,
      }
    }

    // 5. Explore / Find / List (find_by_name, list_dir)
    if (kind === "explore") {
      let fileCountTag = "files"
      if (typeof outputHead === "string") {
        const match = outputHead.match(/Found (\d+) results|(\d+) matches/i)
        if (match) fileCountTag = `${match[1]} files`
      }
      return {
        verb: "Explored",
        icon: null,
        target: <span className="tool-target-text">{fileCountTag}</span>,
        badge: null,
      }
    }

    // Fallback
    return {
      verb: toolVerb(toolName),
      icon: null,
      target: <span className="tool-target-text">{subtitle || inputText || ""}</span>,
      badge: null,
    }
  }, [toolName, bashCommand, inputText, outputHead, diffPath, fileDiff, subtitle, part.state?.input])

  // El error vive en state.error, no en state.output: si el tool falló, el
  // cuerpo debe mostrar el motivo, no el input repetido.
  const errorText = useMemo(() => formatStateError(part.state?.error), [part.state?.error])

  const body = errorText || ((isDone && outputText) ? outputText : inputText)

  return (
    <div className={`tool-part tool-${toolName ?? "unknown"}${isWorking ? " working" : ""}${isError ? " error" : ""}`}>
      <button
        type="button"
        className="tool-part-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        title={isError && errorText ? errorText.slice(0, 300) : undefined}
      >
        <span className="tool-part-verb">{antigravityInfo.verb}</span>
        {antigravityInfo.icon && <span className="tool-part-icon">{antigravityInfo.icon}</span>}
        <span className="tool-part-target">{antigravityInfo.target}</span>
        {antigravityInfo.badge}
        {statusIcon}
        <span className="tool-part-chevron">{expanded ? "▾" : ">"}</span>
      </button>
      {expanded && (fileDiff?.patch || body) ? (
        <div className="tool-part-body">
          {fileDiff?.patch ? (
            <DiffView patch={fileDiff.patch} annotateFile={diffPath ?? undefined} />
          ) : isError && errorText ? (
            <pre className="tool-part-pre tool-part-error-text">{previewLines(body, 60)}</pre>
          ) : diffPath ? (
            // Archivo analizado/editado: mismos colores del editor, mismo <pre>.
            <pre className="tool-part-pre"><HighlightedCode path={diffPath} code={previewLines(body, 60)} /></pre>
          ) : (
            <pre className="tool-part-pre">{previewLines(body, 60)}</pre>
          )}
        </div>
      ) : null}
    </div>
  )

  if (part.type === "tool_use" && meta) {
    return (
      <CollapsibleSection
        icon={headerIcon}
        title={toolName!}
        subtitle={subtitle ?? undefined}
        filePath={displayFilePath ?? undefined}
        defaultOpen={false}
      >
        <pre className="tool-part-pre">{text}</pre>
      </CollapsibleSection>
    )
  }

  if (part.type === "tool_result" && toolName && toolName !== "task") {
    return (
      <CollapsibleSection
        icon={headerIcon}
        title={`${toolName} result`}
        subtitle={subtitle ?? undefined}
        filePath={displayFilePath ?? undefined}
        defaultOpen={false}
      >
        <pre className="tool-part-pre">{resultText}</pre>
      </CollapsibleSection>
    )
  }

  return (
    <CollapsibleSection
      icon={<ToolIcon size={14} />}
      title={label}
      subtitle={subtitle ?? undefined}
      filePath={displayFilePath ?? undefined}
      defaultOpen={false}
    >
      <pre className="tool-part-pre">{preview}</pre>
    </CollapsibleSection>
  )
})

export default ToolPart
