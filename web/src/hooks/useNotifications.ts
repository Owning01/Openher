import { useCallback } from "react"

export type NotificationFlags = {
  onCompletion: boolean
  onQuestion: boolean
  onError: boolean
}

const STORAGE_KEY = "opencode.mobile.notificationFlags"

export function loadNotificationFlags(): NotificationFlags {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_FLAGS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_FLAGS }
}

export function saveNotificationFlags(flags: NotificationFlags) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(flags)) } catch { /* ignore */ }
}

const DEFAULT_FLAGS: NotificationFlags = {
  onCompletion: true,
  onQuestion: true,
  onError: true,
}

export function useNotifications() {
  const notify = useCallback((title: string, body: string) => {
    if (!("Notification" in window)) return
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/img/opencode-logo-dark.jpg" })
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body, icon: "/img/opencode-logo-dark.jpg" })
        }
      })
    }
  }, [])

  return { notify, DEFAULT_FLAGS, STORAGE_KEY }
}
