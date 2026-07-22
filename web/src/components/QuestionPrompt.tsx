import { memo, useState, useCallback } from "react"
import { api } from "../api"
import { useT } from "../i18n-context"
import type { ServerConfig } from "../types"

type QuestionItem = {
  header: string
  question: string
  options: { label: string; description?: string }[]
  multiple: boolean
  custom: boolean
}

type Props = {
  questions: QuestionItem[]
  requestID: string
  config: ServerConfig
  directory?: string
  onDone: () => void
}

export const QuestionPrompt = memo(function QuestionPrompt({ questions, requestID, config, directory, onDone }: Props) {
  const t = useT()
  const [selected, setSelected] = useState<Record<number, string[]>>({})
  const [customs, setCustoms] = useState<Record<number, string>>({})
  const [sending, setSending] = useState(false)

  const handleToggle = useCallback((qIdx: number, label: string) => {
    setSelected((prev) => {
      const current = prev[qIdx] ?? []
      if (current.includes(label)) {
        return { ...prev, [qIdx]: current.filter((l) => l !== label) }
      }
      if (questions[qIdx]?.multiple) {
        return { ...prev, [qIdx]: [...current, label] }
      }
      return { ...prev, [qIdx]: [label] }
    })
  }, [questions])

  const handleCustomChange = useCallback((qIdx: number, value: string) => {
    setCustoms((prev) => ({ ...prev, [qIdx]: value }))
  }, [])

  const handleSend = useCallback(async () => {
    setSending(true)
    const answers: string[][] = questions.map((_, i) => {
      const sel = selected[i] ?? []
      const custom = customs[i] ?? ""
      return custom ? [...sel, custom] : sel
    })
    try {
      await api.questionReply(config, requestID, answers, directory)
      onDone()
    } catch {
      setSending(false)
    }
  }, [questions, selected, customs, config, requestID, directory, onDone])

  const handleSkip = useCallback(async () => {
    setSending(true)
    try {
      await api.questionReject(config, requestID, directory)
      onDone()
    } catch {
      setSending(false)
    }
  }, [config, requestID, directory, onDone])

  return (
    <div className="question-overlay" onClick={onDone}>
      <div className="question-card" onClick={(e) => e.stopPropagation()}>
        <div className="question-card-header">
          <strong>{t('detail.questionTitle')}</strong>
        </div>
        {questions.map((q, qi) => (
          <div key={qi} className="question-row">
            <p className="question-label">{q.question}</p>
            {q.options.length > 0 && (
              <div className="question-options">
                {q.options.map((opt) => {
                  const isActive = (selected[qi] ?? []).includes(opt.label)
                  return (
                    <button
                      key={opt.label}
                      className={`question-option${isActive ? " active" : ""}`}
                      onClick={() => handleToggle(qi, opt.label)}
                    >
                      {opt.label}
                      {opt.description && <span className="question-opt-desc">{opt.description}</span>}
                    </button>
                  )
                })}
              </div>
            )}
            {q.custom && (
              <input
                className="question-custom"
                type="text"
                placeholder={t('detail.questionCustomPlaceholder')}
                value={customs[qi] ?? ""}
                onChange={(e) => handleCustomChange(qi, e.target.value)}
              />
            )}
          </div>
        ))}
        <div className="question-actions">
          <button className="btn btn-secondary" onClick={handleSkip} disabled={sending}>
            {t('detail.questionSkip')}
          </button>
          <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
            {t('detail.questionSend')}
          </button>
        </div>
      </div>
    </div>
  )
})
