// Parser de frames SSE del dialecto opencode, extraído del pump inline de
// useSSE para poder testearlo keyless con fixtures v1/v2 y cortes arbitrarios
// de chunks (TCP no respeta fronteras de eventos).

export type ParsedSSEFrame = {
  id?: string
  type?: string
  properties?: Record<string, unknown>
}

// Semántica EXACTA del processBuffer original:
// - `event: X` setea el tipo; `data: {json}` lo SOBREESCRIBE si trae `type`
//   propio (el type real va DENTRO del JSON en opencode).
// - properties = parsed.properties ?? el objeto entero.
// - JSON inválido → properties = { raw: <texto> }.
// - Un frame se emite al llegar su línea en blanco; sin type no se emite.
export function createSSEFrameParser() {
  let buffer = ""
  let pending: ParsedSSEFrame | null = null

  return (chunk: string): ParsedSSEFrame[] => {
    buffer += chunk
    const frames: ParsedSSEFrame[] = []
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const rawLine of lines) {
      const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine
      if (line.startsWith("event: ")) {
        if (!pending) pending = {}
        pending.type = line.slice(7).trim()
      } else if (line.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(line.slice(6)) as {
            id?: string
            type?: string
            properties?: Record<string, unknown>
          }
          if (!pending) pending = {}
          pending.type = parsed.type ?? pending.type
          pending.properties = parsed.properties ?? (parsed as unknown as Record<string, unknown>)
          if (parsed.id) pending.id = parsed.id
        } catch {
          if (!pending) pending = {}
          pending.properties = { raw: line.slice(6) }
        }
      } else if (line === "" && pending?.type) {
        frames.push(pending)
        pending = null
      }
    }
    return frames
  }
}
