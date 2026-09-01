import { useCallback, useEffect, useRef, useState } from "react"
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
  const tFn = t ?? ((key: string) => key)
  const enabledQ = enabledQuestions ?? enabled
  const enabledP = enabledPermissions ?? enabled
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([])
  const [dismissedQuestions, setDismissedQuestions] = useState<Set<string>>(new Set())
  const notifiedQuestionIDs = useRef<Set<string>>(new Set())
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null)
  const notifiedPermissionIDs = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!config || !enabledQ) return
    const poll = async () => {
      try {
        const qs = await api.listPendingQuestions(config, directory)
        const fresh = qs.filter((q) =>
          (!fallbackSessionID || !q.sessionID || q.sessionID === fallbackSessionID) &&
          !dismissedQuestions.has(q.id),
        )
        setPendingQuestions(fresh)
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
    return () => clearInterval(id)
  }, [config, enabledQ, directory, dismissedQuestions, notify, tFn])

  useEffect(() => {
    if (!config || !enabledP) return
    const poll = async () => {
      try {
        const perms = await api.listPermissions(config, directory)
        const pending = perms.find((p) =>
          p.status === "pending" && (!fallbackSessionID || !p.sessionID || p.sessionID === fallbackSessionID),
        )
        setPermissionRequest(pending ?? null)
        if (pending && notify && !notifiedPermissionIDs.current.has(pending.requestID)) {
          notifiedPermissionIDs.current.add(pending.requestID)
          notify(tFn('notification.permissionTitle'), pending.permission ?? "")
        }
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, QUESTION_POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [config, enabledP, directory, notify, tFn])

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
