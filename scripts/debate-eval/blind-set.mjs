#!/usr/bin/env node
/**
 * debate-eval/blind-set.mjs — arma el set ciego para REVISAR.md.
 * Lee results.json, extrae el acta de cada run (del record o del JSONL por
 * debateID) y escribe blind-NN.md anonimizadas + mapping.json SELLADO
 * (no abrir hasta terminar de puntuar).
 *
 * Uso:
 *   node blind-set.mjs --in ./out-tier1/results.json --out ./out-tier1/blind [--cases D01,D18] [--debates-dir "C:/Users/perca/.openher/debates"]
 * El juez puntúa cada blind-NN.md de 1-5 (rúbrica en REVISAR.md) y vuelca a blind.json:
 *   { "<configId>": nota }  (tras abrir mapping.json y promediar por config)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

function parseArgs(argv) {
  const o = { in: "", out: "", cases: [], debatesDir: "C:/Users/perca/.openher/debates" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--in") o.in = argv[++i] || "";
    else if (argv[i] === "--out") o.out = argv[++i] || "";
    else if (argv[i] === "--cases") o.cases = String(argv[++i] || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    else if (argv[i] === "--debates-dir") o.debatesDir = argv[++i] || o.debatesDir;
  }
  return o;
}

function actaFromJSONL(dir, debateID) {
  try {
    const p = join(dir, `${debateID}.jsonl`);
    if (!existsSync(p)) return "";
    const rows = readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const art = rows.filter((r) => (r.v2 || {}).event === "artifact").at(-1);
    return String(art?.v2?.data?.text ?? "");
  } catch {
    return "";
  }
}

function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (!opt.in || !opt.out) {
    console.error("Uso: node blind-set.mjs --in <results.json> --out <dir> [--cases D01,D18]");
    process.exit(1);
  }
  const results = JSON.parse(readFileSync(opt.in, "utf8"));
  let runs = (results.runs || []).filter((r) => !r.error && (r.debateID || r.acta));
  if (opt.cases.length) runs = runs.filter((r) => opt.cases.includes(String(r.caseId).toUpperCase()));
  if (!runs.length) { console.error("Sin runs con debateID o acta para anonimizar."); process.exit(1); }
  mkdirSync(opt.out, { recursive: true });
  const mapping = {};
  runs.forEach((r, i) => {
    const name = `blind-${String(i + 1).padStart(2, "0")}.md`;
    let acta = String(r.acta || "");
    if (!acta) acta = actaFromJSONL(opt.debatesDir, r.debateID);
    // Quita menciones del motor/config que delatarían la celda.
    const clean = acta
      .replace(/\(isolated\)|\(shared\)|\(hybrid\)/gi, "(motor)")
      .replace(/\[eval [^\]]+\]/g, "[eval]")
      .slice(0, 4000);
    writeFileSync(join(opt.out, name), `# Acta ciega ${name}\n\n${clean || "(sin acta registrada)"}\n`);
    mapping[name] = { caseId: r.caseId, configId: r.configId, run: r.run, debateID: r.debateID };
  });
  writeFileSync(join(opt.out, "mapping.json"), JSON.stringify({ sealed: "NO ABRIR hasta puntuar", mapping }, null, 2));
  console.log(`[blind] ${runs.length} actas → ${resolve(opt.out)} (mapping.json SELLADO)`);
}

main();
