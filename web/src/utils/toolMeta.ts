export const toolMeta: Record<string, { icon: string; label: string }> = {
  bash: { icon: "$", label: "shell" },
  execute: { icon: "⚙", label: "execute" },
  read: { icon: "←", label: "read" },
  write: { icon: "→", label: "write" },
  edit: { icon: "△", label: "edit" },
  apply_patch: { icon: "△", label: "patch" },
  glob: { icon: "✱", label: "glob" },
  grep: { icon: "✱", label: "grep" },
  webfetch: { icon: "%", label: "web" },
  websearch: { icon: "◈", label: "search" },
  todowrite: { icon: "☐", label: "todo" },
  question: { icon: "?", label: "ask" },
  skill: { icon: "◆", label: "skill" },
  task: { icon: "│", label: "task" },
}

export function detectToolName(text: string): string | null {
  const m = text.match(/<invoke\s+name="([^"]+)"/i)
  return m ? m[1] : null
}

export function isTaskTool(text: string): boolean {
  return /<invoke\s+name="task"/i.test(text)
}

export function isQuestionTool(text: string): boolean {
  return /<invoke\s+name="question"/i.test(text)
}
