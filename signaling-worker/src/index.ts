export { TunnelMatcher } from "./matcher"

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 })
    }

    if (url.pathname === "/signal") {
      const upgrade = request.headers.get("Upgrade")
      if (upgrade !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 })
      }
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)

      const id = env.TUNNEL_MATCHER.idFromName("global")
      const stub = env.TUNNEL_MATCHER.get(id)
      stub.acceptWebSocket(server)

      return new Response(null, { status: 101, webSocket: client })
    }

    return new Response("Not found", { status: 404 })
  },
}

interface Env {
  TUNNEL_MATCHER: DurableObjectNamespace
}
