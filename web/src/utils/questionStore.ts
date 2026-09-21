import { useState, useEffect } from "react"
import { createEmitter, createStore } from "../shared/lib/store"

export type QuestionSettledInfo = {
  status: "answered" | "rejected"
  answers?: string[][] | Record<string, unknown>
  answeredAt: number
}

const settledQuestions = new Map<string, QuestionSettledInfo>()
const settledEmitter = createEmitter<{ id: string; info: QuestionSettledInfo }>()

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
  settledEmitter.emit({ id, info })
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
  return settledEmitter.subscribe(({ id, info }) => {
    try {
      listener(id, info)
    } catch { /* ignore */ }
  })
}

export function useQuestionSettled(id?: string | (string | undefined | null)[], enabled = true): QuestionSettledInfo | null {
  const ids = Array.isArray(id) ? id.filter((x): x is string => !!x) : id ? [id] : []
  const idsKey = ids.join("::")

  const [info, setInfo] = useState<QuestionSettledInfo | null>(() => getQuestionSettledInfo(ids) ?? null)

  useEffect(() => {
    if (!enabled || ids.length === 0) {
      setInfo(null)
      return
    }
    setInfo(getQuestionSettledInfo(ids) ?? null)

    return onQuestionSettledChange((settledId, settledInfo) => {
      if (ids.includes(settledId)) {
        setInfo(settledInfo)
      }
    })
  }, [idsKey, enabled])

  return info
}

// ---- Modo flotante (questionAuto) ----------------------------------------
// Cuando questionAuto está ON, el modal de ChatView es la ÚNICA superficie
// interactiva y ToolPart renderiza un chip compacto (evita duplicados). El
// default true acompaña al default de feature flags.
const floatingStore = createStore<boolean>(true)

export function setQuestionFloatingMode(enabled: boolean): void {
  if (floatingStore.get() === enabled) return
  floatingStore.set(enabled)
}

export function isQuestionFloatingMode(): boolean {
  return floatingStore.get()
}

// `enabled=false` evita la suscripcion: los ToolPart que no son de pregunta no
// se re-renderizan cuando cambia questionAuto (el chip/modal solo aplica a
// preguntas). Los hooks se llaman igual (reglas de hooks), pero sin alta.
export function useQuestionFloatingMode(enabled = true): boolean {
  const [value, setValue] = useState<boolean>(() => floatingStore.get())
  useEffect(() => {
    if (!enabled) return
    setValue(floatingStore.get())
    return floatingStore.subscribe(() => setValue(floatingStore.get()))
  }, [enabled])
  return enabled ? value : false
}
