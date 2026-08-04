import { useEffect, useCallback } from "react"
import { App } from "@capacitor/app"
import type { DeepLinkAction } from "../types"

type DeepLinkHandler = (action: DeepLinkAction) => void

function parseDeepLink(url: string): DeepLinkAction | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "opencode:") return null

    const hostname = parsed.hostname

    // opencode://tunnel?id=...&name=... — QR generado por el exe de tunnel
    if (hostname === "tunnel") {
      const tunnelID = parsed.searchParams.get("id") ?? ""
      const tunnelName = parsed.searchParams.get("name") ?? ""
      if (!tunnelName) return null
      return { kind: "tunnel", tunnelName, tunnelID }
    }

    // opencode://session/<id>?directory=... — abrir sesión directa
    if (hostname === "session") {
      const sessionID = parsed.pathname.replace(/^\//, "").split("/")[0] ?? ""
      if (!sessionID) return null
      return {
        kind: "session",
        sessionID,
        directory: parsed.searchParams.get("directory") ?? undefined,
      }
    }

    // opencode://connect?host=...&port=...&username=...
    const host = parsed.searchParams.get("host")
    if (host) {
      const port = parsed.searchParams.get("port")
      const parsedPort = port ? parseInt(port, 10) : 4096
      return {
        kind: "server",
        host,
        port: Number.isFinite(parsedPort) ? parsedPort : 4096,
        username: parsed.searchParams.get("username") || "",
      }
    }

    return null
  } catch { console.error("[DeepLink] invalid URL:", url); return null }
}

export function useDeepLink(onDeepLink: DeepLinkHandler) {
  const handleUrl = useCallback((url: string) => {
    const action = parseDeepLink(url)
    if (action) onDeepLink(action)
  }, [onDeepLink])

  useEffect(() => {
    const listener = App.addListener("appUrlOpen", (data) => {
      handleUrl(data.url)
    })
    return () => { listener.then((l) => l.remove()) }
  }, [handleUrl])

  return { handleUrl }
}
