import { useEffect, useCallback } from "react"
import { App } from "@capacitor/app"
import type { ServerConfig } from "../types"

type DeepLinkHandler = (config: Partial<ServerConfig>) => void

export function useDeepLink(onDeepLink: DeepLinkHandler) {
  const handleUrl = useCallback((url: string) => {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== "opencode:") return
      const host = parsed.searchParams.get("host")
      const port = parsed.searchParams.get("port")
      const username = parsed.searchParams.get("username")
      if (host) {
        const parsedPort = port ? parseInt(port, 10) : 4096
        onDeepLink({
          host,
          port: Number.isFinite(parsedPort) ? parsedPort : 4096,
          username: username || "",
        })
      }
    } catch { console.error("[DeepLink] invalid URL:", url) }
  }, [onDeepLink])

  useEffect(() => {
    const listener = App.addListener("appUrlOpen", (data) => {
      handleUrl(data.url)
    })
    return () => { listener.then((l) => l.remove()) }
  }, [handleUrl])

  return { handleUrl }
}
