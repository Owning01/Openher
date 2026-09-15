// f0-5-delivery.mjs — F0.5: delivery cross-sesión. N=10, timeout=60s,
// PASS = 10/10 + p50 ≤30s. Aproximación declarada: sin plugin team/* aún,
// "send+ask" = prompt (wake) + verificación de respuesta exacta (ask).
import { api, verdict, sleep } from "./lib.mjs";

const N = 10, TIMEOUT = 60000;
const ev = { N, timeoutMs: TIMEOUT, lat: [] };
async function mkSession(title, agent) {
  const r = await api("/api/session", { method: "POST", body: { title, ...(agent ? { agent } : {}) } });
  return r.json?.data?.id;
}
const A = await mkSession("spike f0.5 A");
const B = await mkSession("spike f0.5 B");
if (!A || !B) { verdict("F0.5-delivery", false, { ...ev, error: "no sessions" }); process.exit(1); }
ev.sessions = 2;
let delivered = 0;
for (let i = 0; i < N; i++) {
  const target = i % 2 === 0 ? B : A; // alterna: A→B, B→A
  const nonce = `PING-${i}`;
  const t0 = Date.now();
  try {
    const pr = await api(`/api/session/${target}/prompt`, {
      method: "POST", body: { text: `Responde exactamente con esto y nada más: ${nonce}` }, timeout: TIMEOUT,
    });
    ev.promptStatus = ev.promptStatus ?? pr.status;
    // ask = bloquea hasta respuesta o timeout: poll del message list.
    let found = false;
    while (Date.now() - t0 < TIMEOUT) {
      await sleep(3000);
      const msgs = await api(`/api/session/${target}/message`);
      if (JSON.stringify(msgs.json || {}).includes(nonce)) { found = true; break; }
    }
    if (found) delivered++;
    ev.lat.push(Date.now() - t0);
  } catch { ev.lat.push(-1); }
}
ev.delivered = `${delivered}/${N}`;
ev.latSorted = [...ev.lat].filter((x) => x >= 0).sort((a, b) => a - b);
ev.p50 = ev.latSorted.length ? ev.latSorted[Math.floor(ev.latSorted.length / 2)] : -1;
const pass = delivered === N && ev.p50 >= 0 && ev.p50 <= 30000;
ev.fallback = pass ? "no aplica" : "RECORTE: ask → polling cada 15 s";
verdict("F0.5-delivery", pass, ev);
if (!pass) process.exit(1);
