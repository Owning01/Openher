import { performance } from "node:perf_hooks"
import { readdirSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const STATS = { groups: [], currentGroup: null }

export function group(name, fn) {
  STATS.currentGroup = { name, tests: [] }
  fn()
  STATS.groups.push(STATS.currentGroup)
  STATS.currentGroup = null
}

export function baseline(name, fn) {
  if (!STATS.currentGroup) throw new Error("baseline() must be inside group()")
  STATS.currentGroup.tests.push({ name, fn, isBaseline: true })
}

export function bench(name, fn) {
  if (!STATS.currentGroup) throw new Error("bench() must be inside group()")
  STATS.currentGroup.tests.push({ name, fn, isBaseline: false })
}

// Estimate single-call cost (1 warmup + 1 timed call)
function estimateCost(fn) {
  fn() // warmup
  const t0 = performance.now()
  fn()
  return performance.now() - t0
}

// Measure with smart iteration count based on single-call cost
function measure(fn) {
  const costMs = estimateCost(fn)

  // If the fn itself is expensive (>10ms), just measure 1 call
  if (costMs > 10) {
    const start = performance.now()
    fn()
    const totalMs = performance.now() - start
    const opsPerSec = 1000 / totalMs
    return { avgNs: totalMs * 1e6, avgUs: totalMs * 1000, avgMs: totalMs, opsPerSec, iters: 1 }
  }

  // If moderately expensive (1-10ms), run 5-10 times
  if (costMs > 1) {
    let n = Math.max(1, Math.round(30 / costMs))
    const start = performance.now()
    for (let i = 0; i < n; i++) fn()
    const totalMs = performance.now() - start
    const avgMs = totalMs / n
    return { avgNs: avgMs * 1e6, avgUs: avgMs * 1000, avgMs, opsPerSec: n / (totalMs / 1000), iters: n }
  }

  // Cheap: run enough to fill a 30ms window
  let n = Math.max(1, Math.round(30 / costMs))
  if (n > 5_000_000) n = 5_000_000
  const start = performance.now()
  for (let i = 0; i < n; i++) fn()
  const totalMs = performance.now() - start
  const avgMs = totalMs / n
  return { avgNs: avgMs * 1e6, avgUs: avgMs * 1000, avgMs, opsPerSec: n / (totalMs / 1000), iters: n }
}

export async function runAll(modules) {
  console.log("=".repeat(80))
  console.log("  OPENCODE MOBILE — BENCHMARK SUITE")
  console.log("  Node:", process.version, "| Platform:", process.platform)
  console.log("  Date:", new Date().toISOString())
  console.log("=".repeat(80))

  for (const modPath of modules) {
    console.log(`\n> Loading ${modPath.split("/").pop()}`)
    try { await import(modPath) } catch (err) { console.error(`  FAILED: ${err.message}`) }
  }

  const allResults = {}
  for (const group of STATS.groups) {
    console.log(`\n${"─".repeat(72)}`)
    console.log(`  ${group.name}`)
    console.log(`${"─".repeat(72)}`)

    const results = []
    for (const test of group.tests) {
      const r = measure(test.fn)
      results.push({ ...r, name: test.name, isBaseline: test.isBaseline })

      const opsStr = r.opsPerSec >= 1e6
        ? `${(r.opsPerSec / 1e6).toFixed(2)}M/s`
        : r.opsPerSec >= 1e3 ? `${(r.opsPerSec / 1e3).toFixed(2)}K/s` : `${r.opsPerSec.toFixed(0)}/s`

      const timeStr = r.avgMs >= 1 ? `${r.avgMs.toFixed(3)}ms`
        : r.avgUs >= 1 ? `${r.avgUs.toFixed(2)}µs` : `${r.avgNs.toFixed(1)}ns`

      const bl = test.isBaseline ? " ★" : ""
      console.log(`  ${(test.name + bl).padEnd(58)} ${timeStr.padStart(10)}  ${opsStr.padStart(12)}  n=${r.iters}`)
    }

    const base = results.find((r) => r.isBaseline)
    if (base) {
      for (const r of results) {
        if (!r.isBaseline && r.avgNs > 0) {
          const ratio = base.avgNs / r.avgNs
          console.log(`    └─ vs baseline: ${ratio.toFixed(2)}x ${ratio >= 1 ? "faster" : "slower"}`)
        }
      }
    }
    allResults[group.name] = results
  }

  // Summary
  console.log("\n" + "=".repeat(80))
  console.log("  SUMMARY")
  console.log("=".repeat(80))
  let totalTests = 0
  for (const [g, rs] of Object.entries(allResults)) { totalTests += rs.length }
  console.log(`  Groups: ${Object.keys(allResults).length} | Tests: ${totalTests}`)

  return allResults
}

export function generateMarkdownReport(allResults) {
  let md = "# OpenCode Mobile — Benchmark Report\n\n"
  md += `- **Date:** ${new Date().toISOString()}\n`
  md += `- **Node:** ${process.version}\n`
  md += `- **Platform:** ${process.platform}\n\n`

  for (const [g, rs] of Object.entries(allResults)) {
    md += `## ${g}\n\n`
    md += `| Test | Avg Time | Ops/sec | Iterations |\n|------|----------|---------|------------|\n`
    for (const r of rs) {
      const ts = r.avgMs >= 1 ? `${r.avgMs.toFixed(4)}ms` : r.avgUs >= 1 ? `${r.avgUs.toFixed(2)}µs` : `${r.avgNs.toFixed(1)}ns`
      const os = r.opsPerSec >= 1e6 ? `${(r.opsPerSec / 1e6).toFixed(2)}M` : r.opsPerSec >= 1e3 ? `${(r.opsPerSec / 1e3).toFixed(2)}K` : `${r.opsPerSec.toFixed(0)}`
      md += `| ${r.isBaseline ? "**" + r.name + "**" : r.name} | ${ts} | ${os} | ${r.iters.toLocaleString()} |\n`
    }
    md += "\n"
  }
  return md
}

export async function discoverAndRun() {
  const files = readdirSync(__dirname)
    .filter((f) => f.endsWith("-benchmark.mjs"))
    .map((f) => `file:///${resolve(__dirname, f).replace(/\\/g, "/")}`)

  const results = await runAll(files)
  console.log("\n" + "─".repeat(72))
  console.log("  MARKDOWN REPORT")
  console.log("─".repeat(72) + "\n")
  console.log(generateMarkdownReport(results))
  return { results, markdown: generateMarkdownReport(results) }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  discoverAndRun().catch(console.error)
}
