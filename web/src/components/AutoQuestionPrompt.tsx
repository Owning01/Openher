import { memo, useCallback, useState } from "react"
import { ModalHeader } from "./ModalHeader"
import { useT } from "../i18n-context"
import type { Question } from "../types"

type Props = {
  question: Question
  onReply: (requestID: string, answers: string[][]) => void
  onReject: (requestID: string) => void
  onDismiss: () => void
}

export const AutoQuestionPrompt = memo(function AutoQuestionPrompt({ question, onReply, onReject, onDismiss }: Props) {
  const t = useT()
  const [answer, setAnswer] = useState("")

  const handleSubmit = useCallback(() => {
    if (!answer.trim()) return
    onReply(question.id, [[answer.trim()]])
    setAnswer("")
    onDismiss()
  }, [answer, question.id, onReply, onDismiss])

  const handleReject = useCallback(() => {
    onReject(question.id)
    onDismiss()
  }, [question.id, onReject, onDismiss])

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('settings.questionPrompt')}>
        <ModalHeader title={t('settings.questionPrompt')} onClose={onDismiss} />
        <div className="modal-body">
          <p className="question-text">{question.question}</p>
          <textarea
            className="question-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t('settings.questionPlaceholder')}
            rows={3}
            autoFocus
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={handleReject}>
            {t('settings.questionSkip')}
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!answer.trim()}>
            {t('settings.questionSend')}
          </button>
        </div>
      </div>
    </div>
  )
})
