import { useState, memo, useMemo } from "react"
import type { ServerConfig } from "../types"
import { toolMeta, detectToolName, isTaskTool, isQuestionTool } from "../utils/toolMeta"
import QuestionPrompt from "./QuestionPrompt"

const toolIcons: Record<string, string> = {
  tool_use: "▶",
  tool_result: "◀",
  execution: "⚙",
  terminal: "▸",
  code_execution: "◇",
  tool_call: "▶",
  tool: "◆",
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

export const ToolPart = memo(function ToolPart({ part, config, directory, onViewSubagents }: {
  part: { id: string; type: string; text?: string }
  config?: ServerConfig
  directory?: string
  onViewSubagents?: () => void
}) {
  const [open, setOpen] = useState(false)
  const text = part.text?.trim()

  const toolName = useMemo(() => detectToolName(text ?? ""), [text])

  if (!text) return null

  if (isTaskTool(text)) {
    const agentType = extractParam(text, "subagent_type") || "General"
    const description = extractParam(text, "description")
    const sessionID = extractParam(text, "sessionId")
    const isDone = part.type === "tool_result"
    const title = agentType.charAt(0).toUpperCase() + agentType.slice(1)
    const subtitle = description ? description : ""

    if (isDone) {
      return (
        <div className="tool-part tool-result tool-task">
          <div className="tool-part-toggle" style={{ cursor: "default" }}>
            <span className="tool-part-icon">{"✓"}</span>
            <span className="tool-part-label" style={{ textTransform: "none" }}>
              {title}{subtitle ? <span className="tool-part-arg"> · {subtitle}</span> : null}
            </span>
            {sessionID && onViewSubagents && (
              <button className="tool-part-nav-btn" onClick={(e) => { e.stopPropagation(); onViewSubagents() }}>
                ↳ view
              </button>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="tool-part tool-task working">
        <div className="tool-part-toggle" style={{ cursor: "default" }}>
          <span className="tool-part-icon">
            <span className="subagent-spinner" />
          </span>
          <span className="tool-part-label" style={{ textTransform: "none" }}>
            {title}{subtitle ? <span className="tool-part-arg"> · {subtitle}</span> : null}
          </span>
          <span className="tool-status-dot" />
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
          onDone={() => setOpen(false)}
        />
      )
    }
  }

  const meta = toolName ? toolMeta[toolName] : null

  // Server format: type === "tool"
  if (part.type === "tool") {
    if (meta && toolName) {
      return (
        <div className={`tool-part tool-${toolName}`}>
          <button className="tool-part-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            <span className="tool-part-icon">{meta.icon}</span>
            <span className="tool-part-label">
              {meta.label}
              {extractParam(text, "filePath") && <span className="tool-part-arg"> {extractParam(text, "filePath")}</span>}
            </span>
            <span className="tool-part-chevron">{open ? "−" : "+"}</span>
          </button>
          {open && (
            <div className="tool-part-body">
              <pre className="tool-part-pre">{text}</pre>
            </div>
          )}
        </div>
      )
    }
    return (
      <div className="tool-part tool-result">
        <button className="tool-part-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span className="tool-part-icon">{"◀"}</span>
          <span className="tool-part-label">Result</span>
          <span className="tool-part-chevron">{open ? "−" : "+"}</span>
        </button>
        {open && (
          <div className="tool-part-body">
            <pre className="tool-part-pre">{getResultText(text)}</pre>
          </div>
        )}
      </div>
    )
  }

  if (meta && part.type === "tool_use") {
    return (
      <div className={`tool-part tool-${toolName}`}>
        <button className="tool-part-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span className="tool-part-icon">{meta.icon}</span>
          <span className="tool-part-label">{meta.label}</span>
          <span className="tool-part-chevron">{open ? "−" : "+"}</span>
        </button>
        {open && (
          <div className="tool-part-body">
            <pre className="tool-part-pre">{text}</pre>
          </div>
        )}
      </div>
    )
  }

  if (part.type === "tool_result" && toolName && toolName !== "task") {
    const resultPreview = getResultText(text)
    return (
      <div className={`tool-part tool-result tool-${toolName}`}>
        <button className="tool-part-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span className="tool-part-icon">{meta?.icon ?? "◀"}</span>
          <span className="tool-part-label">{meta ? `${meta.label} result` : "Tool result"}</span>
          <span className="tool-part-chevron">{open ? "−" : "+"}</span>
        </button>
        {open && (
          <div className="tool-part-body">
            <pre className="tool-part-pre">{resultPreview}</pre>
          </div>
        )}
      </div>
    )
  }

  const icon = toolIcons[part.type] || "◆"
  const label = toolLabels[part.type] || part.type
  const isResult = part.type === "tool_result"

  return (
    <div className={`tool-part ${isResult ? "tool-result" : "tool-call"}`}>
      <button className="tool-part-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="tool-part-icon">{icon}</span>
        <span className="tool-part-label">{label}</span>
        <span className="tool-part-chevron">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="tool-part-body">
          <pre className="tool-part-pre">{text}</pre>
        </div>
      )}
    </div>
  )
})

export default ToolPart
