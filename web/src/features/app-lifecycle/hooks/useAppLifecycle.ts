import { useEffect, useRef } from "react"
import { api } from "../../../api"
import { isSessionActive } from "../../../utils"
import { usePolling } from "../../../hooks/usePolling"
import { useCompletionAudio } from "../../../hooks/useCompletionAudio"
import { useMemoryCleanup } from "../../../hooks/useMemoryCleanup"
import { useMemoryUsage } from "../../../hooks/useMemoryUsage"
import { useNetworkMode } from "../../../hooks/useNetworkMode"
import { useDeepLink } from "../../../hooks/useDeepLink"
import type { ServerConfig, ConnectionState, DataMode, SessionView, FeatureFlags } from "../../../types"

export type UseAppLifecycleParams = {
  config: ServerConfig
  connectionState: ConnectionState
  setConnectionState: (state: ConnectionState) => void
  setConnectionMessage: (msg: string) => void
  dataMode: DataMode
  changeDataMode: (mode: DataMode) => void
  flags: FeatureFlags
  selectedSession: SessionView | null
  sessions: SessionView[]
  setSessions: (updater: (prev: SessionView[]) => SessionView[]) => void
  setMessages: React.Dispatch<React.SetStateAction<any>>
  streamState: string
  awaitingAssistantReply: boolean
  setAwaitingAssistantReply: (val: boolean) => void
  completionShouldPlayRef: React.MutableRefObject<boolean>
  chatSettings: { completionSound?: boolean }
  refreshSessions: (force?: boolean) => Promise<any>
  loadSelected: (id: string, dir: string) => Promise<any>
  loadAgents: (dir?: string) => Promise<any>
  loadModels: (dir?: string) => Promise<any>
  setCommands: (cmds: any[]) => void
  getCachedSessions: () => Promise<any>
  backgroundFailureCountRef: React.MutableRefObject<number>
  initialSessionLoadRef: React.MutableRefObject<boolean>
  activeDetailSheet: string | null
  loadDiffs: (id: string, dir: string) => Promise<any>
  loadDashboard: (dir: string) => Promise<any>
  listPending: () => Promise<any[]>
  ackQueuedAction: (id: number) => Promise<boolean>
  markQueuedActionFailed: (action: any, error: unknown) => Promise<boolean>
  navigate: (view: any) => void
  openSession: (id: string, dir: string) => Promise<void>
  setDraftConfig: React.Dispatch<React.SetStateAction<any>>
  t: (key: string) => string
}

export function useAppLifecycle({
  config,
  connectionState,
  setConnectionState,
  setConnectionMessage,
  dataMode,
  changeDataMode,
  flags,
  selectedSession,
  sessions,
  setSessions,
  setMessages,
  streamState,
  awaitingAssistantReply,
  setAwaitingAssistantReply,
  completionShouldPlayRef,
  chatSettings,
  refreshSessions,
  loadSelected,
  loadAgents,
  loadModels,
  setCommands,
  getCachedSessions,
  backgroundFailureCountRef,
  initialSessionLoadRef,
  activeDetailSheet,
  loadDiffs,
  loadDashboard,
  listPending,
  ackQueuedAction,
  markQueuedActionFailed,
  navigate,
  openSession,
  setDraftConfig,
  t,
}: UseAppLifecycleParams) {
  const lastMsgFetchUpdatedRef = useRef<Record<string, number>>({})
  const lastFetchAtRef = useRef<Record<string, number>>({})
  const replayingQueueRef = useRef(false)
  const isStreaming = streamState === "streaming" && dataMode === "full" && flags.streamingFull
  const isStreamingActive = isStreaming && Boolean(selectedSession)

  const connectionStateRef = useRef(connectionState)
  useEffect(() => {
    connectionStateRef.current = connectionState
  }, [connectionState])

  const baseInterval =
    dataMode === "full"
      ? isStreamingActive
        ? 5000
        : 3500
      : dataMode === "ultra"
      ? 30000
      : dataMode === "miser"
      ? 60000
      : 15000

  const isActivePoll = Boolean(
    selectedSession && (isSessionActive(selectedSession) || awaitingAssistantReply)
  )
  const pollInterval = isActivePoll ? Math.min(baseInterval, 3000) : baseInterval

  const pollControl = usePolling(
    async () => {
      const sseLive = streamState === "streaming"
      const isActive = selectedSession ? isSessionActive(selectedSession) : false
      const active = Boolean(isActive || awaitingAssistantReply)
      // Refresh de sesiones: antes solo cuando !sseLive; ahora también periódico aunque SSE vivo
      // para detectar nuevos mensajes de otros clientes y updated que alimenta el skip.
      if (dataMode === "full") {
        if (!sseLive) await refreshSessions(true)
        else {
          const lastAtForRefresh = lastFetchAtRef.current[selectedSession?.id ?? ""] ?? 0
          if (Date.now() - lastAtForRefresh > 20000) await refreshSessions(true).catch(() => {})
        }
      } else {
        await refreshSessions(false)
      }
      if (connectionStateRef.current === "offline") {
        throw new Error("offline")
      }
      if (!selectedSession) return
      // Reconciliación: pull de mensajes incluso con SSE vivo.
      // El skip anterior (`updated <= prevUpdated`) dejaba el chat congelado en idle+streaming
      // porque `updated` no cambiaba y `sseLive` era true → nunca hacía fetch aunque el server
      // tuviera mensajes nuevos que el SSE perdió (reconnect sin replay, directory miss).
      // Ahora se fuerza por tiempo: idle+streaming refresca cada ~15s.
      const now = Date.now()
      const lastAt = lastFetchAtRef.current[selectedSession.id] ?? 0
      const timeSince = now - lastAt
      const threshold = dataMode === "ultra" ? 30000 : dataMode === "miser" ? 60000 : active ? 3000 : 15000
      const prevUpdated = lastMsgFetchUpdatedRef.current[selectedSession.id]
      const updatedChanged = prevUpdated === undefined || selectedSession.updated > prevUpdated
      const shouldPull = dataMode === "full" || dataMode === "saver" || active || updatedChanged || timeSince >= threshold
      if (shouldPull) {
        const skip = !active && sseLive && !updatedChanged && timeSince < threshold
        if (!skip) {
          await loadSelected(selectedSession.id, selectedSession.directory)
          lastMsgFetchUpdatedRef.current[selectedSession.id] = selectedSession.updated
          lastFetchAtRef.current[selectedSession.id] = now
        }
      }
      // No apagar awaiting solo porque la sesión no está busy localmente:
      // el server puede estar aún procesando y el status local va atrasado.
      // Verificar con el server si realmente está idle — también con SSE vivo,
      // porque el evento idle puede perderse (reconnect sin replay, API v2).
      if (selectedSession && !isSessionActive(selectedSession) && awaitingAssistantReply) {
        const st = await api.listStatuses(config, selectedSession.directory).catch(() => undefined)
        const real = st?.[selectedSession.id]
        if (real && real.type !== "busy" && real.type !== "retry") {
          setAwaitingAssistantReply(false)
        }
      }
      if (selectedSession && isSessionActive(selectedSession) && !awaitingAssistantReply) {
        const st = await api.listStatuses(config, selectedSession.directory).catch(() => undefined)
        const real = st?.[selectedSession.id]
        if (real && real.type !== "busy" && real.type !== "retry") {
          setSessions((prev) =>
            prev.map((s) => (s.id === selectedSession.id ? { ...s, status: "idle" } : s))
          )
        }
      }
    },
    pollInterval,
    [
      config.host,
      config.port,
      config.username,
      config.password,
      dataMode,
      streamState,
      selectedSession?.id,
      selectedSession?.status,
      isStreamingActive,
      awaitingAssistantReply,
    ],
    isStreamingActive
  )

  useCompletionAudio(
    awaitingAssistantReply,
    completionShouldPlayRef,
    dataMode,
    chatSettings.completionSound ?? false,
    () => {
      if (selectedSession && dataMode !== "ultra" && dataMode !== "miser") {
        loadSelected(selectedSession.id, selectedSession.directory)
        refreshSessions(true)
      }
    }
  )

  useEffect(() => {
    let cancelled = false
    if (!config.host || config.port <= 0) {
      setConnectionState("idle")
      setConnectionMessage("")
      return
    }
    setConnectionState("connecting")
    setConnectionMessage(t("connection.connecting"))
    backgroundFailureCountRef.current = 0
    initialSessionLoadRef.current = true

    const loadFromCache = async () => {
      if (sessions.length > 0) return
      const cached = await getCachedSessions()
      if (cached && cached.length > 0) {
        setSessions(() => cached as any)
      }
    }
    loadFromCache()

    refreshSessions(true).catch(() => pollControl.fail())
    loadAgents()
    loadModels()
    if (dataMode === "full") {
      api
        .listCommands(config)
        .then((cmds) => {
          if (!cancelled) setCommands(cmds)
        })
        .catch(() => setCommands([]))
    }
    return () => {
      cancelled = true
    }
  }, [config.host, config.port, config.username, config.password, dataMode])

  useMemoryCleanup(selectedSession?.id ?? null, setMessages)
  const memInfo = useMemoryUsage(5000)

  useEffect(() => {
    if (activeDetailSheet !== "details" || !selectedSession) return
    loadDiffs(selectedSession.id, selectedSession.directory)
    loadDashboard(selectedSession.directory)
  }, [activeDetailSheet, selectedSession?.id, selectedSession?.directory, loadDiffs, loadDashboard])

  useNetworkMode(changeDataMode)

  useDeepLink((action) => {
    if (action.kind === "server") {
      const { host, port, username } = action
      if (host) {
        setDraftConfig((prev: any) => ({
          ...prev,
          host,
          port: port ?? prev.port,
          username: username ?? prev.username,
        }))
        navigate("settings")
      }
    } else if (action.kind === "session") {
      if (!action.sessionID) return
      navigate("detail")
      setTimeout(() => {
        const dir = action.directory ?? ""
        const target = sessions.find((s) => s.id === action.sessionID)
        if (target) {
          openSession(target.id, target.directory)
        } else {
          openSession(action.sessionID!, dir)
        }
      }, 300)
    }
  })

  // Replay offline queue when connected
  useEffect(() => {
    if (connectionState !== "connected" || !config) return
    let active = true
    if (replayingQueueRef.current) return () => { active = false }
    replayingQueueRef.current = true
    listPending().then(async (actions) => {
      if (!active) return
      // FIFO y una acción por vez: conservar las siguientes si una escritura
      // falla permite reanudar sin perder trabajo ni reordenar prompts.
      for (const a of actions) {
        if (!active) break
        try {
          let payload = a.payload
          if (a.type === "prompt" && a.options?.translate && payload.trim()) {
            const { translateToEnglish } = await import("../../../utils/translate")
            payload = await translateToEnglish(payload)
          }
          if (a.type === "prompt") {
            await api.sendPrompt(config, a.sessionID, payload, a.directory, a.model, a.agentID, a.images)
          } else if (a.type === "command") {
            await api.sendCommand(config, a.sessionID, payload, "", a.directory, a.model, a.agentID)
          } else if (a.type === "shell") {
            await api.sendShell(config, a.sessionID, payload, a.directory)
          }
          await ackQueuedAction(a.id)
        } catch (error) {
          await markQueuedActionFailed(a, error)
          // No bloquear cola detrás de un fallo: continuar con siguientes
          // acciones (posiblemente de otras sesiones) y dejar el fallido
          // marcado con lastError para reintento manual/próximo ciclo.
          continue
        }
      }
    }).finally(() => {
      replayingQueueRef.current = false
    })
    return () => {
      active = false
    }
  }, [connectionState, config, listPending, ackQueuedAction, markQueuedActionFailed])

  return {
    memInfo,
  }
}
