import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { api } from "../api"
import type { Question, PermissionRequest, ServerConfig } from "../types"
import { QUESTION_POLL_INTERVAL_MS } from "../constants"
import { isQuestionSettled, onQuestionSettledChange } from "../utils/questionStore"
import { useScheduled } from "./useScheduled"

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
    return onQuestionSettledChange((id) => {
      setDismissedQuestions((prev) => new Set(prev).add(id))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== id))
    })
  }, [])

  // Claves estables de una pregunta: formID + callID del tool. Cerrar por
  // cualquiera de las dos debe ocultar tanto el prompt inline como el modal.
  const questionKeys = useCallback((q: Question | undefined): string[] => {
    if (!q) return []
    return [q.id, q.tool?.callID, q.tool?.messageID].filter((k): k is string => !!k)
  }, [])

  const dismissQuestion = useCallback((q: Question | undefined) => {
    const keys = questionKeys(q)
    if (keys.length === 0) return
    setDismissedQuestions((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => next.add(k))
      return next
    })
    setPendingQuestions((prev) => prev.filter((p) => p.id !== q!.id))
  }, [questionKeys])

  // Reloj central (Plan 3): sin setInterval propio. El scheduler aporta pausa
  // en hidden + anti-solapamiento; el key con fingerprint re-dispara el poll
  // inmediato cuando cambian los parámetros (igual que el effect anterior).
  const host = config?.host ?? ""
  const port = config?.port ?? 0
  const pollQuestions = useCallback(async () => {
    if (!config) return
    try {
      const qs = await api.listPendingQuestions(config, directory)
      // Limpieza: las claves dismissed de forms que ya no existen no deben
      // crecer sin límite (y así un form nuevo con el mismo rol no queda oculto).
      const liveFormIDs = new Set(qs.map((q) => q.id))
      setDismissedQuestions((prev) => {
        let changed = false
        const next = new Set<string>()
        for (const key of prev) {
          if (liveFormIDs.has(key) || !key.startsWith("frm_")) next.add(key)
          else changed = true
        }
        return changed ? next : prev
      })
      const fresh = qs.filter((q) =>
        (!fallbackSessionID || !q.sessionID || q.sessionID === fallbackSessionID) &&
        !dismissedQuestions.has(q.id) &&
        !isQuestionSettled(q.id),
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
  }, [config, directory, fallbackSessionID, dismissedQuestions, tFn])

  useScheduled(
    `questions:${enabledQ}:${host}:${port}:${directory}:${fallbackSessionID}:${dismissedQuestions.size}`,
    QUESTION_POLL_INTERVAL_MS,
    pollQuestions,
    { enabled: !!config && enabledQ, runOnRegister: true },
  )

  const pollPermissions = useCallback(async () => {
    if (!config) return
    try {
      const perms = await api.listPermissions(config, directory)
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
  }, [config, directory, fallbackSessionID, tFn])

  useScheduled(
    `permissions:${enabledP}:${host}:${port}:${directory}:${fallbackSessionID}`,
    QUESTION_POLL_INTERVAL_MS,
    pollPermissions,
    { enabled: !!config && enabledP, runOnRegister: true },
  )

  const handleQuestionReply = useCallback(async (requestID: string, answers: string[][]) => {
    if (!config) return
    // Sin catch: el error (400/404/409) sube al componente para feedback
    // visible; no se cierra el prompt en falso.
    await api.questionReply(
      config,
      requestID,
      answers,
      directory,
      pendingQuestions.find((q) => q.id === requestID)?.sessionID ?? fallbackSessionID,
    )
    dismissQuestion(pendingQuestions.find((q) => q.id === requestID))
  }, [config, directory, pendingQuestions, fallbackSessionID, dismissQuestion])

  const handleQuestionReject = useCallback(async (requestID: string) => {
    if (!config) return
    await api.questionReject(
      config,
      requestID,
      directory,
      pendingQuestions.find((q) => q.id === requestID)?.sessionID ?? fallbackSessionID,
    )
    dismissQuestion(pendingQuestions.find((q) => q.id === requestID))
  }, [config, directory, pendingQuestions, fallbackSessionID, dismissQuestion])

  // Cierre sticky: la pregunta queda en dismissedQuestions para que el poll
  // no la reinyecte a los 15s. Sin requestID cierra la primera pendiente.
  const handleDismissQuestion = useCallback((requestID?: string) => {
    const target = requestID
      ? pendingQuestions.find((q) => q.id === requestID)
      : pendingQuestions[0]
    dismissQuestion(target)
  }, [pendingQuestions, dismissQuestion])

  // Reabrir: limpiar el set dismissed (click en el badge de pendientes).
  const clearDismissedQuestions = useCallback(() => {
    setDismissedQuestions(new Set())
  }, [])

  // Al abortar la generación: cerrar localmente TODAS las preguntas de la
  // sesión (sin cancelar server-side: el tool sigue visible para el modelo).
  const dismissSessionQuestions = useCallback((sessionID?: string) => {
    if (!sessionID) return
    const targets = pendingQuestions.filter((q) => !q.sessionID || q.sessionID === sessionID)
    if (targets.length === 0) return
    const keys = targets.flatMap((q) => questionKeys(q))
    setDismissedQuestions((prev) => new Set([...prev, ...keys]))
    const ids = new Set(targets.map((q) => q.id))
    setPendingQuestions((prev) => prev.filter((q) => !ids.has(q.id)))
  }, [pendingQuestions, questionKeys])

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
    clearDismissedQuestions,
    dismissSessionQuestions,
    handlePermissionApprove,
    handlePermissionReject,
    handleDismissPermission,
  }
}
