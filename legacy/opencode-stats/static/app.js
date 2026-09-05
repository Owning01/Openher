"use strict";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = { data: null, charts: {}, activeTab: "resumen", scopes: {}, searchSes: "", prefs: null };

/* ---------- preferencias de visualización (persistidas en localStorage) ---------- */
const PREF_DEFAULTS = {
  cards: { input: true, output: true, reasoning: true, cache_read: true, cache_write: true, cost: true },
  charts: { days: true, requests: true, tokens: true, models: true },
  tabs: { resumen: true, modelo: true, proyecto: true, dia: true, mes: true, herramientas: true, sesiones: true, limites: true, gestion: true },
  ui: { filters: true },
};

function loadPrefs() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("oc_prefs") || "{}"); } catch { saved = {}; }
  state.prefs = {
    cards: Object.assign({}, PREF_DEFAULTS.cards, saved.cards),
    charts: Object.assign({}, PREF_DEFAULTS.charts, saved.charts),
    tabs: Object.assign({}, PREF_DEFAULTS.tabs, saved.tabs),
    ui: Object.assign({}, PREF_DEFAULTS.ui, saved.ui),
  };
}

function savePrefs() {
  localStorage.setItem("oc_prefs", JSON.stringify(state.prefs));
}

function applyTabPrefs() {
  $$(".sidebar-tab").forEach((b) => {
    const id = b.dataset.tab;
    const vis = state.prefs.tabs[id] !== false;
    b.style.display = vis ? "" : "none";
    if (!vis && state.activeTab === id) switchTab("resumen");
  });
}

const FILTERS_BTN_ON = "text-sm leading-none bg-blue-600 hover:bg-blue-500 rounded px-2.5 py-1.5 font-medium text-white";
const FILTERS_BTN_OFF = "text-sm leading-none bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200";

function syncFiltersBtn() {
  const b = $("#btnFilters");
  if (!b) return;
  const on = state.prefs.ui.filters;
  b.className = on ? FILTERS_BTN_ON : FILTERS_BTN_OFF;
  b.textContent = on ? "▾" : "▴";
  b.title = on ? "Ocultar filtros de fechas" : "Mostrar filtros de fechas";
}

function applyPrefs() {
  applyTabPrefs();
  const fb = $("#filtersBar");
  if (fb) fb.style.display = state.prefs.ui.filters ? "" : "none";
  syncFiltersBtn();
  if (state.data) renderAll(state.data);
}

/* ---------- diálogo de configuración ---------- */
function buildPrefsDialog() {
  const d = $("#prefsDialog");
  const chk = (group, key, label) =>
    `<label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
      <input type="checkbox" data-group="${group}" data-key="${key}" ${state.prefs[group][key] ? "checked" : ""} class="accent-blue-500"> ${label}
    </label>`;
  const group = (title, items) => `
    <div class="mb-3">
      <div class="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">${title}</div>
      <div class="grid grid-cols-2 gap-1.5">${items.join("")}</div>
    </div>`;
  d.innerHTML = `
    <h3 class="text-base font-semibold mb-3">Configuración</h3>
    <div class="mb-3">
      <div class="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">Acciones</div>
      <div class="flex gap-1.5">
        <button id="btnRefresh" class="text-sm bg-blue-600 hover:bg-blue-500 rounded px-3 py-1.5 font-medium">Actualizar</button>
        <button id="btnExport" class="text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-3 py-1.5">Exportar CSV</button>
      </div>
    </div>
    ${group("Tarjetas", [
      chk("cards", "input", "Entrada (input)"), chk("cards", "output", "Salida (output)"),
      chk("cards", "reasoning", "Razonamiento"), chk("cards", "cache_read", "Cache leída"),
      chk("cards", "cache_write", "Cache escrita"), chk("cards", "cost", "Costo total"),
    ])}
    ${group("Gráficos (Resumen)", [
      chk("charts", "days", "Costo por día"), chk("charts", "requests", "Peticiones por día"),
      chk("charts", "tokens", "Tokens por día"), chk("charts", "models", "Costo por modelo"),
    ])}
    ${group("Pestañas", [
      chk("tabs", "modelo", "Por modelo"), chk("tabs", "proyecto", "Por proyecto"),
      chk("tabs", "dia", "Por día"), chk("tabs", "mes", "Por mes"),
      chk("tabs", "herramientas", "Herramientas"), chk("tabs", "sesiones", "Sesiones"),
      chk("tabs", "limites", "Límites y precios"), chk("tabs", "gestion", "Gestión"),
    ])}
    ${group("Interfaz", [
      chk("ui", "filters", "Mostrar filtros de fechas"),
    ])}
    <div class="mb-3">
      <div class="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">OpenCode Go</div>
      <div id="goAccountsList" class="mb-1.5"></div>
      <div class="flex gap-1.5">
        <input id="goAccName" type="text" placeholder="Alias (p. ej. Personal)" class="w-32 bg-[#0b0e14] border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200">
        <input id="goApiKey" type="password" placeholder="opencode-go-..." class="flex-1 bg-[#0b0e14] border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200">
        <button id="btnGoAdd" class="text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-3 py-1.5">Agregar</button>
      </div>
      <p class="text-xs text-slate-500 mt-1">Se guardan solo en este navegador (localStorage) y se envían al server local para consultar el uso real de cada cuenta.</p>
    </div>
    <div class="mt-4 flex gap-2 justify-end">
      <button id="dlgReset" class="text-sm bg-slate-700 rounded px-3 py-1.5">Restablecer</button>
      <button onclick="document.querySelector('#prefsDialog').close()" class="text-sm bg-blue-600 rounded px-3 py-1.5">Listo</button>
    </div>`;
  d.querySelectorAll("input[data-group]").forEach((cb) =>
    cb.addEventListener("change", () => {
      state.prefs[cb.dataset.group][cb.dataset.key] = cb.checked;
      savePrefs();
      applyPrefs();
    }));
  d.querySelector("#dlgReset").addEventListener("click", () => {
    state.prefs = JSON.parse(JSON.stringify(PREF_DEFAULTS));
    savePrefs();
    applyPrefs();
    syncPrefsDialog();
  });
  $("#btnRefresh").addEventListener("click", load);
  $("#btnExport").addEventListener("click", exportCsv);
  $("#btnGoAdd").addEventListener("click", () => {
    const name = ($("#goAccName").value || "").trim();
    const key = ($("#goApiKey").value || "").trim();
    if (!name || !key) { showToast("Completá alias y API key", false); return; }
    const list = goAccounts();
    const i = list.findIndex((a) => a.name === name);
    if (i >= 0) list[i] = { name, key }; else list.push({ name, key });
    saveGoAccounts(list);
    $("#goAccName").value = "";
    $("#goApiKey").value = "";
    renderGoAccountsList();
    renderGoAccountSelect();
    showToast(`Cuenta «${name}» guardada`);
  });
  $("#btnFilters").addEventListener("click", () => {
    state.prefs.ui.filters = !state.prefs.ui.filters;
    savePrefs();
    applyPrefs();
  });
}

function syncPrefsDialog() {
  $$("#prefsDialog input[data-group]").forEach((cb) => {
    cb.checked = state.prefs[cb.dataset.group][cb.dataset.key];
  });
  renderGoAccountsList();
}

function openPrefs() {
  syncPrefsDialog();
  $("#prefsDialog").showModal();
}

/* ---------- utilidades de formato ---------- */
const num = (n) => Number(n).toLocaleString("en-US");
const usd = (n, d = 2) => "$" + Number(n).toFixed(d);

/* ---------- definiciones de columnas (DRY: cada tabla solo declara su shape) ---------- */
const quotaBar = (used, limit) => {
  if (limit == null) return num(used);
  const pct = Math.min(100, (used / limit) * 100);
  const color = used >= limit ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e";
  return `<div class="flex items-center gap-2 justify-end">
    <div class="w-20 h-1.5 rounded bg-slate-700 overflow-hidden"><div class="h-full rounded" style="width:${pct}%;background:${color}"></div></div>
    <span class="tabular-nums">${num(used)}/${num(limit)}</span></div>`;
};
const quotaCls = (used, limit) => {
  if (limit == null) return "";
  const pct = used / limit;
  if (used >= limit) return "text-red-400 font-semibold";
  if (pct >= 0.7) return "text-amber-400 font-semibold";
  return "";
};

const COLS = {
  modelo: [
    { key: "model", label: "Modelo", left: true },
    { key: "sessions", label: "#Ses", right: true },
    { key: "requests", label: "Pet.", right: true },
    { key: "input", label: "Input", right: true },
    { key: "output", label: "Output", right: true },
    { key: "cache_read", label: "Cache Read", right: true },
    { key: "cache_write", label: "Cache Write", right: true },
    { key: "est", label: "Costo est.", right: true },
  ],
  generico: [
    { key: "key", label: "Clave", left: true },
    { key: "sessions", label: "#Ses", right: true },
    { key: "input", label: "Input", right: true },
    { key: "output", label: "Output", right: true },
    { key: "reasoning", label: "Reasoning", right: true },
    { key: "cache_read", label: "Cache Read", right: true },
    { key: "cache_write", label: "Cache Write", right: true },
    { key: "cost", label: "Costo", right: true },
  ],
  sesiones: [
    { key: "title", label: "Sesión", left: true },
    { key: "model", label: "Modelo", left: true },
    { key: "start", label: "Inicio", left: true },
    { key: "input", label: "Input", right: true },
    { key: "output", label: "Output", right: true },
    { key: "cache_read", label: "Cache Read", right: true },
    { key: "cost", label: "Costo", right: true },
  ],
  herramientas: [
    { key: "tool", label: "Herramienta", left: true },
    { key: "calls", label: "Llamadas", right: true },
    { key: "input", label: "Input", right: true },
    { key: "output", label: "Output", right: true },
    { key: "reasoning", label: "Reasoning", right: true },
    { key: "cache_read", label: "Cache Read", right: true },
    { key: "cache_write", label: "Cache Write", right: true },
    { key: "cost", label: "Costo est.", right: true },
  ],
  uso: [
    { key: "model", label: "Modelo", left: true },
    { key: "u5h", label: "5 h", right: true, fmt: (r) => quotaBar(r.u5h, r.l5h), cls: (r) => quotaCls(r.u5h, r.l5h) },
    { key: "l5h", label: "Límite 5 h", right: true, fmt: (r) => r.l5h == null ? "—" : num(r.l5h) },
    { key: "u7d", label: "Semana", right: true, fmt: (r) => quotaBar(r.u7d, r.l7d), cls: (r) => quotaCls(r.u7d, r.l7d) },
    { key: "l7d", label: "Límite sem.", right: true, fmt: (r) => r.l7d == null ? "—" : num(r.l7d) },
    { key: "u30d", label: "Mes", right: true, fmt: (r) => quotaBar(r.u30d, r.l30d), cls: (r) => quotaCls(r.u30d, r.l30d) },
    { key: "l30d", label: "Límite mes", right: true, fmt: (r) => r.l30d == null ? "—" : num(r.l30d) },
  ],
  precios: [
    { key: "model", label: "Modelo", left: true },
    { key: "in", label: "Entrada", right: true, fmt: (r) => usd(r.in, 3) },
    { key: "out", label: "Salida", right: true, fmt: (r) => usd(r.out, 2) },
    { key: "cr", label: "Cache read", right: true, fmt: (r) => usd(r.cr, 4) },
    { key: "cw", label: "Cache write", right: true, fmt: (r) => (r.cw ? usd(r.cw, 3) : "—") },
  ],
};

/* ---------- tabla genérica (un solo renderizador para todas) ---------- */
function renderTable(thId, tbId, cols, rows) {
  const th = $(thId), tb = $(tbId);
  th.innerHTML = cols.map((c) =>
    `<th class="px-3 py-2 text-xs uppercase tracking-wide text-slate-400 ${c.right ? "text-right" : "text-left"}">${c.label}</th>`
  ).join("");
  tb.innerHTML = rows.map((r) => {
    const cells = cols.map((c) => {
      const v = c.fmt ? c.fmt(r) : r[c.key];
      return `<td class="px-3 py-2 text-sm ${c.right ? "text-right tabular-nums" : "text-left"} ${c.cls ? c.cls(r) : "text-slate-300"}">${v}</td>`;
    });
    return `<tr class="border-t border-slate-800/60 hover:bg-slate-800/40">${cells.join("")}</tr>`;
  }).join("");
}

/* ---------- cards ---------- */
const CARDS = [
  ["Entrada (input)", "input", "#3b82f6"],
  ["Salida (output)", "output", "#22c55e"],
  ["Razonamiento", "reasoning", "#f59e0b"],
  ["Cache leída", "cache_read", "#a855f7"],
  ["Cache escrita", "cache_write", "#06b6d4"],
];

function renderCards(d) {
  const wrap = $("#cards");
  const visible = CARDS.filter(([label, key]) => state.prefs.cards[key]);
  wrap.innerHTML = visible.map(([label, key, color]) => `
    <div class="bg-[#141a24] border border-slate-800 rounded-xl px-4 py-3.5 flex items-center gap-4" style="border-left: 4px solid ${color}">
      <div>
        <div class="text-xs text-slate-400">${label}</div>
        <div class="text-2xl font-bold text-white">${d.totals[key]}</div>
      </div>
    </div>`).join("");
  if (state.prefs.cards.cost) {
    wrap.insertAdjacentHTML("beforeend", `
    <div class="bg-[#141a24] border border-slate-800 rounded-xl px-4 py-3.5 flex items-center gap-4" style="border-left: 4px solid #ef4444">
      <div>
        <div class="text-xs text-slate-400">Costo total</div>
        <div class="text-2xl font-bold text-white">${d.cost}</div>
        <div class="text-xs text-slate-500">est. ${d.est_total}</div>
      </div>
    </div>`);
  }
  if (!visible.length && !state.prefs.cards.cost) {
    wrap.innerHTML = `<div class="col-span-full text-xs text-slate-500">Sin tarjetas visibles — activá algunas en ⚙.</div>`;
  }
}

/* ---------- gráficos ---------- */
const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#94a3b8", boxWidth: 12 } } },
  scales: { x: { ticks: { color: "#64748b", maxRotation: 45 }, grid: { color: "#1e293b" } },
            y: { ticks: { color: "#64748b" }, grid: { color: "#1e293b" } } },
};

function initCharts() {
  state.charts.days = new Chart($("#chartDays"), {
    type: "bar",
    data: { labels: [], datasets: [{ label: "USD", data: [], backgroundColor: "#3b82f6", borderRadius: 3 }] },
    options: { ...CHART_OPTS, plugins: { legend: { display: false } } },
  });
  state.charts.requests = new Chart($("#chartRequests"), {
    type: "bar",
    data: { labels: [], datasets: [{ label: "Peticiones", data: [], backgroundColor: "#a855f7", borderRadius: 3 }] },
    options: { ...CHART_OPTS, plugins: { legend: { display: false } } },
  });
  state.charts.tokens = new Chart($("#chartTokens"), {
    type: "bar",
    data: { labels: [], datasets: [{ label: "Tokens", data: [], backgroundColor: "#22c55e", borderRadius: 3 }] },
    options: { ...CHART_OPTS, plugins: { legend: { display: false } } },
  });
  state.charts.models = new Chart($("#chartModels"), {
    type: "doughnut",
    data: { labels: [], datasets: [{ data: [], backgroundColor: ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#06b6d4", "#84cc16", "#ec4899"] }] },
    options: { ...CHART_OPTS, cutout: "60%", plugins: { legend: { position: "bottom", labels: { color: "#94a3b8", boxWidth: 10, padding: 12, font: { size: 11 } } } } },
  });
}

function renderCharts(d) {
  const vis = state.prefs.charts;
  ["days", "requests", "tokens", "models"].forEach((k) => {
    const wrap = document.querySelector(`[data-chart="${k}"]`);
    if (wrap) wrap.style.display = vis[k] ? "" : "none";
  });

  const days = (d.days || []).map((x) => x.day);
  const dayLabels = days.map((x) => x.slice(5));
  if (vis.days) {
    state.charts.days.data.labels = dayLabels;
    state.charts.days.data.datasets[0].data = (d.days || []).map((x) => x.cost);
    state.charts.days.update();
  }
  if (vis.requests || vis.tokens) {
    const reqMap = Object.fromEntries((d.days_requests || []).map((x) => [x.day, x.requests]));
    const tokMap = Object.fromEntries((d.days_tokens || []).map((x) => [x.day, x.tokens]));
    if (vis.requests) {
      state.charts.requests.data.labels = dayLabels;
      state.charts.requests.data.datasets[0].data = days.map((x) => reqMap[x] || 0);
      state.charts.requests.update();
    }
    if (vis.tokens) {
      state.charts.tokens.data.labels = dayLabels;
      state.charts.tokens.data.datasets[0].data = days.map((x) => tokMap[x] || 0);
      state.charts.tokens.update();
    }
  }
  if (vis.models) {
    const top = (d.models_chart || []).slice(0, 6);
    const other = (d.models_chart || []).slice(6).reduce((a, m) => a + m.cost, 0);
    const labels = top.map((m) => m.model);
    const data = top.map((m) => m.cost);
    if (other > 0) { labels.push("Otros"); data.push(other); }
    state.charts.models.data.labels = labels;
    state.charts.models.data.datasets[0].data = data;
    state.charts.models.update();
  }
}

/* ---------- estadística del día ---------- */
function renderToday(d) {
  const t = d.today || {};
  const fmt = (n) => {
    n = Number(n || 0);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + " B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + " M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + " K";
    return String(n);
  };
  const cards = [
    ["Costo hoy", "$" + Number(t.cost || 0).toFixed(2), "#ef4444"],
    ["Peticiones hoy", t.requests == null ? "—" : num(t.requests), "#a855f7"],
    ["Input hoy", fmt(t.input), "#3b82f6"],
    ["Output hoy", fmt(t.output), "#22c55e"],
    ["Sesiones hoy", num(t.sessions || 0), "#f59e0b"],
  ];
  $("#todayBox").innerHTML = cards.map(([label, value, color]) => `
    <div class="bg-[#141a24] border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3" style="border-left: 4px solid ${color}">
      <div>
        <div class="text-[11px] uppercase tracking-wide text-slate-400">${label}</div>
        <div class="text-xl font-bold text-white">${value}</div>
      </div>
    </div>`).join("");
}

/* ---------- tabs ---------- */
const TABS = [
  ["resumen", "Resumen"], ["modelo", "Por modelo"], ["proyecto", "Por proyecto"],
  ["dia", "Por día"], ["mes", "Por mes"], ["herramientas", "Herramientas"],
  ["sesiones", "Sesiones"], ["limites", "Límites y precios"],
];
const TAB_SCOPES = {
  resumen: "summary", modelo: "modelo", proyecto: "proyecto",
  dia: "dia", mes: "mes", herramientas: "tools",
  sesiones: "sesiones", limites: "limites",
};

const TAB_BASE = "sidebar-tab";
const TAB_ON = "active";
const TAB_OFF = "";

function initTabs() {
  const nav = $("#sidebarTabs");
  if (nav) {
    nav.innerHTML = TABS.map(([id, label]) =>
      `<button data-tab="${id}" class="${TAB_BASE} ${id === state.activeTab ? TAB_ON : TAB_OFF}">${label}</button>`
    ).join("");
    nav.querySelectorAll(".sidebar-tab").forEach((b) => b.addEventListener("click", () => {
      switchTab(b.dataset.tab);
      closeSidebar();
    }));
  }
  // Sidebar toggle
  const sidebar = $("#sidebar");
  const overlay = $("#sidebarOverlay");
  const btnOpen = $("#btnSidebarOpen");
  const btnClose = $("#btnSidebarClose");
  if (btnOpen) btnOpen.addEventListener("click", () => { sidebar?.classList.add("open"); overlay?.classList.remove("hidden"); });
  if (btnClose) btnClose.addEventListener("click", closeSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);
}

function closeSidebar() {
  $("#sidebar")?.classList.remove("open");
  $("#sidebarOverlay")?.classList.add("hidden");
}

function switchTab(id) {
  state.activeTab = id;
  $$(".sidebar-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === id);
  });
  $$(".panel").forEach((p) => p.classList.toggle("hidden", p.id !== "panel-" + id));
  fetchScope(TAB_SCOPES[id]); // carga diferida: la pestaña se rellena al abrirla
  if (id === "limites") goFetchUsage(); // uso real de OpenCode Go en cada apertura
}

/* ---------- toast de estado (errores y avisos) ---------- */
function showToast(msg, ok = true) {
  let t = $("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.className = `fixed top-4 right-4 z-50 text-sm px-4 py-2 rounded-lg border shadow-lg ${ok
    ? "bg-emerald-950/90 border-emerald-700 text-emerald-300"
    : "bg-red-950/90 border-red-700 text-red-300"}`;
  t.textContent = msg;
  clearTimeout(t._h);
  t._h = setTimeout(() => (t.style.display = "none"), 4000);
}

/* ---------- render completo ---------- */
function renderAll(d) {
  renderCards(d);
  renderToday(d);
  renderCharts(d);
  $("#statsBox").innerHTML =
    `Estadísticas — costo medio por sesión: <b>$${d.meta.avg_cost}</b>  |  input medio por sesión: <b>${d.stats.input_medio}</b><br>` +
    `Sesión más cara: <b>${d.stats.mas_cara.cost}</b> («${d.stats.mas_cara.title}», ${d.stats.mas_cara.model})<br>` +
    `Sesión con más tokens: «${d.stats.mas_tokens.title}» (${d.stats.mas_tokens.model})`;

  renderTable("#th-modelo", "#tb-modelo", COLS.modelo, d.by_model || []);
  renderTable("#th-proyecto", "#tb-proyecto", COLS.generico, d.by_project || []);
  renderTable("#th-dia", "#tb-dia", COLS.generico, d.by_day || []);
  renderTable("#th-mes", "#tb-mes", COLS.generico, d.by_month || []);
  renderTable("#th-herramientas", "#tb-herramientas", COLS.herramientas, d.by_tool || []);
  renderTable("#th-uso", "#tb-uso", COLS.uso, d.limits || []);
  renderTable("#th-precios", "#tb-precios", COLS.precios, d.prices || []);

  const q = state.searchSes.toLowerCase();
  const ses = (d.sessions || []).filter((s) =>
    !q || s.title.toLowerCase().includes(q) || s.model.toLowerCase().includes(q));
  renderTable("#th-sesiones", "#tb-sesiones", COLS.sesiones, ses);
  $("#sesionesCount").textContent = `${ses.length} / ${(d.sessions || []).length}`;
}

/* ---------- overlay de carga (usado también por admin.js) ---------- */
const showOverlay = (msg) => {
  const t = $("#loadingText");
  if (t) t.textContent = msg || "Cargando datos de la base de datos...";
  const o = $("#loadingOverlay");
  if (o) o.classList.remove("hidden");
};
const hideOverlay = () => {
  const o = $("#loadingOverlay");
  if (o) o.classList.add("hidden");
};

/* ---------- fetch + scopes ---------- */
function mergeData(part) {
  state.data = Object.assign({}, state.data, part);
  renderAll(state.data);
}

async function fetchScope(scope) {
  if (state.scopes[scope]) return;
  const since = $("#fSince").value, until = $("#fUntil").value, model = $("#fModel").value.trim();
  try {
    const res = await fetch(`/api/data?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&model=${encodeURIComponent(model)}&scope=${scope}`);
    const d = await res.json();
    if (d.error) throw new Error(d.error);
    state.scopes[scope] = true;
    mergeData(d);
  } catch (e) {
    $("#status").className = "text-sm text-red-400";
    $("#status").textContent = "Error: " + e.message;
  }
}

async function load(silent) {
  const since = $("#fSince").value, until = $("#fUntil").value, model = $("#fModel").value.trim();
  const btn = $("#btnRefresh");
  state.scopes = {};
  if (!silent) {
    btn.disabled = true; btn.textContent = "Cargando...";
    showOverlay("Leyendo la base de datos (puede tardar unos segundos)...");
  }
  try {
    const res = await fetch(`/api/data?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&model=${encodeURIComponent(model)}&scope=summary`);
    const d = await res.json();
    if (d.error) throw new Error(d.error);
    state.scopes.summary = true;
    mergeData(d);
    syncToolsRange();
    fetchScope("usage"); // en segundo plano: peticiones de hoy + cuotas (scan ~4 s)
  } catch (e) {
    showToast("Error: " + e.message, false);
  } finally {
    hideOverlay();
    if (!silent) { btn.disabled = false; btn.textContent = "Actualizar"; }
  }
}

/* ---------- export CSV (pestaña activa) ---------- */
const CSV_MAP = {
  modelo: ["by_model", "modelo"],
  proyecto: ["by_project", "generico"],
  dia: ["by_day", "generico"],
  mes: ["by_month", "generico"],
  sesiones: ["sessions", "sesiones"],
  limites: ["limits", "uso"],
};

function exportCsv() {
  if (!state.data) return;
  const [key, colKey] = CSV_MAP[state.activeTab] || CSV_MAP.modelo;
  const cols = COLS[colKey];
  const rows = state.data[key] || [];
  const head = cols.map((c) => c.label).join(",");
  const body = rows.map((r) => cols.map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + head + "\n" + body], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `opencode_${state.activeTab}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- rangos rápidos + auto-refresh ---------- */
function applyRange(days) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - days);
  $("#fSince").value = from.toISOString().slice(0, 10);
  $("#fUntil").value = to.toISOString().slice(0, 10);
  load();
}

function syncToolsRange() {
  const el = $("#toolsRange");
  if (!el) return;
  const since = $("#fSince").value, until = $("#fUntil").value;
  el.textContent = since || until
    ? `desde ${since || "inicio"} hasta ${until || "hoy"}`
    : "todo el historial";
}

// Rango rápido del panel Herramientas: aplica el filtro y re-fetchea el scope
// (load() limpia state.scopes, pero la pestaña no se re-abre → fetch directo).
function toolsLoad(apply) {
  apply();
  fetchScope("tools");
}

function initExtras() {
  $("#btnRange24").addEventListener("click", () => applyRange(1));
  $("#btnRange7").addEventListener("click", () => applyRange(7));
  $("#btnRange30").addEventListener("click", () => applyRange(30));
  $("#btnTools24").addEventListener("click", () => toolsLoad(() => applyRange(1)));
  $("#btnTools7").addEventListener("click", () => toolsLoad(() => applyRange(7)));
  $("#btnTools30").addEventListener("click", () => toolsLoad(() => applyRange(30)));
  $("#btnToolsMonth").addEventListener("click", () => toolsLoad(() => {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth(), 1);
    $("#fSince").value = from.toISOString().slice(0, 10);
    $("#fUntil").value = to.toISOString().slice(0, 10);
    load();
  }));
  $("#btnToolsAll").addEventListener("click", () => toolsLoad(() => {
    $("#fSince").value = "";
    $("#fUntil").value = "";
    load();
  }));
  $("#btnRangeMonth").addEventListener("click", () => {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth(), 1);
    $("#fSince").value = from.toISOString().slice(0, 10);
    $("#fUntil").value = to.toISOString().slice(0, 10);
    load();
  });
  $("#chkAuto").addEventListener("change", () => {
    if ($("#chkAuto").checked) {
      $("#autoInfo").textContent = "actualizando cada 45 s";
    } else {
      $("#autoInfo").textContent = "";
    }
  });
  setInterval(() => {
    if ($("#chkAuto").checked && document.visibilityState === "visible" && $("#loadingOverlay").classList.contains("hidden")) {
      load(true);
    }
  }, 45000);
  $("#searchSesiones").addEventListener("input", (e) => {
    state.searchSes = e.target.value.trim();
    if (state.data) renderAll(state.data);
  });
  $("#btnGoRefresh").addEventListener("click", goFetchUsage);
  $("#goAccount").addEventListener("change", (e) => {
    localStorage.setItem("oc_go_active", e.target.value);
    goFetchUsage();
  });
}

/* ---------- uso real de OpenCode Go (proxy local → API pública) ---------- */
const GO_LABELS = { rolling: "Rolling (5 h)", weekly: "Semanal (7 d)", monthly: "Mensual (30 d)" };

function goAccounts() {
  try { return JSON.parse(localStorage.getItem("oc_go_accounts") || "[]"); } catch { return []; }
}

function saveGoAccounts(list) {
  localStorage.setItem("oc_go_accounts", JSON.stringify(list));
}

// Migración de la key única antigua (oc_go_key) al formato de cuentas.
function migrateGoKey() {
  const old = localStorage.getItem("oc_go_key");
  if (old && !localStorage.getItem("oc_go_accounts")) {
    saveGoAccounts([{ name: "Cuenta 1", key: old.trim() }]);
    localStorage.removeItem("oc_go_key");
  }
}

function goActiveName() {
  return localStorage.getItem("oc_go_active") || "";
}

function goActiveAccount() {
  const accs = goAccounts();
  return accs.find((a) => a.name === goActiveName()) || accs[0] || null;
}

function renderGoAccountsList() {
  const el = $("#goAccountsList");
  if (!el) return;
  const accs = goAccounts();
  el.innerHTML = accs.length
    ? accs.map((a, i) => `
      <div class="flex items-center gap-2 text-xs text-slate-300 py-1">
        <span class="w-32 truncate">${a.name}</span>
        <span class="text-slate-500 flex-1 truncate">${a.key.slice(0, 16)}${a.key.length > 16 ? "…" : ""}</span>
        <button data-del="${i}" class="text-slate-500 hover:text-red-400" title="Quitar cuenta">✕</button>
      </div>`).join("")
    : `<div class="text-xs text-slate-500">Sin cuentas — agregá una con alias + API key.</div>`;
  el.querySelectorAll("button[data-del]").forEach((b) =>
    b.addEventListener("click", () => {
      const list = goAccounts();
      list.splice(Number(b.dataset.del), 1);
      saveGoAccounts(list);
      renderGoAccountsList();
      renderGoAccountSelect();
    }));
}

function renderGoAccountSelect() {
  const sel = $("#goAccount");
  if (!sel) return;
  const accs = goAccounts();
  const active = goActiveAccount();
  sel.innerHTML = accs.map((a) =>
    `<option value="${a.name}">${a.name}</option>`).join("");
  if (active) {
    sel.value = active.name;
    localStorage.setItem("oc_go_active", active.name);
  }
  sel.disabled = accs.length === 0;
}

function goBar(label, percent, resetsAt) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const color = pct >= 100 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e";
  const reset = resetsAt ? new Date(resetsAt) : null;
  const resetTxt = reset ? ` · se renueva ${reset.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}` : "";
  return `<div class="mb-2">
    <div class="flex items-center gap-2">
      <span class="w-28 text-slate-300">${label}</span>
      <div class="w-56 h-2 rounded bg-slate-700 overflow-hidden"><div class="h-full rounded" style="width:${pct}%;background:${color}"></div></div>
      <span class="tabular-nums ${pct >= 100 ? "text-red-400 font-semibold" : ""}">${pct.toFixed(0)}%</span>
    </div>
    <div class="pl-28 text-slate-500">${resetTxt}</div>
  </div>`;
}

async function goFetchUsage() {
  const acc = goActiveAccount();
  const box = $("#goUsageBox");
  const st = $("#goUsageState");
  if (!acc) {
    box.innerHTML = `<p class="text-slate-400">Sin cuentas — agregá una cuenta de OpenCode Go en ⚙ (alias + API key).</p>`;
    if (st) st.textContent = "";
    return;
  }
  if (st) st.textContent = `Consultando «${acc.name}»...`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch("/api/go/usage", {
      headers: { Authorization: "Bearer " + acc.key, Accept: "application/json", "Cache-Control": "no-store" },
      signal: ctl.signal,
    });
    const d = await res.json();
    if (res.status === 401 || res.status === 403) {
      box.innerHTML = `<p class="text-red-400">Key inválida en «${acc.name}» (HTTP ${res.status}) — revisala en ⚙.</p>`;
    } else if (!res.ok) {
      box.innerHTML = `<p class="text-red-400">Error HTTP ${res.status}: ${d?.error || "desconocido"}</p>`;
    } else if (d?.usage) {
      const { rolling, weekly, monthly } = d.usage;
      box.innerHTML =
        goBar(GO_LABELS.rolling, rolling?.percent, rolling?.resetsAt) +
        goBar(GO_LABELS.weekly, weekly?.percent, weekly?.resetsAt) +
        goBar(GO_LABELS.monthly, monthly?.percent, monthly?.resetsAt);
    } else {
      box.innerHTML = `<p class="text-red-400">Respuesta inesperada de la API.</p>`;
    }
  } catch (e) {
    box.innerHTML = `<p class="text-red-400">No se pudo consultar el uso (${e.name === "AbortError" ? "timeout 15 s" : "red"}).</p>`;
  } finally {
    clearTimeout(timer);
    if (st) st.textContent = "";
  }
}

/* ---------- init ---------- */
migrateGoKey();
loadPrefs();
buildPrefsDialog();
initTabs();
initCharts();
initExtras();
renderGoAccountSelect();
applyPrefs();
  $("#btnApply").addEventListener("click", load);
  $("#fModel").addEventListener("keydown", (e) => e.key === "Enter" && load());
  $("#btnPrefs").addEventListener("click", openPrefs);
  syncToolsRange();
  load();
