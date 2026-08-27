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
  dequeueAll: () => Promise<any[]>
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
  dequeueAll,
  navigate,
  openSession,
  setDraftConfig,
  t,
}: UseAppLifecycleParams) {
  const lastMsgFetchUpdatedRef = useRef<Record<string, number>>({})
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
      if (dataMode === "full" && !sseLive) {
        await refreshSessions(true)
      } else if (dataMode !== "full") {
        await refreshSessions(false)
      }
      if (connectionStateRef.current === "offline") {
        throw new Error("offline")
      }
      if (!selectedSession) return
      if (dataMode === "full" || dataMode === "saver" || isSessionActive(selectedSession)) {
        const prevUpdated = lastMsgFetchUpdatedRef.current[selectedSession.id]
        const skip =
          dataMode !== "full" &&
          sseLive &&
          prevUpdated !== undefined &&
          selectedSession.updated <= prevUpdated
        if (!skip) {
          await loadSelected(selectedSession.id, selectedSession.directory)
          lastMsgFetchUpdatedRef.current[selectedSession.id] = selectedSession.updated
        }
      }
      if (selectedSession && !isSessionActive(selectedSession) && awaitingAssistantReply) {
        setAwaitingAssistantReply(false)
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
    if (connectionState !== "connected" || !config || !selectedSession) return
    let active = true
    dequeueAll().then((actions) => {
      if (!active) return
      for (const a of actions) {
        if (a.type === "prompt") {
          api.sendPrompt(config, a.sessionID, a.payload, a.directory).catch(() => {})
        } else if (a.type === "command") {
          api.sendCommand(config, a.sessionID, a.payload, "", a.directory).catch(() => {})
        } else if (a.type === "shell") {
          api.sendShell(config, a.sessionID, a.payload, a.directory).catch(() => {})
        }
      }
    })
    return () => {
      active = false
    }
  }, [connectionState, config, selectedSession, dequeueAll])

  return {
    memInfo,
  }
}
