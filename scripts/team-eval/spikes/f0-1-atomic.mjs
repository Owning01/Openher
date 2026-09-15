// f0-1-atomic.mjs — F0.1: O_EXCL, 20 intentos concurrentes → 1 gana.
import { open, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { verdict } from "./lib.mjs";

const DIR = join(process.env.TEMP || "/tmp", "spike-f01");
await mkdir(DIR, { recursive: true });
const P = join(DIR, "claim.lock");
await rm(P, { force: true });

async function attempt(i) {
  try {
    const fh = await open(P, "wx", 0o600);
    await fh.writeFile(JSON.stringify({ owner: `agent-${i}`, t: Date.now() }));
    await fh.close();
    return true;
  } catch {
    return false;
  }
}

const t0 = Date.now();
const results = await Promise.all(Array.from({ length: 20 }, (_, i) => attempt(i)));
const wins = results.filter(Boolean).length;
await rm(P, { force: true });
verdict("F0.1-atomic", wins === 1, { intentos: 20, ganadores: wins, ms: Date.now() - t0 });
if (wins !== 1) process.exit(1);
