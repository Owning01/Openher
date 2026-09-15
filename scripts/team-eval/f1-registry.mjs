// f1-registry.mjs — Aceptación Fase 1: 3 registran, 1 muere, list limpio ≤30s+.
// Uso: node scripts/team-eval/f1-registry.mjs
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
async function mkSession(title) {
  const res = await fetch(`${BASE}/api/session`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: H() },
    body: JSON.stringify({ title }),
  });
  const j = await res.json();
  return j?.data?.id;
}
const ev = {};
const c = await rpc("team", "create", { topology: "hierarchy", objetivo: "accept f1" });
ev.teamID = c?.output?.teamID;
if (!ev.teamID) { console.log(`[F1-registry] ROJO ${JSON.stringify({ ...ev, error: "sin teamID" })}`); process.exit(1); }
const sids = [await mkSession("f1 coord"), await mkSession("f1 s1"), await mkSession("f1 s2")];
const names = ["coord", "s1", "s2"];
for (let i = 0; i < 3; i++) {
  const r = await rpc("team", "register", { teamID: ev.teamID, peer: { nombre: names[i], sessionID: sids[i] } });
  if (r?.output?.nombre !== names[i]) { console.log(`[F1-registry] ROJO register ${names[i]}`); process.exit(1); }
}
const l1 = await rpc("team", "list", { teamID: ev.teamID });
ev.inicial = l1?.output?.miembros?.length;
// s2 muere: solo coord+s1 hacen heartbeat.
await rpc("team", "heartbeat", { teamID: ev.teamID, nombre: "coord" });
await rpc("team", "heartbeat", { teamID: ev.teamID, nombre: "s1" });
await sleep(32000);
await rpc("team", "heartbeat", { teamID: ev.teamID, nombre: "coord" });
await rpc("team", "heartbeat", { teamID: ev.teamID, nombre: "s1" });
const l2 = await rpc("team", "list", { teamID: ev.teamID });
ev.final = (l2?.output?.miembros || []).map((m) => m.nombre).sort();
// Topología inválida se rechaza.
const bad = await rpc("team", "create", { topology: "imperio" }).catch((e) => ({ error: String(e).slice(0, 60) }));
ev.topologiaInvalida = !!(bad?.error || bad?.output === undefined);
const st = await rpc("team", "state", { teamID: ev.teamID });
ev.stateOK = st?.output?.teamID === ev.teamID && st?.output?.topology === "hierarchy";
const ok = ev.inicial === 3 && JSON.stringify(ev.final) === JSON.stringify(["coord", "s1"]) && ev.stateOK;
console.log(`[F1-registry] ${ok ? "PASS" : "ROJO"} ${JSON.stringify(ev).slice(0, 400)}`);
process.exit(ok ? 0 : 1);
