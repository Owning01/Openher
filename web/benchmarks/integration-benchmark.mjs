import { bench, group } from "./runner.mjs"

// Full pipeline simulation: from server response to UI state

// --- Scenario 1: Initial Load ---
// Server sends session list → filter → sort → cache → render
group("Scenario 1: Initial Session Load", () => {
  function generateSessions(count) {
    const sessions = []
    for (let i = 0; i < count; i++) {
      sessions.push({
        id: `sess-${i}`,
        title: `Project ${i} work`,
        directory: `/home/user/p${i % 5}`,
        time: { created: Date.now() - i * 120000, updated: Date.now() - i * 60000 },
        summary: { additions: i * 10, deletions: i * 5, files: i % 8 },
        tokens: { total: i * 1000, input: i * 600, output: i * 400, reasoning: 0, cache: { read: 0, write: 0 } },
        cost: i * 0.02,
        agent: i % 3 === 0 ? "primary" : "subagent",
        model: { id: "gpt-4", providerID: "openai" },
      })
    }
    return sessions
  }

  function processSessions(sessions, query) {
    const filtered = sessions.filter((s) => {
      if (!query) return true
      const q = query.toLowerCase()
      return s.title.toLowerCase().includes(q) || s.directory.toLowerCase().includes(q)
    })
    const sorted = [...filtered].sort((a, b) => b.time.updated - a.time.updated)
    return sorted.map((s) => ({
      id: s.id,
      title: s.title,
      directory: s.directory,
      updated: s.time.updated,
      status: "idle",
      files: s.summary?.files ?? 0,
      additions: s.summary?.additions ?? 0,
      deletions: s.summary?.deletions ?? 0,
      tokens: s.tokens,
      cost: s.cost,
      agent: s.agent,
    }))
  }

  const sessions10 = generateSessions(10)
  const sessions100 = generateSessions(100)
  const sessions1000 = generateSessions(1000)

  bench("10 sessions: filter + sort + transform", () => processSessions(sessions10, "Project"))
  bench("100 sessions: filter + sort + transform", () => processSessions(sessions100, "Project"))
  bench("1000 sessions: filter + sort + transform", () => processSessions(sessions1000, "Project"))
  bench("1000 sessions: no filter (full list)", () => processSessions(sessions1000, ""))
  bench("1000 sessions × 100 iterations", () => {
    for (let i = 0; i < 100; i++) processSessions(sessions1000, "")
  })
})

// --- Scenario 2: Message Load + Render Pipeline ---
group("Scenario 2: Message Load + Render Pipeline", () => {
  function generateMessageData(msgCount, partsPerMsg) {
    const messages = []
    for (let m = 0; m < msgCount; m++) {
      const parts = []
      for (let p = 0; p < partsPerMsg; p++) {
        parts.push({
          id: `p-${m}-${p}`,
          type: p === 0 ? "text" : p % 3 === 0 ? "thinking" : "tool_use",
          text: p === 0 ? "Here is the implementation:\n\n```typescript\nconst x = 1;\n```\n\nThat's it." : "content ".repeat(20),
        })
      }
      messages.push({
        info: { id: `msg-${m}`, role: m % 2 ? "assistant" : "user", sessionID: "sess-1", time: { created: Date.now() - (msgCount - m) * 1000 } },
        parts,
      })
    }
    return messages
  }

  function renderAllMessages(messages) {
    return messages.map((m) => {
      const text = m.parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join("")
      const codeBlocks = []
      const re = /```(\w*)\n([\s\S]*?)```/g
      let match
      while ((match = re.exec(text)) !== null) codeBlocks.push({ lang: match[1], code: match[2] })
      return {
        id: m.info.id,
        role: m.info.role,
        text,
        codeBlocks: codeBlocks.length,
        hasThinking: m.parts.some((p) => p.type === "thinking"),
        hasTools: m.parts.some((p) => p.type.startsWith("tool")),
        tokens: m.info.tokens,
      }
    })
  }

  const fewMsgs = generateMessageData(5, 4)
  const manyMsgs = generateMessageData(50, 8)
  const heavyMsgs = generateMessageData(200, 12)

  bench("5 messages, 4 parts each", () => renderAllMessages(fewMsgs))
  bench("50 messages, 8 parts each", () => renderAllMessages(manyMsgs))
  bench("200 messages, 12 parts each", () => renderAllMessages(heavyMsgs))
  bench("200 messages × 50 iterations", () => {
    for (let i = 0; i < 50; i++) renderAllMessages(heavyMsgs)
  })
})

// --- Scenario 3: SSE Event → UI Update Pipeline ---
group("Scenario 3: SSE Event → UI Update", () => {
  function parseSSEPayload(raw) {
    const events = []
    let current = {}
    for (const line of raw.split("\n")) {
      if (line.startsWith("event: ")) current.type = line.slice(7).trim()
      else if (line.startsWith("data: ")) current.data = JSON.parse(line.slice(6))
      else if (line === "" && current.type) { events.push(current); current = {} }
    }
    return events
  }

  function applySSEToSession(event, currentMessages) {
    if (event.type === "message.updated") {
      return { needsRefresh: true, reason: "full message" }
    }
    if (event.type === "message.part.delta") {
      return { needsRefresh: true, reason: "delta" }
    }
    return { needsRefresh: false }
  }

  function buildSSEPayload(eventCount) {
    const lines = []
    for (let i = 0; i < eventCount; i++) {
      if (i % 3 === 0) {
        lines.push("event: message.updated")
        lines.push(`data: {"id":"msg-${i}","sessionID":"sess-1"}`)
      } else {
        lines.push("event: message.part.delta")
        lines.push(`data: {"id":"${i}","sessionID":"sess-1","partID":"p-${i}","field":"text","delta":"chunk"}`)
      }
      lines.push("")
    }
    return lines.join("\n")
  }

  bench("parse + apply 10 SSE events", () => {
    const raw = buildSSEPayload(10)
    const events = parseSSEPayload(raw)
    for (const e of events) applySSEToSession(e, [])
  })

  bench("parse + apply 100 SSE events", () => {
    const raw = buildSSEPayload(100)
    const events = parseSSEPayload(raw)
    for (const e of events) applySSEToSession(e, [])
  })

  bench("parse + apply 500 SSE events", () => {
    const raw = buildSSEPayload(500)
    const events = parseSSEPayload(raw)
    for (const e of events) applySSEToSession(e, [])
  })

  bench("event loop: 1000 events, incremental buffer", () => {
    let buffer = ""
    let eventCount = 0
    const chunks = []
    for (let i = 0; i < 1000; i++) {
      chunks.push("event: message.part.delta\ndata: {\"id\":" + i + "}\n\n")
    }
    const full = chunks.join("")
    // Simulate streaming in 50 chunks
    const chunkSize = Math.ceil(full.length / 50)
    for (let i = 0; i < full.length; i += chunkSize) {
      buffer += full.slice(i, i + chunkSize)
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""
      for (const line of lines) {
        if (line.startsWith("event: ")) eventCount++
      }
    }
    return eventCount
  })
})

// --- Scenario 4: Poll → Backoff → Cache → SSE Handoff ---
group("Scenario 4: Convergence - Polling to SSE Handoff", () => {
  function simulateHandoff(initialFails, pollInterval, sseArrivesAtMs) {
    let fc = initialFails
    let totalTime = 0
    const decisions = []

    // Polling phase
    while (totalTime < sseArrivesAtMs) {
      const delay = Math.min(1000 * Math.pow(2, fc), 60000)
      const jittered = delay * (0.5 + Math.random() * 0.5)
      totalTime += jittered
      if (totalTime < sseArrivesAtMs) {
        decisions.push({ phase: "poll", failCount: fc, delay: jittered })
        fc = Math.min(fc + 1, 5)
      }
    }

    // SSE handoff
    decisions.push({ phase: "sse", arrivedAt: totalTime })

    // SSE active → poll at full interval
    totalTime += pollInterval
    decisions.push({ phase: "sse-poll", delay: pollInterval })

    return decisions
  }

  bench("handoff: 0 initial fails, SSE arrives at 3s", () => {
    simulateHandoff(0, 3500, 3000)
  })

  bench("handoff: 3 initial fails, SSE arrives at 10s", () => {
    simulateHandoff(3, 3500, 10000)
  })

  bench("handoff: 5 initial fails, SSE arrives at 30s", () => {
    simulateHandoff(5, 3500, 30000)
  })
})

// --- Scenario 5: Full Diff Load Pipeline ---
group("Scenario 5: Diff Load Pipeline", () => {
  function parseDiffResponse(content) {
    const files = []
    const blocks = content.split(/(?=^diff --git)/m)
    for (const block of blocks) {
      if (!block.trim()) continue
      const fileMatch = block.match(/^diff --git a\/(.+?) b\//m)
      const statsMatch = block.match(/^@@.*\+(\d+),.*-(\d+)/m)
      if (fileMatch) {
        files.push({
          file: fileMatch[1],
          additions: statsMatch ? parseInt(statsMatch[1]) : 0,
          deletions: statsMatch ? parseInt(statsMatch[2]) : 0,
          content: block,
        })
      }
    }
    return files
  }

  function generateDiffResponse(fileCount, linesPerFile) {
    let output = ""
    for (let f = 0; f < fileCount; f++) {
      output += `diff --git a/src/file${f}.ts b/src/file${f}.ts\n`
      output += `--- a/src/file${f}.ts\n`
      output += `+++ b/src/file${f}.ts\n`
      output += `@@ -1,${linesPerFile} +1,${linesPerFile} @@\n`
      for (let l = 0; l < linesPerFile; l++) {
        if (l % 2 === 0) output += `+console.log("line ${l}");\n`
        else output += ` const unchanged = ${l};\n`
      }
      output += "\n"
    }
    return output
  }

  bench("5 files, 20 lines each", () => parseDiffResponse(generateDiffResponse(5, 20)))
  bench("20 files, 100 lines each", () => parseDiffResponse(generateDiffResponse(20, 100)))
  bench("50 files, 200 lines each", () => parseDiffResponse(generateDiffResponse(50, 200)))
  bench("5 files × 1000 iterations", () => {
    const content = generateDiffResponse(5, 20)
    for (let i = 0; i < 1000; i++) parseDiffResponse(content)
  })
})

// --- Scenario 6: Question/Reply Cycle ---
group("Scenario 6: Question → Reply Cycle", () => {
  function buildQuestionPayload(id, question) {
    return { id, question, status: "pending" }
  }

  function buildReply(answers) {
    return { answers: answers.map((a) => [a]) }
  }

  bench("create question object", () => buildQuestionPayload("q-1", "Which file should I edit?"))
  bench("build reply with 3 answers", () => buildReply(["src/main.ts", "src/utils.ts", "src/types.ts"]))
  bench("1000 question builds", () => {
    for (let i = 0; i < 1000; i++) buildQuestionPayload(`q-${i}`, `Question number ${i}`)
  })
  bench("1000 reply builds with 5 answers each", () => {
    for (let i = 0; i < 1000; i++) {
      const answers = []
      for (let j = 0; j < 5; j++) answers.push(`answer-${j}`)
      buildReply(answers)
    }
  })
})

// --- Scenario 7: Full App Bootstrap ---
group("Scenario 7: App Bootstrap (connection + session load + message load)", () => {
  function simulateBootstrap(config) {
    // Step 1: Health check URL
    const healthUrl = `${config.host}:${config.port}/global/health`

    // Step 2: List sessions URL
    const sessionsUrl = `${config.host}:${config.port}/session`

    // Step 3: Load each session's status
    const statusUrl = `${config.host}:${config.port}/session/status`

    // Step 4: Message URL construction
    const msgUrl = `${config.host}:${config.port}/session/sess-1/message?limit=100`

    return { healthUrl, sessionsUrl, statusUrl, msgUrl }
  }

  const config = { host: "192.168.1.100", port: 8080, username: "admin", password: "secret" }

  bench("URL construction for bootstrap (4 URLs)", () => simulateBootstrap(config))

  bench("1000 bootstrap sequences", () => {
    for (let i = 0; i < 1000; i++) {
      const c = { host: `192.168.1.${i % 255}`, port: 8080 + (i % 100), username: "user", password: "pass" }
      simulateBootstrap(c)
    }
  })
})

// --- Scenario 8: UI State Diff (React reconciliation simulation) ---
group("Scenario 8: State Diff Computation", () => {
  function computeListDiff(oldList, newList, keyFn) {
    const oldKeys = new Set(oldList.map(keyFn))
    const newKeys = new Set(newList.map(keyFn))
    const added = newList.filter((item) => !oldKeys.has(keyFn(item)))
    const removed = oldList.filter((item) => !newKeys.has(keyFn(item)))
    const kept = newList.filter((item) => oldKeys.has(keyFn(item)))
    return { added, removed, kept, changed: added.length + removed.length }
  }

  const oldSessions = []
  const newSessions = []
  for (let i = 0; i < 100; i++) {
    oldSessions.push({ id: `sess-${i}`, title: `Session ${i}` })
    newSessions.push({ id: `sess-${i}`, title: `Session ${i} updated` })
  }
  // Add a few new ones
  for (let i = 100; i < 105; i++) newSessions.push({ id: `sess-${i}`, title: `Session ${i}` })
  // Remove a few
  oldSessions.push({ id: "sess-old", title: "Old" })

  bench("diff 100 vs 105 sessions (5 adds, 1 remove)", () => {
    computeListDiff(oldSessions, newSessions, (s) => s.id)
  })

  bench("diff 100 vs 100 sessions (all same keys)", () => {
    computeListDiff(oldSessions.slice(0, 100), newSessions.slice(0, 100), (s) => s.id)
  })

  bench("1000 state diffs", () => {
    for (let iter = 0; iter < 1000; iter++) {
      computeListDiff(oldSessions, newSessions, (s) => s.id)
    }
  })
})
