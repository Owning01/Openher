import { useCallback, useEffect, useRef } from "react"
import { Capacitor } from "@capacitor/core"
import { PushNotifications } from "@capacitor/push-notifications"
import { notify } from "./useNotifications"

// Notificaciones push (FCM) — requieren google-services.json en el proyecto
// Android para funcionar. Sin la credencial, el registro falla silenciosamente
// y la app sigue usando notificaciones in-app.
export function usePushNotifications(enabled: boolean) {
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const register = useCallback(async () => {
    if (!enabledRef.current) return
    if (!Capacitor.isNativePlatform()) return
    try {
      let granted = await PushNotifications.checkPermissions()
      if (granted.receive !== "granted") {
        granted = await PushNotifications.requestPermissions()
      }
      if (granted.receive !== "granted") return
      await PushNotifications.register()
    } catch { /* FCM sin google-services.json: ignorar */ }
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !enabledRef.current) return
    const reg = PushNotifications.addListener("registration", (token) => {
      localStorage.setItem("opencode.push.token", token.value ?? "")
    })
    const notif = PushNotifications.addListener("pushNotificationReceived", (n) => {
      const title = n.title ?? "OpenCode"
      const body = n.body ?? ""
      notify(title, body)
    })
    register()
    return () => { reg.then((l) => l.remove()); notif.then((l) => l.remove()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { register }
}
