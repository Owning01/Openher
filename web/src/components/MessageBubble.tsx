import { memo, type ComponentProps } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { LogoIcon } from "../Icons"
import { formatTime } from "../utils"
import type { RenderedMessage } from "../types"
import { useT } from "../i18n-context"

function normalizeMessageMarkdown(text: string): string {
  return text.includes("\n") ? text : text.replace(/\s-\s(?=\S)/g, "\n- ")
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
          {message.info.role === "user" ? t('detail.you') : <><LogoIcon size={18} /> {t('detail.opencode')}</>}
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

export default MessageBubble
