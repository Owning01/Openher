import { useRef, useEffect } from "react"
import type { DataMode } from "../types"

export function useCompletionAudio(
  awaitingAssistantReply: boolean,
  completionShouldPlayRef: React.MutableRefObject<boolean>,
  dataMode: DataMode,
  onComplete?: () => void
) {
  const completionAudioRef = useRef<HTMLAudioElement | null>(null)
  const wasAwaitingRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (dataMode === "ultra") {
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
      onCompleteRef.current?.()
    }
    wasAwaitingRef.current = awaitingAssistantReply
  }, [awaitingAssistantReply, completionShouldPlayRef])
}
