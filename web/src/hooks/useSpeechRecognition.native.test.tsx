import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

// Doble del plugin nativo: replica el orden real de eventos de Android
// (onEndOfSpeech → "listeningState: stopped" ANTES de onResults, que llega
// por "partialResults"). Regresión: pausar duplicaba cada palabra.
const h = vi.hoisted(() => ({
  listeners: {} as Record<string, (data: any) => void>,
  starts: [] as unknown[],
}))

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true } }))
vi.mock("@capacitor-community/speech-recognition", () => ({
  SpeechRecognition: {
    available: vi.fn(async () => ({ available: true })),
    requestPermissions: vi.fn(async () => ({ speechRecognition: "granted" })),
    start: vi.fn(async (opts: unknown) => {
      h.starts.push(opts)
    }),
    stop: vi.fn(async () => {}),
    addListener: vi.fn(async (event: string, cb: (data: any) => void) => {
      h.listeners[event] = cb
      return {
        remove: vi.fn(async () => {
          delete h.listeners[event]
        }),
      }
    }),
  },
}))

import { useSpeechRecognition } from "./useSpeechRecognition"

beforeEach(() => {
  vi.useFakeTimers()
  for (const k of Object.keys(h.listeners)) delete h.listeners[k]
  h.starts.length = 0
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useSpeechRecognition (nativo): el final tras 'stopped' no duplica", () => {
  it("pausa: parciales + stopped + final => la frase queda una sola vez", async () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition("es"))
    const emitted: string[] = []
    await act(async () => {
      await result.current.start((t) => emitted.push(t))
    })
    expect(result.current.isListening).toBe(true)

    act(() => {
      h.listeners.partialResults?.({ matches: ["hola"] })
    })
    act(() => {
      h.listeners.partialResults?.({ matches: ["hola mundo"] })
    })
    expect(emitted.at(-1)).toBe("hola mundo")

    // Orden real del plugin: fin de voz (stopped) → resultado final.
    act(() => {
      h.listeners.listeningState?.({ status: "stopped" })
    })
    act(() => {
      h.listeners.partialResults?.({ matches: ["Hola mundo."] })
    })
    expect(emitted.at(-1)).toBe("Hola mundo.")
    expect(emitted.at(-1)?.includes("Hola mundo. Hola mundo")).toBe(false)

    // Rearme automático + segunda frase: no reescribe lo anterior.
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    act(() => {
      h.listeners.partialResults?.({ matches: ["¿Qué tal?"] })
    })
    expect(emitted.at(-1)).toBe("Hola mundo. ¿Qué tal?")
    expect(h.starts.length).toBeGreaterThanOrEqual(2)
    unmount()
  })

  it("sin resultado final, el rearme cierra la utterance y no duplica la siguiente", async () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition("es"))
    const emitted: string[] = []
    await act(async () => {
      await result.current.start((t) => emitted.push(t))
    })
    act(() => {
      h.listeners.partialResults?.({ matches: ["uno dos"] })
    })
    act(() => {
      h.listeners.listeningState?.({ status: "stopped" })
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    act(() => {
      h.listeners.partialResults?.({ matches: ["tres"] })
    })
    expect(emitted.at(-1)).toBe("uno dos tres")
    unmount()
  })
})
