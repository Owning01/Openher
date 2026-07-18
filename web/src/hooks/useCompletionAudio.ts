import { useRef, useEffect, type MutableRefObject } from "react"
import type { DataMode } from "../types"

function sendNotification(title: string, body?: string) {
  if (!("Notification" in window)) return
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/icon-192.webp" })
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") new Notification(title, { body, icon: "/icon-192.webp" })
    })
  }
}

export function useCompletionAudio(
  awaitingAssistantReply: boolean,
  completionShouldPlayRef: MutableRefObject<boolean>,
  dataMode: DataMode,
  onComplete?: () => void
) {
  const completionAudioRef = useRef<HTMLAudioElement | null>(null)
  const wasAwaitingRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (dataMode === "ultra" || dataMode === "miser") {
      completionAudioRef.current = null
      return
    }
    const audio = new Audio("/audio/staplebops-01.aac")
    audio.preload = "auto"
    completionAudioRef.current = audio
    return () => { completionAudioRef.current = null }
  }, [dataMode])

  useEffect(() => {
    const justFinished = wasAwaitingRef.current && !awaitingAssistantReply
    if (justFinished && completionShouldPlayRef.current) {
      completionShouldPlayRef.current = false
      const audio = completionAudioRef.current
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(() => undefined)
      }
      if (dataMode !== "miser") {
        sendNotification("OpenCode Mobile", "Assistant finished responding")
      }
      onCompleteRef.current?.()
    }
    wasAwaitingRef.current = awaitingAssistantReply
  }, [awaitingAssistantReply, completionShouldPlayRef])
}
