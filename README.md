<div align="center">

  <img src="https://raw.githubusercontent.com/Owning01/Opencode-Mobile/main/web/public/img/opencode-logo-dark.jpg" width="64" height="64" alt="OpenCode Logo" style="border-radius: 12px;" />

# ⚡ OpenCode Mobile

**Cliente Android para [OpenCode](https://opencode.ai) — tu asistente de codificación AI desde el celular**

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React 18"/>
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Capacitor-8.0-119EFF?logo=capacitor&logoColor=white" alt="Capacitor"/>
  <img src="https://img.shields.io/badge/212%20tests-%E2%9C%85%20passing-4caf7d" alt="Benchmarks"/>
  <br/>
  <img src="https://img.shields.io/badge/SSE%20streaming-%E2%9C%85-6c8cff" alt="SSE"/>
  <img src="https://img.shields.io/badge/Offline%20cache-%E2%9C%85-6c8cff" alt="Offline"/>
  <img src="https://img.shields.io/badge/i18n-4%20idiomas-6c8cff" alt="i18n"/>
  <img src="https://img.shields.io/badge/30%2B%20temas-%E2%9C%85-6c8cff" alt="Themes"/>
</p>

</div>

---

## ✨ Características

<div class="features-grid">

| | |
|---|---|
| **⚡ Streaming en tiempo real** | Eventos SSE via `/event` — indicadores de escritura, entrega instantánea |
| **🔄 Polling adaptativo** | 4 modos: Full (3.5s), Saver (15s), Ultra (30s), Miser (60s). Cambio automático en datos móviles |
| **📦 Cache offline** | IndexedDB — navegá sesiones y mensajes sin conexión |
| **💬 Chat completo** | Enviá prompts, comandos, shell. Abortá, revertí, undo/redo |
| **📋 Diff viewer** | Diffs expandibles por archivo con carga inline de contenido |
| **📁 Gestión de sesiones** | Crear, renombrar, eliminar, favoritos, archivar, exportar snapshots |
| **🤖 Control de agentes AI** | Seleccioná y cambiá entre agentes/modelos por sesión |
| **🔌 Multi-proveedor** | Conectá proveedores externos (OpenAI, Anthropic, etc.) via API key |
| **📂 File browser** | Navegá archivos remotos del proyecto |
| **🌿 Git toolbar** | Stage, commit, estado de rama (ahead/behind) |
| **🎤 Entrada por voz** | Speech-to-text con Web Speech API + plugin nativo Capacitor |
| **🔐 Permisos y Preguntas** | Modales automáticos para preguntas del AI y permisos de herramientas |
| **🎨 30+ temas** | Modos oscuro, claro, sistema y programado; selector de variantes con preview |
| **🌍 i18n** | Español, English, Italiano, 繁體中文 |
| **📉 Auto-summarize** | Compactación automática cuando el contexto crece |
| **📋 Plan breakdown** | Visualización de tareas para flujos de orquestación AI |
| **⌨️ Atajos de teclado** | Tab + acciones para usuarios avanzados |
| **🚀 Deploy rápido** | Scripts de 1 comando para LAN (misma WiFi) o tunnel (cualquier red) |
| **📝 Editor de archivos** | Leer, editar y guardar archivos del proyecto |
| **🖼️ Lightbox de imágenes** | Vista completa con zoom y arrastre |
| **🧩 MCP Browser** | Explorá recursos MCP conectados |
| **📦 Cola offline** | Las acciones se encolan y reenvían al reconectar |
| **🎨 Creador de temas** | Editor visual de colores con exportación JSON |
| **⭐ Favoritos reordenables** | Arrastrá y soltá para ordenar |

</div>

---

## 🕸️ Grafos de dependencias

<details>
<summary><b>📡 Transporte</b> — SSE, polling, cache y cola offline</summary>

```mermaid
flowchart LR
    classDef infra fill:#1a1a2e,stroke:#6c8cff,color:#eee
    classDef core fill:#1e3a5f,stroke:#5ba3e6,color:#eee
    S(["🖥️ Servidor"]) --> A["🌐 api.ts"]
    A --> SSE["useSSE.ts<br/>SSE streaming"]
    A --> Poll["usePolling.ts<br/>Backoff 1s→60s"]
    A --> Cache["useOfflineCache.ts<br/>IndexedDB"]
    A --> Queue["useOfflineQueue.ts<br/>Cola offline"]
    Poll -->|pausa/reanuda| SSE
    Queue -.->|replay| A
    class S infra
    class A,SSE,Poll,Cache,Queue core
```
</details>

<details>
<summary><b>🧠 Estado</b> — hooks principales y sus relaciones</summary>

```mermaid
flowchart LR
    classDef hook fill:#2d1b4e,stroke:#a78bfa,color:#eee
    classDef core fill:#1e3a5f,stroke:#5ba3e6,color:#eee
    C["useConfig"] --> S["useSessions<br/>CRUD + favs"]
    C --> M["useMessages<br/>send + undo"]
    C --> A["useAI<br/>agentes/modelos"]
    C --> Si["useSessionSidecar<br/>todos/diffs"]
    M -->|optimistic| S
    S -->|selectedID| M
    A -->|activeModel| M
    F["useFeatureFlags"] -.->|toggle| M
    N["useNetworkMode"] -.->|modo datos| C
    Shell["useShell"] -->|terminal| M
    Speech["useSpeechRecognition"] -->|voz| M
    class C,S,M,A,Si,F,N,Shell,Speech hook
```
</details>

<details>
<summary><b>🖥️ UI</b> — App, vistas principales y modales</summary>

```mermaid
flowchart LR
    classDef ui fill:#3b1f3b,stroke:#f0c060,color:#eee
    classDef modal fill:#4a2040,stroke:#d08050,color:#eee
    App["App.tsx<br/>Orquestador"] --> CV["ChatView"]
    App --> SL["SessionList"]
    App --> SP["SettingsPanel"]
    App --> HP["HelpPage"]
    App --> Mod["15 modales<br/>⬇"]
    CV --> MB["MessageBubble"]
    CV --> C["Composer"]
    CV --> ML["MessageList"]
    CV --> TB["ThinkingBlock"]
    CV --> TP["ToolPart"]
    SL --> SC["SessionCard"]
    SL --> AL["ArchivedList"]
    SP --> PM["ProviderManager"]
    SP --> TPk["ThemePicker"]
    subgraph Modales[" "]
        DIFF["DiffViewer"]
        FE["FileEditor"]
        TV["TerminalView"]
        MCP["MCPBrowser"]
        TC["ThemeCreator"]
        IL["ImageLightbox"]
        FM["FavoritesManager"]
        QP["QuestionPrompt"]
        PP["PermissionPrompt"]
        SB["SkillBrowser"]
    end
    class App,CV,SL,SP,HP ui
    class DIFF,FE,TV,MCP,TC,IL,FM,QP,PP,SB,AL,PM,TPk modal
```
</details>

<details>
<summary><b>🔧 Transversal</b> — servicios compartidos</summary>

```mermaid
flowchart LR
    classDef cross fill:#1b3b2b,stroke:#4caf7d,color:#eee
    I18N["🌍 i18n.ts<br/>4 idiomas"]
    Theme["🎨 resolveTheme.ts<br/>30+ temas"]
    Styles["📄 styles.css<br/>~5000 líneas"]
    Types["📐 types.ts<br/>38 tipos"]
    Icons["🖼️ Icons.tsx<br/>31 SVGs"]
    Bench["📊 benchmarks/<br/>212 tests"]
    I18N --> App
    Theme --> ThemePicker
    Styles --> App
    Types --> App
    Icons --> UI
    Bench -.-> API
    class I18N,Theme,Styles,Types,Icons,Bench cross
```
</details>

## 🚀 Inicio rápido

```bash
# Web preview
cd web
pnpm install
pnpm dev                # → http://localhost:5173

# Build APK completo
pnpm build && npx cap sync && cd android
.\gradlew assembleDebug

# O con deploy script
.\deploy-quick.ps1            # Misma WiFi
.\deploy-quick.ps1 -Tunnel    # Cualquier red
```

---

## 🖥️ Configurar el servidor

```bash
OPENCODE_SERVER_USERNAME=opencode \
OPENCODE_SERVER_PASSWORD=tu-contraseña \
npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096
```

> 💡 El puerto `4096` se auto-asigna por defecto en la app.

---

## 🔗 Conectar desde cualquier red (Tailscale)

[Tailscale](https://tailscale.com) crea una VPN mesh segura — tu teléfono y PC se conectan via IP privada incluso en redes diferentes.

```bash
# En tu PC:
tailscale ip -4
# → 100.x.x.x

# Iniciar servidor en Tailscale IP:
OPENCODE_SERVER_USERNAME=opencode \
OPENCODE_SERVER_PASSWORD=tu-contraseña \
npx -y opencode-ai serve --hostname 100.x.x.x --port 4096
```

En el teléfono: **Host** = `100.x.x.x`, **Port** = `4096`, **Username/Password** = los mismos.

---

> 📖 **Catálogo completo**: [`CATALOGO.md`](CATALOGO.md) — 47 componentes, 27 hooks, 35 endpoints, grafos, guía para LLM.

## 📁 Estructura del proyecto

```
web/
├── src/
│   ├── components/       # 43 componentes UI
│   ├── hooks/            # 26 hooks React
│   ├── api.ts            # Cliente HTTP (30 endpoints)
│   ├── App.tsx           # Orquestador principal
│   ├── types.ts          # Tipos TypeScript
│   ├── i18n.ts           # 4 idiomas
│   └── styles.css        # Sistema de diseño completo
├── android/              # Proyecto nativo Android
```

---

## 🏗️ Arquitectura

| Principio | Descripción |
|-----------|-------------|
| **🔄 SSE + Polling handoff** | Cuando SSE está activo, el polling corre a 5s en vez del intervalo completo. Al desconectarse, el backoff entra inmediatamente |
| **📈 Backoff exponencial** | Polling empieza en 1s, se duplica por cada fallo hasta 60s, con 30% de jitter. SSE similar pero tope en 30s |
| **📦 Offline-first** | IndexedDB cachea sesiones + mensajes. Navegar datos antiguos funciona offline; las escrituras requieren conectividad |
| **⚡ Optimistic updates** | Los mensajes del usuario se renderizan inmediatamente antes del round-trip al servidor |
| **🛡️ Stale request rejection** | `loadSelected` usa un ID de request para descartar respuestas de polling obsoletas |
| **🎨 Temas dinámicos** | 30+ temas con variables CSS aplicadas en runtime via `resolveTheme.ts` |

---

<div align="center">

**OpenCode Mobile** es un cliente para [**OpenCode**](https://opencode.ai) — el asistente de codificación AI open-source.

Desarrollado por [@Owning01](https://github.com/Owning01) · [Reportar issue](https://github.com/Owning01/Opencode-Mobile/issues) · [Contribuir](https://github.com/Owning01/Opencode-Mobile)

</div>

