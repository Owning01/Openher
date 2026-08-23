// @vitest-environment node
import { describe, it, expect, afterAll, beforeAll } from "vitest"
import { startMockLlmServer, type MockLlmServer } from "@deepseek-ai/dsh-llm-mock-server"
import { createGroqProvider } from "./groq"
import type { QuickChatMessage } from "./types"

// Servidor mock OpenAI-compatible (@deepseek-ai/dsh-llm-mock-server, MIT):
// consume un comportamiento scriptado por request. Puerto 0 = efímero.
const servers: MockLlmServer[] = []

async function start(sequence: Parameters<typeof startMockLlmServer>[0]["sequence"], extra: Record<string, unknown> = {}) {
  const s = await startMockLlmServer({ port: 0, sequence, ...extra } as never)
  servers.push(s)
  return s
}

afterAll(async () => {
  await Promise.all(servers.map((s) => s.close().catch(() => undefined)))
})

const KEY = "test-key-123"

function userMsg(text: string): QuickChatMessage {
  return { role: "user", content: text }
}

describe("createGroqProvider (contra llm-mock-server)", () => {
  it("streaming success: acumula deltas, llama onChunk y arma el texto completo", async () => {
    const s = await start(["success"], { successText: "hola mundo", chunkSize: 4 })
    const provider = createGroqProvider(KEY, `${s.baseURL}/openai/v1/chat/completions`)
    const chunks: string[] = []
    const res = await provider.chat([userMsg("decime hola")], {
      model: "qwen/qwen3-32b",
      onChunk: (c) => chunks.push(c),
    })
    expect(res.text).toBe("hola mundo")
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.join("")).toBe("hola mundo")
  })

  it("request válido: Bearer auth, system primero y stream:true", async () => {
    const s = await start(["success"], { successText: "ok", chunkSize: 2 })
    const provider = createGroqProvider(KEY, `${s.baseURL}/openai/v1/chat/completions`)
    await provider.chat(
      [
        { role: "system", content: "sys" },
        userMsg("pregunta"),
        { role: "assistant", content: "respuesta" },
        userMsg("seguí"),
      ],
      { model: "llama-3.1-8b-instant", onChunk: () => {} },
    )
    const req = s.requests[0]
    expect(req.headers.authorization).toBe(`Bearer ${KEY}`)
    const body = req.body as { model: string; stream: boolean; messages: Array<{ role: string; content: string }> }
    expect(body.stream).toBe(true)
    expect(body.model).toBe("llama-3.1-8b-instant")
    // El provider antepone SU system propio y recorta a últimos 8
    expect(body.messages[0].role).toBe("system")
    expect(body.messages.at(-1)?.content).toBe("seguí")
  })

  it("rate_limit del server (429) → error con mensaje de rate limit de Groq", async () => {
    const s = await start(["rate_limit"])
    const provider = createGroqProvider(KEY, `${s.baseURL}/openai/v1/chat/completions`)
    await expect(provider.chat([userMsg("x")], { model: "m" })).rejects.toThrow(/Rate limit Groq/)
  })

  it("malformed_event: choices:[null] se saltea sin romper el stream", async () => {
    const s = await start(["malformed_event"])
    const provider = createGroqProvider(KEY, `${s.baseURL}/openai/v1/chat/completions`)
    // El evento corrupto no aporta contenido: resuelve vacío en vez de tirar.
    const res = await provider.chat([userMsg("x")], { model: "m", onChunk: () => {} })
    expect(res.text).toBe("")
  })

  it("partial_disconnect: corta el socket tras enviar texto → conserva el parcial", async () => {
    const s = await start(["partial_disconnect"], { partialText: "parcial vis", chunkSize: 3 })
    const provider = createGroqProvider(KEY, `${s.baseURL}/openai/v1/chat/completions`)
    const res = await provider.chat([userMsg("x")], { model: "m", onChunk: () => {} })
    expect(res.text).toBe("parcial vis")
  })

  it("stream_disconnect: corte antes del primer delta y sin texto → throw honesto", async () => {
    const s = await start(["stream_disconnect"])
    const provider = createGroqProvider(KEY, `${s.baseURL}/openai/v1/chat/completions`)
    await expect(provider.chat([userMsg("x")], { model: "m" })).rejects.toThrow()
  })

  it("partial_eof: texto parcial + fin sin [DONE] → devuelve el parcial", async () => {
    const s = await start(["partial_eof"], { partialText: "abc def", chunkSize: 2 })
    const provider = createGroqProvider(KEY, `${s.baseURL}/openai/v1/chat/completions`)
    const res = await provider.chat([userMsg("x")], { model: "m", onChunk: () => {} })
    expect(res.text).toBe("abc def")
  })

  it("sin apiKey → NO_KEY_GROQ antes de tocar la red", async () => {
    const s = await start(["success"], { successText: "no" })
    const provider = createGroqProvider("", `${s.baseURL}/openai/v1/chat/completions`)
    await expect(provider.chat([userMsg("x")], { model: "m" })).rejects.toThrow("NO_KEY_GROQ")
    expect(s.requests.length).toBe(0)
  })

  it("server_error (500) → throw con status", async () => {
    const s = await start(["server_error"])
    const provider = createGroqProvider(KEY, `${s.baseURL}/openai/v1/chat/completions`)
    await expect(provider.chat([userMsg("x")], { model: "m" })).rejects.toThrow(/Groq 5\d\d|error/)
  })

  it("listModels expone el catálogo Groq", async () => {
    const s = await start(["success"], { successText: "-" })
    const provider = createGroqProvider(KEY, `${s.baseURL}/openai/v1/chat/completions`)
    const models = await provider.listModels()
    expect(models.length).toBeGreaterThanOrEqual(3)
    expect(models.some((m) => m.id.includes("qwen"))).toBe(true)
  })

  beforeAll(() => {
    expect(typeof fetch).toBe("function")
  })
})
