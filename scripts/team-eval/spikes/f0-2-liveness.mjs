// f0-2-liveness.mjs — F0.2: ¿PID o heartbeat? Dictamina con el server real.
// Pregunta: ¿expone el server alguna señal de "sesión viva/muerta"?
import { api, verdict } from "./lib.mjs";

const ev = {};
const mk = await api("/api/session", { method: "POST", body: { title: "spike f0.2" } });
ev.created = mk.status === 200 && !!mk.json?.data?.id;
const id = mk.json?.data?.id;
const g1 = await api(`/api/session/${id}`);
ev.getKeys = Object.keys(g1.json?.data || {});
ev.hasStatus = "status" in (g1.json?.data || {});
ev.hasPid = JSON.stringify(g1.json?.data || {}).includes("pid");
await api(`/api/session/${id}/interrupt`, { method: "POST" });
const g2 = await api(`/api/session/${id}`);
ev.interruptChanges = JSON.stringify(g1.json?.data) !== JSON.stringify(g2.json?.data);
ev.listOk = (await api("/api/session")).status === 200;
// Dictamen: sin status/pid en el server → heartbeat a nivel TEAM.
ev.dictamen = !ev.hasStatus && !ev.hasPid
  ? "heartbeat TEAM (el server no expone liveness)"
  : "revisar: el server expone señal";
verdict("F0.2-liveness", true, ev);
