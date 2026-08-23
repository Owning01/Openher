// OpenCode Plugin: Hello & Clock
export function apply(ctx) {
  console.log("[Plugin:Hello] Inicializando plugin Hello con config:", ctx.config);

  // 1. Registrar Slot en la barra lateral (sidebar.activity)
  const unslotSidebar = ctx.ui.registerSlot("sidebar.activity", {
    id: "clock-widget",
    title: "Reloj OpenCode",
    render: () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      return (
        <div style={{ padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, margin: "4px 8px" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{ctx.config.prefix || "⏰"} HORA LOCAL</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{timeStr}</div>
        </div>
      );
    }
  });

  // 2. Registrar Slot en el overlay de la app (shell.overlay)
  const unslotOverlay = ctx.ui.registerSlot("shell.overlay", {
    id: "hello-banner",
    render: () => null // overlay silencioso listo para interactuar
  });

  // 3. Registrar Slot en las acciones del compositor (composer.actions)
  const unslotComposer = ctx.ui.registerSlot("composer.actions", {
    id: "hello-stamp-btn",
    render: () => (
      <button
        type="button"
        className="btn-ghost compact"
        title="Insertar marca de tiempo (Plugin Hello)"
        onClick={() => {
          const ev = new CustomEvent("plugin:insert-text", { detail: `[${new Date().toLocaleTimeString()}] ` });
          window.dispatchEvent(ev);
        }}
        style={{ fontSize: 11, padding: "2px 6px" }}
      >
        ⏰ Hora
      </button>
    )
  });

  // 4. Escuchar eventos de sesión
  const unevent = ctx.on("session.updated", (data) => {
    console.log("[Plugin:Hello] Evento session.updated recibido:", data);
  });

  // 5. Comando registrado
  const uncmd = ctx.commands.register({
    name: "hora",
    description: "Retorna la hora actual del sistema",
    execute: () => {
      return new Date().toLocaleTimeString();
    }
  });

  // Retorno de limpieza (disposers)
  return () => {
    console.log("[Plugin:Hello] Desmontando plugin Hello...");
    unslotSidebar();
    unslotOverlay();
    unslotComposer();
    unevent();
    uncmd();
  };
}
