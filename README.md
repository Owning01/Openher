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
gradlew assembleDebug
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

## License

MIT
