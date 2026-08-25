import { useState, useCallback, useEffect } from "react"
import { api } from "../api"
import type { ServerConfig } from "../types"

export type ShellType = "pwsh" | "powershell" | "cmd" | "bash" | "wsl" | "direct"

export type ShellLine = {
  id: string
  text: string
  type: "input" | "output" | "error" | "system"
  cwd?: string
  shell?: ShellType
  timestamp?: number
}

const TERMINAL_SHELL_KEY = "opencode.remote.terminal.shell"
const TERMINAL_HISTORY_KEY = "opencode.remote.terminal.history"

export function useShell(config: ServerConfig | null, initialDirectory?: string) {
  const [lines, setLines] = useState<ShellLine[]>([])
  const [running, setRunning] = useState(false)
  const [cwd, setCwd] = useState(initialDirectory || "")
  const [shell, setShellState] = useState<ShellType>(() => {
    return (localStorage.getItem(TERMINAL_SHELL_KEY) as ShellType) || "pwsh"
  })

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(TERMINAL_HISTORY_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  // Sincronizar cwd cuando cambia initialDirectory
  useEffect(() => {
    if (initialDirectory && (!cwd || cwd === "C:\\Users\\octavio" || cwd === "C:/Users/octavio")) {
      setCwd(initialDirectory)
    }
  }, [initialDirectory, cwd])

  const setShell = useCallback((newShell: ShellType) => {
    setShellState(newShell)
    localStorage.setItem(TERMINAL_SHELL_KEY, newShell)
    setLines((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        text: `[Terminal] Shell cambiada a: ${newShell.toUpperCase()}`,
        type: "system",
        timestamp: Date.now()
      }
    ])
  }, [])

  const pushHistory = useCallback((cmd: string) => {
    setHistory((prev) => {
      const next = [cmd, ...prev.filter((c) => c !== cmd)].slice(0, 100)
      try { localStorage.setItem(TERMINAL_HISTORY_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const execute = useCallback(async (rawCommand: string, sessionID: string, overrideDirectory?: string) => {
    const trimmed = rawCommand.trim()
    if (!config || !trimmed) return

    const effectiveDir = overrideDirectory || cwd || initialDirectory || ""
    pushHistory(trimmed)

    // Comando clear / cls local inmediato (0ms delay)
    if (trimmed.toLowerCase() === "clear" || trimmed.toLowerCase() === "cls") {
      setLines([])
      return
    }

    // Comando cd local para rastrear el directorio activo
    if (/^(cd|chdir|Set-Location)\s+/i.test(trimmed)) {
      const targetDir = trimmed.replace(/^(cd|chdir|Set-Location)\s+["']?|["']?$/gi, "").trim()
      if (targetDir) {
        let nextDir = targetDir
        if (targetDir === ".." || targetDir === "../") {
          const parts = effectiveDir.split(/[/\\]/)
          parts.pop()
          nextDir = parts.join("\\") || effectiveDir
        } else if (!targetDir.includes(":") && !targetDir.startsWith("/") && !targetDir.startsWith("\\")) {
          nextDir = effectiveDir ? `${effectiveDir.replace(/[/\\]$/, "")}\\${targetDir}` : targetDir
        }
        setCwd(nextDir)
      }
    }

    const inputLineId = `in-${Date.now()}`
    setLines((prev) => [
      ...prev,
      {
        id: inputLineId,
        text: trimmed,
        type: "input",
        cwd: effectiveDir,
        shell,
        timestamp: Date.now()
      }
    ])

    setRunning(true)

    // Construir comando envuelto según la shell seleccionada
    let commandToSend = trimmed
    if (effectiveDir) {
      switch (shell) {
        case "pwsh":
          commandToSend = `pwsh -NoProfile -Command "& { Set-Location -LiteralPath '${effectiveDir}'; ${trimmed} }"`
          break
        case "powershell":
          commandToSend = `powershell -NoProfile -Command "& { Set-Location -LiteralPath '${effectiveDir}'; ${trimmed} }"`
          break
        case "cmd":
          commandToSend = `cmd.exe /c "cd /d "${effectiveDir}" && ${trimmed}"`
          break
        case "bash":
          commandToSend = `bash -c "cd '${effectiveDir}' && ${trimmed}"`
          break
        case "wsl":
          commandToSend = `wsl -e bash -c "cd '${effectiveDir}' && ${trimmed}"`
          break
        default:
          commandToSend = trimmed
      }
    }

    try {
      await api.sendShell(config, sessionID, commandToSend, effectiveDir)
      setLines((prev) => [
        ...prev,
        {
          id: `out-${Date.now()}`,
          text: ` [${shell.toUpperCase()}] Comando enviado a ${effectiveDir || "sesión"}`,
          type: "output",
          timestamp: Date.now()
        }
      ])
    } catch (err: any) {
      setLines((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          text: `Error: ${err.message}`,
          type: "error",
          timestamp: Date.now()
        }
      ])
    } finally {
      setRunning(false)
    }
  }, [config, cwd, initialDirectory, shell, pushHistory])

  const clear = useCallback(() => setLines([]), [])

  return {
    lines,
    running,
    execute,
    clear,
    history,
    cwd,
    setCwd,
    shell,
    setShell
  }
}
