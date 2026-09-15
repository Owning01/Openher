// lib.mjs — helpers comunes spikes Fase 0 TEAM.
export const BASE = process.env.OPENCODE_URL || "http://127.0.0.1:4098";
export const AUTH = process.env.OPENCODE_AUTH || "opencode:octavio";
export const authH = () => "Basic " + Buffer.from(String(AUTH)).toString("base64");
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function api(path, { method = "GET", body, timeout = 20000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "content-type": "application/json", authorization: authH() },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  } finally {
    clearTimeout(t);
  }
}

export function verdict(spike, ok, evidence) {
  const v = ok ? "PASS" : "ROJO";
  console.log(`[${spike}] ${v} ${JSON.stringify(evidence).slice(0, 400)}`);
  return { spike, verdict: v, evidence };
}
