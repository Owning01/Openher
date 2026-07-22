# OpenCode TUI Agent & Subagent Display — Knowledge Graph

## Files Indexed
- **opentui**: `G:\Proyectos\opentui` (13,366 nodes, 62,180 edges)
- **opencode**: `G:\Proyectos\opencode` (30,107 nodes, 92,783 edges)

---

## 1. Agent Display in Prompt Input

### File: `packages/tui/src/component/prompt/index.tsx`

**Border color** (line 1287-1293):
```
leader() → theme.border
shell mode → theme.primary
normal mode → local.agent.color(agent.name)  ← agent-specific color
```

**Spinner color** (line 1321-1326):
```
agent ? local.agent.color(agent.name) : theme.border
```

**Extmark styles** (lines 231-232):
- `extmark.file` → `theme.warning` + bold
- `extmark.agent` → `theme.secondary` + bold
- `extmark.paste` → `theme.warning` bg + bold

### File: `packages/tui/src/context/local.tsx`

**Agent color assignment** (lines 83-131):
```typescript
colors = [theme.secondary, theme.accent, theme.success, theme.warning, theme.primary, theme.error, theme.info]
```
Subagents filtered out: `agent.mode !== "subagent" && !agent.hidden`

### File: `packages/tui/src/theme/index.ts`

**Extmark syntax rules** (lines 600-621):
- `extmark.file`: `fg=theme.warning` + bold
- `extmark.agent`: `fg=theme.secondary` + bold
- `extmark.paste`: `fg=selectedForeground(theme.warning)` + `bg=theme.warning` + bold

---

## 2. Subagent (Task) Execution Display

### File: `packages/tui/src/routes/session/index.tsx`

**PART_MAPPING** (line 1564):
```
text → TextPart (<markdown> render)
tool → ToolPart (dispatches to tool-specific components)
reasoning → ReasoningPart (<code> with subtle syntax)
```

**ToolPart → Task routing** (lines 1702-1782):
```
toolDisplay() === "bash"  → Shell
toolDisplay() === "task"  → Task       ← subagent
toolDisplay() === "edit"  → Edit
...
else → GenericTool
```

**Task component** (lines 2213-2309):
- Uses `InlineTool` (not `BlockTool`) — inline row, no border, no box
- Icon: `│` (running) / `✓` (completed)
- Spinner while running
- `pending="Delegating..."` when no data yet
- `separate={true}` — always separated from adjacent elements
- Content format (multi-line via `\n`):
  - Line 1: `{AgentType} Task — {description}`
  - Line 2: `↳ {current tool} {title}` or `↳ N toolcalls`
  - Line 2 (retry): `↳ Retrying (attempt N) · {message}` (red)
  - Line 2 (done): `↳ N toolcalls · {duration}`
- Color: `theme.error` on retry, `theme.textMuted` when completed
- Click: navigates to subagent child session

**InlineTool** (lines 1829-1905):
- Manages hover, error state, denied state
- Color logic:
  - `props.color` if provided
  - `theme.warning` if permission required
  - `theme.error` if error
  - `theme.text` if hover + clickable
  - `theme.textMuted` if complete
  - `theme.text` otherwise

**InlineToolRow** (lines 1907-1985):
- `paddingLeft={3}` — indentation
- Pending: `~ Delegating...` (dimmed, paddingLeft=3)
- Complete: icon + content in row
- `INLINE_TOOL_ICON_WIDTH = 2` (characters)
- Error: expandable on click

**SubagentFooter** (`routes/session/subagent-footer.tsx`):
- Only visible when viewing a subagent session (has `parentID`)
- Shows: agent label, counter (N of M), token usage, cost, navigation buttons (Parent/Prev/Next)

**DialogSubagent** (`routes/session/dialog-subagent.tsx`):
- Popup with subagent actions ("Open" → navigate to their session)

**view subagents hint** (lines 1495-1517):
- At bottom of assistant message if any part is `task` tool
- Shows keybinding hint: `"g c" view subagents`

---

## 3. Color System (opentui `@opentui/core`)

### File: `packages/core/src/lib/RGBA.ts`
- `RGBA` = `Uint16Array(4)` with packed `ColorIntent` metadata
- Constructors: `fromValues(r,g,b,a)`, `fromInts(r,g,b,a)`, `fromHex(hex)`, `fromIndex(index)`
- Alpha used only for transparent detection (alpha=0 → SGR 49), NOT for opacity

### File: `packages/core/src/syntax-style.ts`
- `SyntaxStyle.fromTheme(ThemeTokenStyle[])` — registers scope→color rules
- `getStyle(name)` — resolves with fallback (e.g., `"keyword.control"` → `"keyword"`)
- `mergeStyles(...names)` — CSS-cascade merge of multiple scopes

### File: `packages/core/src/renderables/Markdown.ts`
- Inline tokens map to `TextChunk` via scope groups:
  - `markup.raw` → code spans
  - `markup.strong` → bold
  - `markup.italic` → italic
  - `markup.link` → links
  - `markup.heading` → headings
  - `markup.quote` → blockquotes
  - `markup.raw.block` → fenced code blocks

### File: `packages/core/src/zig/renderer.zig` (line 666)
- `emitColor()` → ANSI escapes:
  - True color: `\x1b[38;2;R;G;Bm`
  - 256 color: `\x1b[38;5;Nm`
  - Default: `\x1b[39m` / `\x1b[49m`
- Alpha=0 → transparent (SGR 49 for bg)

---

## 4. Key OpenCode Theme Colors (from `opencode.json`)

| Slot | Dark | Light | CSS Map |
|------|------|-------|---------|
| `secondary` | `#5c9cf5` | `#7b5bb6` | — |
| `accent` | `#9d7cd8` | `#d68c27` | `--accent` |
| `warning` | `#f5a742` | `#d68c27` | `--warning` |
| `primary` | `#fab283` | `#3b7dd8` | `--primary` |
| `success` | `#7fd88f` | `#3d9a57` | `--success` |
| `error` | `#e06c75` | `#d1383d` | `--danger` |
| `info` | `#56b6c2` | `#318795` | `--info` |
