import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useSpeechRecognition } from "./useSpeechRecognition"

// Doble de la Web Speech API: sesiones discretas como Chrome real
// (cada start() abre una sesión con results vacío; la pausa dispara onend).
class FakeRec {
  static last: FakeRec | null = null
  startCalls = 0
  lang = ""
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onresult: ((e: any) => void) | null = null
  onend: (() => void) | null = null
  onerror: ((e: any) => void) | null = null
  constructor() {
    FakeRec.last = this
  }
  start() {
    this.startCalls += 1
  }
  stop() {
    this.onend?.()
  }
  abort() {}
}

function resultEvent(items: { t: string; final: boolean }[], resultIndex = 0) {
  const results = items.map((it) => {
    const r = [{ transcript: it.t }] as any
    r.isFinal = it.final
    return r
  })
  return { resultIndex, results }
}

beforeEach(() => {
  FakeRec.last = null
  ;(window as any).SpeechRecognition = FakeRec
  delete (window as any).webkitSpeechRecognition
})

afterEach(() => {
  delete (window as any).SpeechRecognition
})

describe("useSpeechRecognition (web): pausar y retomar no borra", () => {
  it("acumula finales a través de pausas (onend) sin perder nada", async () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition("es"))
    expect(result.current.supported).toBe(true)

    const emitted: string[] = []
    await act(async () => {
      await result.current.start((text) => emitted.push(text))
    })
    expect(result.current.isListening).toBe(true)
    const rec = FakeRec.last!

    // Primera frase, final consolidado.
    act(() => {
      rec.onresult!(resultEvent([{ t: "hola mundo", final: true }]))
    })
    expect(emitted.at(-1)).toBe("hola mundo")

    // Sigo hablando (interim) y hago una pausa larga: la sesión muere.
    act(() => {
      rec.onresult!(
        resultEvent([
          { t: "hola mundo", final: true },
          { t: "cómo", final: false },
        ]),
      )
    })
    expect(emitted.at(-1)).toBe("hola mundo cómo")
    const callsBeforePause = rec.startCalls
    act(() => {
      rec.onend!()
    })
    // Rearme automático para seguir dictando.
    expect(rec.startCalls).toBeGreaterThan(callsBeforePause)
    expect(result.current.isListening).toBe(true)

    // Retomo en la nueva sesión: lo anterior sigue intacto.
    act(() => {
      rec.onresult!(resultEvent([{ t: "estás", final: true }], 0))
    })
    expect(emitted.at(-1)).toBe("hola mundo cómo estás")

    // Invariante: jamás se emitió vacío tras haber texto (no borrado).
    const firstNonEmpty = emitted.findIndex((t) => t.length > 0)
    for (const t of emitted.slice(firstNonEmpty)) {
      expect(t.length).toBeGreaterThan(0)
    }
    unmount()
  })

  it("interim vacío tras pausa no recorta el buffer", async () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition("es"))
    const emitted: string[] = []
    await act(async () => {
      await result.current.start((text) => emitted.push(text))
    })
    const rec = FakeRec.last!
    act(() => {
      rec.onresult!(resultEvent([{ t: "todo lo hablado", final: true }]))
    })
    act(() => {
      rec.onend!()
    })
    // Sesión nueva que aún no reconoce nada: el display conserva el buffer.
    act(() => {
      rec.onresult!(resultEvent([{ t: "", final: false }], 0))
    })
    expect(emitted.at(-1)).toBe("todo lo hablado")
    unmount()
  })

  it("error fatal avisa una vez y no reintenta en bucle", async () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition("es"))
    const errors: string[] = []
    await act(async () => {
      await result.current.start(
        () => {},
        (msg) => errors.push(msg),
      )
    })
    const rec = FakeRec.last!
    const callsBefore = rec.startCalls
    act(() => {
      rec.onerror!({ error: "not-allowed" })
    })
    expect(errors).toEqual(["not-allowed"])
    expect(result.current.isListening).toBe(false)
    // El onend posterior al error fatal no rearma.
    act(() => {
      rec.onend!()
    })
    expect(rec.startCalls).toBe(callsBefore)
    unmount()
  })

  it("stop manual no rearma", async () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition("es"))
    await act(async () => {
      await result.current.start(() => {})
    })
    const rec = FakeRec.last!
    const callsBefore = rec.startCalls
    act(() => {
      result.current.stop()
    })
    expect(result.current.isListening).toBe(false)
    expect(rec.startCalls).toBe(callsBefore)
    unmount()
  })
})
