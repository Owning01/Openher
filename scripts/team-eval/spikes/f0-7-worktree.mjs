// f0-7-worktree.mjs — F0.7: setup de worktree + decisión capa 3 (umbral ≤60s).
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { verdict } from "./lib.mjs";

const sh = promisify(execFile);
const REPO = "G:/Proyectos/opencode-remote-android";
const WT = "G:/Proyectos/opencode-remote-android/.spike-wt-f07";
const out = {};
try {
  let t0 = Date.now();
  await sh("git", ["worktree", "add", "--detach", WT, "HEAD"], { cwd: REPO });
  out.setupMs = Date.now() - t0;
  t0 = Date.now();
  await sh("git", ["worktree", "remove", "--force", WT], { cwd: REPO });
  out.removeMs = Date.now() - t0;
  await sh("git", ["worktree", "prune"], { cwd: REPO }).catch(() => {});
  const ok = out.setupMs <= 60000;
  out.decision = ok ? "capa-3 viable (entra si Fase 2 la pide)" : "capa-3 diferida (setup >60s)";
  verdict("F0.7-worktree", true, out); // el spike siempre "pasa": su producto es la decisión
} catch (e) {
  verdict("F0.7-worktree", true, { error: String(e).slice(0, 120), decision: "capa-3 diferida (worktree no usable aquí)" });
}
