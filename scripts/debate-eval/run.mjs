#!/usr/bin/env node
/**
 * debate-eval/run.mjs — Matriz A/B de debates por RPC (Fase 3).
 *
 * Compara (mismo tema + misma config, 3 corridas por celda):
 *   A-isolated ........ engine isolated (default §4), todo on
 *   B-shared .......... engine shared (mismo digest, sin reescribir pasado)
 *   C-similarity ...... isolated + participation similarity-filter (C5 experimental, default all)
 *   D-rondas .......... isolated + stabilityStop false (corte por rondas maxTurns)
 *   E-sin-confianza ... isolated + confidence false
 *   F-intervencion .... isolated + intervención humana simulada a mitad del debate
 *
 * Reglas duras: B5 excluido (sin trailer compacto). C5 solo como config C a
 * comparar (default all en el resto). F3 (guards) off salvo caso con
 * wantsGuards explícito (D20) — ahí se activa en modo labMode (solo-log).
 * Tokens siempre como ceil(chars/4) etiquetados "estimado".
 * El harness no expone semilla: se reporta VARIANZA entre las 3 corridas.
 *
 * Uso:
 *   node run.mjs --dry-run [--limit N] [--cases D01,D02] [--out ./out]
 *   node run.mjs [--limit 6] [--cases D01] [--out ./out] [--url http://127.0.0.1:4096]
 *
 * Matriz real (cuando el plugin Fase 1 v2 esté activo con RPC debate/*):
 *   $env:OPENCODE_URL="http://127.0.0.1:4096"
 *   node scripts/debate-eval/run.mjs --cases D01,D09,D15 --limit 18 --out scripts/debate-eval/out
 *   # 18 ejecuciones ~= 3 casos x 6 configs x 1 corrida. Para la matriz completa
 *   # (20 casos x 6 configs x 3 corridas = 360 debates) ver costo/tiempo abajo.
 * Costo estimado (grosero, tokens estimados ceil(chars/4)):
 *   ~8k-25k tokens por debate → matriz completa ~3M-9M tokens y varias horas
 *   (cada debate tarda hasta maxMinutes=12 min en el peor caso; en la práctica
 *   2-6 min). Empezar con --limit 6-18 y ampliar tras la revisión ciega.
 * Tiempo: dry-run <10 s; real ~= debates x minutos/debate (secuencial).
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONSENSUS = "CONSENSUS_READY";
const DISSENT = "DISSENTING";
const ROLES = ["architect", "pragmatist", "adversary"];

// ---- Configs A/B (único lugar de verdad para la matriz) ----
const CONFIGS = [
  { id: "A-isolated", engine: "isolated", participation: "all", stabilityStop: true, confidence: true, intervention: false, maxTurns: 9, note: "baseline default §4" },
  { id: "B-shared", engine: "shared", participation: "all", stabilityStop: true, confidence: true, intervention: false, maxTurns: 9, note: "mismo digest, canal único" },
  { id: "C-similarity", engine: "isolated", participation: "similarity-filter", similarityThreshold: 0.85, stabilityStop: true, confidence: true, intervention: false, maxTurns: 9, note: "C5 experimental a comparar" },
  { id: "D-rondas", engine: "isolated", participation: "all", stabilityStop: false, confidence: true, intervention: false, maxTurns: 9, note: "corte por rondas, sin estabilidad" },
  { id: "E-sin-confianza", engine: "isolated", participation: "all", stabilityStop: true, confidence: false, intervention: false, maxTurns: 9, note: "sin confianza 0-100" },
  { id: "F-intervencion", engine: "isolated", participation: "all", stabilityStop: true, confidence: true, intervention: true, maxTurns: 9, note: "intervención simulada a mitad" },
  { id: "G-hybrid", engine: "hybrid", directMaxPerRole: 2, participation: "all", stabilityStop: true, confidence: true, intervention: false, maxTurns: 9, note: "isolated + consultas directas A→B (tope 2/rol)" },
];
let RUNS_PER_CELL = 3;

// ---- CLI ----
function parseArgs(argv) {
  const o = { dryRun: false, limit: 0, cases: [], out: join(HERE, "out"), url: process.env.OPENCODE_URL || "http://127.0.0.1:4096", auth: process.env.OPENCODE_AUTH || "opencode:octavio", configs: [], runs: 0, maxTurns: 0, recompute: "", help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") o.dryRun = true;
    else if (a === "--recompute") o.recompute = String(argv[++i] || "");
    else if (a === "--limit") o.limit = Math.max(0, parseInt(argv[++i] || "0", 10) || 0);
    else if (a === "--cases") o.cases = String(argv[++i] || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    else if (a === "--configs") o.configs = String(argv[++i] || "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--runs") o.runs = Math.max(0, parseInt(argv[++i] || "0", 10) || 0);
    else if (a === "--max-turns") o.maxTurns = Math.max(0, parseInt(argv[++i] || "0", 10) || 0);
    else if (a === "--auth") o.auth = String(argv[++i] || o.auth);
    else if (a === "--out") o.out = resolve(argv[++i] || o.out);
    else if (a === "--url") o.url = String(argv[++i] || o.url);
    else if (a === "--help" || a === "-h") o.help = true;
  }
  return o;
}

function help() {
  console.log(`debate-eval/run.mjs — matriz A/B por RPC debate/start (3 corridas por celda)

  --dry-run      simula sin llamar al server (genera results.json + report.md)
  --limit N      tope de ejecuciones totales (corridas cortas; p.ej. 6)
  --cases IDS    filtra casos (p.ej. D01,D09,D15)
  --configs IDS  filtra configs (p.ej. A-isolated,B-shared,G-hybrid)
  --runs N       corridas por celda (default 3)
  --max-turns N  override de maxTurns para todas las configs (Tier 1: 6)
  --auth U:P     Basic auth del server (default $OPENCODE_AUTH u opencode:octavio)
  --out DIR      directorio de salida (default ./out)
  --url URL      server opencode con RPC debate/* (default $OPENCODE_URL o 127.0.0.1:4096)

Ejemplos:
  node run.mjs --dry-run
  node run.mjs --dry-run --limit 6 --cases D01
  node run.mjs --cases D01,D09,D15 --limit 18 --out ./out --url http://127.0.0.1:4096

Tokens: ceil(chars/4), siempre etiquetados "estimado".`);
}

// ---- utils ----
const tokensEst = (s) => Math.ceil(String(s ?? "").length / 4);
function hash32(str) {
  return parseInt(createHash("sha256").update(str).digest("hex").slice(0, 8), 16) >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const std = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Firma de estabilidad (heredada v1): rol:status:objeciones:len
const noveltySig = (turns) =>
  turns.map((t) => `${t.role}:${t.status}:${(t.blockingIssues || []).join("|")}:${t.body.length}`).join("~");

// Cascada de error: el rol cambia de postura sin evidencia nueva
// (mismos blockingIssues y mismo repliesTo que su turno previo).
function countCascades(turns) {
  const prev = new Map();
  let n = 0;
  for (const t of turns) {
    if (t.role === "human") continue;
    const p = prev.get(t.role);
    if (p && p.status && t.status && p.status !== t.status) {
      const sameBI = JSON.stringify(p.blockingIssues || []) === JSON.stringify(t.blockingIssues || []);
      const sameRT = (p.repliesTo || null) === (t.repliesTo || null);
      if (sameBI && sameRT) n++;
    }
    prev.set(t.role, t);
  }
  return n;
}

// ---- Simulación dry-run (determinista por hash tema+config+corrida) ----
const ROLE_LINE = {
  architect: ["El contrato queda en el schema versionado, no en el chat.", "Separo el canal (append-only) del estado derivado.", "Acepto el tope maxTurns como invariante de seguridad."],
  pragmatist: ["YAGNI: lo mínimo que cierra el caso sin capas nuevas.", "Si el digest ya trae la postura, no repito el cuerpo.", "Pido el plan accionable antes de más rondas."],
  adversary: ["Falta el caso borde: red a mitad de ACK y locks.", "Sin evidencia nueva el cambio de postura es voto débil.", "Exijo salvaguarda explícita para el peor caso."],
};

function simulateDebate(kase, cfg, runIdx) {
  const t0 = Date.now();
  const rnd = mulberry32(hash32(`${kase.id}|${cfg.id}|${runIdx}`));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const maxTurns = cfg.maxTurns;
  // Rondas fijas agotan maxTurns; estabilidad corta antes (4-8).
  let nTurns = cfg.stabilityStop ? 4 + Math.floor(rnd() * 5) : maxTurns;
  // similarity-filter publica menos (redundantes filtrados, métrica aparte).
  let filtered = 0;
  if (cfg.participation === "similarity-filter") {
    filtered = 1 + Math.floor(rnd() * 2);
    nTurns = Math.max(3, nTurns - filtered);
  }
  const turns = [];
  const statusByRole = {};
  let stalls = 0;
  let lastSig = "";
  for (let i = 0; i < nTurns; i++) {
    const role = ROLES[i % ROLES.length];
    const late = i / Math.max(1, nTurns - 1);
    // Sin confianza el consenso llega menos (árbitro sin ponderación).
    const pConsensus = cfg.confidence ? 0.25 + late * 0.6 : 0.15 + late * 0.45;
    const status = rnd() < pConsensus ? CONSENSUS : DISSENT;
    statusByRole[role] = status;
    const nBI = status === CONSENSUS ? (rnd() < 0.8 ? 0 : 1) : 1 + Math.floor(rnd() * 3);
    const blockingIssues = Array.from({ length: nBI }, (_, k) => `objeción-${role}-${k + 1}`);
    const body = `- ${pick(ROLE_LINE[role])} [${kase.id} ${cfg.id} corrida ${runIdx}]\n- Tema: ${kase.topic.slice(0, 90)}\n- ${status === CONSENSUS ? "Concedo lo no bloqueante; no me quedan objeciones." : "Sostengo: " + blockingIssues.join("; ")}`;
    turns.push({
      role,
      body: body.slice(0, 1200),
      status,
      confidence: cfg.confidence ? 40 + Math.floor(rnd() * 56) : null,
      repliesTo: i === 0 ? null : ROLES[(i - 1) % ROLES.length],
      blockingIssues,
      tokensInEst: 0, // se completa abajo (contexto acumulado simulado)
      tokensOutEst: tokensEst(body),
      estimated: true,
    });
    if ((i + 1) % ROLES.length === 0) {
      const sig = noveltySig(turns.slice(-ROLES.length));
      if (sig === lastSig) stalls++;
      lastSig = sig;
    }
  }
  let interventions = 0;
  if (cfg.intervention) {
    interventions = 1;
    turns.splice(Math.floor(turns.length / 2), 0, {
      role: "human", body: "Intervención (simulada): ¿qué evidencia falta para cerrar? Respondan en el próximo turno.", status: null,
      confidence: null, repliesTo: null, blockingIssues: [], tokensInEst: 0, tokensOutEst: tokensEst("Intervención (simulada)"), estimated: true,
    });
  }
  // Contexto acumulado simulado: isolated paga más (sin reuso), shared menos.
  const ctxMult = cfg.engine === "isolated" ? 1.8 : 1.2;
  let acc = Math.ceil(tokensEst(`${kase.topic} ${kase.context}`) * ctxMult);
  const tokensByRoleEst = {};
  for (const t of turns) {
    if (t.role === "human") continue;
    t.tokensInEst = acc;
    acc += Math.ceil(t.tokensOutEst * (cfg.engine === "isolated" ? 0.6 : 0.25));
    tokensByRoleEst[t.role] = (tokensByRoleEst[t.role] || 0) + t.tokensInEst + t.tokensOutEst;
  }
  const actaText = `Acta (simulada) ${kase.id}/${cfg.id}#${runIdx}: veredicto según resultado bueno acordado: ${kase.goodOutcome}`;
  const tokensTotalEst = Object.values(tokensByRoleEst).reduce((a, b) => a + b, 0) + tokensEst(actaText);
  const consensusCount = ROLES.filter((r) => statusByRole[r] === CONSENSUS).length;
  // Latencia simulada 8-60 s según turnos y motor.
  const latencyMs = Math.round((8000 + nTurns * 3200 * (cfg.engine === "isolated" ? 1.3 : 1) + rnd() * 9000));
  void t0;
  return {
    caseId: kase.id, configId: cfg.id, run: runIdx,
    consensus: consensusCount === ROLES.length,
    consensusPct: Math.round((consensusCount / ROLES.length) * 100),
    tokensTotalEst, tokensByRoleEst, tokensEstimatedLabel: "estimado",
    latencyMs, turns: turns.length, stalls,
    cascades: countCascades(turns),
    interventions, filteredBySimilarity: filtered,
    guards: kase.wantsGuards ? { enabled: true, labMode: true } : { enabled: false },
    simulated: true,
  };
}

// ---- RPC real contra el server opencode (unificado v2) ----
// Transporte verificado: POST {base}/api/rpc/debate/<method> con {input:{...}}
// y respuesta {output:...}, auth Basic. Sin esto el server devuelve 400 vacío.
function authHeader(auth) {
  return "Basic " + Buffer.from(String(auth || "")).toString("base64");
}

async function apiRpc(base, auth, rpcID, method, input, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const url = `${base.replace(/\/$/, "")}/api/rpc/${rpcID}/${method}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: authHeader(auth) },
      body: JSON.stringify({ input }),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${rpcID}/${method}: ${text.slice(0, 200)}`);
    const json = JSON.parse(text);
    return json && typeof json === "object" && "output" in json ? json.output : json;
  } finally {
    clearTimeout(t);
  }
}

async function apiGet(base, auth, path, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      headers: { authorization: authHeader(auth) },
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${path}: ${text.slice(0, 200)}`);
    const json = JSON.parse(text);
    return json && typeof json === "object" && "data" in json ? json.data : json;
  } finally {
    clearTimeout(t);
  }
}

// Tokens/costo REALES por sesión (el API expone cost + tokens). null si no disponible.
async function realSessionStats(base, auth, sessionID) {
  try {
    const s = await apiGet(base, auth, `/api/session/${sessionID}`);
    const t = s.tokens || {};
    const c = t.cache || {};
    return {
      input: Number(t.input) || 0, output: Number(t.output) || 0,
      reasoning: Number(t.reasoning) || 0,
      cacheRead: Number(c.read) || 0, cacheWrite: Number(c.write) || 0,
      cost: Number(s.cost) || 0,
    };
  } catch {
    return null;
  }
}

function toDebateParams(kase, cfg, originSessionID) {
  const topic = `${kase.topic} — ${kase.context} [eval ${kase.id}/${cfg.id}]`;
  return {
    topic, roles: ROLES, maxTurns: cfg.maxTurns, maxMinutes: 12,
    originSessionID,
    engine: cfg.engine, cache: cfg.engine, // cache = alias legacy solo-lectura (compat v1)
    files: [],
    directMaxPerRole: cfg.directMaxPerRole ?? 2,
    participation: cfg.participation,
    similarityThreshold: cfg.similarityThreshold ?? 0.85,
    stabilityStop: cfg.stabilityStop,
    confidence: cfg.confidence,
    blindFirstRound: true, objectionDuty: true, stallLimit: 3,
    guards: kase.wantsGuards ? { enabled: true, labMode: true } : { enabled: false },
  };
}

// Trigramas + Jaccard (misma definición que el plugin, C5).
function trigrams(s) {
  const t = String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  const out = new Set();
  for (let i = 0; i + 3 <= t.length; i++) out.add(t.slice(i, i + 3));
  return out;
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}
// Redundancia: similitud máxima media de cada turno no-humano vs anteriores.
function redundancyRate(turns) {
  const bodies = turns.filter((t) => t.role !== "human").map((t) => String(t.body ?? ""));
  if (bodies.length < 2) return 0;
  const grams = bodies.map(trigrams);
  let sum = 0, n = 0;
  for (let i = 1; i < grams.length; i++) {
    let best = 0;
    for (let j = 0; j < i; j++) best = Math.max(best, jaccard(grams[i], grams[j]));
    sum += best; n++;
  }
  return n ? sum / n : 0;
}
// Leaks del trailer JSON crudo en cuerpos publicados.
function trailerLeaks(turns) {
  return turns.filter((t) => /\{\s*"sender"/.test(String(t.body ?? ""))).length;
}
// Tasa de turnos sin estado parseado (fallos de trailer).
function unknownRate(turns) {
  const agent = turns.filter((t) => t.role !== "human");
  if (!agent.length) return 0;
  return agent.filter((t) => !t.status || t.status === "UNKNOWN").length / agent.length;
}

async function realDebate(kase, cfg, runIdx, base, auth) {
  const t0 = Date.now();
  const base_rec = { caseId: kase.id, configId: cfg.id, run: runIdx, simulated: false, tokensEstimatedLabel: "estimado" };
  try {
    const created = await (async () => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      try {
        const res = await fetch(`${base.replace(/\/$/, "")}/api/session`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: authHeader(auth) },
          body: JSON.stringify({ title: `eval ${kase.id}/${cfg.id}#${runIdx}` }),
          signal: ctrl.signal,
        });
        const json = await res.json();
        return json?.data?.id ?? json?.id;
      } finally {
        clearTimeout(t);
      }
    })();
    if (!created) throw new Error("no se pudo crear sesión origen");
    const params = toDebateParams(kase, cfg, created);
    const started = await apiRpc(base, auth, "debate", "start", params, 30000);
    const debateID = started?.debateID;
    if (!debateID) throw new Error(`start sin debateID: ${JSON.stringify(started).slice(0, 200)}`);
    if (cfg.intervention) {
      // Intervención simulada a mitad del debate (best-effort, no bloquea).
      setTimeout(() => {
        apiRpc(base, auth, "debate", "intervene", { debateID, text: "Intervención (eval): ¿qué evidencia falta para cerrar?" }).catch(() => {});
      }, 45_000).unref?.();
    }
    // Poll debate/state hasta done/running=false o tope 13 min.
    const deadline = Date.now() + 13 * 60_000;
    let s = {};
    for (;;) {
      await sleep(5000);
      try {
        s = await apiRpc(base, auth, "debate", "state", { debateID }, 15000);
      } catch (e) {
        if (Date.now() > deadline) throw e;
        continue;
      }
      if (s && (s.done === true || s.running === false)) break;
      if (Date.now() > deadline) break;
    }
    const turnsArr = Array.isArray(s.channel) ? s.channel : [];
    const turns = typeof s.turns === "number" ? s.turns : turnsArr.length;
    const tokensByRoleEst = {};
    for (const t of turnsArr) {
      const b = String(t.body ?? "");
      tokensByRoleEst[t.role || "unknown"] =
        (tokensByRoleEst[t.role || "unknown"] || 0) + tokensEst(b) + (Number(t.tokensInEst) || 0) + (Number(t.tokensOutEst) || tokensEst(b));
    }
    const actaLen = String(s.acta ?? "").length;
    const tokensTotalEst = Object.values(tokensByRoleEst).reduce((a, b) => a + b, 0) + (actaLen ? tokensEst(actaLen) : 0);
    const consensusPct = typeof s.consensusPct === "number" ? s.consensusPct
      : typeof s.consensus === "boolean" ? (s.consensus ? 100 : 0) : 0;
    // Tokens/costo REALES: suma de sesiones de roles + árbitro (state.sessions).
    const sessions = (s.sessions && typeof s.sessions === "object") ? s.sessions : {};
    const realByRole = {};
    let realIn = 0, realOut = 0, realReason = 0, realRead = 0, realWrite = 0, realCost = 0, realRoles = 0;
    for (const [role, sid] of Object.entries(sessions)) {
      if (typeof sid !== "string") continue;
      const st = await realSessionStats(base, auth, sid);
      if (!st) continue;
      realByRole[role] = st;
      realIn += st.input; realOut += st.output; realReason += st.reasoning;
      realRead += st.cacheRead; realWrite += st.cacheWrite; realCost += st.cost; realRoles++;
    }
    const realTotal = realIn + realOut;
    return {
      ...base_rec, debateID,
      consensus: consensusPct === 100 || s.consensus === true,
      consensusPct,
      acta: String(s.acta ?? "").slice(0, 4000),
      tokensTotalEst, tokensByRoleEst,
      tokensReal: realRoles ? { input: realIn, output: realOut, reasoning: realReason, total: realTotal, roles: realRoles } : null,
      cacheReal: realRoles ? { read: realRead, write: realWrite, readPct: realIn + realRead ? realRead / (realIn + realRead) : 0 } : null,
      costReal: realRoles ? realCost : null,
      latencyMs: Date.now() - t0,
      durationSec: Number(s.durationSec) || Math.round((Date.now() - t0) / 1000),
      turns, stalls: Number(s.stalls) || 0,
      directQueries: Number(s.directQueries) || 0,
      cascades: countCascades(turnsArr),
      trailerLeaks: trailerLeaks(turnsArr),
      unknownRate: +unknownRate(turnsArr).toFixed(3),
      redundancyRate: +redundancyRate(turnsArr).toFixed(3),
      interventions: cfg.intervention ? 1 : 0,
      filteredBySimilarity: 0,
      guards: kase.wantsGuards ? { enabled: true, labMode: true } : { enabled: false },
    };
  } catch (error) {
    return { ...base_rec, error: String(error?.message ?? error), latencyMs: Date.now() - t0, turns: 0, stalls: 0, cascades: 0, interventions: 0, consensus: false, consensusPct: 0, tokensTotalEst: 0, tokensByRoleEst: {} };
  }
}

// ---- Agregados: varianza entre las 3 corridas de cada celda ----
function aggregate(runs) {
  const byCell = new Map();
  for (const r of runs) {
    const k = `${r.caseId}|${r.configId}`;
    if (!byCell.has(k)) byCell.set(k, []);
    byCell.get(k).push(r);
  }
  const cells = [...byCell.entries()].map(([key, rs]) => {
    const [caseId, configId] = key.split("|");
    const toks = rs.map((r) => r.tokensTotalEst);
    const lats = rs.map((r) => r.latencyMs);
    const tns = rs.map((r) => r.turns);
    return {
      caseId, configId, n: rs.length,
      consensusRate: mean(rs.map((r) => (r.consensus ? 1 : 0))),
      consensusPctMean: Math.round(mean(rs.map((r) => r.consensusPct || 0))),
      tokensMean: Math.round(mean(toks)), tokensStd: Math.round(std(toks)),
      tokensMin: Math.min(...toks), tokensMax: Math.max(...toks),
      tokensRealMean: rs.some((r) => r.tokensReal) ? Math.round(mean(rs.filter((r) => r.tokensReal).map((r) => r.tokensReal.total))) : null,
      costRealMean: rs.some((r) => r.costReal != null) ? +mean(rs.filter((r) => r.costReal != null).map((r) => r.costReal)).toFixed(4) : null,
      cacheReadPctMean: rs.some((r) => r.cacheReal) ? +mean(rs.filter((r) => r.cacheReal).map((r) => r.cacheReal.readPct)).toFixed(3) : null,
      latencyMeanMs: Math.round(mean(lats)), latencyStdMs: Math.round(std(lats)),
      turnsMean: +mean(tns).toFixed(2), turnsMin: Math.min(...tns), turnsMax: Math.max(...tns),
      stallsMean: +mean(rs.map((r) => r.stalls)).toFixed(2),
      cascadesMean: +mean(rs.map((r) => r.cascades)).toFixed(2),
      directMean: +mean(rs.map((r) => r.directQueries || 0)).toFixed(2),
      leaksSum: rs.reduce((a, r) => a + (r.trailerLeaks || 0), 0),
      unknownMean: +mean(rs.map((r) => r.unknownRate || 0)).toFixed(3),
      redundancyMean: +mean(rs.map((r) => r.redundancyRate || 0)).toFixed(3),
      errors: rs.filter((r) => r.error).length,
    };
  });
  const byConfig = new Map();
  for (const c of cells) {
    if (!byConfig.has(c.configId)) byConfig.set(c.configId, []);
    byConfig.get(c.configId).push(c);
  }
  const configs = [...byConfig.entries()].map(([configId, cs]) => ({
    configId,
    cells: cs.length,
    runs: cs.reduce((a, c) => a + c.n, 0),
    consensusRate: +mean(cs.map((c) => c.consensusRate)).toFixed(3),
    consensusPctMean: Math.round(mean(cs.map((c) => c.consensusPctMean || 0))),
    tokensMean: Math.round(mean(cs.map((c) => c.tokensMean))),
    tokensStd: Math.round(mean(cs.map((c) => c.tokensStd))),
    tokensRealMean: cs.some((c) => c.tokensRealMean != null) ? Math.round(mean(cs.filter((c) => c.tokensRealMean != null).map((c) => c.tokensRealMean))) : null,
    costRealMean: cs.some((c) => c.costRealMean != null) ? +mean(cs.filter((c) => c.costRealMean != null).map((c) => c.costRealMean)).toFixed(4) : null,
    cacheReadPctMean: cs.some((c) => c.cacheReadPctMean != null) ? +mean(cs.filter((c) => c.cacheReadPctMean != null).map((c) => c.cacheReadPctMean)).toFixed(3) : null,
    latencyMeanMs: Math.round(mean(cs.map((c) => c.latencyMeanMs))),
    turnsMean: +mean(cs.map((c) => c.turnsMean)).toFixed(2),
    stallsMean: +mean(cs.map((c) => c.stallsMean)).toFixed(2),
    cascadesMean: +mean(cs.map((c) => c.cascadesMean)).toFixed(2),
    directMean: +mean(cs.map((c) => c.directMean)).toFixed(2),
    leaksSum: cs.reduce((a, c) => a + c.leaksSum, 0),
    unknownMean: +mean(cs.map((c) => c.unknownMean)).toFixed(3),
    redundancyMean: +mean(cs.map((c) => c.redundancyMean)).toFixed(3),
    errors: cs.reduce((a, c) => a + c.errors, 0),
  }));
  return { cells, configs };
}

// ---- main ----
async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.help) { help(); process.exit(0); }
  if (opt.recompute) {
    // Re-agrega runs existentes (tras fixes de aggregate/reporte) sin re-correr.
    const prev = JSON.parse(readFileSync(opt.recompute, "utf8"));
    const runs = Array.isArray(prev.runs) ? prev.runs : [];
    const { cells, configs } = aggregate(runs);
    const results = {
      meta: { ...(prev.meta || {}), recomputedAt: new Date().toISOString(), executed: runs.length },
      configDefs: prev.configDefs || CONFIGS,
      runs, cells, configs,
    };
    mkdirSync(opt.out, { recursive: true });
    const resultsPath = join(opt.out, "results.json");
    writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`[run] recompute ${runs.length} runs → ${resultsPath}`);
    const reportPath = join(opt.out, "report.md");
    const child = spawnSync(process.execPath, [join(HERE, "report.mjs"), "--in", resultsPath, "--out", reportPath], { encoding: "utf8" });
    if (child.stdout) process.stdout.write(child.stdout);
    if (child.stderr) process.stderr.write(child.stderr);
    if (child.status !== 0) { console.error("[run] report.mjs falló."); process.exit(child.status || 1); }
    console.log(`[run] report → ${reportPath}`);
    return;
  }
  const cases = JSON.parse(readFileSync(join(HERE, "cases.json"), "utf8"));
  if (!Array.isArray(cases) || cases.length !== 20) {
    console.error(`cases.json debe tener 20 dilemas (hay ${Array.isArray(cases) ? cases.length : "?"}).`);
    process.exit(1);
  }
  const picked = opt.cases.length ? cases.filter((c) => opt.cases.includes(String(c.id).toUpperCase())) : cases;
  if (!picked.length) { console.error("Ningún caso coincide con --cases."); process.exit(1); }

  // Plan: por cada (caso, config) N corridas; --limit corta el total.
  // Overrides: --configs filtra configs, --runs cambia corridas, --max-turns
  // clampa maxTurns de todas las configs ejecutadas (Tier 1: 6).
  const runsPerCell = opt.runs > 0 ? opt.runs : RUNS_PER_CELL;
  const cfgs = opt.configs.length ? CONFIGS.filter((c) => opt.configs.includes(c.id)) : CONFIGS;
  if (opt.configs.length && !cfgs.length) { console.error("Ninguna config coincide con --configs."); process.exit(1); }
  const plan = [];
  for (const kase of picked)
    for (const cfg of cfgs) {
      const cc = opt.maxTurns > 0 ? { ...cfg, maxTurns: Math.min(Math.max(opt.maxTurns, 3), 30) } : cfg;
      for (let run = 1; run <= runsPerCell; run++) plan.push([kase, cc, run]);
    }
  const exec = opt.limit > 0 ? plan.slice(0, opt.limit) : plan;
  console.log(`[run] modo=${opt.dryRun ? "dry-run (simulado, sin server)" : "real RPC " + opt.url} casos=${picked.length} configs=${cfgs.map((c) => c.id).join(",")} corridas=${runsPerCell} maxTurns=${opt.maxTurns || "cfg"} ejecuciones=${exec.length}/${plan.length}`);

  const runs = [];
  for (let i = 0; i < exec.length; i++) {
    const [kase, cfg, run] = exec[i];
    process.stdout.write(`[run] ${i + 1}/${exec.length} ${kase.id} x ${cfg.id} #${run} ... `);
    const rec = opt.dryRun ? simulateDebate(kase, cfg, run) : await realDebate(kase, cfg, run, opt.url, opt.auth);
    runs.push(rec);
    const tok = rec.tokensReal ? `tok_real=${rec.tokensReal.total} cost=${rec.costReal}` : `tok_est=${rec.tokensTotalEst}`;
    console.log(rec.error ? `ERROR ${rec.error.slice(0, 80)}` : `ok consenso=${rec.consensusPct}% ${tok} turnos=${rec.turns} direct=${rec.directQueries ?? 0} ${rec.latencyMs}ms`);
  }

  const { cells, configs } = aggregate(runs);
  const results = {
    meta: {
      generatedAt: new Date().toISOString(),
      mode: opt.dryRun ? "dry-run" : "real",
      url: opt.dryRun ? null : opt.url,
      runsPerCell,
      planned: plan.length,
      executed: exec.length,
      maxTurns: opt.maxTurns || null,
      tokensNote: "tokens en ceil(chars/4), etiquetados estimado (§5/contrato); en modo real se suma tokens/costo REAL por sesión (state.sessions).",
      varianceNote: "Cada celda repite N corridas con el mismo tema y config; el harness no expone semilla, por eso se reporta varianza (media ± std, min/max).",
      rules: "B5 excluido; C5 solo en C-similarity (default all); guards/F3 off salvo wantsGuards (labMode).",
    },
    configDefs: cfgs,
    runs,
    cells,
    configs,
  };
  mkdirSync(opt.out, { recursive: true });
  const resultsPath = join(opt.out, "results.json");
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`[run] results → ${resultsPath}`);

  // Reporte vía report.mjs (tabla markdown + veredicto por criterio de adopción).
  const reportPath = join(opt.out, "report.md");
  const child = spawnSync(process.execPath, [join(HERE, "report.mjs"), "--in", resultsPath, "--out", reportPath], { encoding: "utf8" });
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);
  if (child.status !== 0) { console.error("[run] report.mjs falló."); process.exit(child.status || 1); }
  console.log(`[run] report → ${reportPath}`);
  console.log(`[run] Revisión ciega pendiente: completar ${join(HERE, "REVISAR.md")} y pegar notas en el reporte antes de adoptar nada (criterio §9).`);
}

main().catch((e) => { console.error("[run] fatal:", e?.message ?? e); process.exit(1); });
