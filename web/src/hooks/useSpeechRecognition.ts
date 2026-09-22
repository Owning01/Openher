import { useState, useRef, useCallback, useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { SpeechRecognition as CapSpeechRecognition } from "@capacitor-community/speech-recognition"
import { STORAGE_KEYS } from "../constants"
import type { LanguageCode } from "../i18n"
import { normalizeLanguage } from "../i18n-context"
import { appendWebFinal, combineDisplay, mergeNativePartial } from "./dictationBuffer"

// Lectura perezosa (no en import): WebView2/Capacitor exponen la API
// tarde y en tests se instala un doble antes del render.
function getWebSpeechAPI(): any | null {
  if (typeof window === "undefined") return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

const LANG_MAP: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  it: "it-IT",
  "zh-TW": "zh-TW",
}

function getLanguage(language?: LanguageCode): string {
  const code = language ?? normalizeLanguage(localStorage.getItem(STORAGE_KEYS.LANGUAGE) || "es")
  return LANG_MAP[code] || "en-US"
}

export function useSpeechRecognition(language?: LanguageCode) {
  const [isListening, setIsListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const currentTranscript = useRef("")
  const onResultRef = useRef<((text: string) => void) | null>(null)
  const onErrorRef = useRef<((message: string) => void) | null>(null)
  const recognitionRef = useRef<any>(null)
  const cleanupListenersRef = useRef<(() => void) | null>(null)
  const manuallyStoppedRef = useRef(false)
  // Buffer de finales acumulados: sobrevive a pausas y a reinicios automáticos.
  // Solo crece (appendWebFinal/mergeNativePartial): jamás se recorta ni vacía.
  const finalBufferRef = useRef("")
  // Web: nº de finales ya volcados (los finales son prefijo ordenado por
  // sesión; por conteo, no por contenido: repetir una palabra no se pierde).
  const committedFinalsRef = useRef(0)
  // Web: último interim visto; se consolida si la sesión muere en silencio.
  const pendingInterimRef = useRef("")
  // Nativo: longitud del buffer al empezar la utterance (solo se reescribe la cola).
  const utteranceBaseRef = useRef(0)
  // Nativo: "stopped" (onEndOfSpeech) llega ANTES del resultado final
  // (onResults). La base se avanza recién cuando llega el final (o al rearmar
  // sin final), no en "stopped".
  const speechEndedRef = useRef(false)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isNative = Capacitor.isNativePlatform()
  const availableRef = useRef<boolean | null>(null)

  const emit = useCallback((text: string) => {
    currentTranscript.current = text
    onResultRef.current?.(text)
  }, [])

  const detachNative = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    speechEndedRef.current = false
    try {
      cleanupListenersRef.current?.()
    } catch {
      /* noop */
    }
    cleanupListenersRef.current = null
  }, [])

  useEffect(() => {
    if (isNative) {
      // Optimista: el botón se muestra SIEMPRE en nativo (si available() falla
      // o el servicio no está, se ve el error al tocar — nunca un botón oculto).
      setSupported(true)
      CapSpeechRecognition.available()
        .then(({ available }) => {
          availableRef.current = available
          if (!available) setSupported(false)
        })
        .catch(() => { /* mantener optimista */ })
      return () => {
        manuallyStoppedRef.current = true
        detachNative()
        CapSpeechRecognition.stop().catch(() => {})
      }
    }

    const WebSpeechAPI = getWebSpeechAPI()
    if (!WebSpeechAPI) {
      setSupported(false)
      return
    }

    setSupported(true)
    const rec = new WebSpeechAPI()
    rec.lang = getLanguage(language)
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onresult = (event: any) => {
      const results = event?.results
      if (!results) return
      const finals: string[] = []
      let interim = ""
      for (let i = 0; i < results.length; i++) {
        const t = (results[i]?.[0]?.transcript ?? "") as string
        if ((results[i] as any)?.isFinal) finals.push(t)
        else if (t) interim += (interim ? " " : "") + t
      }
      let buf = finalBufferRef.current
      for (let i = committedFinalsRef.current; i < finals.length; i++) {
        buf = appendWebFinal(buf, finals[i])
      }
      committedFinalsRef.current = finals.length
      finalBufferRef.current = buf
      pendingInterimRef.current = interim.trim()
      emit(combineDisplay(buf, interim))
    }

    const flushAndRestart = () => {
      // La sesión murió (pausa larga): consolidar el interim pendiente
      // ANTES de reiniciar, o la última frase se pierde.
      const pend = pendingInterimRef.current
      if (pend) {
        const next = appendWebFinal(finalBufferRef.current, pend)
        if (next !== finalBufferRef.current) {
          finalBufferRef.current = next
          emit(next)
        }
        pendingInterimRef.current = ""
      }
      committedFinalsRef.current = 0
      try {
        rec.start()
      } catch {
        /* noop */
      }
    }

    rec.onend = () => {
      if (manuallyStoppedRef.current) {
        setIsListening(false)
        return
      }
      // Reinicio automático para dictado continuo con pausas.
      flushAndRestart()
    }

    rec.onerror = (event: any) => {
      const code = String(event?.error ?? "")
      if (code === "no-speech" || code === "aborted") {
        if (!manuallyStoppedRef.current) {
          try {
            rec.start()
          } catch {
            /* noop */
          }
        }
        return
      }
      // Error fatal (permiso, red, servicio): no reintentar en bucle,
      // avisar una vez para que el usuario actúe.
      manuallyStoppedRef.current = true
      setIsListening(false)
      onErrorRef.current?.(code || "unavailable")
    }

    recognitionRef.current = rec
    return () => {
      manuallyStoppedRef.current = true
      try {
        rec.abort()
      } catch {
        /* noop */
      }
    }
  }, [isNative, language, emit, detachNative])

  const start = useCallback(async (
    onResult: (text: string) => void,
    onError?: (message: string) => void,
  ) => {
    manuallyStoppedRef.current = false
    onResultRef.current = onResult
    onErrorRef.current = onError ?? null
    currentTranscript.current = ""
    finalBufferRef.current = ""
    committedFinalsRef.current = 0
    pendingInterimRef.current = ""
    utteranceBaseRef.current = 0
    speechEndedRef.current = false

    if (isNative) {
      if (availableRef.current === false) {
        throw new Error("Speech service is not available on this device")
      }
      // Sin listeners duplicados de sesiones previas (doble emisión).
      detachNative()
      try {
        const partialHandler = await CapSpeechRecognition.addListener("partialResults", (data) => {
          const text = (data.matches?.[0] ?? "").trim()
          // Parcial vacío o ya contenido: IGNORAR. Jamás borrar (era el bug:
          // tras una pausa llegaba un parcial corto y vaciaba todo).
          if (!text) return
          const prev = finalBufferRef.current
          const wasEnded = speechEndedRef.current
          const next = mergeNativePartial(prev, utteranceBaseRef.current, text)
          if (next !== prev) {
            finalBufferRef.current = next
            emit(next)
          }
          // onEndOfSpeech ("stopped") llega ANTES del resultado final
          // (onResults), que este plugin emite por este mismo evento. Recién
          // acá se cierra la utterance: avanzar la base en "stopped" hacía que
          // el final se agregara de nuevo (palabras duplicadas).
          if (wasEnded) {
            speechEndedRef.current = false
            utteranceBaseRef.current = finalBufferRef.current.length
          }
        })
        const stateHandler = await CapSpeechRecognition.addListener("listeningState", (data) => {
          if (data.status === "started") {
            setIsListening(true)
            return
          }
          if (manuallyStoppedRef.current) {
            setIsListening(false)
            return
          }
          // El servicio corta solo tras una pausa: rearmar para dictado
          // continuo sin perder lo acumulado. NO avanzar la base acá: el
          // resultado final puede llegar después de "stopped" y debe
          // integrarse como cierre de la utterance actual (ver partialHandler).
          speechEndedRef.current = true
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
          restartTimerRef.current = setTimeout(() => {
            if (manuallyStoppedRef.current) return
            if (speechEndedRef.current) {
              // Sin resultado final (error o demora): cerrar la utterance
              // igual, así la próxima frase no reescribe el texto consolidado.
              speechEndedRef.current = false
              utteranceBaseRef.current = finalBufferRef.current.length
            }
            const startAgain = (attempt: number) => {
              if (manuallyStoppedRef.current) return
              CapSpeechRecognition.start({
                language: getLanguage(language),
                partialResults: true,
                popup: false,
                maxResults: 5,
              }).catch((e: unknown) => {
                const msg = (e as Error)?.message ?? "unavailable"
                // Tras "stopped" el servicio tarda en soltar el reconocedor:
                // "RecognitionService busy" es transitorio, no un error del
                // dispositivo. Un reintento antes de rendirse y avisar.
                if (attempt === 0 && /busy/i.test(msg)) {
                  restartTimerRef.current = setTimeout(() => startAgain(1), 700)
                  return
                }
                manuallyStoppedRef.current = true
                setIsListening(false)
                onErrorRef.current?.(msg)
              })
            }
            startAgain(0)
          }, 400)
        })
        cleanupListenersRef.current = () => {
          partialHandler.remove()
          stateHandler.remove()
        }

        const perm = await CapSpeechRecognition.requestPermissions()
        const status = (perm as { speechRecognition?: string }).speechRecognition ?? (perm as { status?: string }).status
        if (status && status !== "granted") {
          detachNative()
          throw new Error("Microphone permission denied — enable it in system settings")
        }
        await CapSpeechRecognition.start({
          language: getLanguage(language),
          partialResults: true,
          popup: false,
          maxResults: 5,
        })
        setIsListening(true)
        return
      } catch (err) {
        detachNative()
        throw err
      }
    }
    const rec = recognitionRef.current
    if (!rec) return
    try {
      await navigator.mediaDevices?.getUserMedia?.({ audio: true })
    } catch {}
    rec.lang = getLanguage(language)
    rec.start()
    setIsListening(true)
  }, [isNative, language, detachNative, emit])

  const stop = useCallback(() => {
    manuallyStoppedRef.current = true
    if (isNative) {
      detachNative()
      CapSpeechRecognition.stop().catch(() => {})
      setIsListening(false)
      return
    }

    const rec = recognitionRef.current
    if (!rec) return
    try {
      rec.stop()
    } catch {
      /* noop */
    }
    setIsListening(false)
  }, [isNative, detachNative])

  return { isListening, supported, start, stop, currentTranscript }
}
