import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "../api"
import type { Question, PermissionRequest, ServerConfig } from "../types"
import { QUESTION_POLL_INTERVAL_MS } from "../constants"

type UseQuestionsOptions = {
  config: ServerConfig | null
  directory?: string
  enabled: boolean
  notify?: (title: string, body: string) => void
  t: (key: string) => string
}

export function useQuestions({ config, directory, enabled, notify, t }: UseQuestionsOptions) {
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([])
  const [dismissedQuestions, setDismissedQuestions] = useState<Set<string>>(new Set())
  const notifiedQuestionIDs = useRef<Set<string>>(new Set())
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null)
  const notifiedPermissionIDs = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!config || !enabled) return
    const poll = async () => {
      try {
        const qs = await api.listPendingQuestions(config, directory)
        const fresh = qs.filter((q) => !dismissedQuestions.has(q.id))
        setPendingQuestions(fresh)
        if (notify) {
          for (const q of fresh) {
            if (notifiedQuestionIDs.current.has(q.id)) continue
            notifiedQuestionIDs.current.add(q.id)
            notify(t('notification.questionTitle'), (q as { question?: string }).question ?? (q as { questions?: { question: string }[] }).questions?.[0]?.question ?? "")
          }
        }
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, QUESTION_POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [config, enabled, directory, dismissedQuestions, notify, t])

  useEffect(() => {
    if (!config || !enabled) return
    const poll = async () => {
      try {
        const perms = await api.listPermissions(config, directory)
        const pending = perms.find((p) => p.status === "pending")
        if (pending) setPermissionRequest(pending)
        if (pending && notify && !notifiedPermissionIDs.current.has(pending.requestID)) {
          notifiedPermissionIDs.current.add(pending.requestID)
          notify(t('notification.permissionTitle'), pending.permission ?? "")
        }
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, QUESTION_POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [config, enabled, directory, notify, t])

  const handleQuestionReply = useCallback(async (requestID: string, answers: string[][]) => {
    if (!config) return
    try {
      await api.questionReply(config, requestID, answers, directory, pendingQuestions.find((q) => q.id === requestID)?.sessionID)
      setDismissedQuestions((prev) => new Set(prev).add(requestID))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== requestID))
    } catch { /* ignore */ }
  }, [config, directory, pendingQuestions])

  const handleQuestionReject = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.questionReject(config, requestID, directory, pendingQuestions.find((q) => q.id === requestID)?.sessionID)
      setDismissedQuestions((prev) => new Set(prev).add(requestID))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== requestID))
    } catch { /* ignore */ }
  }, [config, directory, pendingQuestions])

  const handleDismissQuestion = useCallback(() => {
    setPendingQuestions((prev) => prev.slice(1))
  }, [])

  const handlePermissionApprove = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.permissionReply(config, requestID, true, directory, permissionRequest?.sessionID)
      setPermissionRequest(null)
    } catch { /* ignore */ }
  }, [config, directory, permissionRequest])

  const handlePermissionReject = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.permissionReply(config, requestID, false, directory, permissionRequest?.sessionID)
      setPermissionRequest(null)
    } catch { /* ignore */ }
  }, [config, directory, permissionRequest])

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
