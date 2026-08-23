import { memo, useCallback, useRef, useState } from "react"
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
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const offsetRef = useRef(offset)
  offsetRef.current = offset

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return
    if ((e.target as HTMLElement).closest("button, input, textarea, a")) return

    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startOffsetX = offsetRef.current.x
    const startOffsetY = offsetRef.current.y

    document.body.style.userSelect = "none"

    const onPointerMove = (ev: PointerEvent) => {
      setOffset({
        x: startOffsetX + (ev.clientX - startX),
        y: startOffsetY + (ev.clientY - startY),
      })
    }

    const onPointerUp = () => {
      document.body.style.userSelect = ""
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
  }, [])

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
      <div
        className="question-card"
        role="dialog"
        aria-label={t('settings.questionPrompt')}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        }}
      >
        <div
          className="question-card-header"
          onPointerDown={handlePointerDown}
          style={{ cursor: "grab", touchAction: "none", userSelect: "none" }}
          title="Arrastra para mover"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ opacity: 0.4, cursor: "grab", fontSize: 13 }}>⠿</span>
            <strong>{t('settings.questionPrompt')}</strong>
          </div>
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
