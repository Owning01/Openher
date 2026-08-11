import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import type { ServerConfig, DataMode, MessageEnvelope, ModelSelection, RenderedMessage, SessionView } from "../types"
import { api } from "../api"
import { parseCommand, resolveCommand, buildOptimisticMessage, buildStatusMessage } from "../utils/parseCommand"

const toolPartTypes = new Set(["tool_use", "tool_result", "tool", "execution", "terminal", "code_execution", "tool_call"])

// Tools de archivos y de terminal: se conservan en modos ahorro para mostrar
// los cambios (+N/−M) y los comandos ejecutados (bash/terminal); el diff
// completo vive en el resumen final.
const fileToolNames = new Set(["write", "edit", "apply_patch", "patch"])
const shellToolNames = new Set(["bash", "execute", "terminal", "shell", "pwsh", "cmd"])

const COMPOSER_STORAGE_KEY = "opencode.remote.composer"

function extractText(msg: MessageEnvelope): string {
  const blocks: string[] = []
  for (const part of msg.parts) {
    if (!part.text) continue
    if (part.type === "text" || part.type === "compaction") {
      blocks.push(part.text)
    }
  }
  return blocks.join("\n\n").trim()
}

export function assistantPayloadLength(items: MessageEnvelope[]): number {
  return items
    .filter((message) => message.info.role !== "user")
    .reduce((sum, message) => sum + extractText(message).length, 0)
}

function stripNonEssential(msg: MessageEnvelope, dataMode?: DataMode): MessageEnvelope {
  if (dataMode === "full" || dataMode === "saver") return msg
  const keep = (p: MessageEnvelope["parts"][number]) =>
    !toolPartTypes.has(p.type) || (typeof p.tool === "string" && (fileToolNames.has(p.tool) || shellToolNames.has(p.tool)))
  const filtered = msg.parts.filter(keep)
  return filtered.length === msg.parts.length ? msg : { ...msg, parts: filtered }
}

export function useMessages(config: ServerConfig, dataMode?: DataMode, storageKey = COMPOSER_STORAGE_KEY) {
  const [messages, setMessages] = useState<MessageEnvelope[]>([])
  const [optimisticUserMessages, setOptimisticUserMessages] = useState<MessageEnvelope[]>([])
  const [composer, setComposer] = useState(() => localStorage.getItem(storageKey) ?? "")
  const [awaitingAssistantReply, setAwaitingAssistantReply] = useState(false)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [compacting, setCompacting] = useState(false)

  const composerRef = useRef(composer)
  composerRef.current = composer
  useEffect(() => {
    const timer = setInterval(() => {
      const current = composerRef.current
      if (current) localStorage.setItem(storageKey, current)
      else localStorage.removeItem(storageKey)
    }, 2000)
    return () => clearInterval(timer)
  }, [storageKey])

  const loadSelectedRequestRef = useRef(0)
  const awaitingAssistantBaselineRef = useRef("")
  const completionShouldPlayRef = useRef(false)
  // Sesión que el estado `messages` representa. Guard contra races: los deltas
  // de otra sesión (que el SSE puede entregar durante una transición de sesión)
  // se rechazan si no coinciden con la sesión cargada.
  const loadedSessionIDRef = useRef<string | null>(null)
  // Ancla partID → mensaje del PADRE para tool parts de subagentes (task): el
  // server los emite con sessionID/messageID de la sesión HIJA; la tarjeta se
  // materializa en el mensaje assistant del padre que los desplegó. El partID
  // se conserva entre updates (running→completed), así el ancla es estable.
  const subagentAnchorRef = useRef<Map<string, { sessionID: string; messageID: string }>>(new Map())

  const renderedMessages: RenderedMessage[] = useMemo(() => {
    const all = [...messages, ...optimisticUserMessages]
    const out: RenderedMessage[] = []
    // Auto-sana duplicados de id (ver loadSelected): nunca dos bubbles iguales.
    const seenIds = new Set<string>()
    // Los diffs del turno (info.summary.diffs del user message) se muestran al
    // final del turno: en el ÚLTIMO mensaje assistant que le sigue.
    let pendingDiffs: import("../types").FileDiff[] | undefined
    let lastAssistantId: string | null = null
    const diffForMessage = new Map<string, import("../types").FileDiff[]>()
    // El user message no trae mode del server (solo el assistant): el modo del
    // turno (plan/build) se toma del primer assistant que le sigue.
    const turnModeForUser = new Map<string, string>()
    let lastUserID: string | null = null
    for (const message of all) {
      if (seenIds.has(message.info.id)) continue
      seenIds.add(message.info.id)
      if (message.info.role === "user") {
        pendingDiffs = message.info.summary?.diffs
        lastAssistantId = null
        lastUserID = message.info.id
      } else {
        if (pendingDiffs && pendingDiffs.length > 0) {
          if (lastAssistantId) diffForMessage.delete(lastAssistantId)
          diffForMessage.set(message.info.id, pendingDiffs)
          lastAssistantId = message.info.id
        }
        if (lastUserID && message.info.mode && !turnModeForUser.has(lastUserID)) {
          turnModeForUser.set(lastUserID, message.info.mode)
        }
      }
    }
    for (const message of all) {
      let text = ""
      let hasCompaction = false
      const thinkingParts: Array<{ id: string; text: string; time?: { start?: number; end?: number } }> = []
      const toolParts: Array<{ id: string; type: string; sessionID?: string; text?: string; callID?: string; tool?: string; state?: MessageEnvelope["parts"][number]["state"] }> = []
      const textBlocks: string[] = []
      for (const part of message.parts) {
        if (part.type === "tool" || toolPartTypes.has(part.type)) {
          toolParts.push({
            id: part.id,
            type: part.type,
            sessionID: part.sessionID,
            text: part.text,
            callID: part.callID,
            tool: part.tool,
            state: part.state
          })
          continue
        }
        const t = part.text
        if (t) {
          if (part.type === "text" || part.type === "compaction") {
            textBlocks.push(t)
            if (part.type === "compaction") hasCompaction = true
          } else if (part.type === "reasoning" || part.type === "thinking") {
            thinkingParts.push({ id: part.id, text: t, time: part.time })
          }
        }
      }
      text = textBlocks.join("\n\n").trim()
      const hasImages = message.parts.some((p) => p.type === "image")
      // thinkingParts cuenta como contenido visible: durante el streaming del
      // reasoning el mensaje NO tiene texto aún — si se filtra aquí, el thinking
      // solo aparece cuando llega el primer pedazo de texto (bug: "el thinking
      // llega completo al final").
      if (text || thinkingParts.length > 0 || toolParts.length > 0 || hasImages) {
        const turnMode = message.info.mode ?? (message.info.role === "user" ? turnModeForUser.get(message.info.id) : undefined)
        out.push({ ...message, text, hasCompaction, thinkingParts, toolParts, tokens: message.info.tokens, cost: message.info.cost, summaryDiffs: diffForMessage.get(message.info.id), dataMode, turnMode })
      }
    }
    return out
  }, [messages, optimisticUserMessages, dataMode])

  const messageScrollSignature = useMemo(() => {
    return renderedMessages.map((m) => `${m.info.id}:${m.text.length}`).join("|")
  }, [renderedMessages])

  const assistantResponseSignature = useMemo(() => {
    return renderedMessages
      .filter((m) => m.info.role !== "user")
      .map((m) => `${m.info.id}:${m.text.length}`)
      .join("|")
  }, [renderedMessages])

  const toolMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.info.role === "assistant") {
        const toolParts = m.parts.filter((p) => p.type === "tool" || toolPartTypes.has(p.type))
        if (toolParts.length > 0) return toolParts
      }
    }
    return null
  }, [messages])

  const clearSession = useCallback(() => {
    loadedSessionIDRef.current = null
    subagentAnchorRef.current.clear()
    setMessages([])
    setOptimisticUserMessages([])
    setAwaitingAssistantReply(false)
    setRuntimeError(null)
  }, [])

  const loadSelected = useCallback(async (sessionID: string, directory: string) => {
    const requestID = ++loadSelectedRequestRef.current
    // Seteo ANTES del await: los deltas que lleguen durante el fetch de esta
    // sesión ya se aplican (el merge por id conserva lo streamed local).
    loadedSessionIDRef.current = sessionID
    const limit = dataMode === "ultra" ? 30 : dataMode === "miser" ? 20 : 100

    const raw = await api.loadMessages(config, sessionID, directory, limit)
    if (requestID !== loadSelectedRequestRef.current) return
    const msg = dataMode === "full" || dataMode === "saver" ? raw : raw.map((m) => stripNonEssential(m, dataMode))

    setMessages((prev) => {
      // Merge por id SOLO de la sesión cargada: el historial local de la sesión
      // nunca se reemplaza ni se descarta por una respuesta parcial o vacía,
      // pero los mensajes residuales de OTRAS sesiones (races de transición)
      // se descartan — el array siempre contiene una sola conversación.
      const seen = new Set<string>()
      let changed = prev.some((m) => m.info.sessionID !== sessionID)
      const msgMap = new Map(msg.map((m) => [m.info.id, m]))
      const merged: MessageEnvelope[] = []
      for (const m of prev) {
        if (m.info.sessionID !== sessionID) continue
        if (seen.has(m.info.id)) { changed = true; continue }
        seen.add(m.info.id)
        const updated = msgMap.get(m.info.id)
        if (updated) {
          // Merge de parts por id: los parts streamed localmente (tools, etc.)
          // que el fetch acotado no traiga se conservan — nunca se borran del chat.
          const remoteIDs = new Set(updated.parts.map((p) => p.id))
          const extraLocal = m.parts.filter((p) => !remoteIDs.has(p.id))
          const parts = extraLocal.length > 0 ? [...updated.parts, ...extraLocal] : updated.parts
          merged.push({ ...updated, parts })
          msgMap.delete(m.info.id)
          if (updated.info.time.completed !== m.info.time.completed || updated.info.role !== m.info.role) changed = true
        } else {
          merged.push(m)
        }
      }
      for (const m of msgMap.values()) {
        if (seen.has(m.info.id)) continue
        seen.add(m.info.id)
        merged.push(m)
        changed = true
      }
      if (!changed) return prev

      // Orden por time.created: un mensaje de usuario confirmado por el server
      // (que llega en un fetch posterior) debe caer en su posición, no al final.
      merged.sort((a, b) => (a.info.time.created ?? 0) - (b.info.time.created ?? 0))
      return merged
    })

    setOptimisticUserMessages((current) => {
      const confirmedUsers = msg.filter((m) => m.info.role === "user")
      // 1) Confirmación por id: el server devuelve el id real del mensaje.
      const confirmedIDs = new Set(confirmedUsers.map((m) => m.info.id))
      // 2) Fallback por texto (echo SSE con role assistant/id distinto): cada
      //    fetch confirma a lo sumo el optimista MÁS VIEJO con ese texto — si
      //    se envió "hola" dos veces, el segundo espera su propio echo en vez
      //    de desaparecer junto con el primero.
      const confirmedTexts = new Set(confirmedUsers.map((m) => extractText(m).trim()).filter(Boolean))
      const removeIDs = new Set<string>(confirmedIDs)
      const matchedTexts = new Set<string>()
      for (const m of current) {
        if (m.info.sessionID !== sessionID || confirmedIDs.has(m.info.id)) continue
        const t = extractText(m).trim()
        if (t && confirmedTexts.has(t) && !matchedTexts.has(t)) {
          matchedTexts.add(t)
          removeIDs.add(m.info.id)
        }
      }
      return current.filter((m) => m.info.sessionID !== sessionID || !removeIDs.has(m.info.id))
    })
  }, [config, dataMode])

  const removeOptimistic = useCallback((id: string) => {
    setOptimisticUserMessages((current) => current.filter((m) => m.info.id !== id))
  }, [])

  // Sincroniza los ids optimistas en un ref para poder consultarlos desde
  // callbacks asíncronos (confirmación del envío). Los TEXTOS de los optimistas
  // pendientes permiten reconocer el echo del user message en el SSE (que llega
  // con role "assistant") — matchea cualquier envío en vuelo, no solo el último.
  const optimisticIDsRef = useRef<Set<string>>(new Set())
  const optimisticTextsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    optimisticIDsRef.current = new Set(optimisticUserMessages.map((m) => m.info.id))
    optimisticTextsRef.current = new Set(optimisticUserMessages.map(extractText).map((t) => t.trim()).filter(Boolean))
  }, [optimisticUserMessages])

  const abortSession = useCallback(async (sessionID: string, directory: string) => {
    setAwaitingAssistantReply(false)
    try {
      await Promise.race([
        api.abort(config, sessionID, directory),
        new Promise((resolve) => setTimeout(resolve, 4000))
      ])
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
    completionShouldPlayRef.current = false
  }, [config])

  const undoMessage = useCallback(async (
    sessionID: string,
    directory: string,
    revert: { messageID: string } | undefined,
    onRefreshSessions: () => Promise<void>,
    onLoadSelected: () => Promise<void>,
  ) => {
    const userMessages = messages.filter((m) => m.info.role === "user")
    const target = userMessages.length > 0
      ? revert
        ? userMessages.filter((m) => m.info.id < revert.messageID).pop()
        : userMessages.pop()
      : undefined
    if (!target) {
      setRuntimeError("No messages to undo")
      return
    }
    try {
      if (awaitingAssistantReply || messages.some((m) => m.info.role !== "user" && !m.info.time.completed)) {
        await api.abort(config, sessionID, directory)
      }
      await api.revert(config, sessionID, target.info.id, directory)
      await onLoadSelected()
      await onRefreshSessions()
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
  }, [config, messages, awaitingAssistantReply])

  const redoMessage = useCallback(async (
    sessionID: string,
    directory: string,
    onRefreshSessions: () => Promise<void>,
    onLoadSelected: () => Promise<void>,
  ) => {
    try {
      await api.unrevert(config, sessionID, directory)
      await onLoadSelected()
      await onRefreshSessions()
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
  }, [config])

  const sendShellCallback = useCallback(async (sessionID: string, directory: string) => {
    const text = composer.trim()
    if (!text || !sessionID) return
    try {
      setComposer("")
      setAwaitingAssistantReply(true)
      await api.sendShell(config, sessionID, text, directory)
    } catch (err) {
      setAwaitingAssistantReply(false)
      setRuntimeError((err as Error).message)
    }
  }, [config, composer])

  const compactSession = useCallback(async (
    sessionID: string,
    directory: string,
    providerID: string,
    modelID: string,
    onRefreshSessions: () => Promise<void>,
    _onLoadSelected: () => Promise<void>,
  ) => {
    try {
      const ok = await api.summarize(config, sessionID, providerID, modelID, directory, false)
      if (!ok) { setRuntimeError("Compact returned false from server"); return }
      await new Promise((r) => setTimeout(r, 500))
      await loadSelected(sessionID, directory)
      await onRefreshSessions()
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
  }, [config, loadSelected])

  const applyDelta = useCallback((sessionID: string, messageID: string, partID: string, text: string, replace = false, partType = "text") => {
    // Guard contra races: nunca aplicar deltas de una sesión distinta a la cargada.
    if (loadedSessionIDRef.current !== sessionID) return
    setMessages((prev) => {
      const existing = prev.find((m) => m.info.sessionID === sessionID && m.info.id === messageID)
      if (!existing) {
        // El SSE etiqueta todo como "assistant"; si el texto coincide con un
        // optimista pendiente es el user message confirmado: con role
        // "user" el bubble conserva su borde/fondo.
        const isUserText = partType === "text" && replace && optimisticTextsRef.current.size > 0
          ? optimisticTextsRef.current.has(text.trim())
          : false
        return [...prev, {
          info: {
            id: messageID,
            role: isUserText ? "user" : "assistant",
            sessionID,
            time: { created: Date.now() },
          },
          parts: [{ id: partID, type: partType, text }]
        }]
      }
      let changed = false
      const next = prev.map((m) => {
        if (m.info.sessionID !== sessionID || m.info.id !== messageID) return m
        const nextParts = m.parts.map((p) => {
          if (p.id !== partID) return p
          // Nunca demotar un part ya tipado (reasoning/tool) a texto por un
          // delta sin tipo resuelto.
          const keepType = partType === "text" && p.type !== "text" ? p.type : partType
          if (replace) {
            if (p.text === text) return p
            changed = true
            return { ...p, text, type: keepType }
          }
          if (p.text?.endsWith(text)) return p
          changed = true
          return { ...p, text: (p.text ?? "") + text, type: keepType }
        })
        if (!nextParts.some((p) => p.id === partID)) {
          changed = true
          return { ...m, parts: [...nextParts, { id: partID, type: partType, text }] }
        }
        return { ...m, parts: nextParts }
      })
      return changed ? next : prev
    })
  }, [])

  // Materializa un part emitido por `message.part.updated`: crea el mensaje/part
  // con el tipo correcto antes de que lleguen los deltas.
  const applyPart = useCallback((sessionID: string, messageID: string, part: { id: string; type?: string; text?: string; tool?: string; callID?: string; state?: unknown; time?: { start?: number; end?: number } }) => {
    if (!part.id) return
    const visible = loadedSessionIDRef.current
    if (visible && visible !== sessionID) {
      // Tool part de un subagente (task): el server manda la sesión/mensaje de
      // la sesión HIJA, pero la tarjeta pertenece al chat del padre. Se ancla
      // por partID al último mensaje assistant de la sesión visible (el turno
      // en curso que desplegó al subagente).
      if (part.type !== "tool" && part.type !== "tool_use") return
      const anchor = subagentAnchorRef.current.get(part.id)
      if (anchor) {
        sessionID = anchor.sessionID
        messageID = anchor.messageID
      } else {
        sessionID = visible
        messageID = ""
      }
    }
    setMessages((prev) => {
      let targetMessageID = messageID
      if (!targetMessageID) {
        const anchorMsg = prev.filter((m) => m.info.sessionID === sessionID && m.info.role === "assistant").pop()
        targetMessageID = anchorMsg?.info.id ?? ""
        if (targetMessageID) subagentAnchorRef.current.set(part.id, { sessionID, messageID: targetMessageID })
        else return prev
      }
      const existing = prev.find((m) => m.info.sessionID === sessionID && m.info.id === targetMessageID)
      if (!existing) {
        const isUserText = part.type === "text" && part.text && optimisticTextsRef.current.size > 0
          ? optimisticTextsRef.current.has(part.text.trim())
          : false
        return [...prev, {
          info: { id: targetMessageID, role: isUserText ? "user" : "assistant", sessionID, time: { created: Date.now() } },
          parts: [{ id: part.id, type: part.type ?? "text", text: part.text ?? "", ...(part.tool ? { tool: part.tool } : {}), ...(part.callID ? { callID: part.callID } : {}), ...(part.state ? { state: part.state } : {}), ...(part.time ? { time: part.time } : {}) }]
        }]
      }
      let changed = false
      const next = prev.map((m) => {
        if (m.info.sessionID !== sessionID || m.info.id !== targetMessageID) return m
        const hasPart = m.parts.some((p) => p.id === part.id)
        if (!hasPart) {
          changed = true
          return { ...m, parts: [...m.parts, { id: part.id, type: part.type ?? "text", text: part.text ?? "", ...(part.tool ? { tool: part.tool } : {}), ...(part.callID ? { callID: part.callID } : {}), ...(part.state ? { state: part.state } : {}), ...(part.time ? { time: part.time } : {}) }] }
        }
        const nextParts = m.parts.map((p) => {
          if (p.id !== part.id) return p
          const incoming = part.text ?? ""
          // Los tool parts (task/subagent) suelen llegar SIN texto: solo traen
          // state.status (running→completed) y tool. Mergear siempre esos campos.
          const newState = part.state && typeof part.state === "object" ? part.state : undefined
          const stateChanged = newState !== undefined && JSON.stringify(p.state ?? null) !== JSON.stringify(newState)
          const toolChanged = part.tool !== undefined && part.tool !== p.tool
          // El time (start/end) también cambia sin tocar texto: p.ej. el
          // reasoning final llega con time.end aunque el texto ya esté completo.
          const timeChanged = part.time !== undefined && JSON.stringify(p.time ?? null) !== JSON.stringify(part.time)
          if (!incoming && p.text && !stateChanged && !toolChanged && !timeChanged) return p
          if (p.text === incoming && (part.type ?? p.type) === p.type && !stateChanged && !toolChanged && !timeChanged) return p
          changed = true
          return {
            ...p,
            text: incoming || p.text,
            ...(part.type ? { type: part.type } : {}),
            ...(part.tool ? { tool: part.tool } : {}),
            ...(part.callID ? { callID: part.callID } : {}),
            ...(newState !== undefined ? { state: newState } : {}),
            ...(part.time ? { time: part.time } : {}),
          }
        })
        return { ...m, parts: nextParts }
      })
      return changed ? next : prev
    })
  }, [])

  const updateSend = useCallback(async (
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
  ) => {
    const text = (textOverride ?? composer).trim()
    if ((!text || !selectedSession) && (!images || images.length === 0)) return

    const optimisticMessage = buildOptimisticMessage(selectedSession, text, images)

    const doSend = async (
      sendFn: () => Promise<unknown>,
      then: () => Promise<void>
    ) => {
      setComposer("")
      setOptimisticUserMessages((current) => [...current, optimisticMessage])
      awaitingAssistantBaselineRef.current = assistantResponseSignature
      completionShouldPlayRef.current = true
      setAwaitingAssistantReply(true)
      onSetRuntimeError(null)

      let sendFailed = false
      try {
        await sendFn()
      } catch (err) {
        sendFailed = true
        const isNetwork = err instanceof TypeError || (err as Error).name === "AbortError" || /failed to fetch|network error|timeout/i.test((err as Error).message)
        if (isNetwork) {
          // El server pudo haber recibido el prompt aunque el fetch fallara
          // localmente (red móvil/túnel): no remover el optimista ni restaurar
          // el texto — el retry de confirmación decide qué pasó.
          onSetRuntimeError((err as Error).message)
        } else {
          // El server respondió con un error: el prompt NO se procesó.
          completionShouldPlayRef.current = false
          setAwaitingAssistantReply(false)
          removeOptimistic(optimisticMessage.info.id)
          setComposer((current) => current || text)
          onSetRuntimeError((err as Error).message)
        }
      }

      // Confirmación: el server persiste el user message de forma asíncrona;
      // loadSelected (match por texto) confirma el optimista. Una falla de red
      // AQUÍ no significa que el envío falló — el merge por id del próximo
      // fetch confirmará el optimista.
      let confirmed = false
      try {
        const deadline = Date.now() + 10000
        while (optimisticIDsRef.current.has(optimisticMessage.info.id) && Date.now() < deadline) {
          await then()
          if (!optimisticIDsRef.current.has(optimisticMessage.info.id)) break
          await new Promise((r) => setTimeout(r, 700))
        }
        confirmed = !optimisticIDsRef.current.has(optimisticMessage.info.id)
      } catch {
        // nunca tratar una falla de confirmación como falla de envío
      }

      // Si el envío dudó por red pero el server confirmó el mensaje, el error
      // mostrado era falso: limpiarlo.
      if (sendFailed && confirmed) onSetRuntimeError(null)

      if (!confirmed && sendFailed) {
        // El prompt no llegó al server: limpiar el optimista y devolver el texto.
        completionShouldPlayRef.current = false
        setAwaitingAssistantReply(false)
        removeOptimistic(optimisticMessage.info.id)
        setComposer((current) => current || text)
      }

      try {
        await onRefreshSessions()
      } catch {
        // una falla del refresh no debe parecer una falla de envío
      }
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
      await undoMessage(selectedSession.id, selectedSession.directory, selectedSession.revert, onRefreshSessions, onLoadSelected)
      return
    }
    if (parsed?.type === "redo") {
      setComposer("")
      await redoMessage(selectedSession.id, selectedSession.directory, onRefreshSessions, onLoadSelected)
      return
    }
    if (parsed?.type === "compact") {
      setComposer("")
      if (activeModel) {
        setCompacting(true)
        setAwaitingAssistantReply(true)
        completionShouldPlayRef.current = true
        try {
          await compactSession(selectedSession.id, selectedSession.directory, activeModel.providerID, activeModel.modelID, onRefreshSessions, onLoadSelected)
        } finally {
          setCompacting(false)
          setAwaitingAssistantReply(false)
        }
      } else {
        onSetRuntimeError("Select a model first to use /compact")
      }
      return
    }
    if (parsed?.type === "themes") {
      setComposer("")
      return "themes"
    }
    if (parsed?.type === "command") {
      const { isKnown } = await resolveCommand(config, parsed.command, commands, onSetCommands)
      if (!isKnown) {
        await doSend(
          () => api.sendPrompt(config, selectedSession.id, text.slice(1), selectedSession.directory, activeModel, activeAgentID),
          () => onLoadSelected()
        )
        return
      }
      await doSend(
        () => api.sendCommand(config, selectedSession.id, parsed.command, parsed.args, selectedSession.directory, activeModel, activeAgentID),
        () => onLoadSelected()
      )
      return
    }

    await doSend(
      () => api.sendPrompt(config, selectedSession.id, text, selectedSession.directory, activeModel, activeAgentID, images),
      () => onLoadSelected()
    )
  }, [composer, config, assistantResponseSignature, removeOptimistic, undoMessage, redoMessage, compactSession])

  return {
    messages, setMessages, optimisticUserMessages,
    composer, setComposer,
    awaitingAssistantReply, setAwaitingAssistantReply,
    runtimeError, setRuntimeError,
    compacting, setCompacting,
    renderedMessages, messageScrollSignature, assistantResponseSignature,
    toolMessage, completionShouldPlayRef,
    clearSession, loadSelected, send: updateSend, abortSession,
    undoMessage, redoMessage, compactSession, sendShell: sendShellCallback,
    applyDelta, applyPart
  }
}
