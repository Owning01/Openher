import { useState, useCallback, useRef } from "react"
import { api } from "../api"
import type { ServerConfig } from "../types"

export type ShellLine = {
  text: string
  type: "input" | "output" | "error"
}

export function useShell(config: ServerConfig | null) {
  const [lines, setLines] = useState<ShellLine[]>([])
  const [running, setRunning] = useState(false)
  const historyRef = useRef<string[]>([])
  const sessionIdRef = useRef<string | null>(null)
  const directoryRef = useRef<string>("")

  const execute = useCallback(async (command: string, sessionID: string, directory: string) => {
    if (!config || !command.trim()) return
    sessionIdRef.current = sessionID
    directoryRef.current = directory
    historyRef.current = [command, ...historyRef.current].slice(0, 50)
    setLines((prev) => [...prev, { text: `$ ${command}`, type: "input" }])
    setRunning(true)
    try {
      await api.sendShell(config, sessionID, command, directory)
      setLines((prev) => [...prev, { text: "Command sent", type: "output" }])
    } catch (err: any) {
      setLines((prev) => [...prev, { text: `Error: ${err.message}`, type: "error" }])
    } finally {
      setRunning(false)
    }
  }, [config])

  const clear = useCallback(() => setLines([]), [])

  return { lines, running, execute, clear, history: historyRef.current }
}
