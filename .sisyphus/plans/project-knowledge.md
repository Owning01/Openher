# OpenCode Remote Android — Project Knowledge Graph

> **Project**: OpenCode Mobile — an Android/web PWA client for the OpenCode AI coding agent  
> **Root**: `G:\Proyectos\opencode-remote-android\web\src`  
> **Stack**: React 19 + TypeScript + Capacitor + CSS Custom Properties  
> **Build**: Vite + Capacitor Android  
> **PM**: npm (web root has `package.json`)  
> **Last indexed**: 2026-07-20 (codebase-memory-mcp, full mode)

---

## 1. Project Overview

OpenCode Mobile is a **remote client** for the [OpenCode](https://opencode.ai) AI coding agent. It connects to an OpenCode server (running on a PC) via HTTP REST API with Basic Authentication, allowing users to:

- Manage AI coding sessions (CRUD)
- Chat with the AI agent in real time
- Browse project files on the server
- View session diffs, VCS status, and token usage
- Handle multiple agents and AI models
- Work in data-saving modes for mobile (cellular data)

The app is built as a Capacitor Android app with a React SPA frontend. It works in both **native Android** (Capacitor) and **browser** modes (with CORS caveats).

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| No state management library | `useState`/`useCallback`/`useMemo` only — app is small enough |
| Single `AppInner` orchestrator | All state lives in one component, passed as props to children |
| Custom CSS (no framework) | 2764 lines of CSS custom properties — no Tailwind/MUI |
| i18n via context | `I18nProvider` + `useT` hook for en/es/it/zh-TW |
| Data modes (full/saver/ultra/miser) | Mobile-conscious polling and bandwidth control |
| Optimistic messages | User messages appear immediately before server confirms |

---

## 2. File Tree (`web/src/`)

```
web/src/
├── main.tsx                          # Entry point — mounts <App /> into #root
├── App.tsx                           # Orchestrator + AppInner component
├── styles.css                        # All CSS (2764 lines, custom properties)
├── Icons.tsx                         # SVG icon components (18 icons + Logo)
├── types.ts                          # All TypeScript types (30 types)
├── constants.ts                      # localStorage keys
├── api.ts                            # HTTP client (CapacitorHttp + fetch fallback)
├── utils.ts                          # Utility functions (time, format, filter)
├── i18n.ts                           # Translations (en/es/it/zh-TW, 190+ keys)
├── i18n-context.tsx                  # I18nProvider + useT hook
├── components/
│   ├── BottomSheet.tsx              # Slide-up sheet for AI/model/project details
│   ├── ChatView.tsx                 # Main chat view (messages + composer)
│   ├── Composer.tsx                 # Chat input with slash commands, mic, images
│   ├── ConfirmModal.tsx             # Delete session confirmation
│   ├── ConnectionNotices.tsx        # Offline/reconnecting banners
│   ├── DataModeSwitcher.tsx         # Full/Saver/ULTRA/Miser toggle
│   ├── ErrorBoundary.tsx            # React error boundary (class component)
│   ├── ErrorNotice.tsx              # Dismissible runtime error banner
│   ├── FileBrowser.tsx              # Modal for browsing server files
│   ├── FolderPicker.tsx             # Modal for picking new session directory
│   ├── HelpPage.tsx                 # Help content (5 tabs)
│   ├── InlineRename.tsx             # Inline session rename input
│   ├── MessageBubble.tsx            # Single message with Markdown rendering
│   ├── MessageList.tsx              # Scrollable message list with lazy loading
│   ├── Modal.tsx                    # Reusable modal with focus trap
│   ├── NavBar.tsx                   # Top or bottom navigation (3 tabs)
│   ├── SessionCard.tsx              # Session card in the list
│   ├── SessionList.tsx              # Project-grouped session list
│   ├── SessionTokenUsage.tsx        # Token usage bars + cost display
│   ├── SessionToolbar.tsx           # Refresh / New Session / Settings buttons
│   └── SettingsPanel.tsx            # Server config, theme, mode, blocked models
├── hooks/
│   ├── useAI.ts                    # Agent + model selection state
│   ├── useBackButton.ts            # Android hardware back button
│   ├── useBlockedModels.ts         # Blocked model filtering
│   ├── useCompletionAudio.ts       # Play audio on completion + notifications
│   ├── useConfig.ts                # Server config CRUD + connection state
│   ├── useFileBrowser.ts           # File listing navigation
│   ├── useFocusTrap.ts             # Keyboard focus trap for modals
│   ├── useFolderPicker.ts          # New session directory picker
│   ├── useMemoryCleanup.ts         # Clean stale messages every 60s
│   ├── useMessages.ts              # Message loading, sending, undo/redo/compact
│   ├── useNetworkMode.ts           # Auto-switch data mode on network change
│   ├── usePolling.ts               # Interval-based polling with visibility check
│   ├── useSessionSidecar.ts        # Todo, diffs, project dashboard
│   ├── useSessions.ts              # Session CRUD + favorites
│   ├── useSpeechRecognition.ts     # Voice input (native Capacitor + Web Speech)
│   ├── useStats.ts                 # Usage stats (prompts sent, sessions created)
│   └── useTheme.ts                 # Theme preference (system/scheduled/light/dark)
└── utils/
    └── parseCommand.ts             # Slash command parser (help, status, undo, etc.)
```

Test files:
```
web/src/
├── i18n.test.mjs
├── model-regression.test.mjs
├── settings-regression.test.mjs
└── ui-regression.test.mjs
```

---

## 3. Component Tree

### 3.1 Hierarchy

```
I18nProvider
└── ErrorBoundary
    └── AppInner (all state, all callbacks)
        ├── NavBar (top variant, conditionally rendered)
        ├── [view=settings] SettingsPanel
        ├── [view=sessions] SessionList
        │   ├── SessionToolbar
        │   ├── DataModeSwitcher
        │   ├── ConnectionNotices
        │   ├── [project] SessionCard[]
        │   │   └── InlineRename (conditional)
        │   ├── [project=null] ProjectCard[]
        │   └── ErrorNotice
        ├── [view=detail] ChatView
        │   ├── InlineRename (conditional)
        │   ├── SessionTokenUsage
        │   ├── MessageList
        │   │   └── MessageBubble (lazy, Suspense)
        │   └── Composer
        ├── [view=help] HelpPage
        ├── [showNewSessionPicker] FolderPicker → Modal
        ├── [fileBrowser.isOpen] FileBrowser → Modal
        ├── [activeDetailSheet] BottomSheet
        ├── [sessionToDelete] ConfirmModal → Modal
        └── NavBar (bottom variant)
```

### 3.2 Components Detail

| Component | File | Lines | Props | Renders | Children |
|-----------|------|-------|-------|---------|----------|
| `App` | `src/App.tsx:540` | 551 | — | I18nProvider → ErrorBoundary → AppInner | `AppInner` |
| `AppInner` | `src/App.tsx:35` | 538 | `{language, setLanguage}` | Full app shell with view switching | All components |
| `NavBar` | `src/components/NavBar.tsx:22` | 64 | `{variant, view, onNavigate, hasConfiguredServer, hasSelectedSession}` | Top header or bottom nav bar | 3 nav buttons |
| `SettingsPanel` | `src/components/SettingsPanel.tsx:44` | 253 | 32 props incl. `draftConfig`, `onSave`, `onTest`, `modelOptions`, `stats`, `blockedModels` | Server config form + settings | Form fields, buttons, stats, blocked model list |
| `SessionList` | `src/components/SessionList.tsx:46` | 201 | 27 props incl. `projects`, `sessions`, `connectionState`, `query`, `favorites` | Session browser with project grouping | `SessionToolbar`, `DataModeSwitcher`, `ConnectionNotices`, `SessionCard[]`, `ErrorNotice` |
| `SessionCard` | `src/components/SessionCard.tsx:25` | 107 | `{session, isSelected, isRenaming, ...callbacks}` | Session card with stats + actions | `InlineRename`, star, play, edit, delete buttons |
| `ChatView` | `src/components/ChatView.tsx:62` | 252 | 29 props incl. `selectedSession`, `messages`, `composer`, `isWorking` | Chat interface | `MessageList`, `Composer`, `InlineRename`, `SessionTokenUsage`, `ErrorNotice` |
| `MessageList` | `src/components/MessageList.tsx:20` | 116 | `{messages, loadingSessionID, showTypingBubble, ...}` | Scrollable message list with auto-scroll | `MessageBubble` (lazy), typing dots |
| `MessageBubble` | `src/components/MessageBubble.tsx:25` | 80 | `{message, revert, onRevertToMessage}` | Single message with Markdown rendering | `ReactMarkdown` with `remarkGfm` |
| `Composer` | `src/components/Composer.tsx:39` | 298 | `{value, commands, onSend, onAbort, isWorking, ...}` | Chat input with slash menu, mic, images | Textarea, slash menu, image strip, tool buttons |
| `BottomSheet` | `src/components/BottomSheet.tsx:41` | 201 | 26 props (AI + Details sheets) | Slide-up sheet for AI/model/project details | Agent select, model list, project dashboard |
| `HelpPage` | `src/components/HelpPage.tsx:34` | 115 | `{helpPage, onHelpPageChange, commands, ...}` | Help with 5 tabs | Tab navigation, help content |
| `ConfirmModal` | `src/components/ConfirmModal.tsx:13` | 33 | `{session, onConfirm, onCancel}` | Delete confirmation dialog | `Modal` |
| `Modal` | `src/components/Modal.tsx:12` | 31 | `{children, onClose, className}` | Reusable modal with focus trap | Children |
| `FolderPicker` | `src/components/FolderPicker.tsx:28` | 80 | `{pickerPath, pickerItems, ...callbacks}` | Directory picker for new session | `Modal`, folder list |
| `FileBrowser` | `src/components/FileBrowser.tsx:17` | 70 | `{currentPath, items, ...callbacks}` | Server file browser | `Modal`, folder/file list |
| `SessionToolbar` | `src/components/SessionToolbar.tsx:12` | 31 | `{refreshing, creating, onRefresh, onNewSession}` | Refresh + New Session buttons | Buttons |
| `DataModeSwitcher` | `src/components/DataModeSwitcher.tsx:9` | 23 | `{mode, onChange}` | Data mode toggle bar | Mode buttons |
| `ConnectionNotices` | `src/components/ConnectionNotices.tsx:4` | 20 | `{connectionState}` | Offline/reconnecting banners | Notice divs |
| `ErrorNotice` | `src/components/ErrorNotice.tsx:1` | 4 | `{message}` | Runtime error banner | Div |
| `InlineRename` | `src/components/InlineRename.tsx:13` | 35 | `{value, original, onChange, onConfirm, onCancel}` | Inline session rename | Input + save/cancel buttons |
| `SessionTokenUsage` | `src/components/SessionTokenUsage.tsx:23` | 48 | `{tokens, cost}` | Token usage visualization | Bar tracks + stat labels |
| `ErrorBoundary` | `src/components/ErrorBoundary.tsx:6` | 34 | `{children}` | React error boundary | Children or fallback UI |

### 3.3 Shared UI Patterns

- **View switching**: `AppInner` has `view` state (`"settings" | "sessions" | "detail" | "help"`)
- **Modal pattern**: `Modal` wraps content with backdrop + focus trap
- **Sheet pattern**: `BottomSheet` slides up from bottom, 3-column dashboard grid
- **Notice pattern**: `ConnectionNotices` (state-based) + `ErrorNotice` (runtime errors)

---

## 4. Hook Tree

| Hook | File | Lines | State | Returns | Used In |
|------|------|-------|-------|---------|---------|
| `useConfig` | `src/hooks/useConfig.ts:84` | 195 | `config, draftConfig, connectionState, dataMode, settingsNotice, lastTestedConfigKey` | Full config management + connection state | `AppInner` |
| `useSessions` | `src/hooks/useSessions.ts:85` | 279 | `sessions, selectedID, loadingSessionID, refreshingSessions, creatingSession, favorites` | `SessionsActions` object | `AppInner` |
| `useMessages` | `src/hooks/useMessages.ts:35` | 329 | `messages, optimisticUserMessages, composer, awaitingAssistantReply, runtimeError` | Messages + send/undo/redo/compact | `AppInner` |
| `useAI` | `src/hooks/useAI.ts:46` | 152 | `agentOptions, modelOptions, selectedModelKey, selectedAgentID, modelQuery` | Agent + model selection | `AppInner` |
| `useSessionSidecar` | `src/hooks/useSessionSidecar.ts:10` | 64 | `todos, diffFiles, projectDashboard, todosExpanded, activeDetailSheet` | Sidecar data | `AppInner` |
| `usePolling` | `src/hooks/usePolling.ts:3` | 35 | — (ref-based) | Interval polling with visibility check | `AppInner` |
| `useCompletionAudio` | `src/hooks/useCompletionAudio.ts:15` | 54 | — (ref-based) | Audio play + notification on completion | `AppInner` |
| `useTheme` | `src/hooks/useTheme.ts:10` | 56 | `theme, scheduledTick` | `{theme, setTheme}` | `AppInner` |
| `useBackButton` | `src/hooks/useBackButton.ts:16` | 50 | — (side-effect) | Android hardware back button handler | `AppInner` |
| `useNetworkMode` | `src/hooks/useNetworkMode.ts:5` | 27 | — (side-effect) | Auto-switch data mode on network change | `AppInner` |
| `useMemoryCleanup` | `src/hooks/useMemoryCleanup.ts:4` | 24 | — (side-effect) | Stale message cleanup every 60s | `AppInner` |
| `useBlockedModels` | `src/hooks/useBlockedModels.ts:20` | 45 | `blocked` | `{filteredModelOptions, toggleBlocked, isBlocked, blockedCount}` | `AppInner` |
| `useStats` | `src/hooks/useStats.ts:25` | 51 | `stats` | `{stats, recordPrompt, recordSessionCreated, resetStats}` | `AppInner` |
| `useFolderPicker` | `src/hooks/useFolderPicker.ts:8` | 77 | `newSessionDirectory, showNewSessionPicker, pickerPath, pickerItems, pickerLoading, pickerError` | Folder picker state | `AppInner` |
| `useFileBrowser` | `src/hooks/useFileBrowser.ts:5` | 59 | `isOpen, currentPath, items, loading, error` | File browser state | `AppInner` |
| `useFocusTrap` | `src/hooks/useFocusTrap.ts:5` | 46 | — (side-effect) | Keyboard focus trap | `Modal` / `BottomSheet` |
| `useSpeechRecognition` | `src/hooks/useSpeechRecognition.ts:20` | 132 | `isListening, supported` | `{start, stop}` | `Composer` |

### 4.1 Hook Dependencies Graph

```
useConfig (standalone)
useTheme (standalone)
useStats (standalone)
useBlockedModels → depends on: modelOptions (from useAI)
useAI → depends on: config (from useConfig)
useSessions → depends on: config, onLoadSelected (from AppInner)
useMessages → depends on: config, dataMode
useSessionSidecar → depends on: config
useFolderPicker → depends on: config
useFileBrowser → depends on: config
usePolling → captures: refreshSessions, loadSelected (via ref)
useCompletionAudio → captures: awaitingAssistantReply, dataMode
useFocusTrap → used by: Modal, BottomSheet
useSpeechRecognition → used by: Composer
useBackButton → captures: view, activeDetailSheet
useNetworkMode → captures: changeDataMode
useMemoryCleanup → captures: selectedSessionId
```

---

## 5. Data Flow

### 5.1 Server Config → Connection

```
localStorage[STORAGE_KEYS.SERVER]
    ↓
useConfig (loadInitialConfig)
    ↓
config state → api.health(config) → /global/health
    ↓
connectionState ∈ {"idle", "connecting", "connected", "reconnecting", "offline"}
```

### 5.2 Sessions List (Polling)

```
usePolling (interval based on dataMode)
    ↓
refreshSessions()
    ↓
api.listGlobalSessions(config) → /experimental/session (paginated with cursor)
  or fallback: api.listSessions(config) → /session
    ↓
Converts Session[] → SessionView[] via toSessionView()
    ↓
sessions state in useSessions
    ↓
Passed as props → SessionList → SessionCard
```

### 5.3 Messages (Session Detail)

```
openSession(id, dir)
    ↓
clearSession() + clearSidecar()
    ↓
loadSelected(id, dir)
    ↓
api.loadMessages(config, id, dir, since?) → /session/:id/message?limit=100
    ↓
stripNonEssential (if dataMode != full/saver)
    ↓
Merge into messages state (dedup by message ID)
    ↓
renderedMessages = messages + optimisticUserMessages, mapped to RenderedMessage
    ↓
Passed as props → ChatView → MessageList → MessageBubble
```

### 5.4 Send Message

```
Composer.onSend(images?)
    ↓
handleSend() in AppInner
    ↓
parseCommand(text) → detect /help, /status, /undo, /redo, /compact, /command
    |    |
    |    ├─ /help → setView("help"), setHelpPage("commands")
    |    ├─ /status → buildStatusMessage() → optimisticUserMessages
    |    ├─ /undo → api.revert()
    |    ├─ /redo → api.unrevert()
    |    ├─ /compact → api.summarize()
    |    └─ /command → resolveCommand() → api.sendCommand() or api.sendPrompt()
    |
    └─ send() in useMessages
        ↓
        composer → buildOptimisticMessage() → optimisticUserMessages
        ↓
        api.sendPrompt(config, id, text, dir, model, agent, images)
          → /session/:id/prompt_async
        ↓
        awaitingAssistantReply = true
        ↓
        Polling picks up new assistant messages
        ↓
        assistantResponseSignature changes → awaitingAssistantReply = false
```

### 5.5 Sidecar Data (Dashboard)

```
onLoadSelected → loadTodos(id, dir) → /session/:id/todo
onSheetOpen("details")
    ↓
loadDiffs(id, dir) → /session/:id/diff
loadDashboard(dir) → /project/current + /vcs + /file/status
    ↓
SessionSidecar state → BottomSheet (details)
```

### 5.6 Revert Flow

```
handleRevertToMessage(messageID)
    ↓
api.revert(config, id, messageID, dir) → /session/:id/revert
    ↓
onLoadSelected(id, dir) → reloads messages
    ↓
Messages after revert point get class "revert-hidden" (opacity 0.4)
Revert separator shown at revert point
Revert dock bar shown at top
    ↓
handleRedo → api.unrevert() → /session/:id/unrevert
```

### 5.7 Data Mode Impact

| Mode | Poll Interval | Audio | Thinking/Tool Parts | Background Load |
|------|-------------|-------|-------------------|-----------------|
| `full` | 3.5s | ✓ | All kept | Always |
| `saver` | 15s | ✓ | All kept | Only if active |
| `ultra` | 30s | ✗ | Stripped | Only if active |
| `miser` | 60s | ✗ | Stripped | Never |

---

## 6. Route Map

### 6.1 View Navigation

The app uses **state-based navigation** (no URL router). Single `view` state controls what's rendered:

```
State: view ∈ {"settings", "sessions", "detail", "help"}
State machine:
  settings ←→ sessions ←→ detail
                   ↓
                  help
```

Navigation is via `NavBar` (3 buttons) or programmatic calls:
- `onNavigate("settings")` — triggered by NavBar or `hasConfiguredServer=false`
- `onNavigate("sessions")` — triggered by NavBar or `onBackToSessions`
- `onNavigate("detail")` — triggered after `openSession()`
- `setView("help")` — triggered by `/help` command or settings help button

### 6.2 Android Back Button Flow

```
useBackButton captures back presses:
  showNewSessionPicker=true → close picker
  activeDetailSheet!=null → close sheet
  view=detail → back to sessions
  else → Dialog.confirm("Close app?") → CapacitorApp.exitApp()
```

### 6.3 Modal/Sheet Stack

```
FolderPicker (new session) → Modal
FileBrowser → Modal
ConfirmModal (delete session) → Modal
BottomSheet → slide-up (AI model or details)
```

---

## 7. Types (All Shared Types)

### 7.1 Server Configuration (`types.ts`)

```typescript
ServerConfig      # { host, port, username, password }
HealthResponse    # { healthy, version }
PathInfo          # { home, state, config, worktree, directory }
```

### 7.2 Session Types (`types.ts`)

```typescript
Session           # Full session from API (id, title, directory, time, summary, tokens, cost, agent, model, project)
SessionView       # Display-ready (flattened status, files, additions, deletions)
SessionStatus     # { type, attempt?, message?, next? }
TodoItem          # { content, status, priority, id }
DiffFile          # { file, additions, deletions }
```

### 7.3 Message Types (`types.ts`)

```typescript
MessageEnvelope   # { info: { id, role, sessionID, time }, parts: Array<{ id, type, text?, data?, mimeType? }> }
RenderedMessage   # MessageEnvelope + { text: string, hasCompaction: boolean }
```

### 7.4 AI/Model Types (`types.ts`)

```typescript
ModelSelection    # { providerID, modelID, variant? }
ModelOption       # ModelSelection + { providerName, modelName, status, contextLimit, outputLimit, tools, attachments, isDefault }
AgentOption       # { id, name, description?, mode, hidden? }
```

### 7.5 File Types (`types.ts`)

```typescript
FileEntry         # { name, path, absolute, type: "file"|"directory", ignored? }
FileStatusEntry   # { path?, file?, status? }
```

### 7.6 UI State Types (`types.ts`)

```typescript
ViewType          # "settings" | "sessions" | "detail" | "help"
HelpPage          # "overview" | "server" | "network" | "troubleshooting" | "commands"
ConnectionState   # "idle" | "connecting" | "connected" | "reconnecting" | "offline"
DataMode          # "full" | "saver" | "ultra" | "miser"
ThemePreference   # "system" | "light" | "dark" | "scheduled"
NoticeType        # "info" | "success" | "error"
CommandInfo       # { name, description?, source?: "command"|"mcp"|"skill" }
```

### 7.7 Compound Types (`types.ts`)

```typescript
ProjectDashboard  # { project: ProjectCurrent|null, vcs: VcsStatus|null, files: FileStatusEntry[] }
ProjectCurrent    # { name?, path?, directory?, root?, [key]: unknown }
VcsStatus         # { branch?, status?, ahead?, behind?, [key]: unknown }
TokenUsage        # { input, output, reasoning, cache: { read, write } }
```

### 7.8 Internal Types (in hooks/files)

| Type | Defined In | Purpose |
|------|-----------|---------|
| `SessionsActions` | `useSessions.ts:59` | Return type of useSessions |
| `UseBackButtonOpts` | `useBackButton.ts:7` | Parameters for useBackButton |
| `UsageStats` | `useStats.ts:6` | Local stats shape |
| `ParseCommandResult` | `parseCommand.ts:9` | Parsed slash command union |
| `Translator` | `i18n-context.tsx:4` | `ReturnType<typeof createTranslator>` |
| `LanguageCode` | `i18n.ts:1` | `'en'\|'es'\|'it'\|'zh-TW'` |
| `ImageAttachment` | `Composer.tsx:10` | Local image attachment |
| `RequestOptions` | `api.ts:52` | Internal fetch options |
| `ResponseWithHeaders<T>` | `api.ts:58` | API response with headers |

---

## 8. Dependency Graph

### 8.1 File-Level Imports

```
main.tsx → App, styles.css
App.tsx → api, i18n-context, i18n, types, utils, constants
App.tsx → all hooks (16), all components (14)
api.ts → types, @capacitor/core
types.ts → (no project imports)
Icons.tsx → (no project imports)
constants.ts → (no project imports)
utils.ts → types, constants
utils/parseCommand.ts → types, api
i18n.ts → (no project imports)
i18n-context.tsx → i18n
styles.css → (no project imports)

Components → importing pattern:
  Each component imports: Icons (icons), i18n-context (useT), types
  Modal imports: useFocusTrap
  FolderPicker imports: Modal, ErrorNotice
  FileBrowser imports: Modal
  ConfirmModal imports: Modal
  MessageList imports: MessageBubble (lazy)
  BottomSheet imports: useFocusTrap
  Composer imports: useSpeechRecognition (from hooks)

Hooks → importing pattern:
  Each hook imports: api (for API calls), types, constants
  useAI imports: useSessions (for modelKey, sameModel, modelFromKey)
  useBlockedModels imports: useSessions (for modelKey)
  useBackButton imports: i18n-context (for useT)
  Composer imports: useSpeechRecognition (from hooks)
```

### 8.2 Central Hub: `App.tsx`

`App.tsx` (line 35-538) is the **single orchestrator** — it calls every hook and passes all state/callbacks to every component. This is the universe hub:

```
AppInner
  ├── Reads from 16 hooks
  ├── Passes props to 14 components
  ├── Defines 15+ event handlers (handleSend, handleAbort, handleUndo, handleCompact, etc.)
  └── Uses 3 utility files (utils, api, constants)
```

### 8.3 Icon Hotspot

`Svg` component in `Icons.tsx:3` is the most-used utility (23 callers). Every icon wraps it:

```
Svg (base) ← SettingsIcon, FolderIcon, ChatIcon, HelpIcon, PlusIcon, PlayIcon, etc. (18 icon components)
```

---

## 9. API Surface

### 9.1 Endpoints Called

| Method | Endpoint | API Function | Purpose |
|--------|----------|-------------|---------|
| GET | `/global/health` | `api.health()` | Health check + version |
| GET | `/session` | `api.listSessions()` | List sessions in a directory |
| GET | `/experimental/session` | `api.listGlobalSessions()` | Paginated global session list |
| GET | `/session/status` | `api.listStatuses()` | Session statuses in directory |
| POST | `/session` | `api.createSession()` | Create new session |
| PATCH | `/session/:id` | `api.renameSession()` | Rename session |
| DELETE | `/session/:id` | `api.deleteSession()` | Delete session |
| GET | `/session/:id/message?limit=100` | `api.loadMessages()` | Load messages (since optional) |
| GET | `/session/:id/todo` | `api.loadTodo()` | Load todo items |
| GET | `/session/:id/diff` | `api.loadDiff()` | Load diff files |
| POST | `/session/:id/prompt_async` | `api.sendPrompt()` | Send prompt (async) |
| POST | `/session/:id/command` | `api.sendCommand()` | Send command (sync) |
| POST | `/session/:id/abort` | `api.abort()` | Abort running task |
| POST | `/session/:id/revert` | `api.revert()` | Revert to message |
| POST | `/session/:id/unrevert` | `api.unrevert()` | Undo revert |
| POST | `/session/:id/summarize` | `api.summarize()` | Compact session |
| GET | `/config/providers` | `api.listModels()` | List providers + models |
| GET | `/agent` | `api.listAgents()` | List agents |
| GET | `/command` | `api.listCommands()` | List slash commands |
| GET | `/project/current` | `api.loadProjectCurrent()` | Current project info |
| GET | `/vcs` | `api.loadVcs()` | VCS status |
| GET | `/file/status` | `api.loadFileStatus()` | File change status |
| GET | `/file?path=` | `api.listFiles()` | List files in directory |
| GET | `/path` | `api.loadPath()` | Server path info |

### 9.2 API Client Details

- **Native**: Uses `@capacitor/core` `CapacitorHttp.request()` (bypasses CORS)
- **Browser**: Uses `fetch()` with `AbortController` timeout
- **Auth**: Basic Auth (`base64(username:password)`) in `Authorization` header
- **Retry**: 1 retry with exponential backoff (1s, 2s)
- **Timeout**: 30s default, 300s for commands/summarize
- **Error handling**: `responseDetail()` extracts message from error bodies
- **Directory scoping**: `withDirectory()` appends `?directory=` param to most endpoints

---

## 10. Style Architecture

### 10.1 CSS Organization (`styles.css`, 2764 lines)

The entire UI is styled with **CSS custom properties** in a single file:

```
styles.css ─ 2764 lines
├── :root (light theme variables)  [1-55]
├── :root[data-theme="dark"] (dark theme) [57-97]
├── Reset + base elements [99-221]
├── App shell + layouts [250-359]
├── Button variants [360-381]
├── Form grid + settings [390-528]
├── Session list + cards [535-925]
├── Detail/Chat view [951-1567]
├── Messages + bubbles [1568-1801]
├── Composer [1803-2062]
├── Notices + empty states [2088-2132]
├── Modal + Bottom Sheet [2134-2218]
├── Help page [2220-2283]
├── Bottom nav (desktop) [2285-2333]
├── Animations (fade-in, spin, typing-dot) [2335-2369]
├── Mobile responsive ≤780px [2371-2588]
├── Mobile responsive ≤430px [2590-2621]
├── Inline rename [2623-2655]
├── Slash command menu [2688-2743]
└── Session type badges [2745-2764]
```

### 10.2 Design Tokens (CSS Variables)

**Spacing**: `--space-1` through `--space-8` (0.25rem to 2rem)  
**Radius**: `--radius-sm/md/lg` (0.375rem/0.5rem/0.75rem)  
**Shadows**: `--shadow-sm/md`  
**Z-indices**: `--z-sticky` (20), `--z-modal-backdrop` (40), `--z-modal` (50)  
**Font**: `--font-family` (system stack), `--font-mono` (monospace stack)  

### 10.3 Theme System

- Controlled by `useTheme` hook → sets `data-theme` on `<html>`
- 4 modes: `system`, `light`, `dark`, `scheduled`
- `scheduled`: light 7:00-19:00, dark otherwise (checks hourly)
- `system`: uses `prefers-color-scheme` media query
- All colors are defined as CSS variables with light/dark variants

### 10.4 Responsive Breakpoints

| Breakpoint | Target | Changes |
|-----------|--------|---------|
| ≤780px | Tablet/mobile | Side padding removed, bottom nav fixed, single-column grids, composer full-width |
| ≤430px | Small phone | Smaller text, single-column session card, compact navbar |

### 10.5 Animation Classes

- `.fade-in` — fade + slide up (120ms, used on all panels/cards)
- `.animate-spin` — infinite rotation (LoadingIcon)
- `.typing-dot` — staggered bounce animation

### 10.6 Key CSS Patterns

- **`.app-shell`**: Max 1120px, centered, min-height 100dvh
- **`.panel`**: White surface with border + shadow
- **`.composer`**: Sticky bottom, backdrop-filter blur, grid layout
- **`.messages`**: Flex column with overflow-y auto, `--chat-bottom-clearance` for composer overlap
- **`.session-card`**: Clickable card with hover border-color transition
- **`.project-card`**: Compact card for project grouping
- **`.bottom-sheet`**: Fixed bottom, rounded top, max-height 82dvh
- **`.data-mode-options`**: 3-column grid on desktop, 1-column on mobile

---

## A. Memory & Edge Cases

- **`useMemoryCleanup`** (`useMemoryCleanup.ts:4`): Clears messages from other sessions older than 5 minutes every 60s
- **`backgroundFailureCountRef`**: After 3 consecutive poll failures, sets connection to "offline"
- **`initialSessionLoadRef`**: First load sets "offline" on failure; subsequent failures go "reconnecting" then "offline"
- **`loadSessionRef`** (`App.tsx:88`): Request ID to discard stale responses
- **`lastMessageTsRef`** (`useMessages.ts:45`): Tracks last message timestamp per session for incremental loading
- **`loadSelectedRequestRef`** (`useMessages.ts:42`): Aborts stale loadSelected calls
- **Optimistic message cleanup** (`useMessages.ts:140`): Optimistic messages removed once confirmed by server
- **Retry logic** (`api.ts:132-193`): 1 retry with exponential backoff for network errors
- **Config persistence**: Stored in localStorage + Capacitor Filesystem (survives uninstall)
- **Favorites/blocked models**: localStorage-backed Sets

---

## B. Performance Considerations

- `memo()` on all components except simple ones (ErrorNotice, ConnectionNotices, etc.)
- `useMemo()` for derived state (renderedMessages, filteredModels, groupedSessions, etc.)
- `useCallback()` for all handlers passed as props
- `lazy()` + `Suspense` for MessageBubble
- Polling interval adapts to data mode (3.5s to 60s)
- Message list capped at 500 (`messages.slice(-500)`)
- CSS animations respect `prefers-reduced-motion`
- Sheets and modals use `useFocusTrap` for accessibility
