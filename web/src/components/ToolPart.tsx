import { memo, useMemo, useState, useEffect, type ReactNode } from "react"
import type { ServerConfig, FileDiff } from "../types"
import { toolMeta, detectToolName, isTaskTool, isQuestionTool } from "../utils/toolMeta"
import { api } from "../api"
import { QuestionPrompt } from "./QuestionPrompt"
import { CollapsibleSection } from "./CollapsibleSection"
import { GridSpinner } from "./GridSpinner"
import { DiffView, parseDiffStat, synthesizeWritePatch } from "./DiffView"
import { useT } from "../i18n-context"
import { CodeIcon, FileIcon, SearchIcon, GlobeIcon, CloseIcon, ToolIcon } from "../Icons"
import { Markdown } from "./Markdown"
import { ThinkingBlock } from "./ThinkingBlock"
import { computeRenderedMessages } from "../utils/rendered"

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

const FILE_TOOLS = new Set(["write", "edit", "apply_patch", "patch"])

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
  switch (toolName) {
    case "bash":
    case "execute":
    case "shell":
    case "terminal":
      return <span className="tool-icon-shell">&lt;&gt;</span>
    case "read":
    case "readFile":
      return <FileIcon size={size} />
    case "write":
    case "edit":
    case "apply_patch":
    case "patch":
      return <CodeIcon size={size} />
    case "grep":
    case "glob":
    case "search":
      return <SearchIcon size={size} />
    case "websearch":
    case "webfetch":
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

function toRelativePath(fullPath: string, baseDir?: string): string {
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
  const lines = text.split("\n")
  if (lines.length <= maxLines) return text
  return lines.slice(0, maxLines).join("\n") + "\n..."
}

function shortToolLabel(tool: string): string {
  if (tool === "bash" || tool === "execute" || tool === "shell" || tool === "terminal") return "SHELL"
  if (tool === "read" || tool === "readFile") return "READ"
  if (tool === "write" || tool === "writeFile") return "WRITE"
  if (tool === "edit" || tool === "apply_patch" || tool === "patch") return "EDIT"
  if (tool === "grep" || tool === "glob" || tool === "search") return "SEARCH"
  if (tool === "websearch" || tool === "webfetch" || tool === "browse") return "BROWSER"
  const m = tool.match(/mcp__([^_]+)__(.+)/)
  if (m) return `${m[1].toUpperCase()} · ${m[2]}`
  return tool.toUpperCase()
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
        const displayV = (k === "filePath" || k === "file" || k === "path" || k === "filepath" || k === "workdir" || k === "directory") && baseDir ? toRelativePath(v, baseDir) : v
        lines.push(displayV.includes("\n") ? `${k}:\n${displayV}` : `${k}: ${displayV}`); continue }
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

function SubagentTaskCard({
  part,
  config,
  directory,
  onViewSubagents,
  isDone,
  isError,
  t,
}: {
  part: ToolPartData
  config?: ServerConfig
  directory?: string
  onViewSubagents?: (subagentID?: string) => void
  isDone: boolean
  isError: boolean
  t: (key: any, vars?: any) => string
}) {
  const [expanded, setExpanded] = useState(false)
  const [subMessages, setSubMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(null)

  const agentType = ((part.state?.input as { subagent_type?: string } | undefined)?.subagent_type
    ?? extractParam(part.text ?? "", "subagent_type"))
    || "General"
  const description = (part.state?.input as { description?: string } | undefined)?.description
    ?? extractParam(part.text ?? "", "description")
  const prompt = (part.state?.input as { prompt?: string } | undefined)?.prompt
    ?? extractParam(part.text ?? "", "prompt")
  const rawOutput = (part.state?.output as string | undefined) ?? getResultText(part.text ?? "")

  const title = agentType.charAt(0).toUpperCase() + agentType.slice(1)
  const subtitle = description || prompt || undefined

  // Carga mensajes de la sesión del subagente al expandir
  useEffect(() => {
    if (!expanded || !config) return
    let cancelled = false
    setLoadingMessages(true)

    const fetchSubMessages = async () => {
      // 1. Extraer ID de la sesión hija desde input, metadata, output o texto
      const input = part.state?.input as Record<string, unknown> | undefined
      const meta = part.state?.metadata as Record<string, unknown> | undefined
      const outObj = (typeof part.state?.output === "object" ? part.state.output : null) as Record<string, unknown> | null

      let sId: string | undefined = (input?.sessionId as string)
        ?? (input?.sessionID as string)
        ?? (meta?.sessionId as string)
        ?? (meta?.sessionID as string)
        ?? (outObj?.sessionId as string)
        ?? (outObj?.sessionID as string)
        ?? (outObj?.id as string)

      if (!sId) {
        const textSource = `${part.text ?? ""} ${typeof part.state?.output === "string" ? part.state.output : ""} ${rawOutput}`
        const match = textSource.match(/\b(ses_[a-zA-Z0-9_-]+)\b/i) || textSource.match(/session(?:Id|ID)?["':=\s]+([a-zA-Z0-9_-]{6,})/i)
        if (match && match[1]) sId = match[1]
      }

      // 2. Si no viene en los datos, buscar en las sesiones hijas del server
      if (!sId && part.sessionID) {
        try {
          const sessions = await api.listSessions(config, directory)
          const child = sessions.find((s) => s.parentID === part.sessionID)
          if (child) sId = child.id
        } catch {}
      }

      // 3. Fallback a part.sessionID si no hay otra opción
      if (!sId && part.sessionID) {
        sId = part.sessionID
      }

      if (!sId) {
        if (!cancelled) setLoadingMessages(false)
        return
      }

      setResolvedSessionId(sId)

      try {
        const msgs = await api.loadMessages(config, sId, directory)
        if (!cancelled) {
          setSubMessages(Array.isArray(msgs) ? msgs : [])
        }
      } catch {}
      if (!cancelled) setLoadingMessages(false)
    }

    void fetchSubMessages()
    return () => { cancelled = true }
  }, [expanded, config, part, rawOutput, directory])

  // Computa los mensajes renderizados del subagente (reusando computeRenderedMessages)
  const renderedSubMessages = useMemo(() => {
    if (!subMessages || subMessages.length === 0) return []
    return computeRenderedMessages(subMessages, undefined, new Map()).out
  }, [subMessages])

  return (
    <div className={`subagent-task-card${expanded ? " is-expanded" : ""}${isDone ? "" : " working"}`}>
      <div
        className="subagent-task-header"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
      >
        <div className="subagent-task-left">
          <span className="subagent-task-badge">
            <ToolIcon size={12} />
            {title}
          </span>
          <span className="subagent-task-title" title={subtitle || title}>
            {subtitle || title}
          </span>
        </div>
        <div className="subagent-task-right">
          <span className="subagent-task-status">
            {isDone ? (
              isError ? <span style={{ color: "var(--danger)" }}> Error</span> : <span style={{ color: "var(--success)" }}> Completado</span>
            ) : (
              <><GridSpinner label={title} size={14} /><span style={{ color: "var(--accent)" }}>En progreso...</span></>
            )}
          </span>
          <span className="subagent-expand-chevron" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease", fontSize: "12px", color: "var(--text-muted)" }}>
            ▼
          </span>
        </div>
      </div>

      {expanded && (
        <div className="subagent-task-window">
          {prompt && (
            <div className="subagent-section-block">
              <div className="subagent-section-title">
                <span style={{ color: "var(--info)", display: "inline-flex" }}><CodeIcon size={13} /></span>
                <span>Objetivo / Prompt</span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text)" }}>
                <Markdown text={prompt} />
              </div>
            </div>
          )}

          {loadingMessages && renderedSubMessages.length === 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", padding: "8px 0" }}>
              <GridSpinner label="Cargando detalles" size={14} />
              <span>Cargando acciones y mensajes del subagente...</span>
            </div>
          )}

          {renderedSubMessages.length > 0 && (
            <div className="subagent-inner-session" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {renderedSubMessages.map((msg) => (
                <div key={msg.info.id} className={`subagent-inner-bubble ${msg.info.role}`}>
                  {msg.thinkingParts && msg.thinkingParts.length > 0 && (
                    <ThinkingBlock parts={msg.thinkingParts} defaultOpen={false} />
                  )}
                  {msg.toolParts && msg.toolParts.map((tp) => (
                    <ToolPart
                      key={tp.id}
                      part={tp}
                      config={config}
                      directory={directory}
                      onViewSubagents={onViewSubagents}
                    />
                  ))}
                  {msg.text && (
                    <div style={{ padding: "4px 0", fontSize: "0.82rem", color: "var(--text)" }}>
                      <Markdown text={msg.text} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {renderedSubMessages.length === 0 && !loadingMessages && rawOutput && rawOutput !== prompt && (
            <div className="subagent-section-block">
              <div className="subagent-section-title">
                <span>Resultado</span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text)" }}>
                <Markdown text={rawOutput} />
              </div>
            </div>
          )}

          {renderedSubMessages.length === 0 && !loadingMessages && (!rawOutput || rawOutput === prompt) && !prompt && (
            <div style={{ color: "var(--muted)", fontStyle: "italic", fontSize: "0.78rem" }}>
              Sin mensajes adicionales registrados para este subagente.
            </div>
          )}

          {resolvedSessionId && onViewSubagents && (
            <div className="subagent-task-footer">
              <button
                type="button"
                className="btn-secondary compact"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewSubagents(resolvedSessionId)
                }}
                title={t('toolpart.viewSubagent') || "Abrir sesión dedicada"}
              >
                {t('toolpart.viewSubagent') || "Ver sesión completa →"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
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

export const ToolPart = memo(function ToolPart({ part, config, directory, onViewSubagents, compact: _compact }: {
  part: ToolPartData
  config?: ServerConfig
  directory?: string
  onViewSubagents?: (subagentID?: string) => void
  compact?: boolean
}) {
  const t = useT()
  const text = part.text?.trim()
  const [expanded, setExpanded] = useState(false)

  const toolName = useMemo(() => part.tool ?? detectToolName(text ?? ""), [part.tool, text])
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

  const outputText = useMemo(() => {
    if (part.state?.output != null) return formatInput(part.state.output, directory)
    return resultText
  }, [part.state?.output, resultText, directory])

  // Comandos de terminal: muestran el command en la línea del toggle (visible
  // sin expandir) y la salida al expandir.
  const isShellTool = toolName === "bash" || toolName === "execute" || toolName === "terminal" || toolName === "shell"
  const bashCommand = useMemo(() => {
    if (!isShellTool) return null
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
  }, [isShellTool, part.state?.input])

  // ---- Diff por tool de archivo (write/edit/apply_patch) ----
  const metadata = part.state?.metadata
  const isFileTool = toolName ? FILE_TOOLS.has(toolName) : false
  const fileDiff = useMemo(() => {
    if (!isFileTool || !toolName) return null
    const input = part.state?.input as { content?: string; filePath?: string } | string | null | undefined
    if (toolName === "edit") {
      const fd = metadata?.filediff as FileDiff | undefined
      if (fd?.patch) return { add: fd.additions ?? parseDiffStat(fd.patch).add, del: fd.deletions ?? parseDiffStat(fd.patch).del, patch: fd.patch }
      const diff = metadata?.diff as string | undefined
      if (diff) { const st = parseDiffStat(diff); return { add: st.add, del: st.del, patch: diff } }
      return null
    }
    if (toolName === "apply_patch" || toolName === "patch") {
      const files = metadata?.files as Array<{ additions?: number; deletions?: number }> | undefined
      const diff = metadata?.diff as string | undefined
      let add = 0
      let del = 0
      if (Array.isArray(files)) {
        for (const f of files) { add += f.additions ?? 0; del += f.deletions ?? 0 }
      } else if (diff) {
        const st = parseDiffStat(diff); add = st.add; del = st.del
      }
      return add || del ? { add, del, patch: diff } : null
    }
    const content = typeof input === "string" ? input : input?.content
    if (typeof content === "string" && content.length > 0) {
      return { add: content.split("\n").length, del: 0, patch: synthesizeWritePatch(content) }
    }
    return null
  }, [isFileTool, toolName, metadata, part.state?.input])

  const diffPath = useMemo(() => {
    if (!isFileTool) return null
    const fd = metadata?.filediff as FileDiff | undefined
    const files = metadata?.files as Array<{ filePath?: string }> | undefined
    const raw = (metadata?.filepath as string | undefined)
      ?? fd?.file
      ?? files?.[0]?.filePath
      ?? part.state?.title
      ?? (part.state?.input as { filePath?: string } | undefined)?.filePath
      ?? filePath
    return raw ? toRelativePath(raw, directory) : null
  }, [isFileTool, metadata, part.state?.title, part.state?.input, filePath, directory])

  if (!text && !toolName && !inputText) return null

  // ---- Task (subagent) tool ----
  if (isTaskTool(text ?? "") || toolName === "task") {
    return (
      <SubagentTaskCard
        part={part}
        config={config}
        directory={directory}
        onViewSubagents={onViewSubagents}
        isDone={isDone}
        isError={isError}
        t={t}
      />
    )
  }

  // ---- Question tool (interactive) ----
  if ((part.type === "tool_use" || toolName === "question") && isQuestionTool(text ?? "")) {
    const rawQuestions = extractJSONParam(text ?? "", "questions")
    const answerData = extractJSONParam(text ?? "", "answers")
    const callID = extractParam(text ?? "", "callID") || text?.match(/callID="([^"]+)"/)?.[1] || part.callID || part.id
    const questions = Array.isArray(rawQuestions) ? rawQuestions.filter((q: any) => q?.question) : []

    if (questions.length > 0 && !answerData) {
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
          sessionID={part.sessionID}
          onDone={() => {}}
        />
      )
    }
  }

  const subtitle = bashCommand ?? meta?.label ?? null
  const label = toolLabels[part.type] || (toolName ? shortToolLabel(toolName) : "Tool")

  const headerIcon = toolSvgIcon(toolName ?? null)
  const statusIcon = isWorking
    ? <GridSpinner label={label} size={14} />
    : isError ? <span className="tool-status-icon tool-error-mark"><CloseIcon size={12} /></span>
    : null

  const antigravityInfo = useMemo(() => {
    const norm = (toolName || "").toLowerCase()
    const inputObj = (typeof part.state?.input === "object" && part.state?.input !== null)
      ? (part.state.input as Record<string, any>)
      : null

    // 1. Shell commands (run_command, bash, execute, shell, terminal)
    if (isShellTool || norm.includes("command") || norm.includes("bash") || norm.includes("shell") || norm.includes("execute")) {
      const cmd = bashCommand || inputObj?.CommandLine || inputObj?.command || inputText
      let displayCmd = typeof cmd === "string" ? cmd.replace(/[\r\n]+/g, " ").trim() : "command"
      if (displayCmd.length > 95) {
        displayCmd = displayCmd.slice(0, 92) + "..."
      }
      return {
        verb: "Ran",
        icon: null,
        target: <span className="tool-target-text" title={typeof cmd === "string" ? cmd : undefined}>{displayCmd}</span>,
        badge: null,
      }
    }

    // 2. File edit/write (replace_file_content, write_to_file, edit, write, patch, apply_patch)
    if (norm.includes("replace") || norm.includes("write") || norm.includes("edit") || norm.includes("patch")) {
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
    if (norm.includes("view") || norm.includes("read")) {
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
            <span className="tool-target-text">{fileName}</span>
            {lineTag && <span className="tool-target-line">{lineTag}</span>}
          </>
        ),
        badge: null,
      }
    }

    // 4. Search / Grep (grep_search, search_web, search)
    if (norm.includes("search") || norm.includes("grep")) {
      const query = inputObj?.Query || inputObj?.query || inputObj?.pattern || inputText
      let resultCountTag: string | null = null
      if (typeof outputText === "string") {
        const match = outputText.match(/Found (\d+) matches|(\d+) results/i)
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
    if (norm.includes("find") || norm.includes("list") || norm.includes("dir")) {
      let fileCountTag = "files"
      if (typeof outputText === "string") {
        const match = outputText.match(/Found (\d+) results|(\d+) matches/i)
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
      verb: toolName ? shortToolLabel(toolName) : "Tool",
      icon: null,
      target: <span className="tool-target-text">{subtitle || inputText || ""}</span>,
      badge: null,
    }
  }, [toolName, isShellTool, bashCommand, inputText, outputText, diffPath, fileDiff, subtitle, part.state?.input])

  const body = (isDone && outputText) ? outputText : inputText

  return (
    <div className={`tool-part tool-${toolName ?? "unknown"}${isWorking ? " working" : ""}${isError ? " error" : ""}`}>
      <button
        type="button"
        className="tool-part-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
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
            <DiffView patch={fileDiff.patch} />
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
