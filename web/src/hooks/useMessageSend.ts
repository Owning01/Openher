import { useCallback } from "react"
import type { MessageEnvelope, ModelSelection, SessionView } from "../types"
import { api } from "../api"
import {
  parseCommand,
  resolveCommand,
  buildOptimisticMessage,
  buildStatusMessage,
  buildNoticeMessage,
} from "../utils/parseCommand"
import { messageText, findDeliveredEcho } from "../utils/messageShape"
import { formatServerError } from "../shared/errors/serverErrors"
import { withTimeout } from "../shared/lib/async"
import { setTranslationOriginal } from "../stores/translationOriginals"

// Onda 3 / B2: `updateSend` extraído tal cual desde hooks/useMessages.ts.
// La conducta es idéntica (mismo anti-doble-envío, mismos slash commands,
// mismos returns y misma restauración de texto/errores). El hook recibe por
// dependencias el estado y los callbacks que antes vivían en el closure.

export type MessageSendDeps = {
  config: Parameters<typeof api.loadMessages>[0]
  composer: string
  assistantResponseSignature: string
  removeOptimistic: (id: string) => void
  undoMessage: (
    sessionID: string,
    directory: string,
    revert: { messageID: string } | undefined,
    _onRefreshSessions: () => Promise<void>,
    onLoadSelected: () => Promise<void>,
    onPatchSession?: (patch: Partial<{ revert: { messageID: string } | undefined }>) => void,
    onSetRevertID?: (id: string | null) => void,
    restoreComposer?: boolean,
  ) => Promise<void>
  redoMessage: (
    sessionID: string,
    directory: string,
    revert: { messageID: string } | undefined,
    _onRefreshSessions: () => Promise<void>,
    onLoadSelected: () => Promise<void>,
    onPatchSession?: (patch: Partial<{ revert: { messageID: string } | undefined }>) => void,
    onSetRevertID?: (id: string | null) => void,
  ) => Promise<void>
  compactSession: (
    sessionID: string,
    directory: string,
    providerID: string,
    modelID: string,
    onRefreshSessions: () => Promise<void>,
    _onLoadSelected: () => Promise<void>,
  ) => Promise<void>
  setComposer: (value: string | ((prev: string) => string)) => void
  setOptimisticUserMessages: (updater: (prev: MessageEnvelope[]) => MessageEnvelope[]) => void
  setIsSending: (value: boolean) => void
  isSendingRef: { current: boolean }
  optimisticIDsRef: { current: Set<string> }
  optimisticTextsRef: { current: Set<string> }
  awaitingBaselineIDRef: { current: string }
  completionShouldPlayRef: { current: boolean }
  setAwaitingAssistantReply: (value: boolean) => void
  lastSigRef: { current: { assistantLastID: string } }
}

export function useMessageSend(deps: MessageSendDeps) {
  const {
    config,
    composer,
    assistantResponseSignature,
    removeOptimistic,
    undoMessage,
    redoMessage,
    compactSession,
    setComposer,
    setOptimisticUserMessages,
    setIsSending,
    isSendingRef,
    optimisticIDsRef,
    optimisticTextsRef,
    awaitingBaselineIDRef,
    completionShouldPlayRef,
    setAwaitingAssistantReply,
    lastSigRef,
  } = deps

  const send = useCallback(async (
    selectedSession: SessionView,
    activeModel: ModelSelection | undefined,
    activeAgentID: string,
    commands: { name: string }[],
    onRefreshSessions: () => Promise<void>,
    onLoadSelected: () => Promise<void>,
    onSetCommands: (cmds: { name: string }[]) => void,
    onSetRuntimeError: (err: string | null) => void,
    images?: Array<{ base64: string; mime: string }>,
    textOverride?: string,
    onSetRevertID?: (id: string | null) => void,
    translatedFrom?: string,
  ) => {
    const text = (textOverride ?? composer).trim()
    if ((!text || !selectedSession) && (!images || images.length === 0)) return false
    try {

    const optimisticMessage = buildOptimisticMessage(selectedSession, text, images)
    // Store original text for "ver original" if this was translated
    if (translatedFrom) {
      setTranslationOriginal(optimisticMessage.info.id, translatedFrom)
    }

    const doSend = async (
      sendFn: () => Promise<unknown>,
      then: () => Promise<void>
    ): Promise<boolean> => {
      // Guard anti doble-envío: SOLO bloquea la fase de HTTP POST, no la
      // confirmación posterior. Antes estaba en el body de updateSend y se
      // pisaba con los returns tempranos de slash commands (help/status/etc),
      // quedando permanentemente en true y bloqueando TODOS los envíos
      // posteriores.
      if (isSendingRef.current) return false
      isSendingRef.current = true
      setIsSending(true)
      let ok = false
      try {
        setComposer("")
        setOptimisticUserMessages((current) => [...current, optimisticMessage])
        // Sync refs inmediato: evita race donde el while loop no ve el optimistic (effect aún no corrió)
        optimisticIDsRef.current = new Set([...optimisticIDsRef.current, optimisticMessage.info.id])
        const t = messageText(optimisticMessage).trim()
        if (t) optimisticTextsRef.current = new Set([...optimisticTextsRef.current, t])
        awaitingBaselineIDRef.current = lastSigRef.current.assistantLastID
        completionShouldPlayRef.current = true
        setAwaitingAssistantReply(true)
        onSetRuntimeError(null)

        try {
          await sendFn()
          ok = true
        } catch (err) {
          // El POST del SDK puede fallar en el cliente DESPUÉS de que el
          // server lo recibió (WebView/Android sobre Tailscale: el preflight
          // falla aunque el GET funcione — ver api/prompt.ts). Antes de borrar
          // el optimista se verifica el eco en el server: si existe, el turno
          // arrancó y sólo hay que traer el historial (móvil: "se perdió").
          let delivered = false
          try {
            // La verificación se acota a 5s: con el server caído de verdad,
            // loadMessages puede sumar decenas de segundos y `isSending`
            // bloquearía el composer todo ese tiempo (timeout > caída real).
            const raced = await withTimeout(
              api.loadMessages(config, selectedSession.id, selectedSession.directory, 50, false),
              5_000,
              "verify-timeout",
            ).catch(() => null)
            delivered = findDeliveredEcho(raced, text, Date.now() - 10 * 60 * 1000) !== null
          } catch {
            delivered = false
          }
          if (delivered) {
            // El server SÍ lo recibió: se trata como envío exitoso (ok=true)
            // para que NO restaure composer (Composer rellena con ok=false) ni
            // el outbox reenvíe (reintenta ante false ⇒ prompt duplicado).
            // then() hace el loadSelected del eco, igual que en el flujo ok.
            ok = true
          } else {
          // Send fallido (red o server): remover el optimistic de inmediato,
          // restaurar el texto original (no el traducido) y mostrar el error.
          // El Composer conserva las imágenes porque recibe `false` como retorno.
            completionShouldPlayRef.current = false
            setAwaitingAssistantReply(false)
            removeOptimistic(optimisticMessage.info.id)
            const restoreText = translatedFrom || text
            setComposer((current) => current || restoreText)
            onSetRuntimeError(formatServerError(err))
          }
        }
      } finally {
        isSendingRef.current = false
        setIsSending(false)
      }

      if (ok) {
        // TUI-like: 1 fetch inmediato; el SSE echo ya borra el optimista sin poll
        try {
          await then().catch(() => undefined)
        } catch {
          // nunca tratar una falla de confirmación como falla de envío
        }
      }

      try {
        await onRefreshSessions()
      } catch {
        // ignore
      }
      return ok
    }

    const parsed = parseCommand(text)
    if (parsed?.type === "help") {
      setComposer("")
      return "help"
    }
    if (parsed?.type === "status") {
      setComposer("")
      setOptimisticUserMessages((current) => [...current, optimisticMessage, buildStatusMessage(selectedSession)])
      return
    }
    if (parsed?.type === "undo") {
      setComposer("")
      await undoMessage(selectedSession.id, selectedSession.directory, selectedSession.revert, onRefreshSessions, onLoadSelected, undefined, onSetRevertID, false)
      return
    }
    if (parsed?.type === "redo") {
      setComposer("")
      await redoMessage(selectedSession.id, selectedSession.directory, selectedSession.revert, onRefreshSessions, onLoadSelected, undefined, onSetRevertID)
      return
    }
    if (parsed?.type === "compact") {
      setComposer("")
      if (activeModel) {
        completionShouldPlayRef.current = true
        await compactSession(selectedSession.id, selectedSession.directory, activeModel.providerID, activeModel.modelID, onRefreshSessions, onLoadSelected)
      } else {
        onSetRuntimeError("Select a model first to use /compact")
      }
      return
    }
    if (parsed?.type === "themes") {
      setComposer("")
      return "themes"
    }
    if (parsed?.type === "history") {
      setComposer("")
      return "history"
    }
    if (parsed?.type === "timeline") {
      setComposer("")
      return "timeline"
    }
    if (parsed?.type === "newSession") {
      setComposer("")
      return "newSession"
    }
    if (parsed?.type === "connect") {
      setComposer("")
      // /connect <providerID> <apiKey> → setea la credencial directo.
      // /connect (sin args) → abre el sheet de proveedores.
      const m = parsed.text.trim().match(/^(\S+)\s+(\S+)/)
      if (m) {
        try {
          await api.setProviderAuth(config, m[1], m[2], selectedSession.directory)
          return true
        } catch (err) {
          onSetRuntimeError(formatServerError(err))
          return false
        }
      }
      return "connect"
    }
    if (parsed?.type === "rename") {
      setComposer("")
      const title = parsed.title.trim()
      if (!title) {
        setOptimisticUserMessages((current) => [...current, optimisticMessage, buildNoticeMessage(selectedSession, "Usage: /rename <new title>")])
        return
      }
      try {
        await api.renameSession(config, selectedSession.id, title, selectedSession.directory)
        try {
          await onRefreshSessions()
        } catch {
          // ignore
        }
        setOptimisticUserMessages((current) => [...current, optimisticMessage, buildNoticeMessage(selectedSession, `Session renamed to "${title}"`)])
      } catch (err) {
        onSetRuntimeError(formatServerError(err))
      }
      return
    }
    if (parsed?.type === "export") {
      setComposer("")
      return "export"
    }
    if (parsed?.type === "command") {
      const { isKnown } = await resolveCommand(config, parsed.command, commands, onSetCommands)
      if (!isKnown) {
        return doSend(
          () => api.sendPrompt(config, selectedSession.id, text, selectedSession.directory, activeModel, activeAgentID),
          () => onLoadSelected()
        )
      }
      return doSend(
        () => api.sendCommand(config, selectedSession.id, parsed.command, parsed.args, selectedSession.directory, activeModel, activeAgentID),
        () => onLoadSelected()
      )
    }

    return doSend(
      () => api.sendPrompt(config, selectedSession.id, text, selectedSession.directory, activeModel, activeAgentID, images),
      () => onLoadSelected()
    )
    } finally {
      // BUG 1+6: isSendingRef siempre se resetea, incluso si el slash
      // command hace return temprano. Antes esto faltaba y el ref quedaba
      // pegado en true bloqueando TODOS los envíos posteriores.
      isSendingRef.current = false
    }
  }, [composer, config, assistantResponseSignature, removeOptimistic, undoMessage, redoMessage, compactSession])

  return send
}
