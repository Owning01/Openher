import { useCallback, useEffect } from "react"
import { useLocalStorage } from "./useLocalStorage"
import { sendNotification, requestNotificationPermission } from "../utils/notifications"

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

export function notify(title: string, body: string) {
  sendNotification(title, body, "/img/openher-mark-180.png")
}

export function useNotifications() {
  const [flags, setFlags] = useLocalStorage<NotificationFlags>(STORAGE_KEY, DEFAULT_FLAGS)

  const showNotification = useCallback((title: string, body: string) => {
    notify(title, body)
  }, [])

  useEffect(() => {
    if (!flags.onCompletion && !flags.onQuestion && !flags.onError) return
    void requestNotificationPermission()
  }, [flags.onCompletion, flags.onQuestion, flags.onError])

  return { notify: showNotification, flags, setFlags, DEFAULT_FLAGS }
}
