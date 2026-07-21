import { useState, useRef, useCallback, useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { SpeechRecognition as CapSpeechRecognition } from "@capacitor-community/speech-recognition"
import { STORAGE_KEYS } from "../constants"

const WebSpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

const LANG_MAP: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  it: "it-IT",
  "zh-TW": "zh-TW",
}

function getLanguage(): string {
  const code = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || "en"
  return LANG_MAP[code] || "en-US"
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const currentTranscript = useRef("")
  const onResultRef = useRef<((text: string) => void) | null>(null)
  const recognitionRef = useRef<any>(null)
  const cleanupListenersRef = useRef<(() => void) | null>(null)

  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    if (isNative) {
      CapSpeechRecognition.available().then(({ available }) => setSupported(available))
      return
    }

    if (!WebSpeechAPI) {
      setSupported(false)
      return
    }

    setSupported(true)
    const rec = new WebSpeechAPI()
    rec.lang = getLanguage()
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
  }, [isNative])

  const start = useCallback(async (onResult: (text: string) => void) => {
    onResultRef.current = onResult
    currentTranscript.current = ""

    if (isNative) {
      const partialHandler = await CapSpeechRecognition.addListener("partialResults", (data) => {
        const text = data.matches?.[0] ?? ""
        currentTranscript.current = text
        onResultRef.current?.(text)
      })
      const stateHandler = await CapSpeechRecognition.addListener("listeningState", (data) => {
        setIsListening(data.status === "started")
      })
      cleanupListenersRef.current = () => {
        partialHandler.remove()
        stateHandler.remove()
      }

      await CapSpeechRecognition.requestPermissions()
      await CapSpeechRecognition.start({
        language: getLanguage(),
        partialResults: true,
        popup: false,
        maxResults: 5,
      })
      setIsListening(true)
      return
    }

    const rec = recognitionRef.current
    if (!rec) return
    try {
      await navigator.mediaDevices?.getUserMedia?.({ audio: true })
    } catch {}
    rec.start()
    setIsListening(true)
  }, [isNative])

  const stop = useCallback(() => {
    if (isNative) {
      CapSpeechRecognition.stop().catch(() => {})
      cleanupListenersRef.current?.()
      cleanupListenersRef.current = null
      setIsListening(false)
      return
    }

    const rec = recognitionRef.current
    if (!rec) return
    rec.stop()
    setIsListening(false)
  }, [isNative])

  return { isListening, supported, start, stop, currentTranscript }
}
