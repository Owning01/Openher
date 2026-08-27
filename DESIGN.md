# DESIGN SYSTEM — OpenCode Mobile & Desktop

Guía y especificación completa del sistema de diseño, estética visual, tipografía, paleta de colores y componentes interactivos para **OpenCode Mobile / Desktop**.

---

## 1. Filosofía de Diseño: *Antigravity Aesthetic*

La interfaz adopta una estética **oscura, minimalista, técnica y de alta densidad**, inspirada en IDEs y herramientas de desarrollo modernas (como Google Antigravity y VS Code), optimizada tanto para escritorio como para dispositivos táctiles.

### Principios Fundamentales:
- **Sobriedad visual**: Sin colores saturados o degradados estridentes; los acentos de color se reservan exclusivamente para estados activos, badges informativos o sintaxis de código.
- **Claridad tipográfica**: Texto nítido con suavizado subpixel, jerarquía de tamaños estricta y espaciado compacto.
- **Superficies por capas**: Profundidad lograda a través de tonos de fondo sutilmente diferenciados (`#09090b` $\rightarrow$ `#121215` $\rightarrow$ `#18181c` $\rightarrow$ `#222226`) y bordes finos de 1px.
- **Micro-interacciones limpias**: Transiciones cortas (120ms–150ms) en hover/focus sin animaciones lentas o intrusivas.

---

## 2. Tipografía & Renderizado

### Pila de Fuentes (Font Stack)

```css
/* Interfaz general / UI */
--font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, "Helvetica Neue", Arial, sans-serif;

/* Código, consola y terminales */
--font-mono: "JetBrains Mono", "SF Mono", "Fira Code", "Cascadia Code", Consolas, monospace;
```

### Configuración Global de Renderizado

```css
html, body {
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  letter-spacing: -0.011em;
}
```

### Escala Tipográfica

| Nivel | Tamaño | Peso | Line-Height | Uso |
|---|---|---|---|---|
| **H1** | `1.35rem` (21px) | 600 | 1.2 | Título principal de vistas y paneles |
| **H2** | `1.15rem` (18px) | 600 | 1.25 | Títulos de sección y modales |
| **H3** | `0.95rem` (15px) | 600 | 1.3 | Encabezados de grupo / Cards |
| **Body** | `13px` / `0.85rem` | 400–450 | 1.5–1.6 | Párrafos, mensajes del chat, opciones |
| **Small / Muted** | `12px` / `0.78rem` | 400 | 1.4 | Descripciones, metadatos, timestamps |
| **Code Inline** | `12.5px` | 500 | Normal | Snippets dentro de mensajes y docs |
| **Code Block** | `12.5px` | 400 | 1.55 | Bloques de código multilínea con syntax highlight |

---

## 3. Paleta de Colores & Tokens

### Modo Oscuro Principal (`data-theme="dark"`)

```css
:root[data-theme="dark"] {
  /* Fondos y Superficies */
  --bg: #09090b;              /* Fondo de ventana principal (pitch black / zinc-950) */
  --surface: #121215;         /* Paneles y tarjetas primarias */
  --surface-subtle: #18181c;  /* Entornos de input y barras secundarias */
  --surface-strong: #222226;  /* Píldoras activas y estados hover destacados */
  --surface-hover: #27272a;   /* Hover en botones y elementos de lista */

  /* Bordes */
  --border: #222226;          /* Borde estructural estándar de 1px */
  --border-strong: #333338;   /* Borde para componentes en hover o foco */
  --border-subtle: #1c1c20;   /* Separadores y líneas tenues */

  /* Textos */
  --text: #f4f4f5;            /* Texto principal (blanco roto de alto contraste) */
  --foreground: var(--text);
  --muted: #a1a1aa;           /* Descripciones secundarias y etiquetas */
  --muted-strong: #d4d4d8;    /* Textos secundarios con mayor peso */

  /* Acentos y Acciones */
  --primary: #6366f1;         /* Índigo moderno para selecciones y links */
  --primary-strong: #818cf8;
  --primary-soft: rgba(99, 102, 241, 0.12);
  --focus-ring: rgba(99, 102, 241, 0.25);

  /* Estados Funcionales */
  --success: #4ade80;         /* Verde esmeralda (éxito / conectado) */
  --success-soft: rgba(74, 222, 128, 0.1);
  --danger: #fb7185;          /* Rosa / Rojo técnico (error / desconectado) */
  --danger-soft: rgba(251, 113, 133, 0.1);
  --warning: #fbbf24;         /* Ámbar (advertencia / pensando / streaming) */
  --warning-soft: rgba(251, 191, 36, 0.1);

  /* Bloques de Código & Markdown */
  --code-bg: #0e0e11;
  --code-text: #f4f4f5;
  --code-keyword: #818cf8;
  --code-string: #4ade80;
  --code-comment: #71717a;
  --code-number: #fbbf24;
}
```

---

## 4. Componentes y Patrones de Interfaz

### 4.1. Panel de Configuración (`Settings`)
- **Estructura a dos columnas**: Sidebar izquierdo de ancho fijo (`230px`) y área de contenido scrollable (`1fr`).
- **Sidebar**:
  - Encabezados de sección limpios (`Settings`, `Projects`, `Not in Project`) en mayúsculas pequeñas (`11px`, `color: #71717a`).
  - Navegación textual sin iconos (`General`, `Application`, `Appearance`, `Models`, `Customizations`, `Browser`).
  - Píldora activa con fondo `#222226`, borde `#2e2e34` y texto blanco `#ffffff`.
  - Pie con accesos directos (`Shortcuts`, `Provide Feedback`) y tarjeta de usuario inferior.
- **Fila de Configuración (`.setting-item-row`)**:
  - Tarjeta rectangular horizontal con información a la izquierda (Título `13px` + Descripción `12px`) y control a la derecha.
  - Fondo `#121215`, borde `1px solid #222226`, radio `6px`.

```html
<div class="setting-item-row">
  <div class="setting-item-info">
    <span class="setting-item-title">Artifact Review Policy</span>
    <p class="setting-item-desc">Control when artifacts require explicit user review.</p>
  </div>
  <div class="setting-item-control">
    <select class="ag-select">...</select>
  </div>
</div>
```

### 4.2. Selects y Dropdowns (`.ag-select`)
- Fondo `#1c1c1f`, borde `#2c2c31`, tipografía `12.5px`, icono chevron integrado vía SVG en CSS.

### 4.3. Controles Segmentados (`.ag-segmented`)
- Contenedor `#141417` con borde `#222226` y botones de píldora interior (`.ag-segmented-btn`).
- Píldora activa con fondo `#27272a` y sombra suave.

### 4.4. Botones (`button`, `.btn-*`, `.ag-btn-open`)
- **Botón estándar**: Altura mínima `38px`, padding `0.5rem 0.85rem`, peso `500`, tamaño `13px`, radio `6px`.
- **Botón Primario (`.btn-primary`)**: Fondo `--primary` (`#6366f1`), texto blanco.
- **Botón de Acción (`.ag-btn-open`)**: Fondo `#222226`, borde `#333338`, texto `#e4e4e7`, hover `#2b2b30`.
- **Botón Fantasma (`.btn-ghost`)**: Fondo transparente, texto `--muted-strong`, hover `#222226`.

### 4.5. Mensajes del Chat
- **Burbuja de Usuario**: Alineada a la derecha o en caja `#18181c`, borde `1px solid #27272a`, radio `8px`, texto `#f4f4f5`.
- **Respuesta del Asistente**: Fondo transparente / superficie natural, formato Markdown enriquecido sin marcos pesados.
- **Bloques de Código**: Fondo `#0e0e11`, borde `1px solid #222226`, scroll horizontal automático, barra de lenguaje superior limpia.
- **Bloques de Pensamiento (*Thinking*)**: Texto en cursiva `--muted` (`#a1a1aa`), fondo `#141417` con borde sutil.

### 4.6. Activity Bar y Desktop Shell
- **Activity Bar (44px)**: Fondo `#09090b`, borde derecho `1px solid #1c1c20`.
- Botones de 38×38px centrados; el activo adopta fondo `#222226`, borde `#333338` y color blanco.

### 4.7. Scrollbars
- Ancho / alto de **5px**.
- Track transparente (`background: transparent`).
- Thumb `#27272a` con radio `999px`; hover `#3f3f46`.

---

## 5. Reglas de Consistencia (Checklist para Desarrolladores)

Al agregar o modificar vistas y componentes:

1. **Evitar fuentes del sistema no declaradas**: Usar siempre `var(--font-family)` o `var(--font-mono)`.
2. **Evitar grises claros o fondos azules saturados en modo oscuro**: Utilizar los tokens semánticos (`--bg`, `--surface`, `--surface-strong`, `--border`).
3. **No amontonar botones de control en headers**: Dejar los títulos limpios con botón de cierre `✕` en la esquina derecha superior.
4. **Prohibido el uso de bordes gruesos (>1px) o sombras de colores**: Todo marco estructural debe ser de `1px` con `--border` (`#222226`) o `--border-strong` (`#333338`).
5. **No usar `font-weight: 700` o `800` en textos de botones estándar**: Mantener `font-weight: 500` para un acabado elegante.
6. **Validar contraste WCAG AA**: Cualquier texto sobre fondo `--surface` debe cumplir con ratio mínimo de 4.5:1 (con `--text` o `--muted-strong`).
