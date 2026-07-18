import { memo, type ComponentProps } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { RenderedMessage } from "../types"
import { useT } from "../i18n-context"

function normalizeMessageMarkdown(text: string): string {
  return text.includes("\n") ? text : text.replace(/\s-\s(?=\S)/g, "\n- ")
}

function formatTime(epoch: number): string {
  if (!epoch) return "-"
  return new Date(epoch).toLocaleString()
}

function Table({ children }: ComponentProps<"table">) {
  return (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  )
}

const components = {
  table: Table
}

export const MessageBubble = memo(function MessageBubble({ message }: { message: RenderedMessage }) {
  const t = useT()
  return (
    <article className={`message ${message.info.role} fade-in`}>
      <header>
        <strong>
          {message.info.role === "user" ? t('detail.you') : t('detail.opencode')}
        </strong>
        <small>{formatTime(message.info.time.created)}</small>
      </header>
      <div className="message-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {normalizeMessageMarkdown(message.text)}
        </ReactMarkdown>
      </div>
    </article>
  )
})
