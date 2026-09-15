// run-all.mjs — corre los 7 spikes Fase 0 y junta veredictos.
// Uso: node scripts/team-eval/spikes/run-all.mjs [--out dir]
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const outIdx = process.argv.indexOf("--out");
const OUT = outIdx >= 0 ? process.argv[outIdx + 1] : join(HERE, "out");
const SPIKES = [
  ["F0.1", "f0-1-atomic.mjs", 60_000],
  ["F0.2", "f0-2-liveness.mjs", 90_000],
  ["F0.3", "f0-3-feed.mjs", 60_000],
  ["F0.4", "f0-4-agent.mjs", 240_000],
  ["F0.5", "f0-5-delivery.mjs", 15 * 60_000],
  ["F0.6", "f0-6-ttl.mjs", 60_000],
  ["F0.7", "f0-7-worktree.mjs", 120_000],
];
const results = [];
for (const [id, file, timeout] of SPIKES) {
  const r = spawnSync(process.execPath, [join(HERE, file)], { encoding: "utf8", timeout });
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith(`[${id}`)) || "(sin veredicto)";
  const pass = line.includes("PASS");
  console.log(line);
  results.push({ spike: id, pass, timeoutMs: timeout, line: line.slice(0, 500) });
}
const passN = results.filter((r) => r.pass).length;
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "f0-results.json"), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(`[run-all] ${passN}/${results.length} PASS → ${join(OUT, "f0-results.json")}`);
process.exit(passN === results.length ? 0 : 1);
