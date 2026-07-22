import { bench, group } from "./runner.mjs"

// Simulated IndexedDB operations (pure JS)
class InMemoryStore {
  constructor() {
    this.store = new Map()
  }
  put(key, value) {
    this.store.set(key, value)
  }
  get(key) {
    return this.store.get(key) ?? null
  }
  getAll() {
    return Array.from(this.store.values())
  }
  delete(key) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
  get size() {
    return this.store.size
  }
}

function generateSession(id) {
  return {
    id: `sess-${id}`,
    title: `Session ${id} - ${"task description ".repeat(5 + (id % 5))}`,
    directory: `/home/user/project-${id % 10}`,
    time: { created: Date.now() - id * 60000, updated: Date.now() },
    summary: { additions: id * 10, deletions: id * 5, files: id % 8 },
    tokens: { total: id * 1000, input: id * 600, output: id * 400, reasoning: id * 100, cache: { read: id * 50, write: id * 10 } },
    cost: id * 0.05,
    agent: id % 3 === 0 ? "primary" : "subagent",
    model: { id: "gpt-4", providerID: "openai" },
  }
}

function generateMessage(sessionID, count) {
  const messages = []
  for (let i = 0; i < count; i++) {
    messages.push({
      info: {
        id: `msg-${sessionID}-${i}`,
        role: i % 2 === 0 ? "user" : "assistant",
        sessionID,
        time: { created: Date.now() - (count - i) * 1000 },
      },
      parts: [
        { id: `part-${i}-0`, type: "text", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(10 + (i % 5)) },
      ],
    })
  }
  return messages
}

// --- Single Operation Throughput ---
group("InMemory Cache: Single Operations", () => {
  const store = new InMemoryStore()

  bench("set 1 session", () => {
    store.put(generateSession(1).id, generateSession(1))
  })

  bench("get 1 session", () => {
    store.get("sess-1")
  })

  bench("getAll (10 sessions)", () => {
    const s = new InMemoryStore()
    for (let i = 0; i < 10; i++) s.put(`sess-${i}`, generateSession(i))
    s.getAll()
  })

  bench("getAll (100 sessions)", () => {
    const s = new InMemoryStore()
    for (let i = 0; i < 100; i++) s.put(`sess-${i}`, generateSession(i))
    s.getAll()
  })

  store.clear()
})

// --- Batch Write Throughput ---
group("Cache: Batch Write Throughput", () => {
  bench("write 10 sessions", () => {
    const s = new InMemoryStore()
    for (let i = 0; i < 10; i++) s.put(`sess-${i}`, generateSession(i))
    return s.size
  })

  bench("write 100 sessions", () => {
    const s = new InMemoryStore()
    for (let i = 0; i < 100; i++) s.put(`sess-${i}`, generateSession(i))
    return s.size
  })

  bench("write 1000 sessions", () => {
    const s = new InMemoryStore()
    for (let i = 0; i < 1000; i++) s.put(`sess-${i}`, generateSession(i))
    return s.size
  })

  bench("write 1000 messages (10 msg × 100 sessions)", () => {
    const s = new InMemoryStore()
    for (let i = 0; i < 100; i++) {
      s.put(`sess-${i}`, { sessionID: `sess-${i}`, messages: generateMessage(`sess-${i}`, 10), cachedAt: Date.now() })
    }
    return s.size
  })

  bench("write 10000 messages (100 msg × 100 sessions)", () => {
    const s = new InMemoryStore()
    for (let i = 0; i < 100; i++) {
      s.put(`sess-${i}`, { sessionID: `sess-${i}`, messages: generateMessage(`sess-${i}`, 100), cachedAt: Date.now() })
    }
    return s.size
  })
})

// --- Read Throughput ---
group("Cache: Read Throughput", () => {
  const s = new InMemoryStore()
  for (let i = 0; i < 100; i++) s.put(`sess-${i}`, generateSession(i))
  for (let i = 0; i < 100; i++) {
    s.put(`msgs-${i}`, { sessionID: `sess-${i}`, messages: generateMessage(`sess-${i}`, 50), cachedAt: Date.now() })
  }

  bench("get individual sessions, 100 iterations", () => {
    for (let i = 0; i < 100; i++) s.get(`sess-${i}`)
  })

  bench("getAll sessions", () => {
    s.getAll()
  })

  s.clear()
})

// --- Object Serialization Size ---
group("Cache: Object Serialization Size", () => {
  bench("JSON.stringify 1 session", () => {
    JSON.stringify(generateSession(1))
  })

  bench("JSON.stringify 1 message batch (50 msgs)", () => {
    JSON.stringify({ sessionID: "sess-1", messages: generateMessage("sess-1", 50), cachedAt: Date.now() })
  })

  bench("JSON.stringify 100 sessions (array)", () => {
    const sessions = []
    for (let i = 0; i < 100; i++) sessions.push(generateSession(i))
    JSON.stringify(sessions)
  })

  bench("JSON.parse + stringify round trip, 1 session", () => {
    const s = JSON.stringify(generateSession(1))
    JSON.parse(s)
  })

  bench("JSON.parse + stringify round trip, 100 sessions", () => {
    const sessions = []
    for (let i = 0; i < 100; i++) sessions.push(generateSession(i))
    const s = JSON.stringify(sessions)
    JSON.parse(s)
  })
})

// --- Cache Lookup by Session ID ---
group("Cache: Lookup Performance (Map.get)", () => {
  const store = new InMemoryStore()
  for (let i = 0; i < 1000; i++) store.put(`sess-${i}`, generateSession(i))

  bench("sequential access, 1000 gets", () => {
    for (let i = 0; i < 1000; i++) store.get(`sess-${i}`)
  })

  bench("random access, 1000 gets", () => {
    for (let i = 0; i < 1000; i++) {
      const idx = Math.floor(Math.random() * 1000)
      store.get(`sess-${idx}`)
    }
  })

  store.clear()
})

// --- Concurrent Read/Write Simulation ---
group("Cache: Mixed Read/Write Load", () => {
  const store = new InMemoryStore()

  bench("interleaved 100 writes + 100 reads", () => {
    for (let i = 0; i < 100; i++) {
      store.put(`k-${i}`, generateSession(i))
    }
    for (let i = 0; i < 100; i++) {
      store.get(`k-${i}`)
    }
  })

  bench("interleaved 1000 writes + 1000 reads", () => {
    for (let i = 0; i < 1000; i++) {
      store.put(`k-${i}`, generateSession(i))
    }
    for (let i = 0; i < 1000; i++) {
      store.get(`k-${i}`)
    }
  })

  store.clear()
})

// --- Cache Eviction simulation ---
group("Cache: Update Overwrite", () => {
  const store = new InMemoryStore()
  for (let i = 0; i < 100; i++) store.put(`sess-${i}`, generateSession(i))

  bench("overwrite all 100 sessions", () => {
    for (let i = 0; i < 100; i++) store.put(`sess-${i}`, generateSession(i + 1000))
  })

  bench("delete all 100 entries", () => {
    for (let i = 0; i < 100; i++) store.delete(`sess-${i}`)
  })

  store.clear()
})

// --- Structured Clone (simulating IndexedDB structured clone) ---
group("Cache: Structured Clone Simulation", () => {
  bench("structuredClone 1 session", () => {
    structuredClone(generateSession(1))
  })

  bench("structuredClone 100 sessions", () => {
    const sessions = []
    for (let i = 0; i < 100; i++) sessions.push(generateSession(i))
    structuredClone(sessions)
  })
})
