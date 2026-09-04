import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { api } from "../api"
import type { Question, PermissionRequest, ServerConfig } from "../types"
import { QUESTION_POLL_INTERVAL_MS } from "../constants"

type UseQuestionsOptions = {
  config: ServerConfig | null
  directory?: string
  enabled: boolean
  enabledQuestions?: boolean
  enabledPermissions?: boolean
  fallbackSessionID?: string
  notify?: (title: string, body: string) => void
  t?: (key: string) => string
}

export function useQuestions({ config, directory, enabled, enabledQuestions, enabledPermissions, fallbackSessionID, notify, t }: UseQuestionsOptions) {
  // tFn ESTABLE: antes era `t ?? (inline)` — una arrow nueva por render que
  // reiniciaba ambos effects cada render → poll inmediato → setState con array
  // nuevo → re-render → loop infinito (~890 fetch/s a /form|permission/request,
  // CPU y RAM por las nubes). useMemo lo congela cuando `t` no cambia.
  const tFn = useMemo(() => t ?? ((key: string) => key), [t])
  // notify por ref: el texto solo se usa para notificar; no debe reiniciar polls.
  const notifyRef = useRef(notify)
  notifyRef.current = notify
  const enabledQ = enabledQuestions ?? enabled
  const enabledP = enabledPermissions ?? enabled
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([])
  const [dismissedQuestions, setDismissedQuestions] = useState<Set<string>>(new Set())
  const notifiedQuestionIDs = useRef<Set<string>>(new Set())
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null)
  const notifiedPermissionIDs = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!config || !enabledQ) return
    let alive = true
    const poll = async () => {
      try {
        const qs = await api.listPendingQuestions(config, directory)
        if (!alive) return
        const fresh = qs.filter((q) =>
          (!fallbackSessionID || !q.sessionID || q.sessionID === fallbackSessionID) &&
          !dismissedQuestions.has(q.id),
        )
        // Guard anti-loop: `filter` crea array nuevo siempre; solo setear si
        // cambió el contenido (mismos ids en orden) para no re-renderizar.
        setPendingQuestions((prev) => {
          if (prev.length === fresh.length && prev.every((p, i) => p.id === fresh[i].id)) return prev
          return fresh
        })
        const notify = notifyRef.current
        if (notify) {
          for (const q of fresh) {
            if (notifiedQuestionIDs.current.has(q.id)) continue
            notifiedQuestionIDs.current.add(q.id)
            notify(tFn('notification.questionTitle'), (q as { question?: string }).question ?? (q as { questions?: { question: string }[] }).questions?.[0]?.question ?? "")
          }
        }
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, QUESTION_POLL_INTERVAL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [config, enabledQ, directory, fallbackSessionID, dismissedQuestions, tFn])

  useEffect(() => {
    if (!config || !enabledP) return
    let alive = true
    const poll = async () => {
      try {
        const perms = await api.listPermissions(config, directory)
        if (!alive) return
        const pending = perms.find((p) =>
          p.status === "pending" && (!fallbackSessionID || !p.sessionID || p.sessionID === fallbackSessionID),
        )
        // Guard anti-loop: mismo requestID → mismo estado, no re-render.
        setPermissionRequest((prev) => {
          const next = pending ?? null
          if ((prev?.requestID ?? null) === (next?.requestID ?? null)) return prev
          return next
        })
        const notify = notifyRef.current
        if (pending && notify && !notifiedPermissionIDs.current.has(pending.requestID)) {
          notifiedPermissionIDs.current.add(pending.requestID)
          notify(tFn('notification.permissionTitle'), pending.permission ?? "")
        }
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, QUESTION_POLL_INTERVAL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [config, enabledP, directory, fallbackSessionID, tFn])

  const handleQuestionReply = useCallback(async (requestID: string, answers: string[][]) => {
    if (!config) return
    try {
      await api.questionReply(config, requestID, answers, directory, pendingQuestions.find((q) => q.id === requestID)?.sessionID ?? fallbackSessionID)
      setDismissedQuestions((prev) => new Set(prev).add(requestID))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== requestID))
    } catch { /* ignore */ }
  }, [config, directory, pendingQuestions, fallbackSessionID])

  const handleQuestionReject = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.questionReject(config, requestID, directory, pendingQuestions.find((q) => q.id === requestID)?.sessionID ?? fallbackSessionID)
      setDismissedQuestions((prev) => new Set(prev).add(requestID))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== requestID))
    } catch { /* ignore */ }
  }, [config, directory, pendingQuestions, fallbackSessionID])

  const handleDismissQuestion = useCallback(() => {
    setPendingQuestions((prev) => prev.slice(1))
  }, [])

  const handlePermissionApprove = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.permissionReply(config, requestID, true, directory, permissionRequest?.sessionID ?? fallbackSessionID)
      setPermissionRequest(null)
    } catch { /* ignore */ }
  }, [config, directory, permissionRequest, fallbackSessionID])

  const handlePermissionReject = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.permissionReply(config, requestID, false, directory, permissionRequest?.sessionID ?? fallbackSessionID)
      setPermissionRequest(null)
    } catch { /* ignore */ }
  }, [config, directory, permissionRequest, fallbackSessionID])

  const handleDismissPermission = useCallback(() => {
    setPermissionRequest(null)
  }, [])

  return {
    pendingQuestions,
    dismissedQuestions,
    permissionRequest,
    handleQuestionReply,
    handleQuestionReject,
    handleDismissQuestion,
    handlePermissionApprove,
    handlePermissionReject,
    handleDismissPermission,
  }
}
