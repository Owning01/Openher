import { memo, useState } from "react"
import { useT } from "../i18n-context"
import { CloseIcon } from "../Icons"
import type { PromptSnippet } from "../types"

type Props = {
  snippets: PromptSnippet[]
  onAdd: (name: string, text: string) => void
  onRemove: (id: string) => void
}

export const SnippetManager = memo(function SnippetManager({ snippets, onAdd, onRemove }: Props) {
  const t = useT()
  const [name, setName] = useState("")
  const [text, setText] = useState("")

  const handleAdd = () => {
    onAdd(name, text)
    setName("")
    setText("")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div className="form-field">
        <input className="snippet-input" placeholder={t('settings.snippetName')}
          value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className="snippet-textarea" rows={2} placeholder={t('settings.snippetText')}
          value={text} onChange={(e) => setText(e.target.value)} />
        <button type="button" className="btn-secondary compact" onClick={handleAdd}
          disabled={!name.trim() || !text.trim()}>
          {t('settings.snippetAdd')}
        </button>
      </div>
      {snippets.length === 0 ? (
        <p className="subtle">{t('settings.snippetsEmpty')}</p>
      ) : (
        <div className="snippet-list">
          {snippets.map((s) => (
            <div key={s.id} className="snippet-row">
              <div className="snippet-info">
                <strong>{s.name}</strong>
                <small>{s.text.slice(0, 80)}{s.text.length > 80 ? "…" : ""}</small>
              </div>
              <button type="button" className="btn-icon btn-ghost compact"
                onClick={() => onRemove(s.id)}
                aria-label={t('settings.snippetRemove')} title={t('settings.snippetRemove')}>
                <CloseIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
