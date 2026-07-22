import { useCallback } from "react"
import { useLocalStorage } from "./useLocalStorage"

export type NotificationFlags = {
  onCompletion: boolean
  onQuestion: boolean
  onError: boolean
}

const STORAGE_KEY = "opencode.mobile.notificationFlags"

const DEFAULT_FLAGS: NotificationFlags = {
  onCompletion: true,
  onQuestion: true,
  onError: true,
}

export function useNotifications() {
  const [flags, setFlags] = useLocalStorage<NotificationFlags>(STORAGE_KEY, DEFAULT_FLAGS)

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

  return { notify, flags, setFlags, DEFAULT_FLAGS }
}
