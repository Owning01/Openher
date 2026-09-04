import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import {
  isSessionActive,
  hasFileChanges,
  formatTime,
  formatTimeCompact,
  noopCatch,
  formatLimit,
  formatCompact,
  formatCost,
  computeBackoff,
  pickString,
  extractPath,
  basename,
  extractName,
  extractBranch,
  filterByQuery,
  isImagePart,
  countImageParts,
  copyToClipboard,
} from "./utils"

// ---------------------------------------------------------------------------
// isSessionActive
// ---------------------------------------------------------------------------
describe("isSessionActive", () => {
  it("returns false for null", () => {
    expect(isSessionActive(null)).toBe(false)
  })
  it("returns false for undefined", () => {
    expect(isSessionActive(undefined)).toBe(false)
  })
  it("returns false when status missing", () => {
    expect(isSessionActive({} as any)).toBe(false)
  })
  it("returns true for string status busy/running/working/retry", () => {
    expect(isSessionActive({ status: "busy" })).toBe(true)
    expect(isSessionActive({ status: "retry" })).toBe(true)
    expect(isSessionActive({ status: "running" })).toBe(true)
    expect(isSessionActive({ status: "working" })).toBe(true)
  })
  it("returns false for idle/done/archived string statuses", () => {
    expect(isSessionActive({ status: "idle" })).toBe(false)
    expect(isSessionActive({ status: "done" })).toBe(false)
    expect(isSessionActive({ status: "archived" })).toBe(false)
  })
  it("handles object status with type field", () => {
    expect(isSessionActive({ status: { type: "busy" } })).toBe(true)
    expect(isSessionActive({ status: { type: "running" } })).toBe(true)
    expect(isSessionActive({ status: { type: "idle" } })).toBe(false)
  })
  it("returns false for object status with empty type", () => {
    expect(isSessionActive({ status: { type: "" } as any })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// hasFileChanges
// ---------------------------------------------------------------------------
describe("hasFileChanges", () => {
  it("returns false when all zero", () => {
    expect(hasFileChanges({ files: 0, additions: 0, deletions: 0 })).toBe(false)
  })
  it("returns true when files > 0", () => {
    expect(hasFileChanges({ files: 1, additions: 0, deletions: 0 })).toBe(true)
  })
  it("returns true when additions > 0", () => {
    expect(hasFileChanges({ files: 0, additions: 5, deletions: 0 })).toBe(true)
  })
  it("returns true when deletions > 0", () => {
    expect(hasFileChanges({ files: 0, additions: 0, deletions: 3 })).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------
describe("formatTime", () => {
  it("returns '-' for 0", () => {
    expect(formatTime(0)).toBe("-")
  })
  it("returns '-' for negative", () => {
    expect(formatTime(-1)).toBe("-")
  })
  it("returns '-' for NaN / falsy", () => {
    expect(formatTime(NaN as any)).toBe("-")
  })
  it("returns locale string for valid epoch", () => {
    const result = formatTime(1_700_000_000_000)
    expect(result).not.toBe("-")
    expect(typeof result).toBe("string")
    expect(result.length).toBeGreaterThan(0)
  })
})

describe("formatTimeCompact", () => {
  it("returns empty string for 0 or negative", () => {
    expect(formatTimeCompact(0)).toBe("")
    expect(formatTimeCompact(-1)).toBe("")
  })
  it("returns compact representation for recent timestamp", () => {
    const now = Date.now()
    expect(formatTimeCompact(now - 10000)).toBe("ahora")
    expect(formatTimeCompact(now - 300000)).toBe("5m")
  })
})

// ---------------------------------------------------------------------------
// noopCatch
// ---------------------------------------------------------------------------
describe("noopCatch", () => {
  it("resolves to value when fn succeeds", async () => {
    const result = await noopCatch(async () => 42, 0)
    expect(result).toBe(42)
  })
  it("returns default when fn rejects", async () => {
    const result = await noopCatch(async () => { throw new Error("fail") }, 99)
    expect(result).toBe(99)
  })
  it("preserves default type string", async () => {
    const result = await noopCatch<string>(async () => { throw new Error() }, "fallback")
    expect(result).toBe("fallback")
  })
})

// ---------------------------------------------------------------------------
// formatLimit
// ---------------------------------------------------------------------------
describe("formatLimit", () => {
  it("returns '-' for undefined/0", () => {
    expect(formatLimit(undefined)).toBe("-")
    expect(formatLimit(0)).toBe("-")
  })
  it("returns raw string for < 1000", () => {
    expect(formatLimit(500)).toBe("500")
    expect(formatLimit(999)).toBe("999")
  })
  it("formats thousands with K", () => {
    expect(formatLimit(1000)).toBe("1K")
    expect(formatLimit(1500)).toBe("2K") // Math.round(1.5) => 2
    expect(formatLimit(12_000)).toBe("12K")
  })
  it("formats millions with M", () => {
    expect(formatLimit(1_000_000)).toBe("1M")
    expect(formatLimit(2_500_000)).toBe("3M")
  })
  it("respects decimals param for thousands", () => {
    expect(formatLimit(1500, 1)).toBe("1.5k")
    expect(formatLimit(1234, 2)).toBe("1.23k")
  })
  it("respects decimals param for millions", () => {
    expect(formatLimit(1_500_000, 1)).toBe("1.5M")
    expect(formatLimit(1_234_567, 2)).toBe("1.23M")
  })
  it("handles NaN as falsy -> '-'", () => {
    expect(formatLimit(NaN as any)).toBe("-")
  })
})

// ---------------------------------------------------------------------------
// formatCompact
// ---------------------------------------------------------------------------
describe("formatCompact", () => {
  it("returns raw for < 1000", () => {
    expect(formatCompact(0)).toBe("0")
    expect(formatCompact(999)).toBe("999")
  })
  it("formats K with one decimal", () => {
    expect(formatCompact(1000)).toBe("1.0K")
    expect(formatCompact(1500)).toBe("1.5K")
  })
  it("formats M with one decimal", () => {
    expect(formatCompact(1_000_000)).toBe("1.0M")
    expect(formatCompact(2_300_000)).toBe("2.3M")
  })
})

// ---------------------------------------------------------------------------
// formatCost
// ---------------------------------------------------------------------------
describe("formatCost", () => {
  it("uses 2 decimals", () => {
    expect(formatCost(0.001)).toBe("$0.00")
    expect(formatCost(0.009)).toBe("$0.01")
    expect(formatCost(0.01)).toBe("$0.01")
    expect(formatCost(1.5)).toBe("$1.50")
  })
  it("handles 0", () => {
    expect(formatCost(0)).toBe("$0.00")
  })
})

// ---------------------------------------------------------------------------
// computeBackoff
// ---------------------------------------------------------------------------
describe("computeBackoff", () => {
  let randomSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, "random")
  })
  afterEach(() => {
    randomSpy.mockRestore()
  })

  it("returns baseMs when attempt 0 and random 0", () => {
    randomSpy.mockReturnValue(0)
    expect(computeBackoff(1000, 30000, 0)).toBe(1000)
  })
  it("applies exponential growth", () => {
    randomSpy.mockReturnValue(0)
    expect(computeBackoff(1000, 30000, 1)).toBe(2000)
    expect(computeBackoff(1000, 30000, 2)).toBe(4000)
    expect(computeBackoff(1000, 30000, 3)).toBe(8000)
  })
  it("caps at maxMs without jitter", () => {
    randomSpy.mockReturnValue(0)
    expect(computeBackoff(1000, 5000, 10)).toBe(5000)
  })
  it("caps at maxMs with jitter", () => {
    randomSpy.mockReturnValue(1)
    // base = min(1000*2^0,30000)=1000, result = min(1000+1000*0.5*1,30000)=1500
    expect(computeBackoff(1000, 30000, 0, 0.5)).toBe(1500)
    // with high attempt jitter would exceed max, should cap
    expect(computeBackoff(1000, 30000, 10, 0.5)).toBe(30000)
  })
  it("respects custom jitterFactor 0 (no jitter)", () => {
    randomSpy.mockReturnValue(0.99)
    expect(computeBackoff(1000, 30000, 2, 0)).toBe(4000)
  })
  it("rounds result", () => {
    randomSpy.mockReturnValue(0.123456)
    const val = computeBackoff(1000, 30000, 0, 0.5)
    expect(Number.isInteger(val)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// pickString
// ---------------------------------------------------------------------------
describe("pickString", () => {
  it("returns string when non-empty trimmed", () => {
    expect(pickString("hello")).toBe("hello")
  })
  it("returns null for empty string", () => {
    expect(pickString("")).toBeNull()
  })
  it("returns null for whitespace-only", () => {
    expect(pickString("   ")).toBeNull()
  })
  it("returns null for non-string types", () => {
    expect(pickString(123)).toBeNull()
    expect(pickString(null)).toBeNull()
    expect(pickString(undefined)).toBeNull()
    expect(pickString({})).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// extractPath / basename / extractName / extractBranch
// ---------------------------------------------------------------------------
describe("extractPath", () => {
  it("returns null for null dashboard", () => {
    expect(extractPath(null)).toBeNull()
  })
  it("returns null when project missing", () => {
    expect(extractPath({ project: null, vcs: null, files: [] })).toBeNull()
  })
  it("prefers path over directory/root", () => {
    expect(extractPath({ project: { path: "/a/b", directory: "/c", root: "/d" }, vcs: null, files: [] })).toBe("/a/b")
  })
  it("falls back to directory", () => {
    expect(extractPath({ project: { directory: "/c" }, vcs: null, files: [] })).toBe("/c")
  })
  it("falls back to root", () => {
    expect(extractPath({ project: { root: "/d" }, vcs: null, files: [] })).toBe("/d")
  })
  it("returns null when all empty/whitespace", () => {
    expect(extractPath({ project: { path: "  ", directory: "" }, vcs: null, files: [] })).toBeNull()
  })
})

describe("basename", () => {
  it("returns '' for undefined/null/empty", () => {
    expect(basename(null)).toBe("")
    expect(basename(undefined)).toBe("")
    expect(basename("")).toBe("")
  })
  it("returns last segment for unix path", () => {
    expect(basename("/foo/bar/file.ts")).toBe("file.ts")
  })
  it("handles windows backslashes", () => {
    expect(basename("C:\\Users\\foo\\bar.ts")).toBe("bar.ts")
  })
  it("handles trailing slash", () => {
    expect(basename("/foo/bar/")).toBe("bar")
  })
  it("handles single segment", () => {
    expect(basename("file.go")).toBe("file.go")
  })
  it("handles mixed separators", () => {
    expect(basename("a\\b/c\\d.txt")).toBe("d.txt")
  })
})

describe("extractName", () => {
  it("returns null for null dashboard", () => {
    expect(extractName(null)).toBeNull()
  })
  it("returns project.name when present", () => {
    expect(extractName({ project: { name: "my-app", path: "/x/y" }, vcs: null, files: [] })).toBe("my-app")
  })
  it("falls back to basename of path", () => {
    expect(extractName({ project: { path: "/home/user/my-project" }, vcs: null, files: [] })).toBe("my-project")
  })
  it("returns null when no name and no path", () => {
    expect(extractName({ project: {}, vcs: null, files: [] })).toBeNull()
  })
  it("ignores whitespace name and uses path", () => {
    expect(extractName({ project: { name: "   ", path: "/a/b/c" }, vcs: null, files: [] })).toBe("c")
  })
})

describe("extractBranch", () => {
  it("returns null for null dashboard", () => {
    expect(extractBranch(null)).toBeNull()
  })
  it("returns branch when present", () => {
    expect(extractBranch({ project: null, vcs: { branch: "main" }, files: [] })).toBe("main")
  })
  it("falls back to status", () => {
    expect(extractBranch({ project: null, vcs: { status: "detached" }, files: [] })).toBe("detached")
  })
  it("returns null when both missing", () => {
    expect(extractBranch({ project: null, vcs: {}, files: [] })).toBeNull()
  })
  it("returns null when vcs is null", () => {
    expect(extractBranch({ project: null, vcs: null, files: [] })).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// filterByQuery
// ---------------------------------------------------------------------------
describe("filterByQuery", () => {
  const items = [
    { name: "Apple", category: "fruit" },
    { name: "Banana", category: "fruit" },
    { name: "Carrot", category: "vegetable" },
  ]
  const fields = (item: typeof items[number]) => [item.name, item.category]

  it("returns all when query empty", () => {
    expect(filterByQuery(items, "", fields)).toEqual(items)
  })
  it("returns all when query whitespace", () => {
    expect(filterByQuery(items, "   ", fields)).toEqual(items)
  })
  it("filters case-insensitively", () => {
    expect(filterByQuery(items, "apple", fields)).toEqual([items[0]])
    expect(filterByQuery(items, "APPLE", fields)).toEqual([items[0]])
  })
  it("matches any field", () => {
    expect(filterByQuery(items, "fruit", fields)).toEqual([items[0], items[1]])
    expect(filterByQuery(items, "vegetable", fields)).toEqual([items[2]])
  })
  it("returns empty when no match", () => {
    expect(filterByQuery(items, "zzz", fields)).toEqual([])
  })
  it("partial match", () => {
    expect(filterByQuery(items, "app", fields)).toEqual([items[0]])
  })
  it("does not mutate original array", () => {
    const original = [...items]
    filterByQuery(items, "fruit", fields)
    expect(items).toEqual(original)
  })
})

// ---------------------------------------------------------------------------
// isImagePart / countImageParts
// ---------------------------------------------------------------------------
describe("isImagePart", () => {
  it("true for type image", () => {
    expect(isImagePart({ type: "image" })).toBe(true)
  })
  it("true for file with image mimeType", () => {
    expect(isImagePart({ type: "file", mimeType: "image/png" })).toBe(true)
  })
  it("true for file with image mime (alt field)", () => {
    expect(isImagePart({ type: "file", mime: "image/jpeg" })).toBe(true)
  })
  it("false for file with non-image mime", () => {
    expect(isImagePart({ type: "file", mimeType: "text/plain" })).toBe(false)
  })
  it("false for text type", () => {
    expect(isImagePart({ type: "text" })).toBe(false)
  })
  it("false for file with no mime", () => {
    expect(isImagePart({ type: "file" })).toBe(false)
  })
})

describe("countImageParts", () => {
  it("counts correctly", () => {
    const parts = [
      { type: "image" },
      { type: "text" },
      { type: "file", mimeType: "image/png" },
      { type: "file", mimeType: "application/pdf" },
    ]
    expect(countImageParts(parts)).toBe(2)
  })
  it("returns 0 for empty", () => {
    expect(countImageParts([])).toBe(0)
  })
  it("returns 0 when none are images", () => {
    expect(countImageParts([{ type: "text" }, { type: "file", mimeType: "text/plain" }])).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// copyToClipboard
// ---------------------------------------------------------------------------
describe("copyToClipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns true when navigator.clipboard succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    })
    expect(await copyToClipboard("hello")).toBe(true)
    expect(writeText).toHaveBeenCalledWith("hello")
  })

  it("falls back to execCommand when clipboard fails (success)", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("nope")) },
      writable: true,
      configurable: true,
    })
    vi.spyOn(document, "createElement").mockImplementation(((_tag: string) => {
      const el: any = {
        value: "",
        style: {} as any,
        select: vi.fn(),
        remove: vi.fn(),
      }
      return el
    }) as any)
    vi.spyOn(document.body, "appendChild").mockImplementation(((el: any) => el) as any)
    ;(document as any).execCommand = vi.fn().mockReturnValue(true)

    expect(await copyToClipboard("fallback")).toBe(true)
  })

  it("returns false when both methods fail", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("fail")) },
      writable: true,
      configurable: true,
    })
    vi.spyOn(document, "createElement").mockImplementation(() => {
      throw new Error("createElement fail")
    })
    expect(await copyToClipboard("fail")).toBe(false)
  })

  it("returns false when execCommand returns false", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("fail")) },
      writable: true,
      configurable: true,
    })
    vi.spyOn(document, "createElement").mockImplementation(((_tag: string) => {
      const el: any = { value: "", style: {} as any, select: vi.fn(), remove: vi.fn() }
      return el
    }) as any)
    vi.spyOn(document.body, "appendChild").mockImplementation(((el: any) => el) as any)
    ;(document as any).execCommand = vi.fn().mockReturnValue(false)

    expect(await copyToClipboard("x")).toBe(false)
  })
})
