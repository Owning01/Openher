import { describe, it, expect, vi, beforeEach } from "vitest"
import { toolMeta, detectToolName, isTaskTool, isQuestionTool } from "./toolMeta"

describe("toolMeta", () => {
  it("contains 14 entries", () => {
    expect(Object.keys(toolMeta)).toHaveLength(14)
  })

  it("each entry has icon and label strings", () => {
    for (const [key, meta] of Object.entries(toolMeta)) {
      expect(typeof meta.icon, `icon for ${key}`).toBe("string")
      expect(meta.icon.length).toBeGreaterThan(0)
      expect(typeof meta.label, `label for ${key}`).toBe("string")
      expect(meta.label.length).toBeGreaterThan(0)
    }
  })

  it("has correct specific mappings", () => {
    expect(toolMeta.bash).toEqual({ icon: "$", label: "shell" })
    expect(toolMeta.execute).toEqual({ icon: "", label: "execute" })
    expect(toolMeta.read).toEqual({ icon: "←", label: "read" })
    expect(toolMeta.write).toEqual({ icon: "→", label: "write" })
    expect(toolMeta.edit).toEqual({ icon: "△", label: "edit" })
    expect(toolMeta.apply_patch).toEqual({ icon: "△", label: "patch" })
    expect(toolMeta.glob).toEqual({ icon: "", label: "glob" })
    expect(toolMeta.grep).toEqual({ icon: "", label: "grep" })
    expect(toolMeta.webfetch).toEqual({ icon: "%", label: "web" })
    expect(toolMeta.websearch).toEqual({ icon: "◈", label: "search" })
    expect(toolMeta.todowrite).toEqual({ icon: "", label: "todo" })
    expect(toolMeta.question).toEqual({ icon: "?", label: "ask" })
    expect(toolMeta.skill).toEqual({ icon: "◆", label: "skill" })
    expect(toolMeta.task).toEqual({ icon: "│", label: "task" })
  })

  it("has expected keys set", () => {
    const keys = Object.keys(toolMeta).sort()
    expect(keys).toEqual(["apply_patch", "bash", "edit", "execute", "glob", "grep", "question", "read", "skill", "task", "todowrite", "webfetch", "websearch", "write"].sort())
  })
})

describe("detectToolName", () => {
  it("extracts bash tool name", () => {
    expect(detectToolName('<invoke name="bash">ls</invoke>')).toBe("bash")
  })

  it("extracts write tool name", () => {
    expect(detectToolName('<invoke name="write">content</invoke>')).toBe("write")
  })

  it("is case-insensitive for tag name", () => {
    expect(detectToolName('<INVOKE name="read">')).toBe("read")
    expect(detectToolName('<Invoke name="edit">')).toBe("edit")
  })

  it("returns null when no invoke tag", () => {
    expect(detectToolName("plain text")).toBeNull()
    expect(detectToolName("")).toBeNull()
    expect(detectToolName('<other name="bash">')).toBeNull()
  })

  it("handles single quotes as not matching (requires double quotes)", () => {
    expect(detectToolName("<invoke name='bash'>")).toBeNull()
  })

  it("extracts first occurrence when multiple invokes", () => {
    expect(detectToolName('<invoke name="bash"></invoke><invoke name="read"></invoke>')).toBe("bash")
  })

  it("handles names with underscores", () => {
    expect(detectToolName('<invoke name="apply_patch">')).toBe("apply_patch")
    expect(detectToolName('<invoke name="todo_write">')).toBe("todo_write")
  })

  it("handles names with dashes or mixed", () => {
    expect(detectToolName('<invoke name="my-tool">')).toBe("my-tool")
  })

  it("requires exact double-quote wrapping", () => {
    expect(detectToolName('<invoke name="task" extra="x">')).toBe("task")
  })

  it("returns null for incomplete tag", () => {
    expect(detectToolName('<invoke name="')).toBeNull()
    expect(detectToolName('<invoke name=>')).toBeNull()
  })

  it("extracts with extra whitespace between invoke and name", () => {
    expect(detectToolName('<invoke   name="grep">')).toBe("grep")
  })

  it("does not match when space missing incorrectly? Should still match with \\s+", () => {
    // no space: <invoke name vs <invoke   name - the regex requires at least one whitespace
    expect(detectToolName('<invoke name="bash">')).not.toBeNull()
    // If we test <invokename="bash"> should be null
    expect(detectToolName('<invokename="bash">')).toBeNull()
  })
})

describe("isTaskTool", () => {
  it("returns true for task invoke", () => {
    expect(isTaskTool('<invoke name="task">')).toBe(true)
  })

  it("is case-insensitive", () => {
    expect(isTaskTool('<INVOKE name="task">')).toBe(true)
    expect(isTaskTool('<invoke name="TASK">')).toBe(true)
  })

  it("returns false for other tools", () => {
    expect(isTaskTool('<invoke name="bash">')).toBe(false)
    expect(isTaskTool('<invoke name="question">')).toBe(false)
    expect(isTaskTool("task")).toBe(false)
  })

  it("handles whitespace variant", () => {
    expect(isTaskTool('<invoke   name="task">')).toBe(true)
  })

  it("does not match task prefix only", () => {
    // should not match task_extra because missing closing quote after task
    expect(isTaskTool('<invoke name="task_extra">')).toBe(false)
    expect(isTaskTool('<invoke name="tasks">')).toBe(false)
  })

  it("returns false for empty string", () => {
    expect(isTaskTool("")).toBe(false)
  })
})

describe("isQuestionTool", () => {
  it("returns true for question invoke", () => {
    expect(isQuestionTool('<invoke name="question">')).toBe(true)
  })

  it("is case-insensitive", () => {
    expect(isQuestionTool('<INVOKE name="question">')).toBe(true)
    expect(isQuestionTool('<invoke name="QUESTION">')).toBe(true)
  })

  it("returns false for other tools", () => {
    expect(isQuestionTool('<invoke name="task">')).toBe(false)
    expect(isQuestionTool('<invoke name="bash">')).toBe(false)
  })

  it("handles whitespace variant", () => {
    expect(isQuestionTool('<invoke   name="question">')).toBe(true)
  })

  it("does not match question prefix only", () => {
    expect(isQuestionTool('<invoke name="question_extra">')).toBe(false)
  })

  it("returns false for empty", () => {
    expect(isQuestionTool("")).toBe(false)
  })

  it("both helpers consistent with detectToolName for their tool", () => {
    const taskText = '<invoke name="task">do</invoke>'
    const qText = '<invoke name="question">ask</invoke>'
    expect(detectToolName(taskText)).toBe("task")
    expect(isTaskTool(taskText)).toBe(true)
    expect(isQuestionTool(taskText)).toBe(false)
    expect(detectToolName(qText)).toBe("question")
    expect(isQuestionTool(qText)).toBe(true)
    expect(isTaskTool(qText)).toBe(false)
  })
})
