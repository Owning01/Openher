import { useCallback, useEffect, useRef, useState } from "react"
import { App } from "@capacitor/app"
import { Capacitor, registerPlugin } from "@capacitor/core"
import { Directory, Filesystem } from "@capacitor/filesystem"
import { shell, remoteShellBase, type AppVersionInfo } from "../shell"
import { blobToBase64 } from "../utils"

// Plugin nativo del proyecto (android/.../AppInstallerPlugin.java): abre el
// instalador del sistema con la APK descargada. En web no existe.
type AppInstallerPlugin = { install: (opts: { name: string }) => Promise<{ ok?: boolean }> }

const AppInstaller = (() => {
  try {
    return Capacitor.isNativePlatform() ? registerPlugin<AppInstallerPlugin>("AppInstaller") : null
  } catch {
    return null
  }
})()

const APK_FILE = "openher-update.apk"
const CHECK_THROTTLE_MS = 60_000
// No competir con el arranque (sesiones, SSE) ni con el usuario.
const FIRST_CHECK_DELAY_MS = 4_000
const DESKTOP_RECHECK_MS = 5 * 60_000

export type AppUpdateStatus = "idle" | "checking" | "available" | "downloading" | "installing" | "error"

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/** La web corre dentro del shell Rust (desktop). */
export function isDesktopShell(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __OPENHER_DESKTOP__?: boolean }).__OPENHER_DESKTOP__
}

export function supportsAppUpdate(): boolean {
  return isNativeApp() || isDesktopShell()
}

/**
 * Auto-update de OpenHer.
 *
 * - APK: consulta la última versión publicada (openher-version.json), compara
 *   con la instalada (App.getInfo().build), descarga /openher.apk y abre el
 *   instalador del sistema.
 * - Desktop con server REMOTO (notebook contra la máquina que compila):
 *   consulta el shell remoto (:4848 del host del server), compara con la
 *   versión local (build-info.json) y aplica el zip `openher-desktop.zip`
 *   (el shell Rust descarga, reemplaza el exe + web-dist y relanza solo).
 */
export function useAppUpdate() {
  const [status, setStatus] = useState<AppUpdateStatus>("idle")
  const [info, setInfo] = useState<AppVersionInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const localBuildRef = useRef(0)
  const lastCheckRef = useRef(0)
  const aliveRef = useRef(true)

  const check = useCallback(async (force = false) => {
    if (!supportsAppUpdate()) return
    const now = Date.now()
    if (!force && now - lastCheckRef.current < CHECK_THROTTLE_MS) return
    lastCheckRef.current = now
    setStatus((s) => (s === "downloading" || s === "installing" ? s : "checking"))
    try {
      if (isNativeApp()) {
        const local = await App.getInfo()
        localBuildRef.current = Number(local.build) || 0
        const remote = await shell.appVersion()
        if (!aliveRef.current) return
        if (remote && remote.versionCode > localBuildRef.current) {
          setInfo(remote)
          setError(null)
          setStatus("available")
        } else {
          setStatus((s) => (s === "downloading" || s === "installing" ? s : "idle"))
        }
        return
      }
      // Desktop: solo actualiza desde el shell remoto (la máquina que compila).
      const base = remoteShellBase()
      if (!base) {
        setStatus((s) => (s === "downloading" || s === "installing" ? s : "idle"))
        return
      }
      const [remote, local] = await Promise.all([shell.appVersionFrom(base), shell.desktopVersion()])
      if (!aliveRef.current) return
      const remoteCode = remote?.desktop?.versionCode ?? 0
      const localCode = local?.versionCode ?? 0
      if (remote?.desktop && remoteCode > localCode) {
        setInfo(remote)
        setError(null)
        setStatus("available")
      } else {
        setStatus((s) => (s === "downloading" || s === "installing" ? s : "idle"))
      }
    } catch (e) {
      if (!aliveRef.current) return
      setStatus((s) => (s === "downloading" || s === "installing" ? s : "error"))
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  const install = useCallback(async () => {
    if (!info) return
    if (isDesktopShell() && !isNativeApp()) {
      const base = remoteShellBase()
      if (!base || !info.desktop) {
        setStatus("error")
        setError("No hay shell remoto disponible para actualizar")
        return
      }
      setStatus("downloading")
      setError(null)
      try {
        await shell.desktopUpdate(`${base}/${info.desktop.file}`, info.desktop.sha256)
        if (!aliveRef.current) return
        setStatus("installing")
        // Poll del progreso: el shell cierra la app al quedar "ready".
        for (let i = 0; i < 600; i++) {
          await new Promise((r) => setTimeout(r, 1500))
          const st = await shell.desktopUpdateStatus()
          if (!st) return // la app ya se está reiniciando
          if (st.state === "error") {
            setStatus("error")
            setError(st.error ?? "No se pudo aplicar la actualización")
            return
          }
          if (st.state === "ready") return
        }
      } catch (e) {
        if (!aliveRef.current) return
        setStatus("error")
        setError(e instanceof Error ? e.message : String(e))
      }
      return
    }

    if (!AppInstaller) {
      setStatus("error")
      setError("Instalador no disponible en este dispositivo")
      return
    }
    setStatus("downloading")
    setError(null)
    try {
      const blob = await shell.downloadApk()
      const b64 = await blobToBase64(blob)
      await Filesystem.writeFile({ path: APK_FILE, data: b64, directory: Directory.Cache, recursive: true })
      if (!aliveRef.current) return
      setStatus("installing")
      await AppInstaller.install({ name: APK_FILE })
      if (aliveRef.current) setStatus("available")
    } catch (e) {
      if (!aliveRef.current) return
      setStatus("error")
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [info])

  useEffect(() => {
    aliveRef.current = true
    if (!supportsAppUpdate()) return
    const timer = setTimeout(() => {
      void check()
    }, FIRST_CHECK_DELAY_MS)
    let sub: { remove: () => void } | null = null
    if (isNativeApp()) {
      App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) void check()
      })
        .then((handle) => { sub = handle })
        .catch(() => undefined)
    } else {
      const onVisible = () => {
        if (document.visibilityState === "visible") void check()
      }
      document.addEventListener("visibilitychange", onVisible)
      const interval = window.setInterval(() => void check(), DESKTOP_RECHECK_MS)
      return () => {
        aliveRef.current = false
        clearTimeout(timer)
        window.clearInterval(interval)
        document.removeEventListener("visibilitychange", onVisible)
      }
    }
    return () => {
      aliveRef.current = false
      clearTimeout(timer)
      sub?.remove()
    }
  }, [check])

  return { status, info, error, check, install }
}
