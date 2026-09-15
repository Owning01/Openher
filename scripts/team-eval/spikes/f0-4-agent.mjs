// f0-4-agent.mjs — F0.4: create({agent}) + micro-prompt, costo mínimo.
import { api, verdict, sleep } from "./lib.mjs";

const ev = {};
const mk = await api("/api/session", { method: "POST", body: { title: "spike f0.4", agent: "architect" } });
ev.accepted = mk.status === 200 && mk.json?.data?.agent === "architect";
const id = mk.json?.data?.id;
if (!id) { verdict("F0.4-agent", false, ev); process.exit(1); }
// Micro-prompt: 1 palabra, sin tools (solo verifica que el agente responde).
const p = await api(`/api/session/${id}/prompt`, { method: "POST", body: { text: "Responde con exactamente esta palabra y nada más: SPIKEOK" }, timeout: 120000 });
ev.promptStatus = p.status;
await sleep(2000);
const msgs = await api(`/api/session/${id}/message`);
const all = JSON.stringify(msgs.json || {});
ev.containsSpikeOk = all.includes("SPIKEOK");
const st = await api(`/api/session/${id}`);
ev.cost = st.json?.data?.cost ?? null;
const ok = ev.accepted && ev.containsSpikeOk;
verdict("F0.4-agent", ok, ev);
if (!ok) process.exit(1);
