import { useCallback, useEffect, useRef, useState } from "react"
import { useLocalStorage } from "../hooks/useLocalStorage"
import { STORAGE_KEYS } from "../constants"
import { DEFAULT_SIGNALING_URL, type TunnelConfig } from "../types"
import { TunnelTransport } from "./TunnelTransport"

export type TunnelStatus = "idle" | "connecting" | "connected" | "disconnected" | "error"

const EMPTY_CONFIG: TunnelConfig = { name: "", password: "", signalingURL: DEFAULT_SIGNALING_URL }

export function useRemoteTunnel() {
  const [tunnelConfig, setTunnelConfig] = useLocalStorage<TunnelConfig>(STORAGE_KEYS.TUNNEL, EMPTY_CONFIG)
  const [status, setStatus] = useState<TunnelStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const transportRef = useRef<TunnelTransport | null>(null)

  useEffect(() => {
    const t = new TunnelTransport()
    transportRef.current = t

    t.onStatus((s) => {
      if (s === "connected") setStatus("connected")
      else if (s === "connecting") setStatus("connecting")
      else if (s === "disconnected") setStatus("disconnected")
      else if (s === "error") setStatus("error")
    })

    t.onError((err) => setError(err))

    return () => {
      t.disconnect()
      transportRef.current = null
    }
  }, [])

  const connect = useCallback(async (config: TunnelConfig) => {
    const t = transportRef.current
    if (!t) return
    setError(null)
    setStatus("connecting")
    try {
      await t.connect(config)
      setTunnelConfig(config)
      setStatus("connected")
    } catch (err: any) {
      setError(err.message || "Connection failed")
      setStatus("error")
    }
  }, [setTunnelConfig])

  const disconnect = useCallback(() => {
    transportRef.current?.disconnect()
    setStatus("disconnected")
    setError(null)
  }, [])

  const request = useCallback(async (method: string, path: string, body?: string, headers?: Record<string, string>) => {
    const t = transportRef.current
    if (!t || !t.connected) throw new Error("Tunnel not connected")
    return t.request(method, path, body, headers)
  }, [])

  return {
    tunnelConfig,
    setTunnelConfig,
    status,
    error,
    setError,
    connect,
    disconnect,
    transport: transportRef.current,
    request,
  }
}
