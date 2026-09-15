// f2-claims.mjs — Aceptación Fase 2: 20→1/19, reclaim ttl=5s, verify SHA.
// Uso: node scripts/team-eval/f2-claims.mjs
const BASE = process.env.OPENCODE_URL || "http://127.0.0.1:4098";
const AUTH = process.env.OPENCODE_AUTH || "opencode:octavio";
const DIR = process.env.TEAM_DIR || "G:/Proyectos/opencode-remote-android";
const H = () => "Basic " + Buffer.from(String(AUTH)).toString("base64");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function rpc(ns, method, input, timeout = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${BASE}/api/rpc/${ns}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: H() },
      body: JSON.stringify({ input: ns === "team" ? { directory: DIR, ...input } : input }),
      signal: ctrl.signal,
    });
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}
const ev = {};
const c = await rpc("team", "create", { topology: "flat", objetivo: "accept f2" });
ev.teamID = c?.output?.teamID;
if (!ev.teamID) { console.log(`[F2-claims] ROJO sin teamID`); process.exit(1); }
const T = ev.teamID;
// N=20 concurrentes al mismo recurso.
const rs = await Promise.all(Array.from({ length: 20 }, (_, i) =>
  rpc("team", "claim", { teamID: T, recurso: "src/app.ts", owner: `w${i}`, tarea: "t", base_SHA: "abc" }).then((r) => r?.output).catch((e) => ({ ok: false, error: String(e).slice(0, 40) }))));
ev.ganadores = rs.filter((r) => r?.ok).length;
ev.denegados = rs.filter((r) => !r?.ok).length;
const win = rs.find((r) => r?.ok);
// Winner libera; reclaim con ttl=5s; expira; otro reclama ≤10s.
await rpc("team", "release", { teamID: T, claimID: win.id, owner: win.owner });
const c2 = await rpc("team", "claim", { teamID: T, recurso: "src/app.ts", owner: "muerto", tarea: "t", ttl: 5 });
const t0 = Date.now();
await sleep(6000);
const c3 = await rpc("team", "reclaim", { teamID: T, recurso: "src/app.ts", owner: "vivo", tarea: "t", ttl: 300 });
ev.reclaimMs = Date.now() - t0;
ev.reclaimOK = c3?.output?.ok === true;
// Mutex semántico: verify con SHA bueno y malo.
const vOk = await rpc("team", "verify", { teamID: T, claimID: c3?.output?.id, base_SHA: "" });
const c4 = await rpc("team", "claim", { teamID: T, recurso: "src/otro.ts", owner: "w", tarea: "t", base_SHA: "SHA1" });
const vMal = await rpc("team", "verify", { teamID: T, claimID: c4?.output?.id, base_SHA: "SHA2" });
ev.verifyOK = vOk?.output?.ok === true;
ev.verifyBloquea = vMal?.output?.ok === false && String(vMal?.output?.motivo || "").includes("rebase");
const st = await rpc("team", "state", { teamID: T });
ev.contadores = st?.output?.contadores;
const ok = ev.ganadores === 1 && ev.denegados === 19 && ev.reclaimOK && ev.reclaimMs <= 10000 && ev.verifyOK && ev.verifyBloquea;
console.log(`[F2-claims] ${ok ? "PASS" : "ROJO"} ${JSON.stringify(ev).slice(0, 500)}`);
process.exit(ok ? 0 : 1);
