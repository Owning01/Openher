import { bench, group } from "./runner.mjs"

// Measure pure JS rendering operations (no DOM since we're in Node)
// These simulate the CPU work that occurs during component rendering

// --- Message Rendering (simulated) ---
function renderMessageText(parts) {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("")
}

function renderThinkingParts(parts) {
  return parts.filter((p) => p.type === "thinking")
}

function renderToolParts(parts) {
  return parts.filter((p) => p.type === "tool_use" || p.type === "tool_result" || p.type === "tool")
}

function buildRenderedMessage(envelope) {
  const text = renderMessageText(envelope.parts)
  return {
    info: envelope.info,
    parts: envelope.parts,
    text,
    hasCompaction: envelope.parts.some((p) => p.type === "compaction"),
    thinkingParts: renderThinkingParts(envelope.parts),
    toolParts: renderToolParts(envelope.parts),
    tokens: envelope.info.tokens,
    cost: envelope.info.cost,
  }
}

function generateMessage(partCount, textLength) {
  const parts = []
  for (let i = 0; i < partCount; i++) {
    if (i % 4 === 0) {
      parts.push({ id: `p-${i}`, type: "text", text: "x".repeat(textLength) })
    } else if (i % 4 === 1) {
      parts.push({ id: `p-${i}`, type: "thinking", text: "I need to think about this...\n".repeat(5) })
    } else if (i % 4 === 2) {
      parts.push({ id: `p-${i}`, type: "tool_use", text: `Tool: read_file filePath="src/main.ts"` })
    } else {
      parts.push({ id: `p-${i}`, type: "tool_result", text: "File contents:\n".repeat(20) })
    }
  }
  return {
    info: {
      id: "msg-1",
      role: "assistant",
      sessionID: "sess-1",
      time: { created: Date.now() },
      tokens: { total: 1000, input: 400, output: 600, reasoning: 100, cache: { read: 50, write: 10 } },
      cost: 0.02,
    },
    parts,
  }
}

// --- Text Rendering ---
group("Text Rendering: Content Assembly", () => {
  const smallMsg = generateMessage(4, 100)
  const medMsg = generateMessage(20, 500)
  const largeMsg = generateMessage(100, 2000)

  bench("4 parts, short text", () => buildRenderedMessage(smallMsg))
  bench("20 parts, medium text", () => buildRenderedMessage(medMsg))
  bench("100 parts, long text", () => buildRenderedMessage(largeMsg))
  bench("100 parts × 100 iterations", () => {
    for (let i = 0; i < 100; i++) buildRenderedMessage(largeMsg)
  })
})

// --- Part Filtering ---
group("Part Filtering by Type", () => {
  const parts = []
  for (let i = 0; i < 1000; i++) {
    const types = ["text", "thinking", "tool_use", "tool_result", "compaction"]
    parts.push({ id: `p-${i}`, type: types[i % types.length], text: "content" })
  }

  bench("filter 1000 parts for text type", () => parts.filter((p) => p.type === "text"))
  bench("filter 1000 parts for tool types", () => parts.filter((p) => p.type === "tool_use" || p.type === "tool_result"))
  bench("filter 1000 parts for thinking", () => parts.filter((p) => p.type === "thinking"))
  bench("filter 1000 parts × 1000 iterations", () => {
    for (let iter = 0; iter < 1000; iter++) {
      parts.filter((p) => p.type === "text")
      parts.filter((p) => p.type === "tool_use" || p.type === "tool_result")
    }
  })
})

// --- Diff Rendering ---
group("Diff Rendering Simulation", () => {
  function parseDiffLines(content) {
    return content.split("\n")
  }

  function countDiffStats(lines) {
    let additions = 0, deletions = 0
    for (const line of lines) {
      if (line.startsWith("+") && !line.startsWith("+++")) additions++
      if (line.startsWith("-") && !line.startsWith("---")) deletions++
    }
    return { additions, deletions }
  }

  function generateDiff(linesCount) {
    const lines = []
    lines.push("--- a/src/file.ts")
    lines.push("+++ b/src/file.ts")
    for (let i = 0; i < linesCount; i++) {
      if (i % 3 === 0) lines.push(`+console.log("line ${i}");`)
      else if (i % 3 === 1) lines.push(`-const old = "${i}";`)
      else lines.push(` const unchanged = ${i};`)
    }
    return lines.join("\n")
  }

  const smallDiff = generateDiff(50)
  const medDiff = generateDiff(500)
  const largeDiff = generateDiff(5000)

  bench("parse 50 lines", () => parseDiffLines(smallDiff))
  bench("parse 500 lines", () => parseDiffLines(medDiff))
  bench("parse 5000 lines", () => parseDiffLines(largeDiff))
  bench("parse + stats 500 lines", () => countDiffStats(parseDiffLines(medDiff)))
  bench("parse + stats 5000 lines", () => countDiffStats(parseDiffLines(largeDiff)))
})

// --- Session Card Rendering Simulation ---
group("Session Card Data Transformation", () => {
  function buildSessionView(session) {
    return {
      id: session.id,
      title: session.title,
      directory: session.directory,
      updated: session.time.updated,
      status: "idle",
      files: session.summary?.files ?? 0,
      additions: session.summary?.additions ?? 0,
      deletions: session.summary?.deletions ?? 0,
      tokens: session.tokens,
      cost: session.cost,
      agent: session.agent,
      model: session.model ? { providerID: session.model.providerID, modelID: session.model.id } : undefined,
    }
  }

  const sessions = []
  for (let i = 0; i < 100; i++) {
    sessions.push({
      id: `sess-${i}`,
      title: `Session ${i}`,
      directory: `/home/user/proj`,
      time: { created: Date.now() - i * 60000, updated: Date.now() - i * 30000 },
      summary: { additions: i * 5, deletions: i * 2, files: i % 7 },
      tokens: { total: i * 500, input: i * 300, output: i * 200, reasoning: i * 50, cache: { read: 0, write: 0 } },
      cost: i * 0.01,
      agent: "primary",
      model: { id: "gpt-4", providerID: "openai" },
    })
  }

  bench("transform 1 session", () => buildSessionView(sessions[0]))
  bench("transform 100 sessions", () => sessions.map(buildSessionView))
  bench("transform 100 sessions × 100 iterations", () => {
    for (let iter = 0; iter < 100; iter++) sessions.map(buildSessionView)
  })
})

// --- Provider List Rendering ---
group("Provider Model List Transformation", () => {
  const sampleProviders = [
    {
      id: "openai",
      name: "OpenAI",
      models: { "gpt-4": { name: "GPT-4", status: "online", capabilities: { toolcall: true }, limit: { context: 128000 } } },
      default: {},
    },
    {
      id: "anthropic",
      name: "Anthropic",
      models: { "claude-3": { name: "Claude 3", status: "online", capabilities: { toolcall: true, attachment: true } }, "claude-3-sonnet": {} },
      default: {},
    },
  ]

  function transformModels(providers, defaults = {}) {
    return providers.flatMap((provider) => {
      return Object.entries(provider.models).map(([modelID, model]) => ({
        providerID: provider.id,
        providerName: provider.name || provider.id,
        modelID: model.id || modelID,
        modelName: model.name || model.id || modelID,
        status: model.status,
        contextLimit: model.limit?.context,
        tools: Boolean(model.capabilities?.toolcall),
        attachments: Boolean(model.capabilities?.attachment),
        isDefault: defaults[provider.id] === modelID,
      }))
    })
  }

  bench("2 providers, 3 models total", () => transformModels(sampleProviders))

  // Many providers
  const manyProviders = []
  for (let i = 0; i < 20; i++) {
    const models = {}
    for (let j = 0; j < 5; j++) {
      models[`model-${j}`] = {
        name: `Model ${i}-${j}`,
        status: "online",
        capabilities: { toolcall: j % 2 === 0, attachment: j % 3 === 0 },
        limit: { context: 32000 + j * 16000 },
      }
    }
    manyProviders.push({ id: `provider-${i}`, name: `Provider ${i}`, models })
  }

  bench("20 providers, 100 models total", () => transformModels(manyProviders))

  bench("transform 20 providers × 1000 iterations", () => {
    for (let iter = 0; iter < 1000; iter++) transformModels(manyProviders)
  })
})

// --- Virtual List calculation ---
group("Virtual List Calculations", () => {
  bench("estimate total height, 500 items at 72px each", () => {
    500 * 72
  })

  bench("calculate visible range, 5000 items, 800px viewport, 72px items", () => {
    const viewport = 800
    const itemHeight = 72
    const total = 5000
    const scrollTop = 15000
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 5)
    const end = Math.min(total, Math.ceil((scrollTop + viewport) / itemHeight) + 5)
    return { start, end, count: end - start }
  })

  bench("calculate visible range, 100k iterations varying scrollTop", () => {
    const viewport = 800
    const itemHeight = 72
    const total = 5000
    for (let iter = 0; iter < 100000; iter++) {
      const scrollTop = (iter * 73) % (total * itemHeight)
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 5)
      const end = Math.min(total, Math.ceil((scrollTop + viewport) / itemHeight) + 5)
    }
  })
})

// --- Markdown Text Processing (simplified) ---
group("Text Processing: Code Block Detection", () => {
  function extractCodeBlocks(text) {
    const blocks = []
    const regex = /```(\w*)\n([\s\S]*?)```/g
    let match
    while ((match = regex.exec(text)) !== null) {
      blocks.push({ language: match[1], code: match[2] })
    }
    return blocks
  }

  const textWithCode = "Some text\n```typescript\nconst x = 1;\nconst y = 2;\n```\nmore text\n```javascript\nconsole.log('hi');\n```\n"
  const longText = "Some text\n```python\n" + "line\n".repeat(100) + "```\n" + "```java\n" + "code;\n".repeat(100) + "```\n"

  bench("2 small code blocks", () => extractCodeBlocks(textWithCode))
  bench("2 large code blocks (200 lines)", () => extractCodeBlocks(longText))
  bench("regex test (no match), 100k iterations", () => {
    const re = /```(\w*)\n([\s\S]*?)```/g
    const txt = "plain text with no code blocks at all here"
    for (let i = 0; i < 100000; i++) {
      txt.match(re)
    }
  })
})
