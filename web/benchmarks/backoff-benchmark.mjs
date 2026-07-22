import { bench, group, baseline } from "./runner.mjs"

// Pure functions extracted from hooks
function sseDelay(attempt, base = 1000, max = 30000) {
  return Math.min(base * Math.pow(2, attempt), max)
}

function sseJitter(delay) {
  return delay * (0.5 + Math.random() * 0.5)
}

function pollBackoff(failCount, base = 1000, max = 60000, jitterFactor = 0.3) {
  const raw = Math.min(base * Math.pow(2, failCount), max)
  return Math.round(raw + raw * jitterFactor * Math.random())
}

function pollComputeDelay(failCount, streamActive, intervalMs) {
  if (streamActive) return intervalMs
  if (failCount > 0) {
    const base = Math.min(1000 * Math.pow(2, failCount), 60000)
    return Math.round(base + base * 0.3 * Math.random())
  }
  return intervalMs
}

// --- SSE Backoff Test ---
group("SSE Reconnect Backoff", () => {
  bench("delay growth 10 attempts", () => {
    for (let i = 0; i < 10; i++) sseDelay(i)
  })
  bench("delay growth 100 attempts", () => {
    for (let i = 0; i < 100; i++) sseDelay(i)
  })
  bench("jittered delay 10k samples", () => {
    for (let i = 0; i < 10000; i++) {
      const d = sseDelay(i % 10)
      sseJitter(d)
    }
  })
  baseline("raw Math.pow baseline", () => {
    for (let i = 0; i < 100000; i++) Math.pow(2, i % 10)
  })
})

group("SSE Maximum Delay Clamping", () => {
  bench("clamp to 30s max", () => {
    for (let i = 0; i < 10; i++) {
      const d = sseDelay(i, 1000, 30000)
      if (d > 30000) throw new Error("over max")
    }
  })
})

// --- Polling Backoff Test ---
group("Polling Delay Computation", () => {
  bench("failCount 1..20, no stream", () => {
    for (let f = 0; f < 20; f++) pollBackoff(f)
  })
  bench("failCount 0..20, 10k samples each", () => {
    for (let sample = 0; sample < 10000; sample++) {
      for (let f = 0; f < 20; f++) pollBackoff(f)
    }
  })
  bench("computeDelay full logic, 10k iterations", () => {
    for (let i = 0; i < 10000; i++) {
      pollComputeDelay(i % 8, i % 3 === 0, 3500)
    }
  })
})

group("Polling Jitter Distribution", () => {
  bench("jitter spread over 100k samples", () => {
    const results = []
    for (let i = 0; i < 100000; i++) {
      results.push(pollBackoff(3))
    }
    return results
  })
})

group("Polling Recovery Gradual Decrease", () => {
  bench("failCount decrease: 5→0 across 5 calls", () => {
    for (let fc = 5; fc >= 0; fc--) pollBackoff(fc)
  })
})

// --- Throughput Test ---
group("Backoff Throughput (combined)", () => {
  bench("100k mixed SSE + Poll delays", () => {
    for (let i = 0; i < 100000; i++) {
      const attempt = i % 10
      sseDelay(attempt)
      pollBackoff(attempt)
    }
  })
})
