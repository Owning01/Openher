import { bench, group } from "./runner.mjs"

// Pure functions extracted from api.ts
function baseUrl(config) {
  let host = config.host.trim()
  const schemeMatch = host.match(/^(https?):\/\//)
  const scheme = schemeMatch ? schemeMatch[1] : "http"
  if (schemeMatch) host = host.slice(schemeMatch[0].length)
  if (host.includes(":") && !host.startsWith("[")) host = `[${host}]`
  return `${scheme}://${host}:${config.port}`
}

function normalizeSlashes(path) {
  return path.replace(/\\/g, "/")
}

function withDirectory(path, directory) {
  if (!directory) return path
  const separator = path.includes("?") ? "&" : "?"
  return `${path}${separator}directory=${encodeURIComponent(normalizeSlashes(directory))}`
}

function toBase64(input) {
  const bytes = new TextEncoder().encode(input)
  const binary = Array.from(bytes).map((b) => String.fromCodePoint(b)).join("")
  return btoa(binary)
}

function authHeader(config) {
  return `Basic ${toBase64(`${config.username}:${config.password}`)}`
}

function normalizeHeaders(headers) {
  if (!headers) return {}
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key.toLowerCase(),
      Array.isArray(value) ? value.join(", ") : String(value),
    ])
  )
}

function responseDetail(body) {
  if (!body) return null
  if (typeof body === "string") {
    try {
      return responseDetail(JSON.parse(body)) ?? body
    } catch {
      return body
    }
  }
  if (typeof body === "object") {
    const value = body
    return value.data?.message ?? value.message ?? JSON.stringify(body)
  }
  return String(body)
}

function toAgentOption(agent) {
  return {
    id: agent.id || agent.name || "",
    name: agent.name || agent.id || "",
    description: agent.description,
    mode: agent.mode,
    hidden: agent.hidden,
  }
}

const SAMPLE_CONFIG = {
  host: "192.168.1.100",
  port: 8080,
  username: "admin",
  password: "secret123",
}

const SAMPLE_COMPLEX_CONFIG = {
  host: "https://my-server.example.com",
  port: 443,
  username: "user-with-long-email@domain.com",
  password: "A!b#C$d%E^f&G*h(I)j_K+l-m=n/o:p;q<r>s,t?u[v]w{x|y}z~1234567890",
}

// --- baseUrl ---
group("baseUrl computation", () => {
  bench("simple IP host", () => {
    baseUrl(SAMPLE_CONFIG)
  })

  bench("complex URL host", () => {
    baseUrl(SAMPLE_COMPLEX_CONFIG)
  })

  bench("many different host formats", () => {
    const hosts = [
      { host: "localhost", port: 8080, username: "", password: "" },
      { host: "192.168.1.1", port: 3000, username: "", password: "" },
      { host: "https://server.com", port: 443, username: "", password: "" },
      { host: "http://10.0.0.1", port: 80, username: "", password: "" },
      { host: "2001:db8::1", port: 9090, username: "", password: "" },
    ]
    for (const h of hosts) baseUrl(h)
  })

  bench("100k iterations", () => {
    for (let i = 0; i < 100000; i++) baseUrl(SAMPLE_CONFIG)
  })
})

// --- toBase64 ---
group("toBase64 throughput", () => {
  bench("short string", () => {
    toBase64("admin:secret123")
  })

  bench("long auth string", () => {
    toBase64(`${SAMPLE_COMPLEX_CONFIG.username}:${SAMPLE_COMPLEX_CONFIG.password}`)
  })

  bench("100k iterations (short)", () => {
    for (let i = 0; i < 100000; i++) toBase64("admin:secret123")
  })
})

// --- authHeader ---
group("Authorization header generation", () => {
  bench("simple config", () => {
    authHeader(SAMPLE_CONFIG)
  })
  bench("complex config", () => {
    authHeader(SAMPLE_COMPLEX_CONFIG)
  })
})

// --- normalizeSlashes ---
group("normalizeSlashes", () => {
  bench("unix path (no-op)", () => {
    normalizeSlashes("/home/user/project/src/file.ts")
  })
  bench("windows path", () => {
    normalizeSlashes("C:\\Users\\user\\project\\src\\file.ts")
  })
  bench("mixed path", () => {
    normalizeSlashes("/home/user\\project/src\\file.ts")
  })
  bench("100k iterations windows path", () => {
    for (let i = 0; i < 100000; i++) normalizeSlashes("C:\\Users\\user\\project\\src\\file.ts")
  })
})

// --- withDirectory ---
group("withDirectory URL building", () => {
  bench("no directory (no-op)", () => {
    withDirectory("/session", undefined)
  })
  bench("with directory", () => {
    withDirectory("/session", "/home/user/project")
  })
  bench("with directory + existing param", () => {
    withDirectory("/session?limit=100", "/home/user/project")
  })
  bench("100k iterations with directory", () => {
    for (let i = 0; i < 100000; i++) withDirectory("/session", "/home/user/project")
  })
})

// --- normalizeHeaders ---
group("normalizeHeaders", () => {
  bench("empty headers", () => {
    normalizeHeaders(undefined)
  })
  bench("few headers", () => {
    normalizeHeaders({ "Content-Type": "application/json", "X-Next-Cursor": "abc123", "X-Request-Id": "req-xyz" })
  })
  bench("many headers (10 entries)", () => {
    const h = {}
    for (let i = 0; i < 10; i++) h[`X-Header-${i}`] = `value${i}`
    normalizeHeaders(h)
  })
})

// --- responseDetail ---
group("responseDetail parsing", () => {
  bench("null body", () => responseDetail(null))
  bench("string body", () => responseDetail("some error text"))
  bench("JSON error body", () => responseDetail({ data: { message: "not found" } }))
  bench("array body", () => responseDetail(JSON.stringify([1, 2, 3])))
})

// --- toAgentOption ---
group("toAgentOption conversion", () => {
  bench("full agent", () => {
    toAgentOption({ id: "agent-1", name: "Assistant", description: "Main AI", mode: "primary", hidden: false })
  })
  bench("minimal agent", () => {
    toAgentOption({ mode: "all" })
  })
  bench("100k iterations", () => {
    const agents = []
    for (let i = 0; i < 100; i++) agents.push({ id: `a${i}`, name: `Agent ${i}`, description: "x".repeat(50), mode: "primary", hidden: i % 10 === 0 })
    for (let iter = 0; iter < 1000; iter++) {
      for (const a of agents) toAgentOption(a)
    }
  })
})

// --- Combined API call chain ---
group("Full API call chain simulation", () => {
  bench("health check URL building", () => {
    const url = baseUrl(SAMPLE_CONFIG) + "/global/health"
    const h = { Authorization: authHeader(SAMPLE_CONFIG), Accept: "application/json" }
  })

  bench("session list URL building with directory", () => {
    const path = withDirectory("/session", "/home/user/project")
    const url = baseUrl(SAMPLE_CONFIG) + path
  })

  bench("prompt message serialization", () => {
    const parts = [{ type: "text", text: "Hello, how are you?" }]
    const body = JSON.stringify({ parts, model: { providerID: "openai", modelID: "gpt-4" } })
  })

  bench("diff URL with encoding", () => {
    const file = "src/components/MyComponent.tsx"
    const path = `/session/sess-123/diff/${encodeURIComponent(file)}`
    const url = baseUrl(SAMPLE_CONFIG) + withDirectory(path, "/home/user/project")
  })
})
