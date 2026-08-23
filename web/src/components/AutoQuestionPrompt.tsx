import { memo, useCallback, useState } from "react"
import { useT } from "../i18n-context"
import type { Question, QuestionInfo } from "../types"

type Props = {
  question: Question
  onReply: (requestID: string, answers: string[][]) => void
  onReject: (requestID: string) => void
  onDismiss: () => void
}

export const AutoQuestionPrompt = memo(function AutoQuestionPrompt({ question, onReply, onReject, onDismiss }: Props) {
  const t = useT()
  const infos: QuestionInfo[] = question.questions && question.questions.length > 0
    ? question.questions
    : (question.question ? [{ question: question.question, header: "", options: [], custom: true }] : [])
  const [selected, setSelected] = useState<Record<number, string[]>>({})
  const [customs, setCustoms] = useState<Record<number, string>>({})

  const handleToggle = useCallback((qi: number, label: string) => {
    setSelected((prev) => {
      const current = prev[qi] ?? []
      if (current.includes(label)) {
        return { ...prev, [qi]: current.filter((l) => l !== label) }
      }
      if (infos[qi]?.multiple) {
        return { ...prev, [qi]: [...current, label] }
      }
      return { ...prev, [qi]: [label] }
    })
  }, [infos])

  const handleSubmit = useCallback(() => {
    const answers: string[][] = infos.map((_, i) => {
      const sel = selected[i] ?? []
      const custom = customs[i] ?? ""
      return custom ? [...sel, custom] : sel
    })
    onReply(question.id, answers)
    onDismiss()
  }, [infos, selected, customs, question.id, onReply, onDismiss])

  const handleReject = useCallback(() => {
    onReject(question.id)
    onDismiss()
  }, [question.id, onReject, onDismiss])

  if (infos.length === 0) return null

  return (
    <div className="question-overlay">
      <div className="question-card" role="dialog" aria-label={t('settings.questionPrompt')}>
        <div className="question-card-header">
          <strong>{t('settings.questionPrompt')}</strong>
          <button className="btn-icon btn-ghost" onClick={onDismiss} aria-label={t('session.cancel')}>×</button>
        </div>
        <div className="question-card-body">
          {infos.map((q, qi) => (
            <div key={qi} className="question-row">
              <p className="question-text">{q.question}</p>
              {q.options.length > 0 && (
                <div className="question-options">
                  {q.options.map((opt) => {
                    const isActive = (selected[qi] ?? []).includes(opt.label)
                    return (
                      <button key={opt.label} type="button"
                        className={`question-option${isActive ? " picked" : ""}`}
                        onClick={() => handleToggle(qi, opt.label)}>
                        <span className="question-opt-label">{opt.label}</span>
                        {opt.description && <span className="question-opt-desc">{opt.description}</span>}
                        {isActive && <span className="question-opt-check">✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
              {q.custom !== false && (
                <input
                  className="question-custom-input"
                  type="text"
                  placeholder={t('detail.questionCustomPlaceholder')}
                  value={customs[qi] ?? ""}
                  onChange={(e) => setCustoms((prev) => ({ ...prev, [qi]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
        <div className="question-actions">
          <button className="btn btn-secondary" onClick={handleReject}>
            {t('settings.questionSkip')}
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {t('settings.questionSend')}
          </button>
        </div>
      </div>
    </div>
  )
})
