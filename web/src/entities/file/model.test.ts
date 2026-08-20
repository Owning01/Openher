import { describe, it, expect } from "vitest"
import type {
  FileEntry,
  FileStatusEntry,
  PathInfo,
  ProjectCurrent,
  VcsStatus,
  ProjectDashboard,
  DiffFile,
  FileDiff,
  DiffContent,
} from "./model"

// Helpers runtime para validar shapes (las interfaces son estáticas, validamos duck-typing)
function isFileEntry(v: unknown): v is FileEntry {
  const o = v as FileEntry
  return typeof o.name === "string" && typeof o.path === "string" && typeof o.absolute === "string" && (o.type === "file" || o.type === "directory")
}
function isPathInfo(v: unknown): v is PathInfo {
  const o = v as PathInfo
  return typeof o.home === "string" && typeof o.state === "string" && typeof o.config === "string" && typeof o.worktree === "string" && typeof o.directory === "string"
}

// ---------------------------------------------------------------------------
// FileEntry
// ---------------------------------------------------------------------------
describe("FileEntry", () => {
  it("acepta entry de tipo file con campos requeridos", () => {
    const e: FileEntry = { name: "index.ts", path: "src/index.ts", absolute: "/home/user/src/index.ts", type: "file" }
    expect(e.name).toBe("index.ts")
    expect(isFileEntry(e)).toBe(true)
  })

  it("acepta entry de tipo directory", () => {
    const e: FileEntry = { name: "src", path: "src", absolute: "/home/user/src", type: "directory" }
    expect(e.type).toBe("directory")
    expect(isFileEntry(e)).toBe(true)
  })

  it("permite ignored opcional true/false", () => {
    const a: FileEntry = { name: "a", path: "a", absolute: "/a", type: "file", ignored: true }
    const b: FileEntry = { name: "b", path: "b", absolute: "/b", type: "file", ignored: false }
    const c: FileEntry = { name: "c", path: "c", absolute: "/c", type: "file" }
    expect(a.ignored).toBe(true)
    expect(b.ignored).toBe(false)
    expect(c.ignored).toBeUndefined()
  })

  it("rechaza type inválido en helper", () => {
    expect(isFileEntry({ name: "x", path: "x", absolute: "/x", type: "other" })).toBe(false)
    expect(isFileEntry({ name: "x", path: "x", absolute: "/x" })).toBe(false)
  })

  it("preserva absolute como ruta absoluta", () => {
    const e: FileEntry = { name: "file.go", path: "a/b/file.go", absolute: "/home/user/project/a/b/file.go", type: "file" }
    expect(e.absolute.startsWith("/")).toBe(true)
    expect(e.path).toBe("a/b/file.go")
  })

  it("serializa y deserializa vía JSON sin perder campos", () => {
    const e: FileEntry = { name: "app.tsx", path: "src/app.tsx", absolute: "/w/src/app.tsx", type: "file", ignored: false }
    const clone = JSON.parse(JSON.stringify(e)) as FileEntry
    expect(clone).toEqual(e)
    expect(isFileEntry(clone)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// FileStatusEntry
// ---------------------------------------------------------------------------
describe("FileStatusEntry", () => {
  it("acepta objeto vacío (todos opcionales + index signature)", () => {
    const f: FileStatusEntry = {}
    expect(f.path).toBeUndefined()
    expect(f.file).toBeUndefined()
    expect(f.status).toBeUndefined()
  })

  it("acepta path + status", () => {
    const f: FileStatusEntry = { path: "src/main.ts", status: "modified" }
    expect(f.path).toBe("src/main.ts")
    expect(f.status).toBe("modified")
  })

  it("acepta file alternativo a path", () => {
    const f: FileStatusEntry = { file: "README.md", status: "untracked" }
    expect(f.file).toBe("README.md")
  })

  it("permite propiedades adicionales vía index signature", () => {
    const f: FileStatusEntry = { path: "a.ts", status: "added", additions: 10, deletions: 2 } as FileStatusEntry & { additions: number }
    expect((f as Record<string, unknown>)["additions"]).toBe(10)
  })

  it("acepta status con valores git comunes", () => {
    for (const s of ["modified", "added", "deleted", "renamed", "untracked", "staged"]) {
      const f: FileStatusEntry = { status: s }
      expect(f.status).toBe(s)
    }
  })
})

// ---------------------------------------------------------------------------
// PathInfo
// ---------------------------------------------------------------------------
describe("PathInfo", () => {
  it("requiere las 5 claves y helper las valida", () => {
    const p: PathInfo = { home: "/home/user", state: "/home/user/.local/state/opencode", config: "/home/user/.config/opencode", worktree: "/home/user/project", directory: "/home/user/project" }
    expect(isPathInfo(p)).toBe(true)
    expect(Object.keys(p)).toEqual(expect.arrayContaining(["home", "state", "config", "worktree", "directory"]))
  })

  it("detecta PathInfo incompleto", () => {
    expect(isPathInfo({ home: "/a", state: "/b" })).toBe(false)
    expect(isPathInfo({ home: "/a", state: "/b", config: "/c", worktree: "/d" })).toBe(false)
  })

  it("permite worktree distinto de directory", () => {
    const p: PathInfo = { home: "/home/u", state: "/tmp/state", config: "/tmp/cfg", worktree: "/repo/.git/worktrees/feature", directory: "/repo/feature" }
    expect(p.worktree).not.toBe(p.directory)
    expect(isPathInfo(p)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ProjectCurrent
// ---------------------------------------------------------------------------
describe("ProjectCurrent", () => {
  it("acepta objeto vacío", () => {
    const pr: ProjectCurrent = {}
    expect(pr.name).toBeUndefined()
  })

  it("acepta name + path", () => {
    const pr: ProjectCurrent = { name: "my-app", path: "/home/user/my-app" }
    expect(pr.name).toBe("my-app")
    expect(pr.path).toBe("/home/user/my-app")
  })

  it("acepta directory y root alternativos", () => {
    const pr: ProjectCurrent = { directory: "/home/user/proj", root: "/home/user/proj" }
    expect(pr.directory).toBe("/home/user/proj")
    expect(pr.root).toBe("/home/user/proj")
  })

  it("permite claves extra por index signature", () => {
    const pr: ProjectCurrent = { name: "x", custom: "value", id: "123" } as ProjectCurrent
    expect((pr as Record<string, unknown>)["custom"]).toBe("value")
  })
})

// ---------------------------------------------------------------------------
// VcsStatus
// ---------------------------------------------------------------------------
describe("VcsStatus", () => {
  it("acepta vacío", () => {
    const v: VcsStatus = {}
    expect(v.branch).toBeUndefined()
  })

  it("acepta branch + status", () => {
    const v: VcsStatus = { branch: "main", status: "clean" }
    expect(v.branch).toBe("main")
  })

  it("acepta ahead/behind numéricos", () => {
    const v: VcsStatus = { ahead: 2, behind: 1 }
    expect(v.ahead).toBe(2)
    expect(v.behind).toBe(1)
  })

  it("permite ahead 0 y claves extra", () => {
    const v: VcsStatus = { branch: "feat/x", ahead: 0, behind: 0, dirty: true } as VcsStatus
    expect(v.ahead).toBe(0)
    expect((v as Record<string, unknown>)["dirty"]).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ProjectDashboard
// ---------------------------------------------------------------------------
describe("ProjectDashboard", () => {
  it("acepta dashboard con project y vcs nulos y files vacío", () => {
    const d: ProjectDashboard = { project: null, vcs: null, files: [] }
    expect(d.project).toBeNull()
    expect(d.vcs).toBeNull()
    expect(d.files).toHaveLength(0)
  })

  it("acepta dashboard con datos completos", () => {
    const d: ProjectDashboard = {
      project: { name: "opencode", path: "/repo" },
      vcs: { branch: "main", ahead: 1 },
      files: [{ path: "src/a.ts", status: "modified" }, { file: "b.ts", status: "added" }],
    }
    expect(d.project!.name).toBe("opencode")
    expect(d.vcs!.branch).toBe("main")
    expect(d.files).toHaveLength(2)
  })

  it("files puede estar vacío aun con project/vcs presentes", () => {
    const d: ProjectDashboard = { project: { name: "p" }, vcs: { branch: "dev" }, files: [] }
    expect(d.files).toEqual([])
  })

  it("serializa correctamente a JSON", () => {
    const d: ProjectDashboard = { project: { name: "x" }, vcs: null, files: [{ status: "modified" }] }
    const parsed = JSON.parse(JSON.stringify(d)) as ProjectDashboard
    expect(parsed).toEqual(d)
  })
})

// ---------------------------------------------------------------------------
// DiffFile
// ---------------------------------------------------------------------------
describe("DiffFile", () => {
  it("valida shape básico", () => {
    const df: DiffFile = { file: "src/app.ts", additions: 10, deletions: 2 }
    expect(df.file).toBe("src/app.ts")
    expect(df.additions).toBe(10)
    expect(df.deletions).toBe(2)
  })

  it("permite ceros", () => {
    const df: DiffFile = { file: "README.md", additions: 0, deletions: 0 }
    expect(df.additions + df.deletions).toBe(0)
  })

  it("suma total de cambios coherente", () => {
    const files: DiffFile[] = [
      { file: "a.ts", additions: 5, deletions: 1 },
      { file: "b.ts", additions: 0, deletions: 3 },
    ]
    const total = files.reduce((acc, f) => acc + f.additions + f.deletions, 0)
    expect(total).toBe(9)
  })
})

// ---------------------------------------------------------------------------
// FileDiff
// ---------------------------------------------------------------------------
describe("FileDiff", () => {
  it("requiere additions/deletions, file/patch opcionales", () => {
    const fd: FileDiff = { additions: 1, deletions: 1 }
    expect(fd.file).toBeUndefined()
    expect(fd.patch).toBeUndefined()
    expect(fd.additions).toBe(1)
  })

  it("acepta file, patch y status", () => {
    const fd: FileDiff = { file: "src/x.ts", patch: "@@ -1 +1 @@", additions: 3, deletions: 0, status: "modified" }
    expect(fd.file).toBe("src/x.ts")
    expect(fd.patch).toContain("@@")
    expect(fd.status).toBe("modified")
  })

  it("patch puede ser string vacío", () => {
    const fd: FileDiff = { file: "a.ts", patch: "", additions: 0, deletions: 0 }
    expect(fd.patch).toBe("")
  })
})

// ---------------------------------------------------------------------------
// DiffContent
// ---------------------------------------------------------------------------
describe("DiffContent", () => {
  it("valida shape completo", () => {
    const dc: DiffContent = { file: "src/y.ts", content: "diff --git ...", additions: 5, deletions: 5 }
    expect(dc.file).toBe("src/y.ts")
    expect(dc.content).toContain("diff")
    expect(dc.additions).toBe(5)
  })

  it("content puede ser vacío con ceros", () => {
    const dc: DiffContent = { file: "empty.ts", content: "", additions: 0, deletions: 0 }
    expect(dc.content).toBe("")
  })
})
