import { memo, useMemo, useState, useEffect, type ReactNode } from "react"
import type { ServerConfig, FileDiff } from "../types"
import { toolMeta, detectToolName, isTaskTool, isQuestionTool } from "../utils/toolMeta"
import { api } from "../api"
import { QuestionPrompt } from "./QuestionPrompt"
import { CollapsibleSection } from "./CollapsibleSection"
import { GridSpinner } from "./GridSpinner"
import { DiffView, parseDiffStat, synthesizeWritePatch } from "./DiffView"
import { useT } from "../i18n-context"
import { CodeIcon, FileIcon, TerminalIcon, GlobeIcon, SearchIcon, ToolIcon, BrainIcon } from "../Icons"

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
  const size = 14
  switch (toolName) {
    case "write": case "edit": case "apply_patch": return <CodeIcon size={size} />
    case "read": return <FileIcon size={size} />
    case "bash": case "execute": return <TerminalIcon size={size} />
    case "grep": case "glob": return <SearchIcon size={size} />
    case "websearch": case "webfetch": return <GlobeIcon size={size} />
    default: return <CodeIcon size={size} />
  }
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

function previewLines(text: string, maxLines = 5): string {
  const lines = text.split("\n")
  if (lines.length <= maxLines) return text
  return lines.slice(0, maxLines).join("\n") + "\n..."
}

function shortToolLabel(tool: string): string {
  const m = tool.match(/mcp__([^_]+)__(.+)/)
  if (m) return `mcp · ${m[1]} · ${m[2]}`
  return tool
}

function formatInput(input: unknown): string {
  if (input == null) return ""
  if (typeof input === "string") return input
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

  const agentType = ((part.state?.input as { subagent_type?: string } | undefined)?.subagent_type
    ?? extractParam(part.text ?? "", "subagent_type"))
    || "General"
  const description = (part.state?.input as { description?: string } | undefined)?.description
    ?? extractParam(part.text ?? "", "description")
  const prompt = (part.state?.input as { prompt?: string } | undefined)?.prompt
    ?? extractParam(part.text ?? "", "prompt")
  const sessionID = (part.state?.input as { sessionId?: string } | undefined)?.sessionId
    ?? extractParam(part.text ?? "", "sessionId")
    ?? part.sessionID
  const rawOutput = (part.state?.output as string | undefined) ?? getResultText(part.text ?? "")

  const title = agentType.charAt(0).toUpperCase() + agentType.slice(1)
  const subtitle = description || prompt || undefined

  // Carga mensajes de la sesión del subagente al expandir
  useEffect(() => {
    if (!expanded || !config || !sessionID) return
    let cancelled = false
    setLoadingMessages(true)
    api.loadMessages(config, sessionID, directory).then((msgs: any) => {
      if (cancelled) return
      setSubMessages(Array.isArray(msgs) ? msgs : [])
      setLoadingMessages(false)
    }).catch(() => {
      if (cancelled) return
      setLoadingMessages(false)
    })
    return () => { cancelled = true }
  }, [expanded, config, sessionID, directory])

  // Extraer thinking, tools, y respuestas de los mensajes del subagente
  const parsedItems = useMemo(() => {
    const items: Array<{ type: "prompt" | "thinking" | "tool" | "message"; title?: string; content: string }> = []
    
    if (prompt) {
      items.push({ type: "prompt", title: "Objetivo / Prompt", content: prompt })
    }

    if (subMessages.length > 0) {
      for (const m of subMessages) {
        if (m.parts && Array.isArray(m.parts)) {
          for (const p of m.parts) {
            if (p.type === "reasoning" || p.type === "thinking") {
              if (p.text?.trim()) {
                items.push({ type: "thinking", title: "Thinking", content: p.text.trim() })
              }
            } else if (p.type === "tool" || p.type.startsWith("tool_") || p.tool) {
              const tName = p.tool || detectToolName(p.text ?? "") || "action"
              const tInput = formatInput(p.state?.input ?? extractParam(p.text ?? "", "input"))
              const tOut = formatInput(p.state?.output ?? extractParam(p.text ?? "", "output") ?? p.text)
              items.push({
                type: "tool",
                title: `${tName.toUpperCase()}`,
                content: [tInput, tOut].filter(Boolean).join("\n→ "),
              })
            } else if (p.type === "text" && p.text?.trim()) {
              items.push({ type: "message", title: m.info?.role === "user" ? "User" : "Agent", content: p.text.trim() })
            }
          }
        } else if (m.text?.trim()) {
          items.push({ type: "message", title: m.info?.role === "user" ? "User" : "Agent", content: m.text.trim() })
        }
      }
    } else if (rawOutput && rawOutput !== prompt) {
      items.push({ type: "message", title: "Resultado", content: rawOutput })
    }

    return items
  }, [prompt, subMessages, rawOutput])

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
              isError ? <span style={{ color: "var(--danger)" }}>✗ Error</span> : <span style={{ color: "var(--success)" }}>✓ Completado</span>
            ) : (
              <><GridSpinner label={title} size={14} /><span style={{ color: "var(--accent)" }}>En progreso...</span></>
            )}
          </span>
          <span className="subagent-expand-chevron" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease", fontSize: "10px", color: "var(--text-muted)" }}>
            ▼
          </span>
        </div>
      </div>

      {expanded && (
        <div className="subagent-task-window">
          {loadingMessages && subMessages.length === 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", padding: "8px 0" }}>
              <GridSpinner label="Cargando detalles" size={14} />
              <span>Cargando acciones y mensajes del subagente...</span>
            </div>
          )}

          {parsedItems.map((item, idx) => (
            <div key={idx} className="subagent-section-block">
              <div className="subagent-section-title">
                {item.type === "thinking" && <span style={{ color: "var(--accent)", display: "inline-flex" }}><BrainIcon size={13} /></span>}
                {item.type === "tool" && <span style={{ color: "var(--primary)", display: "inline-flex" }}><TerminalIcon size={13} /></span>}
                {item.type === "prompt" && <span style={{ color: "var(--info)", display: "inline-flex" }}><CodeIcon size={13} /></span>}
                <span>{item.title}</span>
              </div>
              {item.type === "thinking" ? (
                <div className="subagent-thinking-box">{item.content}</div>
              ) : item.type === "tool" ? (
                <div className="subagent-action-item">{item.content}</div>
              ) : (
                <div style={{ whiteSpace: "pre-wrap", fontSize: "0.8rem", color: "var(--text)" }}>
                  {item.content}
                </div>
              )}
            </div>
          ))}

          {parsedItems.length === 0 && !loadingMessages && (
            <div style={{ color: "var(--muted)", fontStyle: "italic", fontSize: "0.78rem" }}>
              Sin mensajes adicionales registrados para este subagente.
            </div>
          )}

          {sessionID && onViewSubagents && (
            <div className="subagent-task-footer">
              <button
                type="button"
                className="btn-secondary compact"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewSubagents(sessionID)
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

export const ToolPart = memo(function ToolPart({ part, config, directory, onViewSubagents, compact }: {
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
  const resultText = useMemo(() => getResultText(text ?? ""), [text])
  const preview = useMemo(() => previewLines(meta ? resultText : (text ?? "")), [meta, resultText, text])

  const status = part.state?.status ?? (part.type === "tool_result" ? "completed" : part.type === "tool_use" ? "running" : undefined)
  const isWorking = status === "pending" || status === "running"
  const isError = status === "error"
  const isDone = status === "completed" || status === "error"

  const inputText = useMemo(() => {
    if (part.state?.input != null) return formatInput(part.state.input)
    return text ?? ""
  }, [part.state?.input, text])

  const outputText = useMemo(() => {
    if (part.state?.output != null) return formatInput(part.state.output)
    return resultText
  }, [part.state?.output, resultText])

  // Comandos de terminal: muestran el command en la línea del toggle (visible
  // sin expandir) y la salida al expandir.
  const isShellTool = toolName === "bash" || toolName === "execute" || toolName === "terminal" || toolName === "shell"
  const bashCommand = useMemo(() => {
    if (!isShellTool) return null
    const input = part.state?.input
    if (input && typeof input === "object" && "command" in input) {
      const cmd = (input as { command?: string }).command
      if (typeof cmd === "string" && cmd.trim()) return cmd.trim().slice(0, 80)
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
    return (metadata?.filepath as string | undefined)
      ?? fd?.file
      ?? files?.[0]?.filePath
      ?? part.state?.title
      ?? (part.state?.input as { filePath?: string } | undefined)?.filePath
      ?? filePath
  }, [isFileTool, metadata, part.state?.title, part.state?.input, filePath])

  const fileActionLabel = useMemo(() => {
    if (!isFileTool || !toolName) return null
    const verb = toolName === "edit" ? t('toolpart.edited') : toolName === "write" ? t('toolpart.wrote') : t('toolpart.patched')
    return diffPath ? `${verb} ${diffPath}` : verb
  }, [isFileTool, toolName, diffPath, t])

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
    : isError ? <span className="tool-status-icon tool-error-mark">✗</span>
    : isDone ? <span className="tool-status-icon tool-ok-mark">✓</span>
    : null

  const title = toolName ? shortToolLabel(toolName) : label
  const body = (isDone && outputText) ? outputText : inputText

  // Modo compacto (toggle "tools compactos" o dataMode ultra/miser): una sola
  // línea con icono + nombre + estado, sin botón de expandir.
  if (compact) {
    return (
      <div className={`tool-part tool-part-minimal tool-${toolName ?? "unknown"}${isWorking ? " working" : ""}${isError ? " error" : ""}`}>
        <div className="tool-part-toggle" style={{ cursor: "default" }}>
          <span className="tool-part-icon">{headerIcon}</span>
          <span className="tool-part-label">
            {title}
            {subtitle && !bashCommand ? <span className="tool-part-arg"> · {subtitle}</span> : null}
            {bashCommand ? <span className="tool-part-arg"> · {bashCommand}</span> : null}
          </span>
          {statusIcon}
        </div>
      </div>
    )
  }

  if (part.type === "tool" || part.tool) {
    if (isFileTool && fileDiff) {
      const showBody = !compact
      return (
        <div className={`tool-part tool-${toolName}${isWorking ? " working" : ""}${isError ? " error" : ""}`}>
          <button
            type="button"
            className="tool-part-toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={showBody ? expanded : undefined}
            disabled={!showBody}
          >
            <span className="tool-part-icon">{headerIcon}</span>
            <span className="tool-part-label">
              {fileActionLabel}
            </span>
            <DiffStatBadge add={fileDiff.add} del={fileDiff.del} />
            {statusIcon}
            {showBody && <span className="tool-part-chevron">{expanded ? "▾" : "▸"}</span>}
          </button>
          {showBody && expanded && fileDiff.patch ? (
            <div className="tool-part-body">
              <DiffView patch={fileDiff.patch} />
            </div>
          ) : null}
        </div>
      )
    }
    return (
      <div className={`tool-part tool-${toolName ?? "unknown"}${isWorking ? " working" : ""}${isError ? " error" : ""}`}>
        <button
          type="button"
          className="tool-part-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span className="tool-part-icon">{headerIcon}</span>
          <span className="tool-part-label">
            {title}
            {subtitle ? <span className="tool-part-arg"> · {subtitle}</span> : null}
          </span>
          {statusIcon}
          <span className="tool-part-chevron">{expanded ? "▾" : "▸"}</span>
        </button>
        {expanded && body ? (
          <div className="tool-part-body">
            <pre className="tool-part-pre">{previewLines(body, 60)}</pre>
          </div>
        ) : null}
      </div>
    )
  }

  if (part.type === "tool_use" && meta) {
    return (
      <CollapsibleSection
        icon={headerIcon}
        title={toolName!}
        subtitle={subtitle ?? undefined}
        filePath={filePath ?? undefined}
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
        filePath={filePath ?? undefined}
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
      filePath={filePath ?? undefined}
      defaultOpen={false}
    >
      <pre className="tool-part-pre">{preview}</pre>
    </CollapsibleSection>
  )
})

export default ToolPart
