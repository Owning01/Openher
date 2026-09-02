"use strict";

/* ---------- Gestión de DB: panel admin (depende de app.js: num/usd globales) ---------- */

const A = { status: null, sessions: [], selected: new Set(), anchor: null, sort: { key: "events_mb", desc: true }, groupByProject: localStorage.getItem("oc_admin_group") === "1", collapsed: new Set() };

const fmtDate = (ms) => (ms ? new Date(ms).toISOString().slice(0, 16).replace("T", " ") : "—");
const fmtMb = (n) => (n >= 1000 ? (n / 1024).toFixed(2) + " GB" : n.toFixed(1) + " MB");

async function api(path, body) {
  const res = await fetch(path, body ? {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } : undefined);
  const d = await res.json();
  if (d.error) throw Object.assign(new Error(d.error), { blocked: d.blocked });
  return d;
}

/* ---------- tab "Gestión" (app.js intacto: se agrega el botón aparte) ---------- */

function ensureTab() {
  if (document.querySelector("#tab-gestion")) return;
  const b = document.createElement("button");
  b.id = "tab-gestion";
  b.dataset.tab = "gestion";
  b.textContent = "Gestión";
  b.className = "tab whitespace-nowrap px-3 py-1.5 text-sm rounded-lg transition-colors text-slate-400 hover:bg-slate-800 hover:text-slate-200";
  b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => {
      x.className = `tab whitespace-nowrap px-3 py-1.5 text-sm rounded-lg transition-colors ${x === b
        ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`;
    });
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("hidden", p.id !== "panel-gestion"));
    loadStatus();
    if (inflight) {
      setAdminStatus("Escaneando la base de datos...", true);
    } else if (A.sessions.length === 0) {
      loadSessions();
    } else {
      renderSessions();
      renderSummary();
    }
  });
  document.querySelector("#tabs").appendChild(b);
  if (typeof applyTabPrefs === "function") applyTabPrefs();
}

/* ---------- estado + banner ---------- */

async function loadStatus() {
  try {
    A.status = await api("/api/admin/status");
    const banner = document.querySelector("#adminBanner");
    if (A.status.opencode_running) {
      banner.classList.remove("hidden");
      banner.textContent = "⚠ opencode está corriendo — eliminar, mover, archivar y prune están bloqueados. " +
        "Cerrá opencode y actualizá, o usá «forzar» en cada operación (bajo tu responsabilidad).";
    } else {
      banner.classList.add("hidden");
    }
    renderSummary();
  } catch (e) {
    document.querySelector("#adminInfo").innerHTML = `<p class="text-red-400">Error de estado: ${e.message}</p>`;
  }
}

function renderSummary() {
  const st = A.status;
  const q = (document.querySelector("#adminSearch")?.value || "").toLowerCase();
  const visible = q
    ? A.sessions.filter((s) => s.title.toLowerCase().includes(q) || s.model.toLowerCase().includes(q) || s.project.toLowerCase().includes(q))
    : A.sessions;
  const s = visible;
  const totalMb = s.reduce((a, x) => a + x.events_mb, 0);
  const top = [...s].sort((a, b) => b.events_mb - a.events_mb).slice(0, 3);
  const info = document.querySelector("#adminInfo");
  if (!st) return;
  const card = (label, value, cls = "", tip = "") =>
    `<div class="bg-[#141a24] border border-slate-800 rounded-lg px-3 py-2 min-w-[130px]" ${tip ? `title="${escapeHtml(tip)}"` : ""}>
      <div class="text-[11px] uppercase tracking-wide text-slate-400">${label}</div>
      <div class="text-base font-bold text-white ${cls}">${value}</div>
    </div>`;
  info.innerHTML = `
    <div class="flex flex-wrap gap-2 mb-2">
      ${card("Sesiones filtradas", num(s.length))}
      ${card("Events en filtro", fmtMb(totalMb), totalMb > 500 ? "text-amber-400" : "")}
      ${card("DB total", fmtMb(st.db_mb), "", "Base: " + (st.db_path || ""))}
      ${card("WAL", fmtMb(st.wal_mb))}
      ${card("Espacio libre", st.free_gb + " GB")}
      ${card("opencode", st.opencode_running ? "corriendo" : "cerrado",
        st.opencode_running ? "text-amber-400" : "text-emerald-400")}
    </div>
    ${top.length ? `<div class="text-xs text-slate-400 mb-2">Más pesadas: ${top.map((x) =>
      `${escapeHtml(x.title.slice(0, 30))} (${fmtMb(x.events_mb)})`).join(" · ")}</div>` : ""}
    ${A.selected.size ? `<div class="text-xs text-blue-300 font-medium mb-1">${num(A.selected.size)} sesión(es) seleccionada(s) — click = una, shift+click = rango, ctrl+click = sumar/quitar, checkbox cabecera = todas</div>` : `<div class="text-xs text-slate-500 mb-1">Click en una fila para seleccionarla · shift+click selecciona el rango</div>`}`;
}

/* ---------- tabla de sesiones ---------- */

const ACOLS = [
  { key: "check", label: "", right: false },
  { key: "title", label: "Sesión", right: false },
  { key: "model", label: "Modelo", right: false },
  { key: "project", label: "Proyecto", right: false },
  { key: "created", label: "Inicio", right: false },
  { key: "cost", label: "Costo", right: true },
  { key: "events", label: "#Events", right: true },
  { key: "events_mb", label: "Events MB", right: true },
];

function selectedIds() {
  return [...A.selected];
}

let inflight = null;

function setAdminStatus(msg, busy) {
  const el = document.querySelector("#adminInfo");
  if (!el) return;
  el.innerHTML = msg
    ? `<span class="inline-flex items-center gap-2">${busy ? '<span class="spinner-sm"></span>' : ""}${msg}</span>`
    : "";
}

async function loadSessions() {
  const showStatus = !document.querySelector("#panel-gestion").classList.contains("hidden");
  if (showStatus) setAdminStatus("Escaneando la base de datos...", true);
  const p = api("/api/admin/sessions");
  inflight = p;
  try {
    const d = await p;
    A.sessions = d.sessions;
    A.selected = new Set(A.sessions.filter((s) => A.selected.has(s.id)).map((s) => s.id));
    renderSessions();
    renderSummary();
    if (showStatus) setAdminStatus("");
  } catch (e) {
    if (showStatus) setAdminStatus(`<span class="text-red-400">Error: ${escapeHtml(e.message)}</span>`);
  } finally {
    inflight = null;
  }
}

function rowHtml(s, i) {
  const sel = A.selected.has(s.id);
  return `<tr data-idx="${i}" class="cursor-pointer border-t border-slate-800/60 hover:bg-slate-800/40 ${sel ? "bg-blue-950/40" : ""}">
    <td class="px-3 py-2"><input type="checkbox" data-sid="${s.id}" ${sel ? "checked" : ""} class="accent-blue-500"></td>
    <td class="px-3 py-2 text-sm text-slate-200">${s.archived ? "📦 " : ""}${escapeHtml(s.title)}</td>
    <td class="px-3 py-2 text-sm text-slate-300">${escapeHtml(s.model)}</td>
    <td class="px-3 py-2 text-sm text-slate-400">${escapeHtml(s.project)}</td>
    <td class="px-3 py-2 text-sm text-slate-400">${fmtDate(s.created)}</td>
    <td class="px-3 py-2 text-sm text-right tabular-nums text-slate-300">${usd(s.cost)}</td>
    <td class="px-3 py-2 text-sm text-right tabular-nums text-slate-400">${num(s.events)}</td>
    <td class="px-3 py-2 text-sm text-right tabular-nums ${s.events_mb > 50 ? "text-amber-400 font-semibold" : "text-slate-300"}">${fmtMb(s.events_mb)}</td>
  </tr>`;
}

function groupRowHtml(ruta, items, rows) {
  const collapsed = A.collapsed.has(ruta);
  const n = items.length;
  const selInGroup = items.filter((s) => A.selected.has(s.id)).length;
  const allSel = selInGroup === n;
  const cost = items.reduce((a, s) => a + (s.cost || 0), 0);
  const ev = items.reduce((a, s) => a + (s.events || 0), 0);
  const mb = items.reduce((a, s) => a + (s.events_mb || 0), 0);
  return `<tr class="group-row border-t border-slate-700/60 bg-[#101624] hover:bg-[#131a2a] cursor-pointer select-none" data-group="${escapeHtml(ruta)}">
    <td class="px-3 py-2"><input type="checkbox" data-group-sel="${escapeHtml(ruta)}" ${allSel ? "checked" : ""} class="accent-blue-500" title="Seleccionar toda la ruta"></td>
    <td colspan="7" class="px-3 py-2 text-sm font-semibold text-slate-200" title="${escapeHtml(ruta)}">
      <span class="inline-block w-4 text-slate-500">${collapsed ? "▸" : "▾"}</span>
      ${escapeHtml(ruta)}
      <span class="ml-2 text-xs font-normal text-slate-500">${n} sesiones · ${usd(cost)} · ${num(ev)} eventos · ${fmtMb(mb)}</span>
    </td>
  </tr>` + (collapsed ? "" : items.map((s) => rowHtml(s, rows.indexOf(s))).join(""));
}

function renderSessions() {
  const th = document.querySelector("#th-admin");
  const tb = document.querySelector("#tb-admin");
  const q = (document.querySelector("#adminSearch")?.value || "").toLowerCase();
  const visible = q
    ? A.sessions.filter((s) => s.title.toLowerCase().includes(q) || s.model.toLowerCase().includes(q) || s.project.toLowerCase().includes(q))
    : A.sessions;
  const rows = [...visible].sort((a, b) => {
    const k = A.sort.key;
    let v = (a[k] ?? "") < (b[k] ?? "") ? -1 : (a[k] ?? "") > (b[k] ?? "") ? 1 : 0;
    return A.sort.desc ? -v : v;
  });
  const allChecked = visible.length > 0 && A.selected.size === visible.length;
  th.innerHTML = `<th class="px-3 py-2"><input type="checkbox" id="adminSelAll" ${allChecked ? "checked" : ""} class="accent-blue-500"></th>` +
    ACOLS.slice(1).map((c) =>
      `<th data-key="${c.key}" class="px-3 py-2 text-xs uppercase tracking-wide text-slate-400 cursor-pointer select-none ${c.right ? "text-right" : "text-left"}">${c.label}</th>`
    ).join("");
  th.querySelectorAll("th[data-key]").forEach((h) =>
    h.addEventListener("click", () => {
      const k = h.dataset.key;
      if (A.sort.key === k) A.sort.desc = !A.sort.desc;
      else { A.sort.key = k; A.sort.desc = k === "events_mb"; }
      renderSessions();
    }));
  const selAll = th.querySelector("#adminSelAll");
  selAll?.addEventListener("change", () => {
    A.selected = selAll.checked ? new Set(rows.map((s) => s.id)) : new Set();
    A.anchor = null;
    renderSessions();
  });
  if (A.groupByProject) {
    const key = (s) => s.directory || s.project || "(sin ruta)";
    const map = new Map();
    for (const s of rows) {
      const k = key(s);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s);
    }
    const groups = [...map.entries()]
      .map(([k, items]) => [k, items.sort((a, b) => b.updated - a.updated)])
      .sort((a, b) => b[1][0].updated - a[1][0].updated);
    tb.innerHTML = groups.map(([p, items]) => groupRowHtml(p, items, rows)).join("");
    tb.querySelectorAll("tr.group-row").forEach((tr) => {
      tr.addEventListener("click", (e) => {
        if (e.target.matches('input[type="checkbox"]')) return;
        const p = tr.dataset.group;
        if (A.collapsed.has(p)) A.collapsed.delete(p);
        else A.collapsed.add(p);
        renderSessions();
      });
    });
    tb.querySelectorAll("input[data-group-sel]").forEach((cb) =>
      cb.addEventListener("change", () => {
        const ids = rows.filter((s) => key(s) === cb.dataset.groupSel).map((s) => s.id);
        if (cb.checked) ids.forEach((id) => A.selected.add(id));
        else ids.forEach((id) => A.selected.delete(id));
        renderSessions();
        renderSummary();
      }));
  } else {
    tb.innerHTML = rows.map(rowHtml).join("");
  }
  tb.querySelectorAll("tr[data-idx]").forEach((tr) => {
    tr.addEventListener("click", (e) => {
      if (e.target.matches('input[type="checkbox"]')) return;
      const i = Number(tr.dataset.idx);
      if (e.shiftKey && A.anchor != null) {
        const [a, b] = [Math.min(A.anchor, i), Math.max(A.anchor, i)];
        A.selected = new Set(rows.slice(a, b + 1).map((s) => s.id));
      } else if (e.ctrlKey || e.metaKey) {
        const id = rows[i].id;
        if (A.selected.has(id)) A.selected.delete(id);
        else A.selected.add(id);
        A.anchor = i;
      } else {
        A.selected = new Set([rows[i].id]);
        A.anchor = i;
      }
      renderSessions();
      renderSummary();
    });
    tr.addEventListener("dblclick", () => {
      actDetail(rows[Number(tr.dataset.idx)].id);
    });
  });
  tb.querySelectorAll("input[data-sid]").forEach((cb) =>
    cb.addEventListener("change", () => {
      const tr = cb.closest("tr");
      const i = tr ? Number(tr.dataset.idx) : null;
      if (cb.checked) A.selected.add(cb.dataset.sid);
      else A.selected.delete(cb.dataset.sid);
      if (i != null) A.anchor = i;
      renderSessions();
      renderSummary();
    }));
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- dialog ---------- */

function openDialog(html) {
  const d = document.querySelector("#adminDialog");
  d.innerHTML = html;
  d.showModal();
  return d;
}

function closeDialog() {
  document.querySelector("#adminDialog").close();
}

function forceHtml() {
  return `<label class="flex items-center gap-2 text-xs text-amber-300">
    <input type="checkbox" id="dlgForce" class="accent-amber-500"> Forzar (opencode está corriendo)
  </label>`;
}

/* ---------- acciones ---------- */

async function actDelete() {
  const ids = selectedIds();
  if (!ids.length) return openDialog(`<p class="text-sm text-slate-300">Seleccioná al menos una sesión.</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`);
  let prev = null, blocked = false;
  try {
    prev = await api("/api/admin", { action: "delete", ids, dry_run: true });
  } catch (e) {
    if (!e.blocked) return openDialog(`<p class="text-sm text-red-300">${escapeHtml(e.message)}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`);
    blocked = true;
  }
  const rows = (prev?.rows ?? []).map((r) =>
    `<tr class="border-t border-slate-800/60"><td class="px-3 py-1 text-sm text-slate-300">${r.session.slice(0, 12)}…</td>
     <td class="px-3 py-1 text-sm text-right">${r.messages}</td><td class="px-3 py-1 text-sm text-right">${r.parts}</td>
     <td class="px-3 py-1 text-sm text-right">${r.events}</td><td class="px-3 py-1 text-sm text-right text-amber-300">${fmtMb(r.events_mb)}</td></tr>`).join("");
  const d = openDialog(`<h3 class="text-base font-semibold text-red-400 mb-2">Eliminar ${ids.length} sesión(es)</h3>
    ${blocked
      ? `<p class="text-xs text-amber-300 mb-2">⚠ opencode está corriendo: borrar mientras corre puede dejar la base inconsistente (opencode la sobrescribe al cerrar). Marcá «Forzar» para continuar bajo tu responsabilidad. Backup automático previo en backups/.</p>`
      : `<p class="text-xs text-slate-400 mb-2">Borrado definitivo: mensajes, parts y log de eventos. Backup automático previo en backups/.</p>`}
    ${prev?.total_events_mb != null ? `<div class="text-xs text-slate-400 mb-2">Total a liberar: <b class="text-amber-300">${fmtMb(prev.total_events_mb)}</b></div>` : ""}
    ${rows ? `<table class="w-full text-xs"><thead><tr class="text-slate-400"><th class="text-left px-1">Sesión</th><th class="text-right px-1">Msg</th><th class="text-right px-1">Parts</th><th class="text-right px-1">Events</th><th class="text-right px-1">MB</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
    <label class="flex items-center gap-2 mt-3 text-xs text-red-300"><input type="checkbox" id="dlgConfirm" class="accent-red-500"> Entiendo que es irreversible</label>
    ${blocked ? forceHtml() : ""}
    <div class="mt-4 flex gap-2 justify-end">
      <button onclick="closeDialog()" class="text-sm bg-slate-700 rounded px-3 py-1.5">Cancelar</button>
      <button id="dlgGo" disabled class="text-sm bg-red-700 rounded px-3 py-1.5 opacity-50">Eliminar</button>
    </div>`);
  const confirm = d.querySelector("#dlgConfirm");
  const go = d.querySelector("#dlgGo");
  confirm.addEventListener("change", () => { go.disabled = !confirm.checked; go.classList.toggle("opacity-50", !confirm.checked); });
  go.addEventListener("click", async () => {
    go.disabled = true; go.textContent = "Eliminando...";
    showOverlay("Eliminando sesiones...");
    try {
      const r = await api("/api/admin", { action: "delete", ids, force: !!d.querySelector("#dlgForce")?.checked });
      hideOverlay();
      d.innerHTML = `<p class="text-sm text-emerald-300">Eliminadas ${r.deleted} sesión(es). Backup: ${r.backup}</p>
        <button onclick="closeDialog();loadSessions()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Listo</button>`;
    } catch (e) {
      hideOverlay();
      d.innerHTML = `<p class="text-sm text-red-300">${escapeHtml(e.message)}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`;
    }
  });
}

async function actMove() {
  const ids = selectedIds();
  if (!ids.length) return openDialog(`<p class="text-sm text-slate-300">Seleccioná al menos una sesión.</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`);
  const projects = (A.status?.projects ?? []).map((p) => `<option value="${escapeHtml(p.worktree)}">${escapeHtml(p.name || p.worktree)}</option>`).join("");
  const d = openDialog(`<h3 class="text-base font-semibold text-blue-400 mb-2">Mover ${ids.length} sesión(es) de ruta</h3>
    <p class="text-xs text-slate-400 mb-3">Cambia proyecto + ruta y parchea los eventos para que el cambio persista al reabrir la sesión.</p>
    <label class="block text-xs text-slate-400 mb-1">Ruta destino (absoluta)</label>
    <input id="dlgDir" list="dlgProjects" class="w-full bg-[#0b0e14] border border-slate-700 rounded px-2 py-1.5 text-sm mb-2" placeholder="G:\\Proyectos\\otro-proyecto">
    <datalist id="dlgProjects">${projects}</datalist>
    <div id="dlgMovePreview" class="text-xs text-slate-400"></div>
    ${A.status?.opencode_running ? forceHtml() : ""}
    <div class="mt-4 flex gap-2 justify-end">
      <button onclick="closeDialog()" class="text-sm bg-slate-700 rounded px-3 py-1.5">Cancelar</button>
      <button id="dlgGo" class="text-sm bg-blue-600 rounded px-3 py-1.5">Mover</button>
    </div>`);
  const dir = d.querySelector("#dlgDir");
  dir.addEventListener("input", async () => {
    if (!dir.value.trim()) return d.querySelector("#dlgMovePreview").textContent = "";
    try {
      const r = await api("/api/admin", { action: "move", ids, directory: dir.value.trim(), dry_run: true });
      d.querySelector("#dlgMovePreview").textContent = `Proyecto destino: ${r.project_id} (se crea si no existe)`;
    } catch (e) {
      d.querySelector("#dlgMovePreview").textContent = e.message;
    }
  });
  d.querySelector("#dlgGo").addEventListener("click", async () => {
    if (!dir.value.trim()) return;
    const go = d.querySelector("#dlgGo"); go.disabled = true; go.textContent = "Moviendo...";
    try {
      const r = await api("/api/admin", { action: "move", ids, directory: dir.value.trim(), force: !!d.querySelector("#dlgForce")?.checked });
      d.innerHTML = `<p class="text-sm text-emerald-300">Movidas ${r.moved} sesión(es) → ${r.target}</p>
        <button onclick="closeDialog();loadSessions()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Listo</button>`;
    } catch (e) {
      d.innerHTML = `<p class="text-sm text-red-300">${e.message}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`;
    }
  });
}

async function actRename() {
  const ids = selectedIds();
  if (ids.length !== 1) return openDialog(`<p class="text-sm text-slate-300">Seleccioná exactamente una sesión.</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`);
  const s = A.sessions.find((x) => x.id === ids[0]);
  const d = openDialog(`<h3 class="text-base font-semibold mb-2">Renombrar sesión</h3>
    <p class="text-xs text-amber-300 mb-2">⚠ opencode puede sobrescribir el título la próxima vez que actualice esta sesión.</p>
    <input id="dlgTitle" class="w-full bg-[#0b0e14] border border-slate-700 rounded px-2 py-1.5 text-sm mb-2" value="${escapeHtml(s.title.replace(/^\(sin título\)$/, ""))}">
    <div class="flex gap-2 justify-end">
      <button onclick="closeDialog()" class="text-sm bg-slate-700 rounded px-3 py-1.5">Cancelar</button>
      <button id="dlgGo" class="text-sm bg-blue-600 rounded px-3 py-1.5">Guardar</button>
    </div>`);
  d.querySelector("#dlgGo").addEventListener("click", async () => {
    const title = d.querySelector("#dlgTitle").value.trim();
    if (!title) return;
    const go = d.querySelector("#dlgGo"); go.disabled = true;
    try {
      const r = await api("/api/admin", { action: "rename", id: ids[0], title });
      d.innerHTML = `<p class="text-sm text-emerald-300">Renombrada: «${r.title}»</p>
        <button onclick="closeDialog();loadSessions()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Listo</button>`;
    } catch (e) {
      d.innerHTML = `<p class="text-sm text-red-300">${e.message}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`;
    }
  });
}

async function actArchive() {
  const ids = selectedIds();
  if (!ids.length) return openDialog(`<p class="text-sm text-slate-300">Seleccioná al menos una sesión.</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`);
  const allArchived = A.sessions.filter((s) => ids.includes(s.id)).every((s) => s.archived);
  const label = allArchived ? "Desarchivar" : "Archivar";
  const d = openDialog(`<h3 class="text-base font-semibold mb-2">${label} ${ids.length} sesión(es)</h3>
    <p class="text-xs text-slate-400 mb-2">Reversible. Las sesiones archivadas quedan marcadas (📦).</p>
    ${A.status?.opencode_running ? forceHtml() : ""}
    <div class="flex gap-2 justify-end">
      <button onclick="closeDialog()" class="text-sm bg-slate-700 rounded px-3 py-1.5">Cancelar</button>
      <button id="dlgGo" class="text-sm bg-blue-600 rounded px-3 py-1.5">${label}</button>
    </div>`);
  d.querySelector("#dlgGo").addEventListener("click", async () => {
    const go = d.querySelector("#dlgGo"); go.disabled = true;
    try {
      const r = await api("/api/admin", { action: "archive", ids, archived: !allArchived, force: !!d.querySelector("#dlgForce")?.checked });
      d.innerHTML = `<p class="text-sm text-emerald-300">${r.affected} sesión(es) ${allArchived ? "desarchivadas" : "archivadas"}.</p>
        <button onclick="closeDialog();loadSessions()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Listo</button>`;
    } catch (e) {
      d.innerHTML = `<p class="text-sm text-red-300">${e.message}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`;
    }
  });
}

async function actExport() {
  const ids = selectedIds();
  if (!ids.length) return openDialog(`<p class="text-sm text-slate-300">Seleccioná al menos una sesión.</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`);
  try {
    const r = await api("/api/admin", { action: "export", ids });
    const blob = new Blob([JSON.stringify(r.sessions, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "opencode_sessions_" + Date.now() + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    openDialog(`<p class="text-sm text-red-300">${e.message}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`);
  }
}

async function actDetail(sid) {
  try {
    const d = await fetch(`/api/admin/session/${encodeURIComponent(sid)}`).then((r) => r.json());
    if (d.error) throw new Error(d.error);
    const tok = d.tokens || {};
    const parts = (d.parts_by_type || []).map((p) => `${escapeHtml(p.typ || "?")}: ${num(p.n)} (${fmtMb((p.b || 0) / 1e6)})`).join(" · ");
    const samples = (d.message_samples || []).slice(-6).map((m) =>
      `<div class="text-xs text-slate-500 truncate">${fmtDate(m.time_created)} · ${num(m.bytes)} B</div>`).join("");
    openDialog(`<h3 class="text-base font-semibold text-blue-400 mb-2">${escapeHtml(d.title)}</h3>
      <div class="text-xs text-slate-400 space-y-1 mb-3">
        <div><b class="text-slate-200">Modelo:</b> ${escapeHtml(d.model || "—")} · <b class="text-slate-200">Proyecto:</b> ${escapeHtml(d.project?.name || d.project?.worktree || "—")}</div>
        <div><b class="text-slate-200">Ruta:</b> ${escapeHtml(d.directory || "—")}</div>
        <div><b class="text-slate-200">Inicio:</b> ${fmtDate(d.created)} · <b class="text-slate-200">Última:</b> ${fmtDate(d.updated)} ${d.archived ? "· 📦 archivada" : ""}</div>
        <div><b class="text-slate-200">Costo:</b> ${usd(d.cost)} · <b class="text-slate-200">Tokens:</b> in ${num(tok.tokens_input || 0)} / out ${num(tok.tokens_output || 0)} / cache ${num(tok.tokens_cache_read || 0)}</div>
        <div><b class="text-slate-200">Events:</b> ${num(d.events)} (${fmtMb(d.events_mb)}) · <b class="text-slate-200">Parts por tipo:</b> ${parts || "—"}</div>
        ${d.share_url ? `<div><b class="text-slate-200">Share:</b> ${escapeHtml(d.share_url)}</div>` : ""}
      </div>
      <div class="text-[11px] text-slate-500 border-t border-slate-800 pt-2 mb-2">${num(d.messages)} mensajes — últimos:</div>
      ${samples}
      <div class="mt-4 flex gap-2 justify-end">
        <button onclick="closeDialog()" class="text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>
      </div>`);
  } catch (e) {
    openDialog(`<p class="text-sm text-red-300">${e.message}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`);
  }
}

async function actUndo() {
  try {
    const b = await api("/api/admin/backups");
    const last = b.last;
    const list = (b.backups || []).slice(0, 8).map((f) =>
      `<tr class="border-t border-slate-800/60"><td class="px-2 py-1 text-xs text-slate-400">${fmtDate(f.mtime)}</td>
       <td class="px-2 py-1 text-xs text-slate-300">${escapeHtml(f.name)}</td>
       <td class="px-2 py-1 text-xs text-slate-400">${fmtMb(f.size_mb)}</td>
       <td class="px-2 py-1 text-right"><button data-restore="${escapeHtml(f.path)}" class="text-xs bg-emerald-700 rounded px-2 py-0.5">Restaurar</button></td></tr>`).join("");
    const d = openDialog(`<h3 class="text-base font-semibold text-emerald-400 mb-2">Deshacer / Restaurar</h3>
      ${last ? `<p class="text-xs text-slate-400 mb-2">Última operación: <b>${escapeHtml(last.action)}</b> — <span class="text-slate-300">${escapeHtml(last.path.split(/[\\\\/]/).pop())}</span></p>
        <button id="dlgUndoLast" class="mb-3 text-sm bg-emerald-700 rounded px-3 py-1.5">Deshacer última operación</button>` : '<p class="text-xs text-slate-500 mb-2">Sin backups todavía.</p>'}
      <table class="w-full text-xs">${list}</table>
      ${A.status?.opencode_running ? forceHtml() : ""}
      <div class="mt-3 flex gap-2 justify-end"><button onclick="closeDialog()" class="text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button></div>`);
    d.querySelectorAll("[data-restore]").forEach((btn) =>
      btn.addEventListener("click", () => doRestore(btn.dataset.restore, d)));
    d.querySelector("#dlgUndoLast")?.addEventListener("click", () => {
      if (last) doRestore(last.path, d);
    });
  } catch (e) {
    openDialog(`<p class="text-sm text-red-300">${e.message}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`);
  }
}

async function doRestore(backupPath, d) {
  showOverlay("Restaurando sesión(es) desde backup...");
  try {
    const r = await api("/api/admin", { action: "restore", backup_path: backupPath, force: !!d?.querySelector("#dlgForce")?.checked });
    hideOverlay();
    d.innerHTML = `<p class="text-sm text-emerald-300">Restauradas ${r.restored} sesión(es). Nota: sin log de eventos (resume/revert/share de esa sesión no funcionan).</p>
      <button onclick="closeDialog();loadSessions()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Listo</button>`;
  } catch (e) {
    hideOverlay();
    d.innerHTML = `<p class="text-sm text-red-300">${e.message}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`;
  }
}

async function actPricing() {
  try {
    const p = await api("/api/admin/pricing");
    const rows = Object.keys(p.prices).map((mid) => {
      const pr = p.prices[mid];
      const lim = p.limits[mid] || [];
      const name = p.names[mid] || mid;
      const inp = (id, val, step) => `<input data-field="${id}" type="number" step="${step}" value="${val}" class="w-20 bg-[#0b0e14] border border-slate-700 rounded px-1.5 py-0.5 text-xs tabular-nums">`;
      return `<tr class="border-t border-slate-800/60">
        <td class="px-2 py-1 text-xs text-slate-300 font-medium">${escapeHtml(name)}</td>
        <td class="px-2 py-1 text-xs text-slate-500">${escapeHtml(mid)}</td>
        <td class="px-1 py-1">${inp(`in-${mid}`, pr.in, "0.001")}</td>
        <td class="px-1 py-1">${inp(`out-${mid}`, pr.out, "0.001")}</td>
        <td class="px-1 py-1">${inp(`cr-${mid}`, pr.cr, "0.0001")}</td>
        <td class="px-1 py-1">${inp(`cw-${mid}`, pr.cw, "0.0001")}</td>
        <td class="px-1 py-1">${inp(`l5-${mid}`, lim[0] ?? "", "1")}</td>
        <td class="px-1 py-1">${inp(`l7-${mid}`, lim[1] ?? "", "1")}</td>
        <td class="px-1 py-1">${inp(`l30-${mid}`, lim[2] ?? "", "1")}</td>
      </tr>`;
    }).join("");
    const d = openDialog(`<h3 class="text-base font-semibold mb-2">Precios y límites (OpenCode Go)</h3>
      <p class="text-xs text-slate-400 mb-2">Precios por 1M tokens (USD). Se guardan en overrides (persistente).</p>
      <div class="max-h-96 overflow-auto">
      <table class="w-full text-xs">
        <thead><tr class="text-slate-400 text-left"><th class="px-2 py-1">Nombre</th><th class="px-2 py-1">ID</th>
        <th class="px-1 py-1">In</th><th class="px-1 py-1">Out</th><th class="px-1 py-1">CR</th><th class="px-1 py-1">CW</th>
        <th class="px-1 py-1">L 5h</th><th class="px-1 py-1">L 7d</th><th class="px-1 py-1">L 30d</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      <div class="mt-4 flex gap-2 justify-end">
        <button onclick="closeDialog()" class="text-sm bg-slate-700 rounded px-3 py-1.5">Cancelar</button>
        <button id="dlgGo" class="text-sm bg-blue-600 rounded px-3 py-1.5">Guardar</button>
      </div>`);
    d.querySelector("#dlgGo").addEventListener("click", async () => {
      const prices = {}, limits = {}, names = {};
      for (const mid of Object.keys(p.prices)) {
        const g = (id) => Number(d.querySelector(`[data-field="${id}"]`).value);
        prices[mid] = { in: g(`in-${mid}`), out: g(`out-${mid}`), cr: g(`cr-${mid}`), cw: g(`cw-${mid}`) };
        const l5 = g(`l5-${mid}`), l7 = g(`l7-${mid}`), l30 = g(`l30-${mid}`);
        if (l5 || l7 || l30) limits[mid] = [l5, l7, l30];
        names[mid] = p.names[mid] || mid;
      }
      const go = d.querySelector("#dlgGo"); go.disabled = true;
      try {
        const r = await api("/api/admin", { action: "pricing_save", prices, limits, names });
        d.innerHTML = `<p class="text-sm text-emerald-300">Guardados ${r.models} modelos → ${r.path}</p>
          <button onclick="closeDialog();loadStatus();loadSessions()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Listo</button>`;
      } catch (e) {
        d.innerHTML = `<p class="text-sm text-red-300">${e.message}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`;
      }
    });
  } catch (e) {
    openDialog(`<p class="text-sm text-red-300">${e.message}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`);
  }
}

async function actPrune() {
  const def = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const d = openDialog(`<h3 class="text-base font-semibold text-amber-400 mb-2">Prune: borrar sesiones anteriores a una fecha</h3>
    <p class="text-xs text-slate-400 mb-3">Borra sesiones completas (mensajes + log de eventos) sin actividad desde la fecha. Solo sesiones 100% cerradas.</p>
    <label class="block text-xs text-slate-400 mb-1">Corte (YYYY-MM-DD)</label>
    <input id="dlgCutoff" type="date" value="${def}" class="bg-[#0b0e14] border border-slate-700 rounded px-2 py-1.5 text-sm mb-2">
    <div id="dlgPrunePrev" class="text-xs text-slate-400"></div>
    ${A.status?.opencode_running ? forceHtml() : ""}
    <div class="mt-2">
      <label class="block text-xs text-slate-400 mb-1">Escribí <b class="text-amber-300">BORRAR</b> para habilitar la ejecución</label>
      <input id="dlgTyped" class="w-full bg-[#0b0e14] border border-slate-700 rounded px-2 py-1.5 text-sm mb-2" autocomplete="off">
    </div>
    <div class="mt-2 flex gap-2 justify-end">
      <button onclick="closeDialog()" class="text-sm bg-slate-700 rounded px-3 py-1.5">Cancelar</button>
      <button id="dlgEst" class="text-sm bg-slate-700 rounded px-3 py-1.5">Estimar</button>
      <button id="dlgGo" disabled class="text-sm bg-amber-700 rounded px-3 py-1.5 opacity-50">Ejecutar prune</button>
    </div>`);
  const prev = d.querySelector("#dlgPrunePrev");
  const go = d.querySelector("#dlgGo");
  const typed = d.querySelector("#dlgTyped");
  typed.addEventListener("input", () => {
    const ok = typed.value.trim() === "BORRAR";
    go.disabled = !ok;
    go.classList.toggle("opacity-50", !ok);
  });
  const est = async () => {
    if (!d.querySelector("#dlgCutoff").value) return;
    prev.textContent = "Estimando...";
    try {
      const r = await api("/api/admin", { action: "prune", cutoff: d.querySelector("#dlgCutoff").value, dry_run: true });
      prev.textContent = `${r.rows.length} sesiones · ${fmtMb(r.total_events_mb)} en eventos.`;
      go.disabled = false; go.classList.remove("opacity-50");
    } catch (e) {
      prev.textContent = e.message;
    }
  };
  d.querySelector("#dlgEst").addEventListener("click", est);
  go.addEventListener("click", async () => {
    go.disabled = true; go.textContent = "Pruneando...";
    showOverlay("Borrando sesiones anteriores a la fecha...");
    try {
      const r = await api("/api/admin", { action: "prune", cutoff: d.querySelector("#dlgCutoff").value, force: !!d.querySelector("#dlgForce")?.checked });
      hideOverlay();
      d.innerHTML = `<p class="text-sm text-emerald-300">Eliminadas ${r.deleted} sesión(es). Backup: ${r.backup}</p>
        <button onclick="closeDialog();loadSessions()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Listo</button>`;
    } catch (e) {
      hideOverlay();
      d.innerHTML = `<p class="text-sm text-red-300">${e.message}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`;
    }
  });
}

async function actBackup() {
  const d = openDialog(`<h3 class="text-base font-semibold text-emerald-400 mb-2">Backup completo</h3>
    <p class="text-xs text-slate-400 mb-2">Snapshot consistente (API de backup de SQLite) — se puede usar mientras opencode corre. Default: D:\\opencode-backup\\opencode.db</p>
    <input id="dlgDest" class="w-full bg-[#0b0e14] border border-slate-700 rounded px-2 py-1.5 text-sm mb-2" placeholder="(vacío = default)">
    <div class="flex gap-2 justify-end">
      <button onclick="closeDialog()" class="text-sm bg-slate-700 rounded px-3 py-1.5">Cancelar</button>
      <button id="dlgGo" class="text-sm bg-emerald-700 rounded px-3 py-1.5">Ejecutar</button>
    </div>`);
  d.querySelector("#dlgGo").addEventListener("click", async () => {
    const go = d.querySelector("#dlgGo"); go.disabled = true; go.textContent = "Ejecutando (puede tardar)...";
    showOverlay("Generando backup completo de la base de datos...");
    try {
      const r = await api("/api/admin", { action: "backup", dest: d.querySelector("#dlgDest").value.trim() || null });
      hideOverlay();
      d.innerHTML = `<p class="text-sm text-emerald-300">Backup OK: ${r.path} (${r.size_mb.toLocaleString("en-US")} MB)</p>
        <button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Listo</button>`;
    } catch (e) {
      hideOverlay();
      d.innerHTML = `<p class="text-sm text-red-300">${e.message}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`;
    }
  });
}

async function actVacuum() {
  const free = A.status?.free_gb ?? 0;
  const d = openDialog(`<h3 class="text-base font-semibold mb-2">VACUUM (compactar DB)</h3>
    <p class="text-xs text-slate-400 mb-2">Compacta la DB y libera espacio de los borrados. Requiere ~el tamaño final de la DB como espacio libre (ahora: ${free} GB). No bloquea lecturas, pero tarda.</p>
    <div class="flex gap-2 justify-end">
      <button onclick="closeDialog()" class="text-sm bg-slate-700 rounded px-3 py-1.5">Cancelar</button>
      <button id="dlgGo" class="text-sm bg-slate-700 rounded px-3 py-1.5">Ejecutar VACUUM</button>
    </div>`);
  d.querySelector("#dlgGo").addEventListener("click", async () => {
    const go = d.querySelector("#dlgGo"); go.disabled = true; go.textContent = "Compactando...";
    showOverlay("Compactando la base de datos (VACUUM)...");
    try {
      const r = await api("/api/admin", { action: "vacuum" });
      hideOverlay();
      d.innerHTML = `<p class="text-sm text-emerald-300">DB: ${r.before_mb.toLocaleString("en-US")} MB → ${r.after_mb.toLocaleString("en-US")} MB</p>
        <button onclick="closeDialog();loadStatus();loadSessions()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Listo</button>`;
    } catch (e) {
      hideOverlay();
      d.innerHTML = `<p class="text-sm text-red-300">${e.message}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`;
    }
  });
}

async function actDb() {
  const actual = A.status?.db_path || "";
  const config = A.status?.db_config_path || "";
  const d = openDialog(`<h3 class="text-base font-semibold mb-2">Base de datos de opencode</h3>
    <p class="text-xs text-slate-400 mb-2">Indicá la ruta del archivo <b class="text-slate-300">opencode.db</b>. Se guarda en config.json y se usa al reiniciar la app.</p>
    <label class="block text-xs text-slate-400 mb-1">Ruta actual</label>
    <input id="dlgDbPath" type="text" value="${escapeHtml(actual)}" spellcheck="false"
      class="w-full bg-[#0b0e14] border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 font-mono mb-1">
    <p class="text-xs text-slate-500 mb-3">Config: ${escapeHtml(config)}</p>
    <div class="flex gap-2 justify-end">
      <button onclick="closeDialog()" class="text-sm bg-slate-700 rounded px-3 py-1.5">Cancelar</button>
      <button id="dlgGo" class="text-sm bg-slate-700 rounded px-3 py-1.5">Guardar y reiniciar</button>
    </div>`);
  const inp = d.querySelector("#dlgDbPath");
  const go = d.querySelector("#dlgGo");
  go.addEventListener("click", async () => {
    const path = inp.value.trim();
    if (!path) return;
    go.disabled = true;
    go.textContent = "Guardando...";
    try {
      const r = await api("/api/admin", { action: "set_db", path });
      d.innerHTML = `<p class="text-sm text-emerald-300">Ruta guardada: <b class="font-mono">${escapeHtml(r.path)}</b></p>
        <p class="text-xs text-slate-400 mt-1">Reiniciá la app para que use la nueva base de datos.</p>
        <button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`;
    } catch (e) {
      d.innerHTML = `<p class="text-sm text-red-300">${escapeHtml(e.message)}</p><button onclick="closeDialog()" class="mt-3 text-sm bg-slate-700 rounded px-3 py-1.5">Cerrar</button>`;
    }
  });
}

/* ---------- init ---------- */

function initAdmin() {
  ensureTab();
  loadStatus();
  loadSessions();
  document.querySelector("#btnAdminRefresh").addEventListener("click", () => { loadStatus(); loadSessions(); });
  document.querySelector("#btnAdminDelete").addEventListener("click", actDelete);
  document.querySelector("#btnAdminMove").addEventListener("click", actMove);
  document.querySelector("#btnAdminRename").addEventListener("click", actRename);
  document.querySelector("#btnAdminArchive").addEventListener("click", actArchive);
  document.querySelector("#btnAdminExport").addEventListener("click", actExport);
  document.querySelector("#btnAdminUndo").addEventListener("click", actUndo);
  document.querySelector("#btnAdminPricing").addEventListener("click", actPricing);
  document.querySelector("#btnAdminPrune").addEventListener("click", actPrune);
  document.querySelector("#btnAdminBackup").addEventListener("click", actBackup);
  document.querySelector("#btnAdminVacuum").addEventListener("click", actVacuum);
  document.querySelector("#btnAdminDb").addEventListener("click", actDb);
  document.querySelector("#adminSearch").addEventListener("input", () => { renderSessions(); renderSummary(); });
  const chkGroup = document.querySelector("#chkGroup");
  chkGroup.checked = A.groupByProject;
  chkGroup.addEventListener("change", () => {
    A.groupByProject = chkGroup.checked;
    localStorage.setItem("oc_admin_group", chkGroup.checked ? "1" : "0");
    renderSessions();
    renderSummary();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdmin);
} else {
  initAdmin();
}
