import { useState, useRef, useCallback, useEffect } from "react"

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [supported] = useState(() => !!SpeechRecognition)
  const recognitionRef = useRef<any>(null)
  const currentTranscript = useRef("")
  const onResultRef = useRef<((text: string) => void) | null>(null)

  useEffect(() => {
    if (!SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.lang = "en-US"
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onresult = (event: any) => {
      let interim = ""
      let final = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += t
        } else {
          interim += t
        }
      }
      currentTranscript.current = final || interim
      onResultRef.current?.(final || interim)
    }

    rec.onend = () => {
      setIsListening(false)
    }

    rec.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return
      setIsListening(false)
    }

    recognitionRef.current = rec
    return () => {
      try { rec.abort() } catch {}
    }
  }, [])

  const start = useCallback(async (onResult: (text: string) => void) => {
    const rec = recognitionRef.current
    if (!rec) return
    onResultRef.current = onResult
    currentTranscript.current = ""
    try {
      await navigator.mediaDevices?.getUserMedia?.({ audio: true })
    } catch {}
    rec.start()
    setIsListening(true)
  }, [])

  const stop = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    rec.stop()
    setIsListening(false)
  }, [])

  return { isListening, supported, start, stop, currentTranscript }
}
