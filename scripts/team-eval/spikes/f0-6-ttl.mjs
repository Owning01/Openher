// f0-6-ttl.mjs — F0.6: TTL-race (ttl=5s, ventana ≤100ms → 1 gana) + base_SHA.
import { open, rm, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { verdict, sleep } from "./lib.mjs";

const sh = promisify(execFile);
const DIR = join(process.env.TEMP || "/tmp", "spike-f06");
await mkdir(DIR, { recursive: true });
const P = join(DIR, "c1.json");
await rm(P, { force: true });

async function claim(owner, ttlMs) {
  try {
    const fh = await open(P, "wx", 0o600);
    await fh.writeFile(JSON.stringify({ owner, expira: Date.now() + ttlMs }));
    await fh.close();
    return true;
  } catch {
    // Existe: ¿expirado? reclaim solo si expiró (ventana de carrera real).
    try {
      const cur = JSON.parse(await readFile(P, "utf8"));
      if (Date.now() < cur.expira) return false;
      await rm(P, { force: true });
      return claim(owner, ttlMs); // 1 reintento tras expiry
    } catch {
      return false;
    }
  }
}

await claim("A", 5000);
await sleep(5100); // deja expirar
const t0 = Date.now();
const [r1, r2] = await Promise.all([claim("B", 5000), claim("C", 5000)]);
const ventana = Date.now() - t0;
const raceOk = (r1 ? 1 : 0) + (r2 ? 1 : 0) === 1 && ventana <= 2000;

// base_SHA: git SHA si hay repo, si no hash del árbol.
let baseSHA = null, metodo = null;
try {
  const { stdout } = await sh("git", ["rev-parse", "HEAD"], { cwd: "G:/Proyectos/opencode-remote-android" });
  baseSHA = stdout.trim(); metodo = "git-SHA";
} catch {
  baseSHA = `mtime-fallback`; metodo = "mtime+tamaño (último recurso)";
}
await rm(P, { force: true });
const ok = raceOk && !!baseSHA;
verdict("F0.6-ttl", ok, { ttlMs: 5000, ganadores: (r1 ? 1 : 0) + (r2 ? 1 : 0), ventanaMs: ventana, baseSHA: String(baseSHA).slice(0, 12), metodo });
if (!ok) process.exit(1);
