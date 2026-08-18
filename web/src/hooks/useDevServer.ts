import { useState, useEffect, useCallback, useRef } from "react"
import { shell } from "../shell"

export type DevServerInfo = {
  hasDevServer: boolean
  devCommand: string | null
  status: "idle" | "starting" | "running" | "error"
  serverUrl: string | null
  startDevServer: () => Promise<string>
  stopDevServer: () => Promise<void>
}

// Global registry of running dev servers keyed by directory
const runningServers = new Map<string, { ptyId: string; url: string; command: string }>()

export function useDevServer(directory?: string | null): DevServerInfo {
  const [hasDevServer, setHasDevServer] = useState(false)
  const [devCommand, setDevCommand] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "starting" | "running" | "error">("idle")
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const pollRef = useRef<number | null>(null)

  // Check if directory has an active server in memory
  useEffect(() => {
    if (!directory) {
      setHasDevServer(false)
      setDevCommand(null)
      setStatus("idle")
      setServerUrl(null)
      return
    }

    const running = runningServers.get(directory)
    if (running) {
      setHasDevServer(true)
      setDevCommand(running.command)
      setStatus("running")
      setServerUrl(running.url)
    }

    // Inspect directory for web dev scripts
    let cancelled = false
    const checkProject = async () => {
      try {
        const sep = directory.includes("\\") ? "\\" : "/"
        const pkgPath = `${directory}${directory.endsWith(sep) ? "" : sep}package.json`
        
        let pkgContent: string | null = null
        try {
          const res = await shell.fs.read(pkgPath)
          if (res && res.content) pkgContent = res.content
        } catch {
          // not found
        }

        if (cancelled) return

        if (pkgContent) {
          try {
            const pkg = JSON.parse(pkgContent)
            const scripts = pkg.scripts || {}
            let cmd: string | null = null

            // Detect package manager
            let pm = "npm run"
            try {
              const list = await shell.fs.list(directory)
              const files = (list.files || []).map((f) => f.name.toLowerCase())
              if (files.includes("pnpm-lock.yaml")) pm = "pnpm"
              else if (files.includes("bun.lockb") || files.includes("bun.lock")) pm = "bun"
              else if (files.includes("yarn.lock")) pm = "yarn"
            } catch {
              /* ignore */
            }

            if (scripts.dev) cmd = pm === "npm run" ? "npm run dev" : `${pm} dev`
            else if (scripts.start) cmd = pm === "npm run" ? "npm start" : `${pm} start`
            else if (scripts.serve) cmd = pm === "npm run" ? "npm run serve" : `${pm} serve`

            if (cmd) {
              setHasDevServer(true)
              setDevCommand(cmd)
              return
            }
          } catch {
            /* ignore json error */
          }
        }

        // Also check for vite.config, index.html, trunk.toml
        try {
          const list = await shell.fs.list(directory)
          const fileNames = (list.files || []).map((f) => f.name.toLowerCase())
          if (fileNames.some((f) => f.startsWith("vite.config") || f === "index.html")) {
            setHasDevServer(true)
            setDevCommand("npx vite")
            return
          }
          if (fileNames.includes("trunk.toml")) {
            setHasDevServer(true)
            setDevCommand("trunk serve")
            return
          }
        } catch {
          /* ignore */
        }

        if (!running) {
          setHasDevServer(false)
          setDevCommand(null)
        }
      } catch {
        if (!cancelled && !running) {
          setHasDevServer(false)
          setDevCommand(null)
        }
      }
    }

    checkProject()
    return () => {
      cancelled = true
    }
  }, [directory])

  const stopDevServer = useCallback(async () => {
    if (!directory) return
    const running = runningServers.get(directory)
    if (running) {
      try {
        await shell.pty.kill(running.ptyId)
      } catch {
        /* ignore */
      }
      runningServers.delete(directory)
    }
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
    setStatus("idle")
    setServerUrl(null)
  }, [directory])

  const startDevServer = useCallback(async (): Promise<string> => {
    if (!directory || !devCommand) {
      throw new Error("No hay comando dev configurado")
    }

    const existing = runningServers.get(directory)
    if (existing && existing.url) {
      setStatus("running")
      setServerUrl(existing.url)
      return existing.url
    }

    setStatus("starting")
    try {
      const ptyRes = await shell.pty.create(directory)
      const ptyId = ptyRes.id

      // Send the dev command to PTY
      await shell.pty.write(ptyId, `${devCommand}\n`)

      return new Promise<string>((resolve) => {
        let cursor = 0
        let foundUrl: string | null = null
        let attempts = 0

        const checkOutput = async () => {
          attempts++
          try {
            const buf = await shell.pty.poll(ptyId, cursor)
            if (buf && buf.data) {
              cursor += buf.len
              // Extract localhost URL
              const match = buf.data.match(/(https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]):(\d+)(\/[^\s]*)?)/i)
              if (match) {
                let u = match[1]
                if (u.includes("0.0.0.0")) u = u.replace("0.0.0.0", "localhost")
                if (u.includes("[::1]")) u = u.replace("[::1]", "localhost")
                foundUrl = u
              }
            }
          } catch {
            /* ignore */
          }

          if (foundUrl) {
            if (pollRef.current) {
              window.clearInterval(pollRef.current)
              pollRef.current = null
            }
            runningServers.set(directory, { ptyId, url: foundUrl, command: devCommand })
            setStatus("running")
            setServerUrl(foundUrl)
            resolve(foundUrl)
            return
          }

          // After ~3.5 seconds without explicit URL detection, fallback to default port 5173
          if (attempts >= 14) {
            if (pollRef.current) {
              window.clearInterval(pollRef.current)
              pollRef.current = null
            }
            const fallbackUrl = "http://localhost:5173"
            runningServers.set(directory, { ptyId, url: fallbackUrl, command: devCommand })
            setStatus("running")
            setServerUrl(fallbackUrl)
            resolve(fallbackUrl)
          }
        }

        pollRef.current = window.setInterval(checkOutput, 250)
      })
    } catch (err: any) {
      setStatus("error")
      throw err
    }
  }, [directory, devCommand])

  return {
    hasDevServer,
    devCommand,
    status,
    serverUrl,
    startDevServer,
    stopDevServer,
  }
}
