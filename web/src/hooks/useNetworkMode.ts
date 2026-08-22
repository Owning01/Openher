import { useEffect } from "react"
import { Network } from "@capacitor/network"
import type { DataMode } from "../types"

const isDesktopShell = () =>
  typeof window !== "undefined" && !!(window as any).__OPENCODE_DESKTOP__

// Red "sólida": wifi o ethernet (nunca cellular) → full, trayendo todo sin demora.
function isSolidConnection(type: string): boolean {
  return type === "wifi" || type === "ethernet"
}

export function useNetworkMode(changeDataMode: (mode: DataMode) => void) {
  useEffect(() => {
    let cancelled = false

    const apply = (s: { connectionType?: string }) => {
      if (cancelled) return
      // Escritorio: SIEMPRE full (independiente de la red del host).
      if (isDesktopShell()) {
        changeDataMode("full")
        return
      }
      const t = s.connectionType ?? ""
      if (isSolidConnection(t)) {
        changeDataMode("full")
      } else if (t === "cellular") {
        changeDataMode("ultra")
      }
      // none / unknown → no tocar la elección del usuario.
    }

    Network.getStatus().then(apply).catch(() => {
      // Sin plugin de red (p.ej. web/desktop sin capacitor): si es desktop → full.
      if (isDesktopShell()) changeDataMode("full")
    })

    let netH: any
    Network.addListener("networkStatusChange", apply).then((hnd) => { netH = hnd })
    return () => { cancelled = true; if (netH) netH.remove() }
  }, [changeDataMode])
}
