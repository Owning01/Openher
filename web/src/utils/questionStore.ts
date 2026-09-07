import { useState, useEffect } from "react"

export type QuestionSettledInfo = {
  status: "answered" | "rejected"
  answers?: string[][] | Record<string, unknown>
  answeredAt: number
}

const settledQuestions = new Map<string, QuestionSettledInfo>()
const listeners = new Set<(id: string, info: QuestionSettledInfo) => void>()

export function recordQuestionSettled(
  id: string,
  status: "answered" | "rejected" = "answered",
  answers?: string[][] | Record<string, unknown>,
): void {
  if (!id) return
  const info: QuestionSettledInfo = {
    status,
    answers,
    answeredAt: Date.now(),
  }
  settledQuestions.set(id, info)
  listeners.forEach((fn) => {
    try {
      fn(id, info)
    } catch { /* ignore */ }
  })
}

export function isQuestionSettled(id?: string | string[]): boolean {
  if (!id) return false
  if (Array.isArray(id)) {
    return id.some((i) => i && settledQuestions.has(i))
  }
  return settledQuestions.has(id)
}

export function getQuestionSettledInfo(id?: string | string[]): QuestionSettledInfo | undefined {
  if (!id) return undefined
  if (Array.isArray(id)) {
    for (const i of id) {
      if (i && settledQuestions.has(i)) return settledQuestions.get(i)
    }
    return undefined
  }
  return settledQuestions.get(id)
}

export function clearQuestionSettled(id?: string): void {
  if (!id) settledQuestions.clear()
  else settledQuestions.delete(id)
}

export function onQuestionSettledChange(listener: (id: string, info: QuestionSettledInfo) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useQuestionSettled(id?: string | (string | undefined | null)[]): QuestionSettledInfo | null {
  const ids = Array.isArray(id) ? id.filter((x): x is string => !!x) : id ? [id] : []
  const idsKey = ids.join("::")

  const [info, setInfo] = useState<QuestionSettledInfo | null>(() => getQuestionSettledInfo(ids) ?? null)

  useEffect(() => {
    if (ids.length === 0) {
      setInfo(null)
      return
    }
    setInfo(getQuestionSettledInfo(ids) ?? null)

    return onQuestionSettledChange((settledId, settledInfo) => {
      if (ids.includes(settledId)) {
        setInfo(settledInfo)
      }
    })
  }, [idsKey])

  return info
}

