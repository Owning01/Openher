// f0-3-feed.mjs — F0.3: JSONL append-only + rehidratación tras "kill".
import { appendFile, readFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { verdict } from "./lib.mjs";

const DIR = join(process.env.TEMP || "/tmp", "spike-f03");
await mkdir(DIR, { recursive: true });
const P = join(DIR, "feed.jsonl");
await rm(P, { force: true });

let seq = 0;
async function post(type, data) {
  seq += 1;
  await appendFile(P, JSON.stringify({ seq, type, ...data }) + "\n");
}
// Simula muerte del proceso: se pierde `seq` en memoria.
async function rehydrate() {
  const lines = (await readFile(P, "utf8")).trim().split("\n").filter(Boolean);
  const last = lines.length ? JSON.parse(lines[lines.length - 1]).seq : 0;
  return { lines: lines.length, last };
}
for (let i = 0; i < 5; i++) await post("claim", { ref: `c${i}` });
const mid = await rehydrate();
seq = 0; // proceso muerto, memoria perdida
const r = await rehydrate();
seq = r.last; // recupera
await post("veto", { motivo: "x" });
const fin = await rehydrate();
const ok = mid.lines === 5 && r.last === 5 && fin.last === 6 && fin.lines === 6;
verdict("F0.3-feed", ok, { mid, rehidratado: r, final: fin });
await rm(P, { force: true });
if (!ok) process.exit(1);
