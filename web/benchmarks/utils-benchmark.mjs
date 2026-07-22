import { bench, group } from "./runner.mjs"

function isSessionActive(s) {
  return s.status === "busy" || s.status === "retry"
}

function hasFileChanges(s) {
  return s.files > 0 || s.additions > 0 || s.deletions > 0
}

function formatTime(epoch) {
  if (!epoch || epoch <= 0) return "-"
  return new Date(epoch).toLocaleString()
}

function formatLimit(value, decimals = 0) {
  if (!value) return "-"
  if (value >= 1_000_000) return decimals ? `${(value / 1_000_000).toFixed(decimals)}M` : `${Math.round(value / 1_000_000)}M`
  if (value >= 1_000) return decimals ? `${(value / 1_000).toFixed(decimals)}k` : `${Math.round(value / 1_000)}K`
  return String(value)
}

function pickString(value) {
  return typeof value === "string" && value.trim() ? value : null
}

function filterByQuery(items, query, fields) {
  if (!query.trim()) return items
  const q = query.toLowerCase()
  return items.filter((item) => fields(item).some((f) => f.toLowerCase().includes(q)))
}

function extractPath(dashboard) {
  const project = dashboard?.project
  if (!project) return null
  return pickString(project.path) ?? pickString(project.directory) ?? pickString(project.root) ?? null
}

function filterSessionsByQuery(sessions, query) {
  return filterByQuery(sessions, query, (s) => [s.title, s.directory, s.id, s.agent ?? ""])
}

// --- isSessionActive ---
group("isSessionActive", () => {
  bench("active session (busy)", () => isSessionActive({ status: "busy" }))
  bench("inactive session", () => isSessionActive({ status: "idle" }))
  bench("100k iterations mixed", () => {
    const statuses = ["busy", "idle", "retry", "working", "error"]
    for (let i = 0; i < 100000; i++) isSessionActive({ status: statuses[i % statuses.length] })
  })
})

// --- hasFileChanges ---
group("hasFileChanges", () => {
  bench("has changes", () => hasFileChanges({ files: 3, additions: 10, deletions: 5 }))
  bench("no changes", () => hasFileChanges({ files: 0, additions: 0, deletions: 0 }))
  bench("100k iterations", () => {
    for (let i = 0; i < 100000; i++) hasFileChanges({ files: i % 10, additions: i % 20, deletions: i % 15 })
  })
})

// --- formatTime ---
group("formatTime", () => {
  bench("valid timestamp", () => formatTime(Date.now()))
  bench("zero timestamp", () => formatTime(0))
  bench("negative timestamp", () => formatTime(-1))
  bench("100k iterations valid", () => {
    for (let i = 0; i < 100000; i++) formatTime(Date.now() - i * 60000)
  })
})

// --- formatLimit ---
group("formatLimit", () => {
  bench("null value", () => formatLimit(null))
  bench("small value (< 1K)", () => formatLimit(500))
  bench("medium value (1K-1M)", () => formatLimit(15000))
  bench("large value (>1M)", () => formatLimit(2500000))
  bench("with decimals", () => formatLimit(1555000, 1))
  bench("100k mixed values", () => {
    const vals = [null, 5, 999, 1500, 999999, 1000000, 2500000, 10000000]
    for (let i = 0; i < 100000; i++) formatLimit(vals[i % vals.length])
  })
})

// --- pickString ---
group("pickString", () => {
  bench("valid string", () => pickString("hello world"))
  bench("empty string", () => pickString(""))
  bench("whitespace string", () => pickString("   "))
  bench("non-string", () => pickString(123))
  bench("100k iterations mixed", () => {
    const vals = ["hello", "", "  ", null, undefined, 0, true, "valid"]
    for (let i = 0; i < 100000; i++) pickString(vals[i % vals.length])
  })
})

// --- filterByQuery ---
group("filterByQuery", () => {
  const sessions = []
  for (let i = 0; i < 100; i++) {
    sessions.push({ id: `sess-${i}`, title: `Project ${i} - ${["bugfix", "feature", "refactor"][i % 3]}`, directory: `/home/user/proj-${i % 10}`, agent: i % 2 === 0 ? "primary" : null })
  }

  bench("filter 100 sessions, exact match", () => {
    filterSessionsByQuery(sessions, "Project 5")
  })
  bench("filter 100 sessions, partial match", () => {
    filterSessionsByQuery(sessions, "bug")
  })
  bench("filter 100 sessions, no match", () => {
    filterSessionsByQuery(sessions, "zzzzzzzz")
  })
  bench("filter 100 sessions, empty query", () => {
    filterSessionsByQuery(sessions, "")
  })

  const bigSessions = []
  for (let i = 0; i < 10000; i++) {
    bigSessions.push({ id: `s-${i}`, title: `Session ${i}`, directory: `/p/${i % 100}`, agent: null })
  }
  bench("filter 10000 sessions, partial match", () => {
    filterSessionsByQuery(bigSessions, "Session 99")
  })
  bench("filter 10000 sessions, full scan (no match)", () => {
    filterSessionsByQuery(bigSessions, "zzzzz")
  })
})

// --- extractPath ---
group("extractPath", () => {
  bench("with project.path", () => {
    extractPath({ project: { path: "/home/user/project", directory: "/home/user", root: "/" } })
  })
  bench("with project.directory fallback", () => {
    extractPath({ project: { directory: "/home/user/other" } })
  })
  bench("null dashboard", () => extractPath(null))
  bench("empty project", () => extractPath({ project: {} }))
})

// --- String Building: Message Text ---
group("String Operations", () => {
  bench("concatenate 100 message parts", () => {
    let text = ""
    for (let i = 0; i < 100; i++) text += `Part ${i}: ${"A".repeat(50)}\n`
    return text.length
  })

  bench("join 100 parts into one string", () => {
    const parts = []
    for (let i = 0; i < 100; i++) parts.push(`Part ${i}: ${"A".repeat(50)}`)
    return parts.join("\n").length
  })

  bench("100k small string concat", () => {
    let s = ""
    for (let i = 0; i < 100000; i++) s += "x"
    return s.length
  })
})

// --- Type coercion and validation ---
group("Type Guards & Coercion", () => {
  bench("typeof checks, 1M iterations", () => {
    const vals = ["string", 42, null, undefined, true, {}, [], Symbol("x")]
    for (let i = 0; i < 1000000; i++) {
      const v = vals[i % vals.length]
      typeof v === "string"
    }
  })

  bench("optional chaining, 1M iterations", () => {
    const obj = { a: { b: { c: "deep" } } }
    const nil = null
    for (let i = 0; i < 1000000; i++) {
      obj?.a?.b?.c
      nil?.a?.b?.c
    }
  })
})

// --- Session sorting by time ---
group("Session Sorting", () => {
  const sessions = []
  for (let i = 0; i < 100; i++) {
    sessions.push({ id: `s-${i}`, time: { updated: Date.now() - i * 1000 } })
  }

  bench("sort 100 sessions by time.updated", () => {
    [...sessions].sort((a, b) => b.time.updated - a.time.updated)
  })

  bench("sort 100 sessions by time.updated (desc), 1000 iters", () => {
    for (let iter = 0; iter < 1000; iter++) {
      const copy = [...sessions]
      const shuffled = copy.sort(() => Math.random() - 0.5)
      shuffled.sort((a, b) => b.time.updated - a.time.updated)
    }
  })
})
