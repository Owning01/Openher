// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest"
import { createServer, type Server } from "node:http"
import { createCerebrasProvider } from "./cerebras"
import type { QuickChatMessage } from "./types"

// Cerebras usa stream:false y parsea JSON: el mock dsh solo emite SSE, así que
// este test usa un mini-server http propio con respuestas JSON no-streaming.
function startJsonMock(handler: (req: { headers: Record<string, string | undefined>; body: unknown }) => { status: number; body: unknown }): Promise<{ server: Server; url: string; requests: Array<{ headers: Record<string, string | undefined>; body: unknown }> }> {
  const requests: Array<{ headers: Record<string, string | undefined>; body: unknown }> = []
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let raw = ""
      req.on("data", (c) => { raw += c })
      req.on("end", () => {
        let body: unknown = null
        try { body = JSON.parse(raw) } catch {}
        requests.push({ headers: req.headers as Record<string, string | undefined>, body })
        const out = handler({ headers: req.headers as Record<string, string | undefined>, body })
        res.writeHead(out.status, { "Content-Type": "application/json" })
        res.end(JSON.stringify(out.body))
      })
    })
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address()
      const port = typeof addr === "object" && addr ? addr.port : 0
      resolve({ server, url: `http://127.0.0.1:${port}/v1/chat/completions`, requests })
    })
  })
}

const servers: Server[] = []
afterAll(() => {
  for (const s of servers) s.close()
})

const KEY = "cerebras-key"
const userMsg = (text: string): QuickChatMessage => ({ role: "user", content: text })

describe("createCerebrasProvider (mock JSON no-stream)", () => {
  it("success: extrae choices[0].message.content y mapea usage", async () => {
    const { server, url } = await startJsonMock(() => ({
      status: 200,
      body: {
        choices: [{ message: { content: "  respuesta cerebras  " } }],
        usage: { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 },
      },
    }))
    servers.push(server)
    const provider = createCerebrasProvider(KEY, url)
    const res = await provider.chat([userMsg("hola")], { model: "gpt-oss-120b" })
    expect(res.text).toBe("respuesta cerebras")
    expect(res.usage).toEqual({ input: 11, output: 7, total: 18 })
  })

  it("request válido: Bearer auth + max_completion_tokens + stream:false", async () => {
    const { server, url, requests } = await startJsonMock(() => ({
      status: 200,
      body: { choices: [{ message: { content: "ok" } }] },
    }))
    servers.push(server)
    const provider = createCerebrasProvider(KEY, url)
    await provider.chat([userMsg("q")], { model: "gemma-4" })
    expect(requests[0].headers.authorization).toBe(`Bearer ${KEY}`)
    const body = requests[0].body as { model: string; stream: boolean; max_completion_tokens: number }
    expect(body.model).toBe("gemma-4")
    expect(body.stream).toBe(false)
    expect(body.max_completion_tokens).toBe(500)
  })

  it("429 → error de rate limit (5/min)", async () => {
    const { server, url } = await startJsonMock(() => ({ status: 429, body: { error: "rate limited" } }))
    servers.push(server)
    const provider = createCerebrasProvider(KEY, url)
    await expect(provider.chat([userMsg("x")], { model: "m" })).rejects.toThrow(/Rate limit/)
  })

  it("500 → throw con el texto del server", async () => {
    const { server, url } = await startJsonMock(() => ({ status: 500, body: { error: "boom interno" } }))
    servers.push(server)
    const provider = createCerebrasProvider(KEY, url)
    await expect(provider.chat([userMsg("x")], { model: "m" })).rejects.toThrow(/boom interno|Cerebras 5\d\d/)
  })

  it("sin apiKey → NO_KEY antes de tocar la red", async () => {
    const { server, url, requests } = await startJsonMock(() => ({ status: 200, body: {} }))
    servers.push(server)
    const provider = createCerebrasProvider("", url)
    await expect(provider.chat([userMsg("x")], { model: "m" })).rejects.toThrow("NO_KEY")
    expect(requests.length).toBe(0)
  })

  it("modelo vacío en opts → error explícito sin fetch", async () => {
    const { server, url, requests } = await startJsonMock(() => ({ status: 200, body: {} }))
    servers.push(server)
    const provider = createCerebrasProvider(KEY, url)
    await expect(provider.chat([userMsg("x")], { model: "" })).rejects.toThrow(/Seleccioná un modelo/)
    expect(requests.length).toBe(0)
  })

  it("fallback a choices[0].text si no hay message.content", async () => {
    const { server, url } = await startJsonMock(() => ({
      status: 200,
      body: { choices: [{ text: "legacy text" }] },
    }))
    servers.push(server)
    const provider = createCerebrasProvider(KEY, url)
    const res = await provider.chat([userMsg("x")], { model: "m" })
    expect(res.text).toBe("legacy text")
  })
})
