---
name: openher-add-plugin
description: Guía paso a paso para crear, desarrollar, probar e integrar nuevos plugins y extensiones ESM en OpenHer Mobile / Desktop utilizando los UI Slots (sidebar, composer, overlay, settings), bus de eventos SSE, comandos y storage con capability gating.
---

# Cómo Crear y Agregar un Plugin a OpenHer

Esta skill enseña cómo desarrollar e instalar un plugin en **OpenHer Mobile / Desktop**. Los plugins son módulos ESM ligeros que se ejecutan directamente en la aplicación y se extienden a través de puntos de inserción visual (**UI Slots**), escucha de eventos SSE de la IA en tiempo real y comandos personalizados.

---

## 1. Dónde se Instalan los Plugins

Los plugins se ubican como carpetas dentro del directorio de plugins de la aplicación:

```
data/plugins/
└── <tu-plugin>/
    ├── package.json   # Manifiesto y declaración de capacidades
    └── index.js       # Código JavaScript ESM compilado con export apply(ctx)
```

> **Nota:** La aplicación escanea automáticamente las carpetas dentro de `data/plugins/` al iniciar o al solicitar una recarga en caliente vía `POST /shell/plugins/reload`.

---

## 2. Paso 1: Crear el Manifiesto (`package.json`)

El archivo `package.json` define los metadatos del plugin y las **capacidades (capabilities)** que solicita. Si un plugin intenta usar una API que no declaró en sus capacidades, el sistema denegará la llamada por seguridad.

### Ejemplo de `package.json`:

```json
{
  "name": "mi-super-plugin",
  "title": "Mi Super Plugin",
  "version": "1.0.0",
  "description": "Añade herramientas personalizadas al chat y la barra lateral.",
  "opencode": {
    "entry": "./index.js",
    "capabilities": [
      "ui",
      "events",
      "commands",
      "storage"
    ],
    "config": {
      "modo": "activo",
      "contadorInicial": 0
    }
  }
}
```

### Capacidades Disponibles:

| Capacidad | Permite | APIs Habilitadas en `ctx` |
|---|---|---|
| `"ui"` | Inyectar componentes visuales en slots | `ctx.ui.registerSlot(slotId, item)` |
| `"events"` | Escuchar y emitir eventos del sistema y SSE | `ctx.on(evento, callback)`, `ctx.events.emit()` |
| `"commands"` | Registrar comandos rápidos / slash | `ctx.commands.register(cmd)` |
| `"storage"` | Persistir datos aislados en LocalStorage | `ctx.storage.get()`, `ctx.storage.set()` |
| `"shell"` | Llamadas puente al backend local | `ctx.shell.*` (FS, PTY, git) |

---

## 3. Paso 2: Desarrollar el Módulo ESM (`index.js`)

El archivo `index.js` debe exportar una función `apply(ctx)`. 

- Recibe el contexto seguro `ctx`.
- Puede registrar slots de interfaz, comandos y eventos.
- **Debe retornar una función de limpieza (disposer)** para desregistrar todo al descargar o recargar el plugin.

### Estructura base de `index.js`:

```javascript
export function apply(ctx) {
  console.log("[MiPlugin] Inicializado con config:", ctx.config);

  // 1. Inyectar UI en un Slot
  const unslot = ctx.ui.registerSlot("sidebar.activity", {
    id: "mi-widget",
    title: "Mi Widget",
    render: (props) => {
      return (
        <div style={{ padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, margin: "4px 8px" }}>
          <strong style={{ color: "var(--text)" }}>Hola desde Mi Plugin</strong>
        </div>
      );
    }
  });

  // 2. Escuchar eventos SSE de la sesión
  const unevent = ctx.on("session.updated", (event) => {
    console.log("[MiPlugin] Evento recibido:", event);
  });

  // 3. Registrar comando
  const uncmd = ctx.commands.register({
    name: "saludo",
    description: "Inserta un saludo",
    execute: () => "¡Hola desde el plugin!"
  });

  // Retornar limpieza
  return () => {
    unslot();
    unevent();
    uncmd();
    console.log("[MiPlugin] Desmontado correctamente.");
  };
}
```

---

## 4. Puntos de Extensión Visual (UI Slots Disponibles)

Puedes inyectar elementos visuales en cualquiera de los siguientes **Slots**:

### 1. `sidebar.activity` (Barra lateral / Actividades)
Inyecta un panel, widget o tarjeta dentro del cuerpo de la barra lateral izquierda del escritorio.
```javascript
ctx.ui.registerSlot("sidebar.activity", {
  id: "monitor-panel",
  title: "Monitor del Proyecto",
  render: () => (
    <div style={{ padding: 10 }}>Widget de monitoreo en sidebar</div>
  )
});
```

### 2. `composer.actions` (Barra de acciones del Compositor de Chat)
Inyecta botones o selectores en la barra inferior del chat, al lado de los botones de traducción o agente.
```javascript
ctx.ui.registerSlot("composer.actions", {
  id: "quick-stamp-btn",
  render: () => (
    <button
      type="button"
      className="btn-ghost compact"
      style={{ fontSize: 11, padding: "2px 6px" }}
      onClick={() => {
        // Disparar inserción de texto en el input del chat
        window.dispatchEvent(new CustomEvent("plugin:insert-text", {
          detail: "[TAG_PERSONALIZADO] "
        }));
      }}
    >
      🏷️ Etiqueta
    </button>
  )
});
```

### 3. `settings.section` (Secciones de Ajustes)
Añade una sección completa dentro del panel de Configuración de la app.
```javascript
ctx.ui.registerSlot("settings.section", {
  id: "mi-config-section",
  title: "Ajustes de Mi Plugin",
  render: () => (
    <div className="settings-section">
      <h3 style={{ fontSize: 13, fontWeight: 700 }}>Opciones de Mi Plugin</h3>
      <p style={{ fontSize: 12, color: "var(--muted)" }}>Configuración personalizada del plugin.</p>
    </div>
  )
});
```

### 4. `shell.overlay` (Capa Flotante Global)
Inyecta modales, banners flotantes, barras de estado o HUDs sobre la aplicación completa.

---

## 5. Uso del Storage Aislado (`ctx.storage`)

Cada plugin cuenta con un almacén clave-valor persistente con prefijo automático `opencode.plugin.<name>.`:

```javascript
// Guardar valor (se serializa a JSON automáticamente)
ctx.storage.set("ultima_visita", new Date().toISOString());
ctx.storage.set("contador", 42);

// Leer valor con valor por defecto
const contador = ctx.storage.get("contador", 0);

// Eliminar clave
ctx.storage.remove("ultima_visita");
```

---

## 6. Escucha de Eventos en Tiempo Real

El bus de eventos reenvía todos los eventos SSE del servidor de IA:

- `"session.updated"`: Cambio de estado o mensajes en la sesión activa.
- `"message.part.updated"`: Flujo de deltas de texto, pensamiento o llamadas a herramientas.
- `"*``: Escucha de cualquier evento del sistema.

```javascript
ctx.on("session.updated", ({ sessionID, directory, type }) => {
  console.log(`Sesión ${sessionID} en ${directory} tuvo evento ${type}`);
});
```

---

## 7. Paso a Paso para Instalar y Probar el Plugin

1. Crea la carpeta en `data/plugins/<tu-plugin>/`.
2. Crea `data/plugins/<tu-plugin>/package.json` con el campo `"opencode"`.
3. Crea `data/plugins/<tu-plugin>/index.js` con tu función `apply(ctx)`.
4. Abre o recarga la aplicación de escritorio (**OpenHer Desktop**). El plugin se cargará automáticamente al arrancar.
5. Para forzar una recarga en caliente sin reiniciar la app:
   - En la consola de desarrollo o vía código ejecuta: `shell.plugins.reload()`.
   - Para deshabilitarlo temporalmente: `shell.plugins.toggle("<tu-plugin>", false)`.
