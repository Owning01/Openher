import type { TunnelConfig } from "../types"
import { computeBackoff } from "../utils"

type RequestResolve = {
  resolve: (value: { status: number; headers: Record<string, string>; body: string }) => void
  reject: (err: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

type SSEHandler = {
  onEvent: (event: { id: string; type: string; data: string }) => void
  onDone: () => void
  onError: (err: Error) => void
}

const TUNNEL_RECONNECT_BASE_MS = 1_000
const TUNNEL_RECONNECT_MAX_MS = 30_000
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }]

export class TunnelTransport {
  private ws: WebSocket | null = null
  private pc: RTCPeerConnection | null = null
  private dc: RTCDataChannel | null = null
  private config: TunnelConfig | null = null
  private reqId = 0
  private pending = new Map<string, RequestResolve>()
  private sseHandlers = new Map<string, SSEHandler>()
  private _connected = false
  private _onStatus: ((status: string) => void) | null = null
  private _onError: ((err: string) => void) | null = null
  private _connectReject: ((err: Error) => void) | null = null
  private _connectResolve: (() => void) | null = null
  private reconnectAttempt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private stopped = false

  get connected() { return this._connected }

  onStatus(fn: (status: string) => void) { this._onStatus = fn }
  onError(fn: (err: string) => void) { this._onError = fn }

  async connect(config: TunnelConfig): Promise<void> {
    this.config = config
    this.stopped = false
    this.reconnectAttempt = 0
    this.setStatus("connecting")

    const wsURL = config.signalingURL
    this.ws = new WebSocket(wsURL)

    return new Promise((resolve, reject) => {
      if (!this.ws) return reject(new Error("WebSocket not created"))
      this._connectReject = reject
      this._connectResolve = resolve

      this.ws.onopen = () => {
        this.ws!.send(JSON.stringify({
          type: "connect",
          name: config.name,
          password: config.password,
        }))
      }

      this.ws.onmessage = async (evt) => {
        const msg = JSON.parse(evt.data)
        await this.handleSignaling(msg, reject)
      }

      this.ws.onerror = () => {
        this.setStatus("error")
        this._connectReject = null
        reject(new Error("Signaling connection failed"))
      }

      this.ws.onclose = () => {
        if (!this._connected) {
          this.setStatus("disconnected")
          if (this._connectReject) {
            this._connectReject(new Error("Signaling closed"))
            this._connectReject = null
          }
          this.scheduleReconnect()
        }
      }
    })
  }

  private scheduleReconnect() {
    if (this.stopped || this.reconnectTimer) return
    const delay = computeBackoff(TUNNEL_RECONNECT_BASE_MS, TUNNEL_RECONNECT_MAX_MS, this.reconnectAttempt++)
    this.setStatus("connecting")
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.stopped || !this.config) return
      this.connect(this.config).catch(() => { /* error already surfaced via onError/status */ })
    }, delay)
  }

  private async handleSignaling(msg: any, reject: (err: Error) => void) {
    switch (msg.type) {
      case "error": {
        this.setStatus("error")
        this._connectReject = null
        this._onError?.(msg.error)
        reject(new Error(msg.error))
        break
      }
      case "connecting": {
        break
      }
      case "signal": {
        if (msg.sdp) {
          await this.handleRemoteSDP(msg.sdp)
        }
        break
      }
      default:
        break
    }
  }

  private async handleRemoteSDP(sdpJSON: string) {
    const config: RTCConfiguration = {
      iceServers: this.config?.iceServers?.length ? this.config.iceServers : DEFAULT_ICE_SERVERS,
    }

    this.pc = new RTCPeerConnection(config)

    this.pc.onicecandidate = (evt) => {
      if (evt.candidate && this.ws && this.config) {
        this.ws.send(JSON.stringify({
          type: "signal",
          sessionId: this.config.name,
          ice: JSON.stringify(evt.candidate.toJSON()),
        }))
      }
    }

    this.pc.ondatachannel = (evt) => {
      this.dc = evt.channel
      this.setupDataChannel()
    }

    this.pc.oniceconnectionstatechange = () => {
      if (this.pc?.iceConnectionState === "disconnected" ||
          this.pc?.iceConnectionState === "failed") {
        this._connected = false
        this.setStatus("disconnected")
        this.pc?.close()
        this.pc = null
        this.dc = null
        this.scheduleReconnect()
      }
    }

    const sdp = JSON.parse(sdpJSON) as RTCSessionDescriptionInit
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp))

    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)

    if (this.ws && this.config) {
      this.ws.send(JSON.stringify({
        type: "signal",
        sessionId: this.config.name,
        sdp: JSON.stringify(answer),
      }))
    }
  }

  private setupDataChannel() {
    if (!this.dc) return

    this.dc.onopen = () => {
      this.reconnectAttempt = 0
      this._connected = true
      this.setStatus("connected")
      if (this._connectResolve) {
        this._connectResolve()
        this._connectResolve = null
        this._connectReject = null
      }
    }

    this.dc.onclose = () => {
      this._connected = false
      this.setStatus("disconnected")
      this.scheduleReconnect()
    }

    this.dc.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data)
        this.handleDataChannelMessage(msg)
      } catch { /* ignore parse errors */ }
    }
  }

  private handleDataChannelMessage(msg: any) {
    if (msg.type === "event" && msg.id) {
      const handler = this.sseHandlers.get(msg.id)
      if (handler) {
        if (msg.done) {
          handler.onDone()
          this.sseHandlers.delete(msg.id)
        } else {
          handler.onEvent(msg)
        }
      }
      return
    }

    if (msg.id) {
      const pending = this.pending.get(msg.id)
      if (pending) {
        clearTimeout(pending.timeout)
        this.pending.delete(msg.id)
        if (msg.type === "error") {
          pending.reject(new Error(msg.body || "request failed"))
        } else {
          pending.resolve({
            status: msg.status || 500,
            headers: msg.headers || {},
            body: msg.body || "",
          })
        }
      }
    }
  }

  async request(method: string, path: string, body?: string, headers?: Record<string, string>): Promise<{ status: number; headers: Record<string, string>; body: string }> {
    if (!this.dc || this.dc.readyState !== "open") {
      throw new Error("Tunnel not connected")
    }

    const id = `req_${++this.reqId}`
    const msg = { id, method, path, body, headers: headers || {} }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Request timeout: ${method} ${path}`))
      }, 30000)

      this.pending.set(id, { resolve, reject, timeout })
      this.dc!.send(JSON.stringify(msg))
    })
  }

  async subscribeSSE(path: string, onEvent: (event: any) => void, onDone: () => void, onError: (err: Error) => void): Promise<string> {
    if (!this.dc || this.dc.readyState !== "open") {
      throw new Error("Tunnel not connected")
    }

    const id = `sse_${++this.reqId}`
    const msg = { id, method: "GET", path, type: "sse" }

    this.sseHandlers.set(id, {
      onEvent: (evt) => onEvent(evt),
      onDone,
      onError,
    })

    this.dc.send(JSON.stringify(msg))
    return id
  }

  disconnect() {
    this.stopped = true
    this._connected = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.dc?.close()
    this.pc?.close()
    this.ws?.close()
    this.dc = null
    this.pc = null
    this.ws = null
    this.pending.clear()
    this.sseHandlers.clear()
    this._connectResolve = null
    this._connectReject = null
    this.setStatus("disconnected")
  }

  private setStatus(status: string) {
    this._onStatus?.(status)
  }
}
