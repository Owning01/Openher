// t-d1-cycle.mjs — Aceptación Fase 4 (caso T-D1): divergir→criticar→juzgar→
// registrar, veto motivado, topología inmutable, timeline claim+veto+acta.
// Uso: node scripts/team-eval/t-d1-cycle.mjs  (~10 turnos LLM, varios min)
const BASE = process.env.OPENCODE_URL || "http://127.0.0.1:4098";
const AUTH = process.env.OPENCODE_AUTH || "opencode:octavio";
const DIR = process.env.TEAM_DIR || "G:/Proyectos/opencode-remote-android";
const H = () => "Basic " + Buffer.from(String(AUTH)).toString("base64");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function rpc(ns, method, input, timeout = 30000) {
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
    if (!res.ok) return { __error: JSON.stringify(j).slice(0, 200) };
    return j;
  } finally {
    clearTimeout(t);
  }
}
async function mkSession(title, agent) {
  const res = await fetch(`${BASE}/api/session`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: H() },
    body: JSON.stringify({ title, ...(agent ? { agent } : {}) }),
  });
  return (await res.json())?.data?.id;
}
async function ask(sessionID, text, timeoutMs = 120000) {
  await fetch(`${BASE}/api/session/${sessionID}/prompt`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: H() },
    body: JSON.stringify({ text }),
  });
  const t0 = Date.now();
  for (;;) {
    await sleep(4000);
    const m = await (await fetch(`${BASE}/api/session/${sessionID}/message`, { headers: { authorization: H() } })).json();
    const all = JSON.stringify(m || {});
    if (all.includes("PROPUESTA:") || all.includes("CRITICA:") || Date.now() - t0 > timeoutMs) return all;
  }
}
const ev = {};
const DILEMA = "Para el estado del equipo (registry, claims, feed): ¿SQLite o JSONL? Debate solo persistencia local de un host.";
// 1. Equipo + roles.
const c = await rpc("team", "create", { topology: "hierarchy", objetivo: "T-D1: SQLite vs JSONL" });
ev.teamID = c?.output?.teamID;
if (!ev.teamID) { console.log("[T-D1] ROJO sin teamID"); process.exit(1); }
const T = ev.teamID;
const topo0 = c?.output?.topology;
const sCoord = await mkSession("t-d1 coord");
const sS1 = await mkSession("t-d1 spec1");
const sS2 = await mkSession("t-d1 spec2");
await rpc("team", "register", { teamID: T, peer: { nombre: "coord", sessionID: sCoord } });
await rpc("team", "register", { teamID: T, peer: { nombre: "s1", sessionID: sS1 } });
await rpc("team", "register", { teamID: T, peer: { nombre: "s2", sessionID: sS2 } });
// 2. Claim del recurso de decisión.
const cl = await rpc("team", "claim", { teamID: T, recurso: "decision:T-D1", owner: "coord", tarea: "dirimir persistencia", base_SHA: "HEAD" });
ev.claim = cl?.output?.ok === true;
// 3. Divergir (ciego): 1 propuesta por specialist.
const div = (v) => `Proponé UNA solución, por tu cuenta, sin ver otras. Formato exacto: PROPUESTA: <título> | POR QUÉ: <2 líneas> | RIESGO: <principal>. Dilema: ${DILEMA} (variante ${v})`;
const [p1, p2] = await Promise.all([ask(sS1, div("A")), ask(sS2, div("B"))]);
ev.prop1 = p1.includes("PROPUESTA:");
ev.prop2 = p2.includes("PROPUESTA:");
// 4. Criticar: 1 turno adversario sobre ambas.
const crit = await ask(sCoord, `Actuá como red team. Estas son 2 propuestas rivales. Devolvé exactamente: CRITICA: <el punto más débil de cada una en 2 líneas>. P1: ${p1.slice(-800)} P2: ${p2.slice(-800)}`);
ev.critica = crit.includes("CRITICA:");
// 5. Juzgar: sala de debate chica con el material.
const st0 = await rpc("debate", "start", {
  topic: `${DILEMA}\nP1: ${p1.slice(-600)}\nP2: ${p2.slice(-600)}\nCrítica: ${crit.slice(-500)}`,
  engine: "isolated", maxTurns: 3,
  originSessionID: sCoord,
});
ev.debateID = st0?.output?.debateID || st0?.debateID;
const deadline = Date.now() + 12 * 60_000;
let ds = {};
for (;;) {
  await sleep(8000);
  try { ds = (await rpc("debate", "state", { debateID: ev.debateID }, 20000))?.output || {}; } catch { /* reintenta */ }
  if (ds && (ds.done === true || ds.running === false)) break;
  if (Date.now() > deadline) break;
}
ev.actaLen = String(ds.acta || "").length;
ev.minorities = Array.isArray(ds.minorities);
// 6. Registrar decisión (link) en el equipo.
await rpc("team", "board", { teamID: T, namespace: "decisiones", valor: { titulo: "T-D1", debateID: ev.debateID, ganador: "ver acta" }, rol: "arbiter" });
await rpc("team", "post", { teamID: T, type: "decision", data: { titulo: "T-D1", debateID: ev.debateID } });
// 7. Veto con motivo bloquea; sin motivo se rechaza.
const v1 = await rpc("team", "veto", { teamID: T, motivo: "Falta medir latencia de SQLite bajo lock", autor: "reviewer" });
ev.vetoBloquea = v1?.output?.bloquea === true;
const v2 = await rpc("team", "veto", { teamID: T, autor: "reviewer" });
ev.vetoSinMotivoRechazado = !!v2.__error;
// 8. Topología inmutable a lo largo de todo.
const stEnd = await rpc("team", "state", { teamID: T });
ev.topoInmutable = stEnd?.output?.topology === topo0;
const kinds = [...new Set((stEnd?.output?.timeline || []).map((e) => e.kind))].sort();
ev.timeline = kinds;
const ok = ev.claim && ev.prop1 && ev.prop2 && ev.critica && ev.actaLen > 200 && ev.minorities &&
  ev.vetoBloquea && ev.vetoSinMotivoRechazado && ev.topoInmutable &&
  kinds.includes("claim") && kinds.includes("veto") && kinds.includes("acta");
console.log(`[T-D1] ${ok ? "PASS" : "ROJO"} ${JSON.stringify({ ...ev, teamID: T }).slice(0, 700)}`);
process.exitCode = ok ? 0 : 1;
