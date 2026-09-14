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
];
const RUNS_PER_CELL = 3;

// ---- CLI ----
function parseArgs(argv) {
  const o = { dryRun: false, limit: 0, cases: [], out: join(HERE, "out"), url: process.env.OPENCODE_URL || "http://127.0.0.1:4096", help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") o.dryRun = true;
    else if (a === "--limit") o.limit = Math.max(0, parseInt(argv[++i] || "0", 10) || 0);
    else if (a === "--cases") o.cases = String(argv[++i] || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
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

// ---- RPC real contra el server opencode ----
async function rpcPost(base, method, params, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    // Intento 1: JSON-RPC genérico en /rpc. Intento 2: ruta directa /<method>.
    const bodies = [
      `${base.replace(/\/$/, "")}/rpc`,
      `${base.replace(/\/$/, "")}/${method}`,
    ];
    let lastErr;
    for (const url of bodies) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(url.endsWith("/rpc") ? { method, params } : params),
          signal: ctrl.signal,
        });
        const text = await res.text();
        if (!res.ok) { lastErr = new Error(`HTTP ${res.status} en ${url}: ${text.slice(0, 200)}`); continue; }
        try { return JSON.parse(text); } catch { return { raw: text }; }
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error("RPC sin respuesta");
  } finally {
    clearTimeout(t);
  }
}

function toDebateParams(kase, cfg) {
  const topic = `${kase.topic} — ${kase.context} [eval ${kase.id}/${cfg.id}]`;
  const core = {
    topic, roles: ROLES, maxTurns: cfg.maxTurns,
    engine: cfg.engine, cache: cfg.engine, // cache = alias legacy solo-lectura (compat v1)
    files: [],
  };
  const v2 = {
    participation: cfg.participation,
    similarityThreshold: cfg.similarityThreshold ?? 0.85,
    stabilityStop: cfg.stabilityStop,
    confidence: cfg.confidence,
    blindFirstRound: true, objectionDuty: true, stallLimit: 3,
    guards: kase.wantsGuards ? { enabled: true, labMode: true } : { enabled: false },
  };
  return { core, v2 };
}

async function realDebate(kase, cfg, runIdx, base) {
  const t0 = Date.now();
  const { core, v2 } = toDebateParams(kase, cfg);
  const base_rec = { caseId: kase.id, configId: cfg.id, run: runIdx, simulated: false, tokensEstimatedLabel: "estimado" };
  try {
    // Intento con params v2; si el server v1 rechaza (additionalProperties false), reintenta solo core.
    let started;
    try {
      started = await rpcPost(base, "debate/start", { ...core, ...v2 });
    } catch {
      started = await rpcPost(base, "debate/start", core);
    }
    const debateID = started?.debateID ?? started?.result?.debateID ?? started?.debateId;
    if (!debateID) throw new Error(`start sin debateID: ${JSON.stringify(started).slice(0, 200)}`);
    if (cfg.intervention) {
      // Intervención simulada a mitad del debate (best-effort, no bloquea).
      setTimeout(() => {
        rpcPost(base, "debate/intervene", { debateID, text: "Intervención (eval): ¿qué evidencia falta para cerrar?" }).catch(() => {});
      }, 45_000).unref?.();
    }
    // Poll debate/state hasta done/running=false o tope 13 min.
    const deadline = Date.now() + 13 * 60_000;
    let state = {};
    for (;;) {
      await sleep(5000);
      try {
        state = await rpcPost(base, "debate/state", { debateID }, 12000);
      } catch (e) {
        if (Date.now() > deadline) throw e;
        continue;
      }
      const s = state?.result ?? state;
      if (s && (s.done === true || s.running === false)) { state = s; break; }
      if (Date.now() > deadline) { state = s; break; }
    }
    const turnsArr = Array.isArray(state.turns) ? state.turns : [];
    const turns = typeof state.turns === "number" ? state.turns : turnsArr.length;
    const tokensByRoleEst = {};
    for (const t of turnsArr) {
      const b = String(t.body ?? "");
      tokensByRoleEst[t.role || "unknown"] =
        (tokensByRoleEst[t.role || "unknown"] || 0) + tokensEst(b) + (Number(t.tokensInEst) || 0) + (Number(t.tokensOutEst) || tokensEst(b));
    }
    const actaLen = String(state.acta ?? state.text ?? "").length;
    const tokensTotalEst = Object.values(tokensByRoleEst).reduce((a, b) => a + b, 0) + (actaLen ? tokensEst(actaLen) : 0);
    const consensusPct = typeof state.consensusPct === "number" ? state.consensusPct
      : typeof state.consensus === "boolean" ? (state.consensus ? 100 : 0)
      : typeof state.consensus === "number" ? state.consensus : 0;
    return {
      ...base_rec, debateID,
      consensus: consensusPct === 100 || state.consensus === true,
      consensusPct,
      tokensTotalEst, tokensByRoleEst,
      latencyMs: Date.now() - t0,
      turns, stalls: Number(state.stalled ?? state.stalls ?? 0) || 0,
      cascades: countCascades(turnsArr),
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
      tokensMean: Math.round(mean(toks)), tokensStd: Math.round(std(toks)),
      tokensMin: Math.min(...toks), tokensMax: Math.max(...toks),
      latencyMeanMs: Math.round(mean(lats)), latencyStdMs: Math.round(std(lats)),
      turnsMean: +mean(tns).toFixed(2), turnsMin: Math.min(...tns), turnsMax: Math.max(...tns),
      stallsMean: +mean(rs.map((r) => r.stalls)).toFixed(2),
      cascadesMean: +mean(rs.map((r) => r.cascades)).toFixed(2),
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
    tokensMean: Math.round(mean(cs.map((c) => c.tokensMean))),
    tokensStd: Math.round(mean(cs.map((c) => c.tokensStd))),
    latencyMeanMs: Math.round(mean(cs.map((c) => c.latencyMeanMs))),
    turnsMean: +mean(cs.map((c) => c.turnsMean)).toFixed(2),
    stallsMean: +mean(cs.map((c) => c.stallsMean)).toFixed(2),
    cascadesMean: +mean(cs.map((c) => c.cascadesMean)).toFixed(2),
    errors: cs.reduce((a, c) => a + c.errors, 0),
  }));
  return { cells, configs };
}

// ---- main ----
async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.help) { help(); process.exit(0); }
  const cases = JSON.parse(readFileSync(join(HERE, "cases.json"), "utf8"));
  if (!Array.isArray(cases) || cases.length !== 20) {
    console.error(`cases.json debe tener 20 dilemas (hay ${Array.isArray(cases) ? cases.length : "?"}).`);
    process.exit(1);
  }
  const picked = opt.cases.length ? cases.filter((c) => opt.cases.includes(String(c.id).toUpperCase())) : cases;
  if (!picked.length) { console.error("Ningún caso coincide con --cases."); process.exit(1); }

  // Plan: por cada (caso, config) 3 corridas; --limit corta el total (corridas cortas).
  const plan = [];
  for (const kase of picked)
    for (const cfg of CONFIGS)
      for (let run = 1; run <= RUNS_PER_CELL; run++) plan.push([kase, cfg, run]);
  const exec = opt.limit > 0 ? plan.slice(0, opt.limit) : plan;
  console.log(`[run] modo=${opt.dryRun ? "dry-run (simulado, sin server)" : "real RPC " + opt.url} casos=${picked.length} configs=${CONFIGS.length} ejecuciones=${exec.length}/${plan.length}`);

  const runs = [];
  for (let i = 0; i < exec.length; i++) {
    const [kase, cfg, run] = exec[i];
    process.stdout.write(`[run] ${i + 1}/${exec.length} ${kase.id} x ${cfg.id} #${run} ... `);
    const rec = opt.dryRun ? simulateDebate(kase, cfg, run) : await realDebate(kase, cfg, run, opt.url);
    runs.push(rec);
    console.log(rec.error ? `ERROR ${rec.error.slice(0, 80)}` : `ok consenso=${rec.consensusPct}% tok_est=${rec.tokensTotalEst} turnos=${rec.turns} ${rec.latencyMs}ms`);
  }

  const { cells, configs } = aggregate(runs);
  const results = {
    meta: {
      generatedAt: new Date().toISOString(),
      mode: opt.dryRun ? "dry-run" : "real",
      url: opt.dryRun ? null : opt.url,
      runsPerCell: RUNS_PER_CELL,
      planned: plan.length,
      executed: exec.length,
      tokensNote: "tokens en ceil(chars/4), etiquetados estimado (§5/contrato)",
      varianceNote: "Cada celda repite 3 corridas con el mismo tema y config; el harness no expone semilla, por eso se reporta varianza (media ± std, min/max).",
      rules: "B5 excluido; C5 solo en C-similarity (default all); guards/F3 off salvo wantsGuards (labMode).",
    },
    configDefs: CONFIGS,
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
