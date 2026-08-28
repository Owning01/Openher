import { describe, it, expect } from "vitest"
import { computeGitFileStatus } from "./useGitStatus"
import type { GitChangedFile } from "../../shell"

describe("computeGitFileStatus", () => {
  it("marks untracked files as U with untracked color", () => {
    const file: GitChangedFile = {
      path: "test.ts",
      originalPath: null,
      indexStatus: "?",
      worktreeStatus: "?",
      staged: false,
      unstaged: false,
      untracked: true,
      statusLabel: "U",
    }
    const res = computeGitFileStatus(file)
    expect(res.status).toBe("U")
    expect(res.badge).toBe("U")
  })

  it("marks modified files as M", () => {
    const file: GitChangedFile = {
      path: "src/App.tsx",
      originalPath: null,
      indexStatus: "M",
      worktreeStatus: "M",
      staged: false,
      unstaged: true,
      untracked: false,
      statusLabel: "M",
    }
    const res = computeGitFileStatus(file)
    expect(res.status).toBe("M")
    expect(res.badge).toBe("M")
  })
})
