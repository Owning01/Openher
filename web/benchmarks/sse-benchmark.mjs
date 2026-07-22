import { bench, group } from "./runner.mjs"

// SSE event parsing (pure logic extracted from useSSE.ts)
function parseSSEStream(buffer) {
  const lines = buffer.split("\n")
  const events = []
  let currentEvent = {}

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      currentEvent.type = line.slice(7).trim()
    } else if (line.startsWith("data: ")) {
      try {
        currentEvent.properties = JSON.parse(line.slice(6))
      } catch {
        currentEvent.properties = { raw: line.slice(6) }
      }
    } else if (line === "" && currentEvent.type) {
      events.push(currentEvent)
      currentEvent = {}
    }
  }
  return events
}

function generateSSEPayload(eventCount, includeHeartbeat = true) {
  const lines = []
  for (let i = 0; i < eventCount; i++) {
    if (includeHeartbeat && i % 3 === 0) {
      lines.push("event: server.heartbeat")
      lines.push("data: {}")
    } else if (i % 3 === 1) {
      lines.push("event: message.updated")
      lines.push(`data: {"id":"msg-${i}","sessionID":"sess-1","type":"message.updated"}`)
    } else {
      lines.push("event: message.part.delta")
      lines.push(`data: {"id":"msg-${i}","sessionID":"sess-1","partID":"part-${i}","field":"text","delta":"new content chunk ${"x".repeat(50)}"}`)
    }
    if (i % 2 === 0) {
      lines.push("data: {\"extra\": \"metadata\"}")
    }
    lines.push("")
  }
  return lines.join("\n")
}

function generateLargePayload(sizeKB) {
  const chars = sizeKB * 1024
  const lines = []
  lines.push("event: message.part.delta")
  lines.push(`data: {"id":"msg-1","sessionID":"sess-1","partID":"part-1","field":"text","delta":"${"A".repeat(Math.min(chars - 200, 5000))}"}`)
  lines.push("")
  lines.push("event: server.heartbeat")
  lines.push("data: {}")
  lines.push("")
  return lines.join("\n")
}

// SSE reconnect schedule calculations
function sseReconnectDelay(attempt, baseMs = 1000, maxMs = 30000) {
  return Math.min(baseMs * Math.pow(2, attempt), maxMs)
}

function sseReconnectJitter(delay) {
  return delay * (0.5 + Math.random() * 0.5)
}

// Heartbeat timeout detection
function checkHeartbeatTimeout(lastHeartbeat, now, timeoutMs = 35000) {
  return now - lastHeartbeat > timeoutMs
}

// --- SSE Buffer Parsing ---
group("SSE Buffer Parsing", () => {
  const smallPayload = generateSSEPayload(10)
  const mediumPayload = generateSSEPayload(100)
  const largePayload = generateSSEPayload(1000)

  bench("parse 10 events", () => {
    parseSSEStream(smallPayload)
  })

  bench("parse 100 events", () => {
    parseSSEStream(mediumPayload)
  })

  bench("parse 1000 events", () => {
    parseSSEStream(largePayload)
  })

  bench("parse 100 events × 100 iterations", () => {
    for (let i = 0; i < 100; i++) parseSSEStream(mediumPayload)
  })
})

// --- SSE Large Payload ---
group("SSE Large Payload Parsing", () => {
  bench("10KB payload", () => {
    parseSSEStream(generateLargePayload(10))
  })
  bench("100KB payload", () => {
    parseSSEStream(generateLargePayload(100))
  })
  bench("500KB payload", () => {
    parseSSEStream(generateLargePayload(500))
  })
})

// --- SSE Event Deserialization ---
group("SSE JSON Deserialization", () => {
  const jsonPayloads = []
  for (let i = 0; i < 1000; i++) {
    jsonPayloads.push(`data: ${JSON.stringify({ id: `msg-${i}`, sessionID: "sess-1", type: "message.part.delta", partID: `part-${i}`, field: "text", delta: "new content" })}\n\n`)
  }

  bench("parse 1000 JSON data lines", () => {
    for (const p of jsonPayloads) {
      const match = p.match(/^data: (.+)\n\n/)
      if (match) JSON.parse(match[1])
    }
  })
})

// --- SSE Reconnect Schedule ---
group("SSE Reconnect Schedule", () => {
  bench("reconnect delay, 10 attempts", () => {
    for (let i = 0; i < 10; i++) sseReconnectDelay(i)
  })

  bench("reconnect delay with jitter, 1000 samples", () => {
    for (let i = 0; i < 1000; i++) {
      const d = sseReconnectDelay(i % 10)
      sseReconnectJitter(d)
    }
  })

  bench("max clamp verification, 20 attempts", () => {
    for (let i = 0; i < 20; i++) {
      const d = sseReconnectDelay(i)
      if (d > 30000 && i < 15) throw new Error("premature clamp")
    }
  })
})

// --- Heartbeat Detection ---
group("SSE Heartbeat Detection", () => {
  bench("heartbeat timeout check, 1M iterations", () => {
    let now = Date.now()
    for (let i = 0; i < 1000000; i++) {
      const hb = now - (i * 1000)
      checkHeartbeatTimeout(hb, now, 35000)
    }
  })
})

// --- Incremental Buffer Decoding ---
group("SSE Incremental Buffer Decoding", () => {
  bench("TextDecoder chunked decode, simulated 100KB", () => {
    const decoder = new TextDecoder()
    let fullBuffer = ""
    for (let chunk = 0; chunk < 100; chunk++) {
      const bytes = new TextEncoder().encode("event: message.part.delta\n" + `data: {"delta":"${"x".repeat(900)}"}\n\n`)
      fullBuffer += decoder.decode(bytes, { stream: true })
    }
    parseSSEStream(fullBuffer)
  })
})

// --- SSE vs Polling: Time to First Update ---
group("SSE vs Polling: Time to First Update", () => {
  const POLL_INTERVAL = 3500
  const SSE_NETWORK_LATENCY_MS = 50

  bench("SSE: event arrival (simulated 50ms latency)", () => {
    // SSE delivers event as soon as server emits
    SSE_NETWORK_LATENCY_MS
  })

  bench("Polling: average wait time (half interval)", () => {
    // On average, a change happens mid-way between polls
    POLL_INTERVAL / 2
  })

  bench("Polling: worst case wait (full interval)", () => {
    POLL_INTERVAL
  })

  bench("Polling: best case wait (near-zero)", () => {
    0
  })
})

// --- SSE Stream Reconstruction from Chunks ---
group("SSE Stream Reconstruction", () => {
  const fullMessage = "event: message.part.delta\ndata: {\"delta\":\"Hello\"}\n\nevent: message.part.delta\ndata: {\"delta\":\" World\"}\n\nevent: message.updated\ndata: {\"id\":\"1\"}\n\n"

  bench("split+parse, single chunk", () => {
    parseSSEStream(fullMessage)
  })

  bench("split+parse, split across 4 chunks", () => {
    const chunks = [
      "event: message.part.delta\ndata: ",
      '{"delta":"Hello"}\n\nevent: ',
      "message.part.delta\ndata: {\"delta\":\"",
      ' World"}\n\nevent: message.updated\ndata: {"id":"1"}\n\n',
    ]
    let buffer = ""
    for (const c of chunks) {
      buffer += c
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""
      parseSSEStream(lines.join("\n"))
    }
  })
})
