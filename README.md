# OpenCode Mobile

Android client for the [OpenCode](https://opencode.ai) AI coding assistant — connect to your OpenCode server and work with AI agents from your phone.

Built with **React 18 + TypeScript + Vite + Capacitor 8**.

## Features

| | |
|---|---|
| **Real-time streaming** | SSE events via `/event` — typing indicators, instant message delivery |
| **Adaptive polling** | 4 data modes: Full (3.5s), Saver (15s), Ultra (30s), Miser (60s). Auto-switches on cellular |
| **Offline cache** | IndexedDB-backed — browse sessions and messages without connectivity |
| **Chat** | Send prompts, commands, shell commands. Abort, revert, undo/redo |
| **Diff viewer** | Expandable per-file diffs with inline content fetching |
| **Session management** | Create, rename, delete, favorite, archive, export session snapshots |
| **AI agent control** | Select and switch between agents/models inline per session |
| **Multi-provider** | Connect external AI providers (OpenAI, Anthropic, etc.) via API key |
| **File browser** | Browse remote project files, navigate directories |
| **Git toolbar** | Stage, commit, branch status (ahead/behind) |
| **Voice input** | Speech-to-text via Web Speech API + Capacitor native plugin |
| **Permissions & Questions** | Auto-triggered modals for AI questions and tool permissions |
| **30+ themes** | Dark, light, system, scheduled modes; theme variant picker with preview |
| **i18n** | English, Español, Italiano, 繁體中文 |
| **Auto-summarize** | Automatic session compaction when context grows large |
| **Plan breakdown** | Task visualization for AI orchestration flows |
| **Keyboard shortcuts** | Tab/Search + actions for power users |
| **Quick deploy** | One-command scripts for LAN (same WiFi) or tunnel (any network) |

## Quick Start

```bash
cd web
pnpm install
pnpm dev          # Web preview at localhost:5173
```

```bash
pnpm build && npx cap sync && cd android && .\gradlew assembleDebug
```

```bash
.\deploy-quick.ps1          # same WiFi
.\deploy-quick.ps1 -Tunnel   # any network
```

## Server Setup

```bash
OPENCODE_SERVER_USERNAME=opencode \
OPENCODE_SERVER_PASSWORD=your-password \
npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096
```

## Project Structure

```
web/
├── src/
│   ├── components/     # 35 UI components
│   ├── hooks/          # 22 React hooks
│   ├── benchmarks/     # 212 speed benchmarks
│   ├── api.ts          # HTTP client (30 endpoint methods)
│   ├── App.tsx         # Main orchestrator
│   ├── types.ts        # 32 TypeScript types
│   ├── i18n.ts         # 4 languages
│   └── styles.css      # Full design system
├── android/            # Android native project
└── benchmarks/         # Performance test suite
```

## Performance

Benchmark suite: **212 tests, 68 groups** — run with `pnpm benchmark`

| Layer | Fastest | Typical | Bottleneck |
|-------|---------|---------|------------|
| **SSE parsing** | 4ns/event | 11µs (10 events) | 707µs (1000 events — unrealistic) |
| **Backoff calc** | 261ns | 1µs | N/A |
| **i18n lookup** | 56ns | 360ns | N/A |
| **Cache Map.get** | 24ns | 2µs (1000 gets) | N/A |
| **Session filter** | 18ns (empty) | 10µs (100 sessions) | 489µs (10000 sessions) |
| **Message render** | 710ns (4 parts) | 34µs (200 msgs) | N/A |
| **Diff parse** | 1µs (50 lines) | 132µs (5000 lines) | N/A |
| **JSON serialize** | 1.7µs (1 session) | 250µs (100 sessions) | N/A |
| **Virtual list** | 4ns | 90ns | N/A |

All critical-path operations complete in **microseconds or nanoseconds**. The app is GPU/network-bound, not CPU-bound.

## Architecture Highlights

- **SSE + Polling handoff**: When SSE is active, polling runs at 5s instead of full interval. On SSE disconnect, backoff kicks in immediately.
- **Exponential backoff**: Polling starts at 1s, doubles per failure up to 60s, with 30% jitter. SSE reconnect similar but caps at 30s.
- **Offline-first**: IndexedDB caches sessions + messages. Browsing stale data works offline; writes require connectivity.
- **Optimistic updates**: User messages render immediately before the server round-trip completes.
- **Stale request rejection**: `loadSelected` uses a request ID to discard stale polling responses that could overwrite newer data.

## Benchmark Suite

```bash
pnpm benchmark                    # Run all 212 tests
pnpm benchmark:report             # Save to benchmarks/report.txt
node benchmarks/runner.mjs        # Same
```

Tests cover: SSE parsing, backoff algorithms, polling scenarios, API call chains, IndexedDB write/read, i18n lookup, message rendering, diff parsing, session transform, provider transform, virtual lists, code block detection, and 8 integration scenarios.

## License

MIT
