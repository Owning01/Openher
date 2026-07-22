import { bench, group } from "./runner.mjs"

// Extracted i18n logic from i18n.ts
const translations = {
  en: {
    "sessions": { "title": "Sessions", "refresh": "Refresh", "deleteTitle": "Delete session?" },
    "settings": { "title": "Settings", "theme": "Theme", "language": "Language", "server": { "host": "Server Host", "port": "Server Port" } },
    "detail": { "title": "Detail", "opencode": "OpenCode", "changedFilesTitle": "Changed files", "linesAddedDeleted": "{additions} lines added, {deletions} lines removed", "fileStatusLabel": "Changed files" },
    "chat": { "inputPlaceholder": "Type a message...", "send": "Send", "connecting": "Connecting..." },
    "errors": { "connectionFailed": "Connection failed", "unknownError": "Unknown error" },
    "common": { "ok": "OK", "cancel": "Cancel", "save": "Save", "delete": "Delete" },
    "session": { "deleteTitle": "Delete session?", "renameTitle": "Rename session" },
    "todo": { "title": "Todo Items" },
    "server": { "connect": "Connect", "disconnect": "Disconnect", "status": { "connected": "Connected", "disconnected": "Disconnected" } },
    "offlineCache": { "label": "Offline cache", "desc": "Cache sessions locally" },
  },
  es: {
    "sessions": { "title": "Sesiones", "refresh": "Actualizar", "deleteTitle": "¿Eliminar sesión?" },
    "settings": { "title": "Ajustes", "theme": "Tema", "language": "Idioma", "server": { "host": "Servidor", "port": "Puerto" } },
    "detail": { "title": "Detalle", "opencode": "OpenCode", "changedFilesTitle": "Archivos modificados", "linesAddedDeleted": "{additions} líneas añadidas, {deletions} líneas eliminadas", "fileStatusLabel": "Archivos modificados" },
    "chat": { "inputPlaceholder": "Escribe un mensaje...", "send": "Enviar", "connecting": "Conectando..." },
    "errors": { "connectionFailed": "Conexión fallida", "unknownError": "Error desconocido" },
    "common": { "ok": "OK", "cancel": "Cancelar", "save": "Guardar", "delete": "Eliminar" },
    "session": { "deleteTitle": "¿Eliminar sesión?", "renameTitle": "Renombrar sesión" },
    "todo": { "title": "Tareas pendientes" },
    "server": { "connect": "Conectar", "disconnect": "Desconectar", "status": { "connected": "Conectado", "disconnected": "Desconectado" } },
    "offlineCache": { "label": "Caché offline", "desc": "Guardar sesiones localmente" },
  },
  it: {
    "sessions": { "title": "Sessioni", "refresh": "Aggiorna", "deleteTitle": "Eliminare la sessione?" },
    "settings": { "title": "Impostazioni", "theme": "Tema", "language": "Lingua", "server": { "host": "Server", "port": "Porta" } },
    "detail": { "title": "Dettaglio", "opencode": "OpenCode", "changedFilesTitle": "File modificati", "linesAddedDeleted": "{additions} righe aggiunte, {deletions} righe rimosse", "fileStatusLabel": "File modificati" },
    "chat": { "inputPlaceholder": "Scrivi un messaggio...", "send": "Invia", "connecting": "Connessione..." },
    "errors": { "connectionFailed": "Connessione fallita", "unknownError": "Errore sconosciuto" },
    "common": { "ok": "OK", "cancel": "Annulla", "save": "Salva", "delete": "Elimina" },
    "session": { "deleteTitle": "Eliminare la sessione?", "renameTitle": "Rinominare sessione" },
    "todo": { "title": "Attività" },
    "server": { "connect": "Connetti", "disconnect": "Disconnetti", "status": { "connected": "Connesso", "disconnected": "Disconnesso" } },
    "offlineCache": { "label": "Cache offline", "desc": "Salva sessioni localmente" },
  },
}

function resolveKey(obj, key) {
  const parts = key.split(".")
  let current = obj
  for (const part of parts) {
    if (current == null || typeof current !== "object") return null
    current = current[part]
  }
  return current ?? null
}

function translate(lang, key, params = {}) {
  const locale = translations[lang] || translations.en
  const template = resolveKey(locale, key)
  if (!template) return key
  if (typeof template !== "string") return key
  return template.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`)
}

function createTranslator(lang) {
  return (key, params) => translate(lang, key, params)
}

// --- Translation Lookup Speed ---
group("Translation Lookup (resolveKey)", () => {
  const en = createTranslator("en")

  bench("shallow key (1 level)", () => en("common.ok"))
  bench("nested key (2 levels)", () => en("settings.server.host"))
  bench("nested key (3 levels)", () => en("detail.linesAddedDeleted"))
  bench("missing key returns key itself", () => en("nonexistent.key"))
})

// --- Translation with Parameters ---
group("Translation with Parameters", () => {
  const en = createTranslator("en")

  bench("no params", () => en("sessions.title"))
  bench("1 param", () => en("detail.linesAddedDeleted", { additions: 10, deletions: 5 }))
  bench("nested param replacement", () => {
    en("detail.linesAddedDeleted", { additions: 100, deletions: 50 })
  })
})

// --- Multi-language ---
group("Multi-language Lookup Speed", () => {
  const en = createTranslator("en")
  const es = createTranslator("es")
  const it = createTranslator("it")

  bench("translate 'sessions.title' in 3 languages", () => {
    en("sessions.title")
    es("sessions.title")
    it("sessions.title")
  })

  bench("translate all keys in EN", () => {
    const keys = ["sessions.title", "settings.theme", "detail.title", "chat.send", "common.ok", "todo.title", "server.connect"]
    for (const k of keys) en(k)
  })

  bench("translate all keys × 3 languages", () => {
    const keys = ["sessions.title", "settings.theme", "detail.title", "chat.send", "common.ok", "todo.title", "server.connect"]
    for (const k of keys) {
      en(k); es(k); it(k)
    }
  })
})

// --- Throughput: many translations ---
group("Translation Throughput", () => {
  const en = createTranslator("en")
  const es = createTranslator("es")

  bench("1000 translations (EN)", () => {
    const keys = ["sessions.title", "settings.theme", "detail.title", "chat.send", "common.ok", "todo.title", "server.connect", "common.cancel", "common.save", "common.delete"]
    for (let i = 0; i < 100; i++) {
      for (const k of keys) en(k)
    }
  })

  bench("10000 translations, alternating EN/ES", () => {
    const keys = ["sessions.title", "settings.theme", "detail.title", "chat.send", "common.ok"]
    for (let i = 0; i < 2000; i++) {
      en(keys[i % keys.length])
      es(keys[(i + 1) % keys.length])
    }
  })

  bench("100k translations (EN, same key)", () => {
    for (let i = 0; i < 100000; i++) en("common.ok")
  })
})

// --- resolveKey deep dive ---
group("resolveKey Performance", () => {
  const data = { a: { b: { c: { d: { e: "deep" } } } } }

  bench("depth 1", () => resolveKey(data, "a"))
  bench("depth 2", () => resolveKey(data, "a.b"))
  bench("depth 3", () => resolveKey(data, "a.b.c"))
  bench("depth 4", () => resolveKey(data, "a.b.c.d"))
  bench("depth 5", () => resolveKey(data, "a.b.c.d.e"))
  bench("100k depth-3 lookups", () => {
    for (let i = 0; i < 100000; i++) resolveKey(data, "a.b.c")
  })
})

// --- Template replacement (regex) ---
group("Template String Replacement", () => {
  const template = "{additions} lines added, {deletions} lines removed"

  bench("single replacement", () => {
    template.replace(/\{(\w+)\}/g, (_, k) => ({ additions: 10, deletions: 5 })[k] ?? `{${k}}`)
  })

  bench("100k replacements, same template", () => {
    for (let i = 0; i < 100000; i++) {
      template.replace(/\{(\w+)\}/g, (_, k) => ({ additions: i, deletions: i / 2 })[k] ?? `{${k}}`)
    }
  })
})

// --- Full translator initialization ---
group("Translator Initialization", () => {
  bench("create translator × 100", () => {
    for (let i = 0; i < 100; i++) {
      createTranslator(i % 3 === 0 ? "en" : i % 3 === 1 ? "es" : "it")
    }
  })
})
