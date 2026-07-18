# OpenCode Mobile

Cliente Android para el agente de codificación con IA [OpenCode](https://opencode.ai).

Construido con React + TypeScript + Vite + Capacitor 8.

## Características

- Conectar al servidor OpenCode con autenticación Basic Auth
- Navegar proyectos y sesiones
- Chatear con agentes Build/Plan
- Polling en tiempo real (modos Full/Saver/ULTRA)
- Multi-idioma: EN, ES, IT, zh-TW

## Requisitos

- Node.js 18+
- Android SDK (para compilar APK)
- Servidor OpenCode ejecutándose con `--hostname 0.0.0.0`

## Desarrollo

```bash
cd web
npm install
npm run dev          # vista web en localhost:5173
```

## Compilar APK

```bash
cd web
npm run build
npx cap copy
cd android
gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

O usar el script de deploy rápido:

```bash
cd web
.\deploy-quick.ps1          # misma WiFi
.\deploy-quick.ps1 -Tunnel   # cualquier red (usa localtunnel)
```

## Estructura del proyecto

```
web/
├── src/
│   ├── components/     # Componentes UI
│   ├── hooks/          # React hooks (useMessages, useSessions, useAI, etc.)
│   ├── api.ts          # Cliente HTTP (CapacitorHttp)
│   ├── App.tsx         # Orquestador principal
│   ├── types.ts        # Tipos compartidos
│   ├── Icons.tsx       # Set de iconos SVG
│   ├── i18n.ts         # Traducciones (en/es/it/zh-TW)
│   └── styles.css      # Todos los estilos
├── android/            # Proyecto nativo Android
├── capacitor.config.ts # Configuración Capacitor
└── deploy-quick.ps1    # Script de deploy rápido
```

## Configuración del servidor

```bash
OPENCODE_SERVER_USERNAME=opencode \
OPENCODE_SERVER_PASSWORD=tu-contraseña \
npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096
```

## Conexión desde cualquier red (Tailscale)

[Tailscale](https://tailscale.com) crea una VPN mesh segura — tu celular y PC se conectan por IP privada aunque estén en redes distintas.

### 1. Instalar Tailscale

- **PC**: [tailscale.com/download](https://tailscale.com/download) — instalar e iniciar sesión
- **Celular**: Play Store → "Tailscale" — instalar e iniciar sesión (misma cuenta)

### 2. Obtener la IP de Tailscale

```bash
# En la PC:
tailscale ip -4
# → 100.x.x.x
```

### 3. Iniciar el servidor vinculado a Tailscale

```bash
OPENCODE_SERVER_USERNAME=opencode \
OPENCODE_SERVER_PASSWORD=tu-contraseña \
npx -y opencode-ai serve --hostname 100.x.x.x --port 4096
```

> Usá la IP de Tailscale del paso 2 (ej. `100.68.42.13`).

### 4. Configurar la app

En el celular:
- **Host**: `100.x.x.x` (la misma IP de Tailscale)
- **Port**: `4096`
- **Username**: `opencode`
- **Password**: tu contraseña

Listo. La app se conecta por el túnel de Tailscale — no necesitas abrir puertos.

### ¿Por qué Tailscale?

- Funciona en cualquier red (datos móviles, WiFi distinto)
- Cifrado extremo a extremo (WireGuard)
- Sin puertos abiertos en el router
- Gratuito para uso personal

## Licencia

MIT
