import { useRef, useEffect, type MutableRefObject } from "react"
import type { DataMode } from "../types"
import { sendNotification } from "../utils/notifications"

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
    audio.onerror = () => { completionAudioRef.current = null }
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
