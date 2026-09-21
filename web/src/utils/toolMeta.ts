// Los detectores XML viven en toolName.ts (fuente unica de nombres/alias de
// tools). Se re-exportan aca para no romper los imports historicos.
export { detectToolName, isTaskTool, isQuestionTool } from "./toolName"

export const toolMeta: Record<string, { icon: string; label: string }> = {
  bash: { icon: "$", label: "shell" },
  execute: { icon: "⚙", label: "execute" },
  read: { icon: "←", label: "read" },
  write: { icon: "→", label: "write" },
  edit: { icon: "△", label: "edit" },
  apply_patch: { icon: "△", label: "patch" },
  glob: { icon: "✱", label: "glob" },
  grep: { icon: "◎", label: "grep" },
  webfetch: { icon: "%", label: "web" },
  websearch: { icon: "◈", label: "search" },
  todowrite: { icon: "✓", label: "todo" },
  question: { icon: "?", label: "ask" },
  skill: { icon: "◆", label: "skill" },
  task: { icon: "│", label: "task" },
}
