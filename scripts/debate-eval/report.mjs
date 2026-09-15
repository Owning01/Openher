#!/usr/bin/env node
/**
 * debate-eval/report.mjs — Tabla markdown comparativa + veredicto (Fase 3).
 * Criterio de adopción (§9 DEBATE.md): una técnica entra al default solo con
 * mejora de calidad o ahorro ≥30% de tokens sin degradar calidad >2%.
 * La calidad es ciega y diferida: el humano completa REVISAR.md; este script
 * acepta --blind blind.json opcional ({ configId: notaMedia1a5 }).
 * Sin notas ciegas el veredicto queda INCONCLUSO (no se adopta nada).
 *
 * Uso:
 *   node report.mjs --in ./out/results.json --out ./out/report.md [--blind ./out/blind.json]
 */

import { readFileSync, writeFileSync } from "node:fs";

function parseArgs(argv) {
  const o = { in: "", out: "", blind: "" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--in") o.in = argv[++i] || "";
    else if (argv[i] === "--out") o.out = argv[++i] || "";
    else if (argv[i] === "--blind") o.blind = argv[++i] || "";
  }
  return o;
}

const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const num = (x) => (typeof x === "number" ? x.toLocaleString("en-US") : String(x ?? "-"));

export function renderReport(results, blindScores = {}) {
  const { meta, configs = [], cells = [] } = results;
  const base = configs.find((c) => c.configId === "A-isolated");
  const L = [];
  L.push(`# Debate-eval — reporte A/B (Fase 3)`);
  L.push(``);
  L.push(`- Generado: ${meta.generatedAt} · modo: **${meta.mode}**${meta.url ? ` · server: ${meta.url}` : ""}`);
  L.push(`- Celdas: mismo tema + misma config, ${meta.runsPerCell} corridas por celda · ejecutadas: ${meta.executed}/${meta.planned}`);
  L.push(`- Tokens: ${meta.tokensNote}`);
  L.push(`- Varianza: ${meta.varianceNote}`);
  L.push(`- Reglas: ${meta.rules}`);
  const hasBlind = Object.keys(blindScores).length > 0;
  L.push(`- Revisión ciega: ${hasBlind ? "notas presentes (" + Object.keys(blindScores).join(", ") + ")" : "**PENDIENTE** — completar REVISAR.md; sin notas no se adopta nada"}`);
  L.push(``);

  if (!base) {
    L.push(`Sin baseline A-isolated en los datos: las columnas Δ vs base quedan en 0. Re-correr incluyendo A-isolated para veredicto.`);
    L.push(``);
  }
  // ---- Tabla comparativa por config ----
  L.push(`## Comparativa por config (vs baseline A-isolated)`);
  L.push(``);
  const useReal = configs.some((c) => c.tokensRealMean != null);
  L.push(`| Config | Corridas | Consenso | Tokens ${useReal ? "reales" : "est."} media | Δ tokens vs base | Costo real medio | Cache read | Turnos medios | Directas | Stalls | Cascadas | Leaks | Redund. |`);
  L.push(`|---|---|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const c of configs) {
    const tm = useReal ? (c.tokensRealMean ?? 0) : c.tokensMean;
    const tb = base ? (useReal ? (base.tokensRealMean ?? 0) : base.tokensMean) : 0;
    const saving = tb ? (tb - tm) / tb : 0;
    const savingStr = c.configId === "A-isolated" ? "—" : `${saving >= 0 ? "−" : "+"}${pct(Math.abs(saving))} ${saving >= 0.3 ? "(≥30%)" : ""}`;
    L.push(`| ${c.configId} | ${c.runs} | ${pct(c.consensusRate)} | ${num(tm)}${useReal ? "" : " (est.)"} | ${savingStr} | ${c.costRealMean ?? "-"} | ${c.cacheReadPctMean ?? "-"} | ${c.turnsMean} | ${c.directMean} | ${c.stallsMean} | ${c.cascadesMean} | ${c.leaksSum} | ${c.redundancyMean} |`);
  }
  L.push(``);

  // ---- Varianza por celda ----
  L.push(`## Varianza por celda (3 corridas: media ± std, min/max)`);
  L.push(``);
  L.push(`| Celda (caso × config) | Consenso | Tokens est. | Latencia media ± std | Turnos | Errores |`);
  L.push(`|---|---|---|---|---|---|`);
  const sorted = [...cells].sort((a, b) => String(a.caseId).localeCompare(String(b.caseId)) || String(a.configId).localeCompare(String(b.configId)));
  for (const c of sorted) {
    L.push(`| ${c.caseId} × ${c.configId} (n=${c.n}) | ${pct(c.consensusRate)} | ${num(c.tokensMean)} ± ${num(c.tokensStd)} [${num(c.tokensMin)}–${num(c.tokensMax)}] | ${num(c.latencyMeanMs)} ± ${num(c.latencyStdMs)} ms | ${c.turnsMean} [${c.turnsMin}–${c.turnsMax}] | ${c.errors} |`);
  }
  L.push(``);

  // ---- Veredicto por criterio de adopción ----
  L.push(`## Veredicto (criterio §9: mejora calidad o ahorro ≥30% sin degradar >2%)`);
  L.push(``);
  if (!base) {
    L.push(`Sin baseline A-isolated en los datos: veredicto imposible. Re-correr con la matriz completa.`);
  } else if (!hasBlind) {
    L.push(`**INCONCLUSO — falta revisión ciega.** No se adopta ninguna técnica.`);
    L.push(`Comparación solo de costo/robustez (no de calidad):`);
    L.push(``);
    const useReal = (results.configs || []).some((c) => c.tokensRealMean != null);
    for (const c of configs) {
      if (c.configId === "A-isolated") continue;
      const tm = useReal ? (c.tokensRealMean ?? 0) : c.tokensMean;
      const tb = useReal ? (base.tokensRealMean ?? 0) : base.tokensMean;
      const saving = tb ? (tb - tm) / tb : 0;
      L.push(`- **${c.configId}**: ahorro ${useReal ? "real" : "est."} ${pct(saving)} vs base; consenso ${pct(c.consensusRate)} vs ${pct(base.consensusRate)} (base); directas ${c.directMean}; leaks ${c.leaksSum}; redundancia ${c.redundancyMean}. Decisión bloqueada hasta nota ciega.`);
    }
    L.push(``);
    L.push(`Para cerrar: \`node report.mjs --in <results.json> --out <report.md> --blind blind.json\` con notas de REVISAR.md.`);
  } else {
    const bq = blindScores["A-isolated"];
    const useReal = (results.configs || []).some((c) => c.tokensRealMean != null);
    L.push(`| Config | Nota ciega | Δ calidad vs base | Δ tokens vs base | Veredicto |`);
    L.push(`|---|---|---|---|---|`);
    for (const c of configs) {
      const q = blindScores[c.configId];
      const dq = bq ? (q - bq) / bq : 0;
      const tm = useReal ? (c.tokensRealMean ?? 0) : c.tokensMean;
      const tb = base ? (useReal ? (base.tokensRealMean ?? 0) : base.tokensMean) : 0;
      const saving = tb ? (tb - tm) / tb : 0;
      let v;
      if (q == null) v = "INCONCLUSO (sin nota)";
      else if (dq < -0.02) v = "RECHAZADO (degrada >2%)";
      else if (dq > 0 || saving >= 0.3) v = "ADOPTAR (pasa §9)";
      else v = "RECHAZADO (sin mejora ni ahorro ≥30%)";
      L.push(`| ${c.configId} | ${q ?? "-"} | ${c.configId === "A-isolated" ? "—" : pct(dq)} | ${c.configId === "A-isolated" ? "—" : pct(saving)} | **${v}** |`);
    }
  }
  L.push(``);
  L.push(`### Aplicación a C5 y a enrutado de modelos`);
  L.push(``);
  L.push(`- **C5 (similarity-filter, config C)**: entra al default (\`participation:"all"\` → filtro) solo si el veredicto de arriba dice ADOPTAR con notas ciegas reales. El ahorro en dry-run no cuenta.`);
  L.push(`- **Enrutado de modelos** (roles baratos + árbitro fuerte): no evaluado en esta matriz (requiere harness con per-role model). Para evaluarlo, añadir configs G-barato/H-híbrido y repetir este mismo protocolo; mismo criterio §9.`);
  L.push(``);
  L.push(`### Reproducir`);
  L.push(``);
  L.push(`\`\`\`powershell`);
  L.push(`node scripts/debate-eval/run.mjs --dry-run --out scripts/debate-eval/out`);
  L.push(`node scripts/debate-eval/report.mjs --in scripts/debate-eval/out/results.json --out scripts/debate-eval/out/report.md`);
  L.push(`\`\`\``);
  L.push(`Matriz real (server con RPC debate/*): \`$env:OPENCODE_URL="http://127.0.0.1:4096"; node scripts/debate-eval/run.mjs --cases D01,D09,D15 --limit 18 --out scripts/debate-eval/out\` (~8k-25k tokens est. por debate).`);
  L.push(``);
  return L.join("\n");
}

function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (!opt.in || !opt.out) {
    console.error("Uso: node report.mjs --in <results.json> --out <report.md> [--blind <blind.json>]");
    process.exit(1);
  }
  const results = JSON.parse(readFileSync(opt.in, "utf8"));
  let blind = {};
  if (opt.blind) blind = JSON.parse(readFileSync(opt.blind, "utf8"));
  const md = renderReport(results, blind);
  writeFileSync(opt.out, md);
  console.log(`[report] ${results.configs?.length ?? 0} configs, ${results.cells?.length ?? 0} celdas → ${opt.out}`);
  // Resumen stdout: veredicto corto por config vs base.
  const base = (results.configs || []).find((c) => c.configId === "A-isolated");
  const useReal = (results.configs || []).some((c) => c.tokensRealMean != null);
  for (const c of results.configs || []) {
    const tm = useReal ? (c.tokensRealMean ?? 0) : c.tokensMean;
    const tb = useReal ? (base?.tokensRealMean ?? 0) : base?.tokensMean;
    const saving = tb ? (((tb - tm) / tb) * 100).toFixed(1) : "?";
    console.log(`[report] ${c.configId}: consenso=${(c.consensusRate * 100).toFixed(1)}% tok_${useReal ? "real" : "est"}=${tm} ahorro_vs_base=${c.configId === "A-isolated" ? "—" : saving + "%"}`);
  }
  if (!Object.keys(blind).length) console.log("[report] Veredicto: INCONCLUSO — falta revisión ciega (REVISAR.md).");
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/debate-eval/report.mjs") || process.argv[1]?.replace(/\\/g, "/").endsWith("debate-eval/report.mjs")) main();
