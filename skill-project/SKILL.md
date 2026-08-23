---
name: opencode-plugin-kernel
description: Guía y arquitectura para implementar un kernel de plugins modular, seguro y ligero (~500 líneas en React/TS + Rust) basado en ESM nativo, gating de capacidades por Proxy, bus de eventos reactivo y UI Slots.
---

# Kernel de Plugins Modular (Patrón dsh sin Cordis)

Esta skill documenta la arquitectura y los pasos para implementar un sistema de extensiones/plugins ligero en aplicaciones híbridas (React/TypeScript + Backend de escritorio Rust/Node), sin dependencias externas pesadas ni grafos complejos de Inyección de Dependencias.

---

## 1. Conceptos Fundamentales

El diseño se compone de 6 principios clave:

1. **Plugin Contract:** Cada plugin es un módulo ESM precompilado que exporta `apply(ctx)` y un manifiesto en `package.json` con el campo `"opencode"` (o `"dsh"`).
2. **Capability Gating (Proxy Context):** El host pasa un objeto `ctx` protegido por Proxy que deniega el acceso a APIs cuyas capacidades no hayan sido declaradas explícitamente en el manifiesto (`ui`, `events`, `commands`, `storage`, `shell`).
3. **Ciclo de Vida Reversible:** Toda registración (`registerSlot`, `on`, `register`, etc.) devuelve una función *disposer*. Al descargar un plugin, el host ejecuta los disposers en orden inverso.
4. **Aislamiento de Errores:** Errores en la ejecución o ciclo de vida de un plugin no derriban la aplicación central.
5. **UI Slots (Outlets Reactivos):** Componentes fijos `<PluginSlot id="..." />` en puntos clave del layout donde los plugins inyectan sus componentes de interfaz.
6. **Bus de Eventos Puenteado:** Reenvío de eventos del sistema (como deltas SSE o actualizaciones de sesión) hacia los plugins suscriptos.

---

## 2. Estructura de Archivos Recomendada

```
web/src/plugins/
├── types.ts    # Tipos de manifiesto, capacidades, contexto y slots
├── bus.ts      # Bus de eventos interno con soporte de wildcards
├── ctx.ts      # Factory de contexto con Proxy y capability gating
├── slots.tsx   # Registro reactivo (useSyncExternalStore) y componente <PluginSlot />
├── host.ts     # Gestor de ciclo de vida (load, unload, reload)
└── index.ts    # Barrel export
```

---

## 3. Implementación Paso a Paso

### Paso 1: Tipos y Contrato (`types.ts`)

```typescript
import type { ReactNode } from "react";

export type PluginCapability = "ui" | "events" | "commands" | "storage" | "shell";

export type PluginManifest = {
  name: string;
  title?: string;
  version?: string;
  description?: string;
  entry?: string;
  entryUrl?: string;
  capabilities: PluginCapability[];
  config?: Record<string, any>;
  enabled?: boolean;
};

export type SlotId =
  | "sidebar.activity"
  | "shell.overlay"
  | "composer.actions"
  | "message.decorate"
  | "settings.section"
  | (string & {});

export type SlotItem = {
  id: string;
  pluginName: string;
  title?: string;
  icon?: string | ReactNode;
  render: (props?: any) => ReactNode;
};

export type PluginDisposer = () => void;

export type PluginContext = {
  pluginName: string;
  config: Record<string, any>;
  ui: {
    registerSlot: (slotId: SlotId, item: Omit<SlotItem, "pluginName">) => PluginDisposer;
  };
  events: {
    on: (event: string, handler: (payload: any) => void) => PluginDisposer;
    emit: (event: string, payload: any) => void;
  };
  commands: {
    register: (cmd: { name: string; description?: string; execute: (args?: string) => any }) => PluginDisposer;
  };
  storage: {
    get: <T>(key: string, fallback?: T) => T | null;
    set: (key: string, value: any) => void;
    remove: (key: string) => void;
  };
  shell: any;
  on: (event: string, handler: (payload: any) => void) => PluginDisposer;
};
```

---

### Paso 2: Bus de Eventos (`bus.ts`)

```typescript
import type { PluginDisposer } from "./types";

class PluginEventBus {
  private listeners = new Map<string, Set<(payload: any) => void>>();

  on(event: string, handler: (payload: any) => void): PluginDisposer {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
    return () => {
      set?.delete(handler);
      if (set?.size === 0) this.listeners.delete(event);
    };
  }

  emit(event: string, payload: any) {
    const set = this.listeners.get(event);
    if (set) {
      for (const handler of set) {
        try { handler(payload); } catch (err) { console.error(err); }
      }
    }
  }
}

export const pluginBus = new PluginEventBus();
```

---

### Paso 3: UI Slots Reactivos (`slots.tsx`)

```typescript
import { useSyncExternalStore, type ReactNode } from "react";
import type { SlotId, SlotItem, PluginDisposer } from "./types";

class SlotRegistry {
  private slots = new Map<SlotId, SlotItem[]>();
  private listeners = new Set<() => void>();

  register(slotId: SlotId, item: SlotItem): PluginDisposer {
    const list = this.slots.get(slotId) ?? [];
    this.slots.set(slotId, [...list.filter((s) => s.id !== item.id), item]);
    this.notify();

    return () => {
      const current = this.slots.get(slotId) ?? [];
      this.slots.set(slotId, current.filter((s) => s.id !== item.id));
      this.notify();
    };
  }

  get(slotId: SlotId): SlotItem[] {
    return this.slots.get(slotId) ?? [];
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) l();
  }
}

export const slotRegistry = new SlotRegistry();

export function PluginSlot({ id, props }: { id: SlotId; props?: any }) {
  const items = useSyncExternalStore(
    (cb) => slotRegistry.subscribe(cb),
    () => slotRegistry.get(id),
  );

  if (items.length === 0) return null;

  return (
    <>
      {items.map((item) => (
        <div key={`${item.pluginName}:${item.id}`} className={`plugin-slot-item plugin-slot-${id.replace(/\./g, "-")}`}>
          {item.render(props)}
        </div>
      ))}
    </>
  );
}
```

---

### Paso 4: Contexto con Capability Gating (`ctx.ts`)

```typescript
import { slotRegistry } from "./slots";
import { pluginBus } from "./bus";
import { shell } from "../shell";
import type { PluginManifest, PluginContext, PluginDisposer } from "./types";

export function createPluginContext(manifest: PluginManifest, disposers: PluginDisposer[]): PluginContext {
  const name = manifest.name;
  const caps = new Set(manifest.capabilities || []);
  const storagePrefix = `opencode.plugin.${name}.`;

  const deny = (cap: string) => {
    throw new Error(`[Plugin:${name}] Capability "${cap}" no declarada en el manifiesto`);
  };

  const rawUI = {
    registerSlot: (slotId: any, item: any) => {
      if (!caps.has("ui")) deny("ui");
      const unreg = slotRegistry.register(slotId, { ...item, pluginName: name });
      disposers.push(unreg);
      return unreg;
    },
  };

  const rawEvents = {
    on: (event: string, handler: any) => {
      if (!caps.has("events")) deny("events");
      const unreg = pluginBus.on(event, handler);
      disposers.push(unreg);
      return unreg;
    },
    emit: (event: string, payload: any) => {
      if (!caps.has("events")) deny("events");
      pluginBus.emit(event, payload);
    },
  };

  const rawCommands = {
    register: (cmd: any) => {
      if (!caps.has("commands")) deny("commands");
      const unreg = pluginBus.on(`cmd:${cmd.name}`, cmd.execute);
      disposers.push(unreg);
      return unreg;
    },
  };

  const rawStorage = {
    get: (key: string, fallback: any = null) => {
      if (!caps.has("storage")) deny("storage");
      try {
        const raw = localStorage.getItem(`${storagePrefix}${key}`);
        return raw !== null ? JSON.parse(raw) : fallback;
      } catch { return fallback; }
    },
    set: (key: string, value: any) => {
      if (!caps.has("storage")) deny("storage");
      try {
        localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value));
      } catch (err) { console.error(err); }
    },
    remove: (key: string) => {
      if (!caps.has("storage")) deny("storage");
      try { localStorage.removeItem(`${storagePrefix}${key}`); } catch {}
    },
  };

  const rawShell = new Proxy(shell, {
    get(target, prop, receiver) {
      if (!caps.has("shell")) deny("shell");
      return Reflect.get(target, prop, receiver);
    },
  });

  return {
    pluginName: name,
    config: manifest.config || {},
    ui: rawUI,
    events: rawEvents,
    commands: rawCommands,
    storage: rawStorage,
    shell: rawShell,
    on: (event: string, handler: any) => rawEvents.on(event, handler),
  };
}
```

---

### Paso 5: Host y Ciclo de Vida (`host.ts`)

```typescript
import { createPluginContext } from "./ctx";
import type { PluginManifest, PluginInstance } from "./types";

class PluginHost {
  private instances = new Map<string, PluginInstance>();

  async loadPlugin(manifest: PluginManifest): Promise<boolean> {
    const name = manifest.name;
    if (this.instances.has(name)) this.unloadPlugin(name);

    const instance: PluginInstance = { manifest, state: "loading", disposers: [] };
    this.instances.set(name, instance);

    try {
      const fullUrl = `${window.location.origin}${manifest.entryUrl || `/shell/plugin/${name}/index.js`}?t=${Date.now()}`;
      const mod = await import(/* @vite-ignore */ fullUrl);

      if (typeof mod.apply !== "function") {
        throw new Error(`El plugin ${name} no exporta apply(ctx)`);
      }

      const ctx = createPluginContext(manifest, instance.disposers);
      const cleanup = await mod.apply(ctx);
      if (typeof cleanup === "function") instance.disposers.push(cleanup);

      instance.state = "active";
      return true;
    } catch (err: any) {
      instance.state = "error";
      instance.error = err?.message || String(err);
      return false;
    }
  }

  unloadPlugin(name: string) {
    const instance = this.instances.get(name);
    if (!instance) return;

    while (instance.disposers.length > 0) {
      const d = instance.disposers.pop();
      try { d?.(); } catch (err) { console.error(err); }
    }

    this.instances.delete(name);
  }
}

export const pluginHost = new PluginHost();
```

---

## 4. Creación de un Plugin de Ejemplo

### `package.json`
```json
{
  "name": "plugin-hello",
  "version": "1.0.0",
  "description": "Demostración de plugin OpenCode",
  "opencode": {
    "entry": "./index.js",
    "capabilities": ["ui", "events", "commands", "storage"],
    "config": {
      "prefix": "⏰"
    }
  }
}
```

### `index.js`
```javascript
export function apply(ctx) {
  // 1. Inyectar widget en la barra lateral
  const unslotSidebar = ctx.ui.registerSlot("sidebar.activity", {
    id: "clock-widget",
    title: "Reloj OpenCode",
    render: () => {
      const timeStr = new Date().toLocaleTimeString();
      return (
        <div style={{ padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, margin: "4px 8px" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{ctx.config.prefix || "⏰"} HORA LOCAL</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{timeStr}</div>
        </div>
      );
    }
  });

  // 2. Inyectar acción rápida en el compositor
  const unslotComposer = ctx.ui.registerSlot("composer.actions", {
    id: "stamp-btn",
    render: () => (
      <button
        type="button"
        className="btn-ghost compact"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("plugin:insert-text", { detail: `[${new Date().toLocaleTimeString()}] ` }));
        }}
      >
        ⏰ Insertar Hora
      </button>
    )
  });

  // 3. Suscripción a eventos SSE
  const unevent = ctx.on("session.updated", (data) => {
    console.log("Sesión actualizada:", data);
  });

  return () => {
    unslotSidebar();
    unslotComposer();
    unevent();
  };
}
```
