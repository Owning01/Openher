<div align="center">

  <img src="https://raw.githubusercontent.com/Owning01/Opencode-Mobile/main/web/public/img/opencode-logo-dark.jpg" width="64" height="64" alt="OpenCode Logo" style="border-radius: 12px;" />

# OpenCode Mobile

**Cliente Android/iOS para [OpenCode](https://opencode.ai) — tu asistente de codificación AI desde el celular**

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React 18"/>
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Capacitor-8.0-119EFF?logo=capacitor&logoColor=white" alt="Capacitor"/>
  <img src="https://img.shields.io/badge/4%20suites%20de%20tests-%E2%9C%85%20passing-4caf7d" alt="Tests"/>
  <br/>
  <img src="https://img.shields.io/badge/SSE%20streaming-%E2%9C%85-6c8cff" alt="SSE"/>
  <img src="https://img.shields.io/badge/Cache%20offline-%E2%9C%85-6c8cff" alt="Offline"/>
  <img src="https://img.shields.io/badge/i18n-4%20idiomas-6c8cff" alt="i18n"/>
  <img src="https://img.shields.io/badge/30%2B%20temas-%E2%9C%85-6c8cff" alt="Themes"/>
</p>

**Español** · [**English**](README.md)

</div>

---

<div align="center">

**Tu asistente de codificación AI, desde el celular** — respuestas en streaming, herramientas en tiempo real, terminal, escritorio remoto y control total de la configuración.

</div>

| Chat en vivo | Sesiones | Conectar servidor |
| :---: | :---: | :---: |
| [![Chat en vivo](./marketing/github/thumbs/live-chat.png)](./screenshots/chat+thinking.png) | [![Sesiones](./marketing/github/thumbs/sessions.png)](./screenshots/home-1.png) | [![Conectar servidor](./marketing/github/thumbs/connect-server.png)](./screenshots/settings-1.png) |
| **Modos de datos** | **Control total** | **Configuración del chat y más** |
| [![Modos de datos](./marketing/github/thumbs/data-modes.png)](./screenshots/settings-4.png) | [![Control total](./marketing/github/thumbs/full-control.png)](./screenshots/Settings-3.png) | [![Configuración del chat y más](./marketing/github/thumbs/get-it-now.png)](./screenshots/Settingsdentrodelchat.png) |

```
┌──────────────────────────────────────────────┐
│              📱 TU CELULAR                    │
│          OpenCode Mobile (la app)            │
└──────────────────────┬───────────────────────┘
                       │
                       │  ① Tailscale — VPN privada
                       │     sin abrir puertos en tu router
                       ▼
┌──────────────────────────────────────────────┐
│                🖥️ TU PC                       │
│           Tailscale node                      │
└──────────────────────┬───────────────────────┘
                       │
                       │  ② localhost:4096
                       ▼
┌──────────────────────────────────────────────┐
│               🤖 OPENCODE                     │
│     el servidor con tu código y tus tools    │
└──────────────────────────────────────────────┘
```

---

## 🚀 Empezar en 2 pasos

### 📲 1 — Instalá la app en tu celular

[⬇️ **Descargar OpenCodeMobile.apk**](https://github.com/Owning01/Opencode-Mobile/releases/latest)

O construíla vos mismo (ver [desarrollo](#-desarrollo)).

**iOS** (requiere macOS + Xcode 16+): cloná el repo y abrí `web/ios/App/App.xcworkspace` en Xcode, seleccioná tu team de desarrollo y Build & Run.

---

### 🖥️ 2 — Instalá Tailscale en tu PC (para acceso remoto)

OpenCode Mobile se conecta a tu servidor OpenCode por HTTP directo. Para **acceso remoto desde cualquier red** (no solo tu WiFi), usá [**Tailscale**](https://tailscale.com) — una VPN mesh privada, gratuita y sin configuración.

#### Paso A — Instalá Tailscale en la PC (servidor)

1. Instalá Tailscale desde https://tailscale.com/download (Windows/macOS/Linux).
2. Iniciá sesión con tu cuenta y uní la PC a tu tailnet:
   ```
   tailscale up
   ```
3. Buscá la IP de Tailscale de la PC:
   ```
   tailscale ip -4
   ```
   → ej. `100.101.102.103`. Anotala — nunca cambia.

#### Paso B — Iniciá OpenCode escuchando en la interfaz Tailscale

OpenCode escucha en **0.0.0.0** por defecto, así que la IP de Tailscale ya es alcanzable — sin flags extra:

```
npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096
```

> 🔒 **Tip de seguridad**: activá autenticación para que el tailnet no sea la única protección:
> ```
> set OPENCODE_SERVER_USERNAME=opencode
> set OPENCODE_SERVER_PASSWORD=<una contraseña fuerte>
> npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096
> ```

#### Paso C — Instalá Tailscale en tu celular

1. Instalá **Tailscale** desde Play Store / App Store.
2. Iniciá sesión con la **misma cuenta** que la PC.
3. Tu celular ya está en la misma red privada que la PC — incluso con 4G/5G.

#### Paso D — Conectá la app

En OpenCode Mobile: **Ajustes → Servidor**:

| Campo | Valor |
|-------|-------|
| Host | La IP de Tailscale de la PC, ej. `100.101.102.103` |
| Puerto | `4096` (o el puerto en que iniciaste el servidor) |
| Usuario / Contraseña | Solo si activaste auth en el Paso B |

Tocá **Probar conexión** y luego **Guardar**. ✓ Listo — podés usar OpenCode desde cualquier lugar, sin abrir puertos en tu router.

---

### 🏠 Alternativa: WiFi local (sin Tailscale)

Si siempre estás en la misma red:
1. En PC: `npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096`
2. En la app: **Ajustes → Servidor**, poné la IP local de tu PC (ej. `192.168.1.20`)

---

### ❓ Preguntas frecuentes de Tailscale

- **¿Es gratis?** Sí — hasta 100 dispositivos y 3 usuarios en el plan gratuito.
- **¿Necesita abrir puertos en el router?** No. Tailscale usa NAT traversal (con relay de respaldo) — tu router no necesita nada.
- **¿Por qué no un túnel QR/WebRTC?** Tailscale es más confiable (relay de respaldo), ya está probado, y le da a tu PC una IP privada estable.
- **El celular muestra "offline"?** Verificá que Tailscale esté **conectado** (verde) en el celular y que el `tailscale status` de la PC muestre ambos dispositivos.

---

## 📱 Datos móviles

<details>
<summary><b>Datos móviles — modos de consumo</b> (clic para expandir)</summary>

La app ajusta automáticamente el modo al detectar datos móviles (cellular → Reducido, WiFi → Full).
También podés cambiarlo manualmente en **Ajustes**.

| Modo | Polling | KB/min (idle) | ~30 min | Ideal para |
|------|---------|---------------|---------|------------|
| **Full** | 3.5s | ~35 KB | ~1 MB | WiFi ilimitado · streaming SSE en tiempo real con audio |
| **Balance** | 15s | ~10 KB | ~300 KB | WiFi o datos generosos · payload completo + notificaciones |
| **Reducido** | 30s | ~3.6 KB | ~108 KB | 4G/LTE · sin audio ni tool parts · solo polling si activa |
| **Mínimo** | 60s | ~1.8 KB | ~54 KB | Datos limitados o roaming · solo texto, sin notificaciones |

Durante generación activa el consumo puntual se multiplica 2-3× por unos segundos (respuesta con tool calls).
Cifras estimadas sobre HTTP/2 comprimido con ~10 sesiones en el servidor.

</details>

---

> 🏗️ **Arquitectura**: [`architecture.md`](architecture.md) — mapa del monorepo, flujos críticos, decisiones y trampas.

## 📁 Estructura del proyecto

<details>
<summary><b>Estructura del proyecto</b> (clic para expandir)</summary>

```
web/
├── src/
│   ├── components/       # 57 componentes UI
│   ├── hooks/            # 32 hooks React
│   ├── api.ts            # Cliente HTTP (36 endpoints)
│   ├── App.tsx           # Orquestador principal
│   ├── types.ts          # Tipos TypeScript
│   ├── i18n.ts           # 4 idiomas
│   └── styles.css        # Sistema de diseño completo
├── android/              # Proyecto nativo Android
├── ios/                  # Proyecto nativo iOS (Xcode)
```

</details>

---

## 🏗️ Arquitectura

<details>
<summary><b>Arquitectura — principios clave</b> (clic para expandir)</summary>

| Principio | Descripción |
|-----------|-------------|
| **🔄 SSE + Polling handoff** | Cuando SSE está activo, el polling corre a 5s en vez del intervalo completo. Al desconectarse, el backoff entra inmediatamente |
| **📈 Backoff exponencial** | Polling empieza en 1s, se duplica por cada fallo hasta 60s, con 30% de jitter. SSE similar pero tope en 30s |
| **📦 Offline-first** | IndexedDB cachea sesiones + mensajes. Navegar datos antiguos funciona offline; las escrituras requieren conectividad |
| **⚡ Optimistic updates** | Los mensajes del usuario se renderizan inmediatamente antes del round-trip al servidor |
| **🛡️ Stale request rejection** | `loadSelected` usa un ID de request para descartar respuestas de polling obsoletas |
| **🎨 Temas dinámicos** | 30+ temas con variables CSS aplicadas en runtime via `resolveTheme.ts` |

</details>

---

<div align="center">

**OpenCode Mobile** es un cliente para [**OpenCode**](https://opencode.ai) — el asistente de codificación AI open-source.

Desarrollado por [@Owning01](https://github.com/Owning01) · [Reportar issue](https://github.com/Owning01/Opencode-Mobile/issues) · [Contribuir](https://github.com/Owning01/Opencode-Mobile)

</div>
