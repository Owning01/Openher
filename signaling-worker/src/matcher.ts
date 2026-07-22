function makeID(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

type PeerInfo = {
  role: "server" | "client"
  name: string
  password: string
  ws: WebSocket
}

export class TunnelMatcher implements DurableObject {
  private servers = new Map<string, PeerInfo>()
  private clients = new Map<string, PeerInfo>()
  private pendingByServer = new Map<string, WebSocket[]>()

  async fetch(request: Request): Promise<Response> {
    return new Response("Durable Object internal", { status: 200 })
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    let msg: any
    try {
      msg = JSON.parse(message)
    } catch {
      ws.send(JSON.stringify({ type: "error", error: "invalid JSON" }))
      return
    }

    switch (msg.type) {
      case "register":
        this.handleRegister(ws, msg)
        break
      case "connect":
        this.handleConnect(ws, msg)
        break
      case "signal":
        this.handleSignal(ws, msg)
        break
      default:
        ws.send(JSON.stringify({ type: "error", error: `unknown type: ${msg.type}` }))
    }
  }

  private handleRegister(ws: WebSocket, msg: any) {
    const { name, password } = msg
    if (!name || !password) {
      ws.send(JSON.stringify({ type: "error", error: "name and password required" }))
      return
    }

    const id = makeID(8)
    this.servers.set(id, { role: "server", name, password, ws })
    ws.send(JSON.stringify({ type: "registered", tunnelId: id, name }))
    console.log(`[register] server "${name}" registered as ${id}`)
  }

  private handleConnect(ws: WebSocket, msg: any) {
    const { name, password, tunnelId } = msg

    let server: PeerInfo | undefined
    if (tunnelId) {
      server = this.servers.get(tunnelId)
    } else if (name) {
      server = Array.from(this.servers.values()).find(s => s.name === name)
    }

    if (!server) {
      ws.send(JSON.stringify({ type: "error", error: "tunnel not found" }))
      return
    }

    if (server.password !== password) {
      ws.send(JSON.stringify({ type: "error", error: "invalid password" }))
      return
    }

    this.clients.set(ws as any, { role: "client", name, password, ws })

    const sid = makeID(8)
    server.ws.send(JSON.stringify({
      type: "peer_offer",
      sessionId: sid,
    }))

    this.pendingByServer.set(sid, [server.ws, ws])
    ws.send(JSON.stringify({ type: "connecting", sessionId: sid }))
  }

  private handleSignal(ws: WebSocket, msg: any) {
    const { sessionId, sdp, ice } = msg
    const pair = this.pendingByServer.get(sessionId)
    if (!pair) {
      ws.send(JSON.stringify({ type: "error", error: "invalid session" }))
      return
    }

    const [serverWs, clientWs] = pair
    const target = ws === serverWs ? clientWs : serverWs

    target.send(JSON.stringify({
      type: "signal",
      sessionId,
      sdp,
      ice,
    }))
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string) {
    for (const [id, info] of this.servers) {
      if (info.ws === ws) {
        this.servers.delete(id)
        for (const [sid, pair] of this.pendingByServer) {
          if (pair[0] === ws || pair[1] === ws) {
            this.pendingByServer.delete(sid)
            const other = pair[0] === ws ? pair[1] : pair[0]
            try { other.close(1011, "server disconnected") } catch {}
          }
        }
        console.log(`[close] server "${info.name}" disconnected`)
        return
      }
    }
    for (const [key, info] of this.clients) {
      if (info.ws === ws) {
        this.clients.delete(key)
        console.log(`[close] client "${info.name}" disconnected`)
        return
      }
    }
  }
}
