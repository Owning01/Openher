# OpenCode Mobile

Android client for the [OpenCode](https://opencode.ai) AI coding agent.

Built with React + TypeScript + Vite + Capacitor 8.

## Features

- Connect to OpenCode server via Basic Auth
- Browse projects and sessions
- Chat with Build/Plan agents
- Real-time polling (Full/Saver/ULTRA modes)
- Multi-language: EN, ES, IT, zh-TW

## Prerequisites

- Node.js 18+
- Android SDK (for APK build)
- OpenCode server running with `--hostname 0.0.0.0`

## Development

```bash
cd web
npm install
npm run dev          # web preview at localhost:5173
```

## Build APK

```bash
cd web
npm run build
npx cap copy
cd android
.\gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Or use the quick deploy script:

```bash
cd web
.\deploy-quick.ps1          # same WiFi
.\deploy-quick.ps1 -Tunnel   # any network (uses localtunnel)
```

## Project Structure

```
web/
├── src/
│   ├── components/     # UI components
│   ├── hooks/          # React hooks (useMessages, useSessions, useAI, etc.)
│   ├── api.ts          # HTTP client (CapacitorHttp)
│   ├── App.tsx         # Main orchestrator
│   ├── types.ts        # Shared types
│   ├── Icons.tsx       # SVG icon set
│   ├── i18n.ts         # Translations (en/es/it/zh-TW)
│   └── styles.css      # All styles
├── android/            # Android native project
├── capacitor.config.ts # Capacitor config
└── deploy-quick.ps1    # Quick deploy script
```

## Server Setup

```bash
OPENCODE_SERVER_USERNAME=opencode \
OPENCODE_SERVER_PASSWORD=your-password \
npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096
```

## Connect from Any Network (Tailscale)

[Tailscale](https://tailscale.com) creates a secure mesh VPN — your phone and PC connect via a private IP even on different networks.

### 1. Install Tailscale

- **PC**: [tailscale.com/download](https://tailscale.com/download) — install and sign in
- **Phone**: Play Store → "Tailscale" → install and sign in (same account)

### 2. Find the Tailscale IP

```bash
# On your PC, run:
tailscale ip -4
# → 100.x.x.x
```

### 3. Start the server bound to Tailscale

```bash
OPENCODE_SERVER_USERNAME=opencode \
OPENCODE_SERVER_PASSWORD=your-password \
npx -y opencode-ai serve --hostname 100.x.x.x --port 4096
```

> Use the Tailscale IP from step 2 (e.g. `100.68.42.13`).

### 4. Configure the app

On your phone, set:
- **Host**: `100.x.x.x` (same Tailscale IP)
- **Port**: `4096`
- **Username**: `opencode`
- **Password**: your password

That's it. The app connects through the Tailscale tunnel — no port forwarding needed.

### Why Tailscale?

- Works on any network (mobile data, different WiFi)
- Encrypted end-to-end (WireGuard)
- No open ports on your router
- Free for personal use

## License

MIT
