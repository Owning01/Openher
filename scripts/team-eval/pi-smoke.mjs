// pi-smoke.mjs — Aceptación bus Pi (DEBATE F5): 2 peers socket, list/send,
// ask→reply, cwd guard, supervisor, stop.
// Uso: node scripts/team-eval/pi-smoke.mjs
import net from "node:net";
const BASE = process.env.OPENCODE_URL || "http://127.0.0.1:4098";
const AUTH = process.env.OPENCODE_AUTH || "opencode:octavio";
const DIR = process.env.TEAM_DIR || "G:/Proyectos/opencode-remote-android";
const H = () => "Basic " + Buffer.from(String(AUTH)).toString("base64");
async function rpc(ns, method, input, timeout = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${BASE}/api/rpc/${ns}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: H() },
      body: JSON.stringify({ input: { directory: DIR, ...input } }),
      signal: ctrl.signal,
    });
    const j = await res.json();
    if (!res.ok) return { __error: JSON.stringify(j).slice(0, 200) };
    return j;
  } finally {
    clearTimeout(t);
  }
}
function peer(port) {
  const sock = net.createConnection({ host: "127.0.0.1", port });
  let buf = "", id = 0;
  const pending = new Map();
  sock.on("data", (c) => {
    buf += String(c);
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      try {
        const m = JSON.parse(line);
        if (m.id != null && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
      } catch { /* ignora */ }
    }
  });
  const call = (op) => new Promise((resolve, reject) => {
    const my = ++id;
    pending.set(my, resolve);
    sock.write(JSON.stringify({ id: my, ...op }) + "\n");
    setTimeout(() => { if (pending.has(my)) { pending.delete(my); reject(new Error("timeout socket " + op.op)); } }, 45000);
  });
  const close = () => sock.end();
  return { call, close };
}
const ev = {};
const c = await rpc("team", "create", { topology: "flat", objetivo: "pi smoke" });
ev.teamID = c?.output?.teamID;
if (!ev.teamID) { console.log("[PI-smoke] ROJO sin teamID"); process.exit(1); }
const T = ev.teamID;
const st = await rpc("pibus", "start", {});
ev.bus = st?.output;
if (!ev.bus?.port || !ev.bus?.secret) { console.log(`[PI-smoke] ROJO sin bus ${JSON.stringify(ev.bus)}`); process.exit(1); }
const A = peer(ev.bus.port), B = peer(ev.bus.port);
const S = ev.bus.secret;
const hA = await A.call({ op: "hello", secret: S, teamID: T, name: "extA", cwd: "/tmp/a" });
const hB = await B.call({ op: "hello", secret: S, teamID: T, name: "extB", cwd: "/tmp/b" });
ev.hello = hA?.ok === true && hB?.ok === true;
const li = await A.call({ op: "list", secret: S, teamID: T });
ev.listVe2 = li?.ok && JSON.stringify(li).includes("extA") && JSON.stringify(li).includes("extB");
const snd = await A.call({ op: "send", secret: S, teamID: T, to: "extB", message: "hola-b" });
ev.send = snd?.ok === true && snd?.entregado === "extB";
// ask→reply concurrente.
const askP = A.call({ op: "ask", secret: S, teamID: T, to: "extB", message: "ping-1", timeoutMs: 30000 });
await new Promise((r) => setTimeout(r, 1500));
const rep = await B.call({ op: "reply", secret: S, teamID: T, message: "pong-1" });
const askR = await askP;
ev.askReply = askR?.ok === true && askR?.message === "pong-1" && askR?.from === "extB" && rep?.ok === true;
// cwd guard: extB no está en /tmp/a → error.
const bad = await A.call({ op: "send", secret: S, teamID: T, to: "extB", cwd: "/tmp/a", message: "x" });
ev.cwdGuard = bad?.ok === false;
// supervisor.
const sup = await A.call({ op: "supervisor", secret: S, teamID: T, message: "duda de contrato" });
ev.supervisor = sup?.ok === true && sup?.needsHuman === true;
// secreto malo.
const wrong = await A.call({ op: "ping", secret: "zzz" });
ev.secreto = wrong?.ok === false;
// feed + state ven el tráfico pi.
const rd = await rpc("team", "read", { teamID: T, filter: { texto: "pong-1" } });
ev.feedVePi = (rd?.output?.entries?.length || 0) >= 1;
const tstate = await rpc("team", "state", { teamID: T });
ev.stateVePi = JSON.stringify(tstate?.output?.miembros || []).includes("pi:extA");
A.close(); B.close();
await new Promise((r) => setTimeout(r, 500));
const stop = await rpc("pibus", "stop", {});
ev.stop = stop?.output?.ok === true;
const ok = ev.hello && ev.listVe2 && ev.send && ev.askReply && ev.cwdGuard && ev.supervisor && ev.secreto && ev.feedVePi && ev.stateVePi && ev.stop;
console.log(`[PI-smoke] ${ok ? "PASS" : "ROJO"} ${JSON.stringify({ ...ev, bus: ev.bus ? { port: ev.bus.port, reused: ev.bus.reused } : null }).slice(0, 600)}`);
process.exitCode = ok ? 0 : 1;
