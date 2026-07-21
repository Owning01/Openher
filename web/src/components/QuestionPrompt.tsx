import { useState, memo, useCallback } from "react"
import { api } from "../api"
import type { ServerConfig } from "../types"

type Question = {
  header: string
  question: string
  options: Array<{ label: string; description: string }>
  multiple?: boolean
  custom?: boolean
}

type QuestionPromptProps = {
  questions: Question[]
  requestID: string
  config: ServerConfig
  directory?: string
  onDone: () => void
}

export const QuestionPrompt = memo(function QuestionPrompt({ questions, requestID, config, directory, onDone }: QuestionPromptProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[][]>(() => questions.map(() => []))
  const [customInputs, setCustomInputs] = useState<string[]>(() => questions.map(() => ""))
  const [editing, setEditing] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const q = questions[step]
  const isSingle = questions.length === 1 && !q?.multiple
  const isConfirm = step === questions.length
  const options = q?.options ?? []
  const hasCustom = q?.custom !== false
  const isMulti = q?.multiple === true

  const selected = answers[step] ?? []
  const customVal = customInputs[step] ?? ""

  const pick = useCallback((label: string) => {
    if (isMulti) {
      setAnswers((prev) => {
        const copy = prev.map((a) => [...a])
        const idx = copy[step].indexOf(label)
        if (idx >= 0) copy[step].splice(idx, 1)
        else copy[step].push(label)
        return copy
      })
    } else {
      setAnswers((prev) => {
        const copy = prev.map((a) => [...a])
        copy[step] = [label]
        return copy
      })
      if (isSingle) return
      setStep((s) => s + 1)
    }
  }, [step, isMulti, isSingle])

  const submitCustom = useCallback(() => {
    const text = customVal.trim()
    if (!text) return
    if (isMulti) {
      setAnswers((prev) => {
        const copy = prev.map((a) => [...a])
        if (!copy[step].includes(text)) copy[step].push(text)
        return copy
      })
    } else {
      setAnswers((prev) => {
        const copy = prev.map((a) => [...a])
        copy[step] = [text]
        return copy
      })
      if (isSingle) return
      setStep((s) => s + 1)
    }
    setEditing(false)
  }, [customVal, step, isMulti, isSingle])

  const nextStep = useCallback(() => {
    if (step < questions.length) setStep((s) => s + 1)
  }, [step, questions.length])

  const prevStep = useCallback(() => {
    if (step > 0) setStep((s) => s - 1)
  }, [step])

  const handleSubmit = useCallback(async () => {
    setSending(true)
    setError(null)
    try {
      const result = await api.questionReply(config, requestID, answers, directory)
      if (result) onDone()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSending(false)
    }
  }, [config, requestID, answers, directory, onDone])

  const handleReject = useCallback(async () => {
    setSending(true)
    try {
      await api.questionReject(config, requestID, directory)
      onDone()
    } catch {
      onDone()
    }
  }, [config, requestID, directory, onDone])

  if (sending) {
    return <div className="question-prompt"><div className="question-prompt-status">Sending...</div></div>
  }

  return (
    <div className="question-prompt">
      {!isSingle && (
        <div className="question-tabs">
          {questions.map((qq, i) => (
            <button key={i}
              className={`question-tab${i === step ? " active" : ""}${(answers[i]?.length ?? 0) > 0 ? " answered" : ""}`}
              onClick={() => setStep(i)}>
              {qq.header}
            </button>
          ))}
          <button className={`question-tab${isConfirm ? " active" : ""}`} onClick={() => setStep(questions.length)}>
            Confirm
          </button>
        </div>
      )}

      {!isConfirm ? (
        <div className="question-body">
          <div className="question-text">
            {q.question}{isMulti ? " (select all that apply)" : ""}
          </div>
          <div className="question-options">
            {options.map((opt, i) => {
              const picked = selected.includes(opt.label)
              return (
                <button key={i}
                  className={`question-option${picked ? " picked" : ""}`}
                  onClick={() => pick(opt.label)}>
                  {isMulti ? <span className="question-check">{picked ? "✓" : " "}</span> : null}
                  <span className="question-opt-label">{opt.label}</span>
                  {opt.description && <span className="question-opt-desc">{opt.description}</span>}
                  {!isMulti && picked && <span className="question-opt-check"> ✓</span>}
                </button>
              )
            })}
            {hasCustom && (
              <div className="question-custom">
                {!editing ? (
                  <button className="question-option" onClick={() => setEditing(true)}>
                    {isMulti ? <span className="question-check">{customVal ? "✓" : " "}</span> : null}
                    <span>{customVal || "Type your own answer"}</span>
                    {!isMulti && customVal ? <span className="question-opt-check"> ✓</span> : null}
                  </button>
                ) : (
                  <div className="question-custom-edit">
                    <textarea
                      className="question-custom-input"
                      value={customVal}
                      onChange={(e) => setCustomInputs((prev) => {
                        const copy = [...prev]
                        copy[step] = e.target.value
                        return copy
                      })}
                      placeholder="Type your own answer"
                      autoFocus
                    />
                    <button className="question-custom-submit" onClick={submitCustom}>Done</button>
                  </div>
                )}
                {customVal && !editing && (
                  <div className="question-custom-preview">{customVal}</div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="question-review">
          {questions.map((qq, i) => {
            const val = answers[i]?.join(", ") ?? ""
            return (
              <div key={i} className="question-review-row">
                <span className="question-review-label">{qq.header}:</span>
                <span className={`question-review-value${val ? "" : " unanswered"}`}>
                  {val || "(not answered)"}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {error && <div className="question-error">{error}</div>}

      <div className="question-actions">
        <div className="question-nav">
          {!isSingle && step > 0 && (
            <button className="question-btn" onClick={prevStep}>← Back</button>
          )}
          {!isSingle && !isConfirm && (
            <button className="question-btn" onClick={nextStep} disabled={selected.length === 0}>
              Next →
            </button>
          )}
        </div>
        <div className="question-submit">
          {isConfirm && (
            <button className="question-btn question-btn-primary" onClick={handleSubmit}
              disabled={answers.some((a) => a.length === 0)}>
              Submit
            </button>
          )}
          {isSingle && (
            <button className="question-btn question-btn-primary" onClick={handleSubmit}
              disabled={selected.length === 0}>
              Submit
            </button>
          )}
          <button className="question-btn question-btn-danger" onClick={handleReject}>Dismiss</button>
        </div>
      </div>
    </div>
  )
})

export default QuestionPrompt
