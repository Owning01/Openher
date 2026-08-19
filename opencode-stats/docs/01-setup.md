# OpenCode Stats — Setup

Aplicación web local (servida desde Rust) para consultar el consumo de tokens
de opencode a lo largo de toda la historia de chats.

## 1. Prerrequisitos

| Herramienta | Versión | Nota |
|---|---|---|
| Rust | 1.94+ (edición 2024) | `cargo` desde rustup |
| opencode | cualquiera | La app lee `opencode.db` (no lo toca) |

La base de datos que se lee es:

```
C:\Users\<usuario>\.local\share\opencode\opencode.db
```

Se abre en **modo solo lectura** (`mode=ro`), por lo que se puede consultar
mientras opencode está corriendo sin riesgo de corrupción ni locks.

## 2. Instalación

```powershell
cd G:\Proyectos\opencode-stats
cargo build --release
```

Dependencias: `rusqlite` (SQLite bundled, incluye JSON1 y backup), `tiny_http`
(servidor HTTP síncrono), `wry` + `winit` (ventana WebView2), `chrono` (fechas
locales), `serde_json`. Tailwind y Chart.js están vendoreados en `static/vendor/`
para funcionar offline.

## 3. Ejecución

Doble clic en el acceso directo `OpenCode Stats` del escritorio (apunta a
`target\release\opencode-stats.exe`), que abre la ventana embebida.

O manualmente:

```powershell
cargo run --release                 # ventana embebida (wry/WebView2)
OPENCODE_STATS_HIDE_WINDOW=1 cargo run   # solo servidor en http://127.0.0.1:8765
cargo run --bin stats-watch         # monitor de terminal (lee la API local)
```

El servidor escucha solo en `127.0.0.1`. Cerrar la ventana = apagar todo.

## 4. Uso

- **Filtros** (barra superior): `Desde` / `Hasta` (fecha) y `Modelo` (substring).
  Afectan a todos los paneles y gráficos.
- **Cards**: totales de input, output, reasoning, cache read, cache write y costo
  (el de la DB + estimado según precios oficiales de OpenCode Go).
- **Pestañas**:
  - `Resumen`: gráfico de costo por día y distribución por modelo + estadísticas.
  - `Por modelo`: sesiones, peticiones, tokens y costo estimado por modelo.
  - `Por proyecto` / `Por día` / `Por mes`: desgloses por agregación.
  - `Sesiones`: top 40 por costo (título, modelo, inicio, tokens).
  - `Límites y precios`: uso de peticiones vs cuota de OpenCode Go (ventanas
    móviles de 5 h, 7 y 30 días) y tabla de precios por 1M tokens.
  - `Gestión`: administración de la base (ver README).
- **Exportar CSV**: descarga la tabla por modelo actual con los filtros aplicados.

## 5. Notas sobre las estimaciones

- **Peticiones**: se cuentan las respuestas del asistente (parts `type=text` de
  mensajes `role=assistant`). Es una buena aproximación a "completions" pero no
  es el contador exacto del proveedor.
- **Costo estimado**: tokens reales × precios oficiales de OpenCode Go (tramo
  base en modelos con precio por tramo: GPT 5.6 Luna, Qwen3.7/3.6 Plus).
- Los modelos `*-free` (provider `opencode`) no cotizan y se marcan como `—`.

## 6. Estructura

```
opencode-stats/
├── Cargo.toml
├── src/
│   ├── main.rs                  # entry: server en thread + ventana wry/winit
│   ├── server.rs                # HTTP tiny_http + estáticos
│   ├── payload.rs               # build_payload (contrato JSON del frontend)
│   ├── db.rs                    # acceso SQLite (solo lectura) + conteo de peticiones
│   ├── admin.rs                 # capa de escritura (gestión) con guardas
│   ├── pricing.rs               # precios y límites de OpenCode Go
│   ├── types.rs                 # Session/Group/Price/AdminAction/ApiError/formatos
│   └── bin/
│       ├── stats-watch.rs       # monitor de terminal
│       └── make-icon.rs         # generador del logo (assets/)
├── static/
│   ├── index.html               # layout (Tailwind)
│   ├── app.js                   # lógica frontend (tablas genéricas DRY)
│   ├── admin.js                 # pestaña Gestión
│   ├── app.css                  # estilos base
│   └── vendor/                  # tailwind.js + chart.js (offline)
├── tests/                       # 42 tests con DB temporal (no tocan la real)
└── docs/
    ├── 01-setup.md              # este archivo
    ├── 02-arquitectura.md       # diagrama y flujo de datos
    └── migracion-rust/          # inventario de la migración (referencia)
```
