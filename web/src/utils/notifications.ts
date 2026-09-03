import { Capacitor } from "@capacitor/core"
import { LocalNotifications } from "@capacitor/local-notifications"

export type NativeNotify = {
  canNotify: boolean
  send: (title: string, body?: string, icon?: string) => Promise<void>
}

function createNativeNotify(): NativeNotify {
  return {
    canNotify: Capacitor.isNativePlatform(),
    send: async (title, body, icon) => {
      if (!Capacitor.isNativePlatform()) return
      try {
        let perm = await LocalNotifications.checkPermissions()
        if (perm.display !== "granted") {
          perm = await LocalNotifications.requestPermissions()
        }
        if (perm.display !== "granted") return
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Date.now() / 1000) % 2147483647,
              title,
              body: body ?? "",
              ...(icon ? { smallIcon: icon, iconColor: "#a1a1aa" } : {}),
            },
          ],
        })
      } catch {
        /* sin soporte nativo: ignorar */
      }
    },
  }
}

export function sendNotification(title: string, body?: string, icon?: string) {
  if (Capacitor.isNativePlatform()) {
    void createNativeNotify().send(title, body, icon)
    return
  }
  if (!("Notification" in window)) return
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon })
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((p) => {
      if (p === "granted") new Notification(title, { body, icon })
    })
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.checkPermissions()
      if (perm.display === "granted") return true
      const requested = await LocalNotifications.requestPermissions()
      return requested.display === "granted"
    } catch {
      return false
    }
  }
  if (!("Notification" in window)) return false
  if (Notification.permission === "granted") return true
  if (Notification.permission === "denied") return false
  const p = await Notification.requestPermission()
  return p === "granted"
}
