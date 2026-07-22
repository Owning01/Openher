import { bench, group, baseline } from "./runner.mjs"

const POLL_BACKOFF_BASE = 1000
const POLL_BACKOFF_MAX = 60000
const POLL_JITTER = 0.3
const POLL_MAX_RETRIES = 5

function computeDelay(failCount, streamActive = false, intervalMs = 3500) {
  if (streamActive) return intervalMs
  if (failCount > 0) {
    const base = Math.min(POLL_BACKOFF_BASE * Math.pow(2, failCount), POLL_BACKOFF_MAX)
    const jitter = base * POLL_JITTER * Math.random()
    return Math.round(base + jitter)
  }
  return intervalMs
}

function backoffCurve(maxFailCount = 10) {
  const results = []
  for (let f = 0; f <= maxFailCount; f++) {
    results.push(Math.min(POLL_BACKOFF_BASE * Math.pow(2, f), POLL_BACKOFF_MAX))
  }
  return results
}

function backoffWithRecovery(initialFails, steps) {
  let fc = initialFails
  const delays = []
  for (let s = 0; s < steps; s++) {
    delays.push(computeDelay(fc))
    // Simulate: on success decrement, on error increment
    if (s % 2 === 0) fc = Math.max(0, fc - 1)
    else fc = Math.min(fc + 1, POLL_MAX_RETRIES)
  }
  return delays
}

function simulatePollingScenario(events, intervalMs = 3500) {
  let fc = 0
  const delays = []
  for (const event of events) {
    if (event === "success") {
      fc = Math.max(0, fc - 1)
    } else if (event === "error") {
      fc = Math.min(fc + 1, POLL_MAX_RETRIES)
    }
    delays.push(computeDelay(fc, false, intervalMs))
  }
  return delays
}

// --- Polling Delay Computation ---
group("Polling Delay Computation", () => {
  bench("failCount 0..10, no jitter (raw), 100k iters", () => {
    for (let i = 0; i < 100000; i++) {
      for (let f = 0; f <= 10; f++) Math.min(1000 * Math.pow(2, f), 60000)
    }
  })

  bench("computeDelay with jitter, fail 0..10, 10k iters", () => {
    for (let i = 0; i < 10000; i++) {
      for (let f = 0; f <= 10; f++) computeDelay(f)
    }
  })

  bench("computeDelay streamActive=true, 10k iters", () => {
    for (let i = 0; i < 10000; i++) computeDelay(5, true, 1000)
  })

  baseline("Math.pow + Math.min (no jitter), 100k", () => {
    for (let i = 0; i < 100000; i++) {
      Math.min(1000 * Math.pow(2, i % 10), 60000)
    }
  })
})

// --- Backoff Curve Growth ---
group("Backoff Curve Characteristics", () => {
  bench("curve values at each fail count 0..10", () => {
    backoffCurve(10)
  })

  bench("verify exponential: each step is >= previous", () => {
    const curve = backoffCurve(10)
    for (let i = 1; i < curve.length; i++) {
      if (curve[i] < curve[i - 1]) throw new Error("not monotonic")
    }
  })

  bench("verify clamped at 60s max", () => {
    for (let f = 0; f <= 20; f++) {
      const d = Math.min(1000 * Math.pow(2, f), 60000)
      if (d > 60000) throw new Error("clamp failed")
      if (f >= 6 && d !== 60000) throw new Error(`should be clamped at f=${f}: got ${d}`)
    }
  })
})

// --- Polling Recovery Pattern ---
group("Polling Recovery After Failures", () => {
  bench("recovery: 5 fails → 5 successes", () => {
    backoffWithRecovery(5, 10)
  })

  bench("recovery: 3 fails → 10 successes", () => {
    backoffWithRecovery(3, 10)
  })
})

// --- Full Scenario Simulation ---
group("Real-world Polling Scenarios", () => {
  // Scenario A: Stable server, occasional hiccup
  bench("scenario A: stable with 1 error (20 polls)", () => {
    const events = Array(19).fill("success")
    events.splice(10, 0, "error")
    simulatePollingScenario(events, 3500)
  })

  // Scenario B: Server down for 3 polls, then back
  bench("scenario B: 3 consecutive errors then recovery (15 polls)", () => {
    const events = [
      "success", "success",
      "error", "error", "error",
      "success", "success", "success", "success", "success",
      "success", "success", "success", "success", "success",
    ]
    simulatePollingScenario(events, 3500)
  })

  // Scenario C: Intermittent failures (50% error rate)
  bench("scenario C: alternating success/error (20 polls)", () => {
    const events = []
    for (let i = 0; i < 20; i++) events.push(i % 2 === 0 ? "success" : "error")
    simulatePollingScenario(events, 3500)
  })

  // Scenario D: SSE active for part of the time
  bench("scenario D: SSE streaming kicks in (10 polls)", () => {
    let fc = 0
    const delays = []
    for (let i = 0; i < 10; i++) {
      const streaming = i >= 3 && i <= 6
      delays.push(computeDelay(fc, streaming, 3500))
      if (streaming) fc = 0
      else if (i % 2 === 0) fc = Math.min(fc + 1, POLL_MAX_RETRIES)
      else fc = 0
    }
    return delays
  })
})

// --- Total delay across scenarios ---
group("Total Cumulative Delay", () => {
  bench("5 consecutive failures, total time", () => {
    const delays = []
    for (let f = 0; f < 5; f++) delays.push(computeDelay(f))
    const total = delays.reduce((a, b) => a + b, 0)
    return total
  })

  bench("10 failures with recoveries", () => {
    let fc = 0
    let total = 0
    for (let i = 0; i < 10; i++) {
      total += computeDelay(fc)
      if (i % 3 === 2) fc = Math.max(0, fc - 1)
      else fc = Math.min(fc + 1, POLL_MAX_RETRIES)
    }
    return total
  })
})

// --- Polling Efficiency: Requests saved by backoff ---
group("Polling Efficiency Metrics", () => {
  bench("requests avoided by backoff (5 fails → 3.5s → 7s → 14s...)", () => {
    const standard_interval = 3500
    let total_backoff_delay = 0
    let total_standard_delay = 0
    let fc = 0
    for (let i = 0; i < 5; i++) {
      total_backoff_delay += computeDelay(fc)
      total_standard_delay += standard_interval
      fc++
    }
    return { standard: total_standard_delay, backoff: total_backoff_delay, saved: total_standard_delay - total_backoff_delay }
  })
})
