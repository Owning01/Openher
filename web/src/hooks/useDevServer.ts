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
const runningServers = new Map<string, { ptyId: string; url: string; command: string; cwd: string | null }>()

// Subdirectorios típicos de monorepos donde vive el package.json con scripts.dev.
// La raíz de un monorepo suele NO tener script dev propio (ej: opencode-remote-android/web).
const SUBDIR_PRIORITY = ["web", "app", "client", "frontend", "ui", "www", "apps/web", "packages/web"]
const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".next", ".vite", ".git", "target", "vendor", "out", ".output"])

async function detectCmdInPkg(dir: string): Promise<{ cmd: string } | null> {
  try {
    const res = await shell.fs.read(`${dir}/package.json`)
    if (!res?.content) return null
    const pkg = JSON.parse(res.content)
    const scripts = pkg.scripts || {}
    let pm = "npm run"
    try {
      const list = await shell.fs.list(dir)
      const files = (list.files || []).map((f: { name: string }) => f.name.toLowerCase())
      if (files.includes("pnpm-lock.yaml")) pm = "pnpm"
      else if (files.includes("bun.lockb") || files.includes("bun.lock")) pm = "bun"
      else if (files.includes("yarn.lock")) pm = "yarn"
    } catch {
      /* ignore */
    }
    if (scripts.dev) return { cmd: pm === "npm run" ? "npm run dev" : `${pm} dev` }
    if (scripts.start) return { cmd: pm === "npm run" ? "npm start" : `${pm} start` }
    if (scripts.serve) return { cmd: pm === "npm run" ? "npm run serve" : `${pm} serve` }
  } catch {
    /* ignore */
  }
  return null
}

export function useDevServer(directory?: string | null): DevServerInfo & { devCwd: string | null } {
  const [hasDevServer, setHasDevServer] = useState(false)
  const [devCommand, setDevCommand] = useState<string | null>(null)
  const [devCwd, setDevCwd] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "starting" | "running" | "error">("idle")
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const pollRef = useRef<number | null>(null)

  // Check if directory has an active server in memory
  useEffect(() => {
    if (!directory) {
      setHasDevServer(false)
      setDevCommand(null)
      setDevCwd(null)
      setStatus("idle")
      setServerUrl(null)
      return
    }

    const running = runningServers.get(directory)
    if (running) {
      setHasDevServer(true)
      setDevCommand(running.command)
      setDevCwd(running.cwd)
      setStatus("running")
      setServerUrl(running.url)
    }

    // Inspect directory for web dev scripts
    let cancelled = false
    const checkProject = async () => {
      try {
        const sep = directory.includes("\\") ? "\\" : "/"
        const base = directory.endsWith(sep) ? directory.slice(0, -1) : directory
        const pkgPath = `${base}${sep}package.json`

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
              setDevCwd(null)
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
            setDevCwd(null)
            return
          }
          if (fileNames.includes("trunk.toml")) {
            setHasDevServer(true)
            setDevCommand("trunk serve")
            setDevCwd(null)
            return
          }
        } catch {
          /* ignore */
        }

        // Monorepo: la raíz no tiene script dev propio → escanear UN nivel de
        // subdirectorios (web/, apps/*, etc.) buscando package.json con dev/start/serve.
        try {
          const list = await shell.fs.list(directory)
          const dirNames = ((list.files || []) as Array<{ name: string; is_dir: boolean }>)
            .filter((f) => f.is_dir && !SKIP_DIRS.has(f.name.toLowerCase()))
            .map((f) => f.name)

          const trySub = async (name: string): Promise<string | null> => {
            const r = await detectCmdInPkg(`${base}${sep}${name}`)
            return r ? r.cmd : null
          }

          let found: { sub: string; cmd: string } | null = null
          for (const cand of SUBDIR_PRIORITY) {
            if (!dirNames.includes(cand)) continue
            const cmd = await trySub(cand)
            if (cmd) { found = { sub: cand, cmd }; break }
          }
          if (!found) {
            let n = 0
            for (const name of dirNames) {
              if (++n > 24) break
              if (SUBDIR_PRIORITY.includes(name)) continue
              const cmd = await trySub(name)
              if (cmd) { found = { sub: name, cmd }; break }
            }
          }
          if (cancelled) return
          if (found) {
            setHasDevServer(true)
            setDevCommand(found.cmd)
            setDevCwd(`${base}${sep}${found.sub}`)
            return
          }
        } catch {
          /* ignore */
        }

        if (!running) {
          setHasDevServer(false)
          setDevCommand(null)
          setDevCwd(null)
        }
      } catch {
        if (!cancelled && !running) {
          setHasDevServer(false)
          setDevCommand(null)
          setDevCwd(null)
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

    // En monorepos el comando corre en el subdirectorio detectado, no en la raíz
    const cwd = devCwd ?? directory

    setStatus("starting")
    try {
      const ptyRes = await shell.pty.create(cwd)
      const ptyId = ptyRes.id

      // Send the dev command to PTY
      await shell.pty.write(ptyId, `${devCommand}\n`)

      return new Promise<string>((resolve) => {
        let cursor = 0
        let foundUrl: string | null = null
        let attempts = 0
        let fullOutput = ""

        const cleanAnsi = (str: string) => str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "").replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "")

        const probeUrl = async (testUrl: string): Promise<boolean> => {
          try {
            const controller = new AbortController()
            const id = setTimeout(() => controller.abort(), 800)
            await fetch(testUrl, { mode: "no-cors", signal: controller.signal, cache: "no-store" })
            clearTimeout(id)
            return true
          } catch {
            return false
          }
        }

        const checkOutput = async () => {
          attempts++
          try {
            const buf = await shell.pty.poll(ptyId, cursor)
            if (buf && buf.data) {
              cursor = buf.len
              const txt = atob(buf.data)
              const clean = cleanAnsi(txt)
              fullOutput += clean

              const match = clean.match(/(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]):(\d+)(?:\/[^\s'"<>()]*)?)/i)
                || fullOutput.match(/(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]):(\d+)(?:\/[^\s'"<>()]*)?)/i)

              if (match) {
                let u = match[1]
                if (u.includes("0.0.0.0")) u = u.replace("0.0.0.0", "127.0.0.1")
                if (u.includes("[::1]")) u = u.replace("[::1]", "127.0.0.1")
                if (u.includes("localhost")) u = u.replace("localhost", "127.0.0.1")
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
            runningServers.set(directory, { ptyId, url: foundUrl, command: devCommand, cwd })
            setStatus("running")
            setServerUrl(foundUrl)
            resolve(foundUrl)
            return
          }

          // A partir del intento 8 (~2s), sondear puertos dev estándar si ya están escuchando
          if (attempts >= 8 && attempts % 4 === 0) {
            const portsToTry = ["5173", "3000", "5174", "8080", "4321", "8000"]
            for (const p of portsToTry) {
              const testUrl = `http://127.0.0.1:${p}`
              const isOpen = await probeUrl(testUrl)
              if (isOpen) {
                if (pollRef.current) {
                  window.clearInterval(pollRef.current)
                  pollRef.current = null
                }
                runningServers.set(directory, { ptyId, url: testUrl, command: devCommand, cwd })
                setStatus("running")
                setServerUrl(testUrl)
                resolve(testUrl)
                return
              }
            }
          }

          // Timeout tras 25 segundos (100 intentos x 250ms)
          if (attempts >= 100) {
            if (pollRef.current) {
              window.clearInterval(pollRef.current)
              pollRef.current = null
            }
            const fallbackUrl = "http://127.0.0.1:5173"
            runningServers.set(directory, { ptyId, url: fallbackUrl, command: devCommand, cwd })
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
  }, [directory, devCommand, devCwd])

  return {
    hasDevServer,
    devCommand,
    devCwd,
    status,
    serverUrl,
    startDevServer,
    stopDevServer,
  }
}
