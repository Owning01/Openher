import { useCallback, useEffect, useRef, useState } from "react"
import { Capacitor, registerPlugin } from "@capacitor/core"

type SharedPayload = {
  text: string
  uri: string
  type: string
}

type ShareReceiverPluginShape = {
  getPendingShare: () => Promise<SharedPayload>
  clearPendingShare: () => Promise<void>
  addListener: (eventName: string, fn: (data: SharedPayload) => void) => Promise<{ remove: () => void }>
}

const ShareReceiver = registerPlugin<ShareReceiverPluginShape>("ShareReceiver")

export type PendingShare = SharedPayload & { present: boolean }

const EMPTY: PendingShare = { text: "", uri: "", type: "", present: false }

// Expone el texto/imagen recibido vía "Compartir a OpenCode" de Android.
// `onShared` se invoca cuando la app llega al frente con un share nuevo.
export function useShareReceiver(onShared?: (payload: PendingShare) => void) {
  const [pending, setPending] = useState<PendingShare>(EMPTY)
  const handlerRef = useRef(onShared)
  handlerRef.current = onShared

  useEffect(() => {
    // El plugin solo existe en el APK nativo; en web registerPlugin lanza
    // promesas rechazadas al invocar métodos.
    if (!Capacitor.isNativePlatform()) return

    let mounted = true

    ShareReceiver.getPendingShare().then((p) => {
      if (!mounted) return
      const value = normalize(p)
      if (value.present) {
        setPending(value)
        handlerRef.current?.(value)
        ShareReceiver.clearPendingShare().catch(() => {})
      }
    }).catch(() => { /* plugin solo existe en APK nativo */ })

    const listener = ShareReceiver.addListener("shared", (p) => {
      const value = normalize(p)
      setPending(value)
      handlerRef.current?.(value)
      ShareReceiver.clearPendingShare().catch(() => {})
    }).catch(() => null)

    return () => { mounted = false; listener.then((l) => l?.remove()).catch(() => {}) }
  }, [])

  const clear = useCallback(() => setPending(EMPTY), [])

  return { pendingShare: pending, clearShare: clear }
}

function normalize(p: SharedPayload): PendingShare {
  const text = (p.text ?? "").trim()
  const uri = (p.uri ?? "").trim()
  return { text, uri, type: p.type ?? "", present: Boolean(text || uri) }
}
