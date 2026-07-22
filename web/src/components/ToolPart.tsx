import { memo, useMemo, type ReactNode } from "react"
import type { ServerConfig } from "../types"
import { toolMeta, detectToolName, isTaskTool, isQuestionTool } from "../utils/toolMeta"
import { QuestionPrompt } from "./QuestionPrompt"
import { CollapsibleSection } from "./CollapsibleSection"
import { CodeIcon, FileIcon, TerminalIcon, GlobeIcon, SearchIcon, ToolIcon } from "../Icons"

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

export const ToolPart = memo(function ToolPart({ part, config, directory, onViewSubagents }: {
  part: { id: string; type: string; text?: string }
  config?: ServerConfig
  directory?: string
  onViewSubagents?: () => void
}) {
  const text = part.text?.trim()

  const toolName = useMemo(() => detectToolName(text ?? ""), [text])
  const meta = toolName ? toolMeta[toolName] : null
  const filePath = useMemo(() => extractFilePath(text ?? ""), [text])
  const resultText = useMemo(() => getResultText(text ?? ""), [text])
  const preview = useMemo(() => previewLines(meta ? resultText : (text ?? "")), [meta, resultText, text])

  if (!text) return null

  if (isTaskTool(text)) {
    const agentType = extractParam(text, "subagent_type") || "General"
    const description = extractParam(text, "description")
    const sessionID = extractParam(text, "sessionId")
    const isDone = part.type === "tool_result"
    const title = agentType.charAt(0).toUpperCase() + agentType.slice(1)
    const subtitle = description || undefined

    return (
      <div className={`tool-part tool-task${isDone ? "" : " working"}`}>
        <div className="tool-part-toggle" style={{ cursor: "default" }}>
          <span className="tool-part-icon">{isDone ? "✓" : <span className="subagent-spinner" />}</span>
          <span className="tool-part-label" style={{ textTransform: "none" }}>
            {title}{subtitle ? <span className="tool-part-arg"> · {subtitle}</span> : null}
          </span>
          {!isDone && <span className="tool-status-dot" />}
          {sessionID && isDone && onViewSubagents && (
            <button className="tool-part-nav-btn" onClick={(e) => { e.stopPropagation(); onViewSubagents() }}>
              ↳ view
            </button>
          )}
        </div>
      </div>
    )
  }

  if (part.type === "tool_use" && isQuestionTool(text) && text.includes("questions")) {
    const rawQuestions = extractJSONParam(text, "questions")
    const answerData = extractJSONParam(text, "answers")
    const callID = extractParam(text, "callID") || text.match(/callID="([^"]+)"/)?.[1] || part.id
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
          onDone={() => {}}
        />
      )
    }
  }

  const subtitle = meta?.label ?? null

  if (part.type === "tool_use" && meta) {
    return (
      <CollapsibleSection
        icon={toolSvgIcon(toolName)}
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
        icon={toolSvgIcon(toolName)}
        title={`${toolName} result`}
        subtitle={subtitle ?? undefined}
        filePath={filePath ?? undefined}
        defaultOpen={false}
      >
        <pre className="tool-part-pre">{resultText}</pre>
      </CollapsibleSection>
    )
  }

  const label = toolLabels[part.type] || part.type

  if (part.type === "tool") {
    return (
      <CollapsibleSection
        icon={<ToolIcon size={14} />}
        title={label}
        subtitle={meta?.label ? `${toolName}` : undefined}
        filePath={filePath ?? undefined}
        defaultOpen={false}
      >
        <pre className="tool-part-pre">{text}</pre>
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
