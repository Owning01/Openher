// f3-feed.mjs — Aceptación Fase 3: read exige filtro, caps, TTL, rehidrata.
// Uso: node scripts/team-eval/f3-feed.mjs
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
    const j = await res.json();
    if (!res.ok) return { __error: JSON.stringify(j).slice(0, 160) };
    return j;
  } finally {
    clearTimeout(t);
  }
}
const ev = {};
const c = await rpc("team", "create", { topology: "blackboard", objetivo: "accept f3" });
ev.teamID = c?.output?.teamID;
if (!ev.teamID) { console.log(`[F3-feed] ROJO sin teamID`); process.exit(1); }
const T = ev.teamID;
await rpc("team", "post", { teamID: T, type: "nota", data: { texto: "hola equipo" } });
await rpc("team", "post", { teamID: T, type: "claim", data: { claimID: "clm_x", recurso: "a.ts", owner: "w" } });
await rpc("team", "post", { teamID: T, type: "decision", data: { ganador: "A" } });
// Sin filtro → error.
const sinFiltro = await rpc("team", "read", { teamID: T });
ev.sinFiltroRechazado = !!sinFiltro.__error;
const porTipo = await rpc("team", "read", { teamID: T, filter: { type: "nota" } });
ev.porTipo = porTipo?.output?.entries?.length;
const dig = await rpc("team", "read", { teamID: T, filter: { desde_seq: 1 }, formato: "digest" });
ev.digestLen = (dig?.output?.digest || "").length;
// Board: objetivo + hecho con ttl=2s → expira.
await rpc("team", "board", { teamID: T, namespace: "objetivo", valor: "probar feed" });
await rpc("team", "board", { teamID: T, namespace: "hechos", valor: { texto: "efímero", ttlMs: 2000 }, rol: "s1" });
await sleep(3000);
const hechos = await rpc("team", "board", { teamID: T, namespace: "hechos" });
ev.hechoExpirado = Array.isArray(hechos?.output?.valor) && hechos.output.valor.length === 0;
// State rehidrata: timeline con claim+acta(decision).
const st = await rpc("team", "state", { teamID: T });
ev.feedLineas = st?.output?.feed?.lineas;
const kinds = (st?.output?.timeline || []).map((e) => e.kind);
ev.timelineKinds = [...new Set(kinds)].sort();
const ok = ev.sinFiltroRechazado && ev.porTipo === 1 && ev.digestLen > 0 && ev.digestLen <= 2100 &&
  ev.hechoExpirado && ev.feedLineas === 3 && ev.timelineKinds.includes("claim") && ev.timelineKinds.includes("acta");
console.log(`[F3-feed] ${ok ? "PASS" : "ROJO"} ${JSON.stringify(ev).slice(0, 500)}`);
process.exit(ok ? 0 : 1);
