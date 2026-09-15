// run.mjs — Matriz TEAM Fase 5: 6 tareas × 3 celdas × 3 corridas = 54.
// Celdas: S-single vs H-equipo-jerarquía vs F-equipo-plano.
// Métricas reales (tokens/costo sesiones), colisión evitada, texto p/revisión ciega.
// Uso: node scripts/team-eval/run.mjs [--cases T-E1,T-E2] [--runs 3] [--out scripts/team-eval/out-t1]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.OPENCODE_URL || "http://127.0.0.1:4098";
const AUTH = process.env.OPENCODE_AUTH || "opencode:octavio";
const DIR = process.env.TEAM_DIR || "G:/Proyectos/opencode-remote-android";
const H = () => "Basic " + Buffer.from(String(AUTH)).toString("base64");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function args() {
  const o = { cases: [], runs: 3, out: join(HERE, "out-t1") };
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--cases") o.cases = String(a[++i] || "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (a[i] === "--runs") o.runs = Math.max(1, Number(a[++i]) || 3);
    else if (a[i] === "--out") o.out = String(a[++i] || o.out);
  }
  return o;
}

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
    const j = await res.json().catch(() => ({}));
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

async function stats(sid) {
  try {
    const s = await (await fetch(`${BASE}/api/session/${sid}`, { headers: { authorization: H() } })).json();
    const t = s?.data?.tokens || {};
    return { in: Number(t.input) || 0, out: Number(t.output) || 0, cost: Number(s?.data?.cost) || 0 };
  } catch {
    return { in: 0, out: 0, cost: 0 };
  }
}

// Pregunta y espera (quietud 2 polls tras 15s, o timeout): devuelve texto assistant.
async function ask(sessionID, text, timeoutMs = 180000) {
  const t0 = Date.now();
  await fetch(`${BASE}/api/session/${sessionID}/prompt`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: H() },
    body: JSON.stringify({ text }),
  });
  const pickText = (m) => {
    const arr = Array.isArray(m?.content) ? m.content : [];
    return arr.filter((p) => p?.type === "text").map((p) => String(p?.text ?? "")).join("\n");
  };
  let last = "", prevSig = "", quiet = 0;
  for (;;) {
    await sleep(5000);
    try {
      const m = await (await fetch(`${BASE}/api/session/${sessionID}/message`, { headers: { authorization: H() } })).json();
      const msgs = Array.isArray(m?.data) ? m.data : [];
      const assistants = msgs.filter((x) => x?.type === "assistant");
      const texts = assistants.map(pickText).filter((s) => s.trim());
      if (texts.length) last = texts[texts.length - 1];
      const finished = assistants.length > 0 && assistants[assistants.length - 1]?.finish === "stop";
      const sig = texts.map((s) => s.length).join(",");
      quiet = sig === prevSig ? quiet + 1 : 0;
      prevSig = sig;
      if (texts.length && finished && Date.now() - t0 > 10000) break;
      if (texts.length && Date.now() - t0 > 15000 && quiet >= 2) break;
      if (Date.now() - t0 > timeoutMs) break;
    } catch {
      if (Date.now() - t0 > timeoutMs) break;
    }
  }
  return last;
}

async function sumStats(sids) {
  let i = 0, o = 0, c = 0;
  for (const s of sids) {
    const st = await stats(s);
    i += st.in; o += st.out; c += st.cost;
  }
  return { tokens: i + o, cost: c };
}

// Celda S: 1 sesión, tarea completa.
async function runSingle(kase) {
  const t0 = Date.now();
  const s = await mkSession(`teval S ${kase.id}`, null);
  const texto = await ask(s, `Resolvé esta tarea en ≤25 líneas, formato markdown. Sin vueltas.\nTarea: ${kase.tarea}\nParte A: ${kase.parteA}\nParte B: ${kase.parteB}`);
  const st = await sumStats([s]);
  return { texto, sids: [s], turns: 1, ...st, ms: Date.now() - t0 };
}

// Celda H: coordinator + 2 specialists ciegos en paralelo + integración.
async function runTeam(kase, topology) {
  const t0 = Date.now();
  const teamID = (await rpc("team", "create", { topology, objetivo: `teval ${topology} ${kase.id}` }))?.output?.teamID;
  if (!teamID) throw new Error("sin teamID");
  const sC = await mkSession(`teval ${topology} coord ${kase.id}`);
  const sA = await mkSession(`teval ${topology} specA ${kase.id}`);
  const sB = await mkSession(`teval ${topology} specB ${kase.id}`);
  for (const [n, s] of [["coord", sC], ["sA", sA], ["sB", sB]])
    await rpc("team", "register", { teamID, peer: { nombre: n, sessionID: s } });
  await rpc("team", "claim", { teamID, recurso: `${kase.id}:parteA`, owner: "sA", tarea: "parte A", base_SHA: "HEAD" });
  await rpc("team", "claim", { teamID, recurso: `${kase.id}:parteB`, owner: "sB", tarea: "parte B", base_SHA: "HEAD" });
  // Colisión evitada a propósito: otro reclama lo de sA → debe dar denegado.
  const col = await rpc("team", "claim", { teamID, recurso: `${kase.id}:parteA`, owner: "intruso", tarea: "x" });
  const collisionAvoided = col?.output?.ok === false;
  const blind = (parte) => `Trabajás SOLO tu parte, sin ver la del otro. ≤15 líneas.\nTarea general: ${kase.tarea}\nTu parte: ${parte}\nDevolvé solo tu parte.`;
  const [tA, tB] = await Promise.all([ask(sA, blind(kase.parteA)), ask(sB, blind(kase.parteB))]);
  let texto, turns;
  if (topology === "hierarchy") {
    texto = await ask(sC, `Sos coordinator. Integrá estas 2 partes en UN texto final ≤25 líneas, sin repetir. No agregues contenido nuevo.\nPARTE A:\n${String(tA).slice(-1500)}\nPARTE B:\n${String(tB).slice(-1500)}`);
    turns = 3;
  } else {
    // Plano: cada uno revisa la del otro y entrega versión propia; final = ambas.
    const [rA, rB] = await Promise.all([
      ask(sA, `Un par hizo esto. Mejorá TU parte (≤15 líneas) teniendo en cuenta su enfoque, sin copiarla. Tu parte original: ${String(tA).slice(-1200)}\nPar: ${String(tB).slice(-1200)}`),
      ask(sB, `Un par hizo esto. Mejorá TU parte (≤15 líneas) teniendo en cuenta su enfoque, sin copiarla. Tu parte original: ${String(tB).slice(-1200)}\nPar: ${String(tA).slice(-1200)}`),
    ]);
    texto = `## Parte A (revisada)\n${rA}\n\n## Parte B (revisada)\n${rB}`;
    turns = 4;
  }
  await rpc("team", "release", { teamID, claimID: undefined, owner: "sA" }).catch(() => {});
  const st = await sumStats([sC, sA, sB]);
  await rpc("team", "post", { teamID, type: "decision", data: { titulo: kase.id, celdas: topology } }).catch(() => {});
  return { texto: String(texto).slice(0, 4000), sids: [sC, sA, sB], turns, collisionAvoided, teamID, ...st, ms: Date.now() - t0 };
}

async function main() {
  const opt = args();
  const cases = JSON.parse(readFileSync(join(HERE, "cases.json"), "utf8")).filter((k) => k.tipo === "ejecucion");
  const picked = opt.cases.length ? cases.filter((k) => opt.cases.includes(k.id)) : cases;
  const cells = [{ id: "S-single" }, { id: "H-team" }, { id: "F-flat" }];
  mkdirSync(opt.out, { recursive: true });
  const resultsPath = join(opt.out, "results.json");
  let prev = { runs: [] };
  if (existsSync(resultsPath)) {
    try { prev = JSON.parse(readFileSync(resultsPath, "utf8")); } catch { prev = { runs: [] }; }
  }
  const done = new Set((prev.runs || []).map((r) => `${r.caseId}/${r.configId}#${r.run}`));
  const runs = [...(prev.runs || [])];
  const plan = [];
  for (const k of picked) for (const c of cells) for (let i = 1; i <= opt.runs; i++)
    if (!done.has(`${k.id}/${c.id}#${i}`)) plan.push([k, c, i]);
  console.log(`[teval] casos=${picked.length} celdas=3 corridas=${opt.runs} pendientes=${plan.length}`);
  let n = 0;
  for (const [kase, cell, idx] of plan) {
    n++;
    const t0 = Date.now();
    process.stdout.write(`[teval] ${n}/${plan.length} ${kase.id} x ${cell.id} #${idx} ... `);
    try {
      const r = cell.id === "S-single" ? await runSingle(kase)
        : await runTeam(kase, cell.id === "H-team" ? "hierarchy" : "flat");
      runs.push({
        caseId: kase.id, configId: cell.id, run: idx,
        tokensReal: r.tokens, costReal: +r.cost.toFixed(6), turns: r.turns,
        ms: r.ms ?? (Date.now() - t0), collisionAvoided: r.collisionAvoided ?? null,
        teamID: r.teamID || null, debateID: null,
        acta: String(r.texto || "").slice(0, 4000), // campo p/blind-set.mjs
      });
      console.log(`ok tok=${r.tokens} turns=${r.turns}`);
    } catch (e) {
      runs.push({ caseId: kase.id, configId: cell.id, run: idx, error: String(e?.message || e).slice(0, 200) });
      console.log(`ERROR ${String(e?.message || e).slice(0, 100)}`);
    }
    writeFileSync(resultsPath, JSON.stringify({ meta: { at: new Date().toISOString() }, runs }, null, 1));
  }
  // Reporte con misma-base y veredicto INCONCLUSO hasta nota ciega (§9).
  const cfgs = cells.map((c) => {
    const rs = runs.filter((r) => r.configId === c.id && !r.error);
    return { configId: c.id, n: rs.length, tokMean: Math.round(mean(rs.map((r) => r.tokensReal || 0))), costMean: +mean(rs.map((r) => r.costReal || 0)).toFixed(6), turnsMean: +mean(rs.map((r) => r.turns || 0)).toFixed(1), colAvoid: rs.filter((r) => r.collisionAvoided).length };
  });
  const base = cfgs.find((c) => c.configId === "S-single");
  const L = [`# TEAM Fase 5 — reporte`, ``];
  for (const c of cfgs) {
    const saving = c.configId === "S-single" || !base?.tokMean ? "—" : `${(((base.tokMean - c.tokMean) / base.tokMean) * 100).toFixed(1)}%`;
    L.push(`- ${c.configId}: n=${c.n} tok_medios=${c.tokMean} costo=${c.costMean} turnos=${c.turnsMean} colisiones_evitadas=${c.colAvoid} Δtok_vs_base=${saving}`);
  }
  L.push(``, `**INCONCLUSO — falta revisión ciega.** Anonimizar actas con blind-set.mjs y puntuar 1–5 antes de adoptar (criterio §9).`);
  writeFileSync(join(opt.out, "report.md"), L.join("\n"));
  console.log(`[teval] results → ${resultsPath}`);
  console.log(L.join("\n"));
}

main().catch((e) => { console.error("[teval] FATAL", e); process.exit(1); });
