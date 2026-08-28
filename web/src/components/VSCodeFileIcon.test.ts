import { describe, it, expect } from "vitest"
import { getFileCategory } from "./VSCodeFileIcon"

describe("VSCodeFileIcon category detection", () => {
  it("detects folders", () => {
    expect(getFileCategory("src", true)).toBe("folder")
    expect(getFileCategory(".claude", true)).toBe("folder")
  })

  it("detects git files", () => {
    expect(getFileCategory(".gitignore")).toBe("git")
    expect(getFileCategory(".gitattributes")).toBe("git")
  })

  it("detects config and env files", () => {
    expect(getFileCategory(".env")).toBe("env")
    expect(getFileCategory(".env.local")).toBe("env")
    expect(getFileCategory("Makefile")).toBe("config")
  })

  it("detects markdown files", () => {
    expect(getFileCategory("AGENTS.md")).toBe("markdown")
    expect(getFileCategory("architecture.md")).toBe("markdown")
    expect(getFileCategory("DESIGN.md")).toBe("markdown")
  })

  it("detects terminal and scripts", () => {
    expect(getFileCategory("build-desktop.bat")).toBe("terminal")
    expect(getFileCategory("build-desktop.ps1")).toBe("terminal")
    expect(getFileCategory("deploy.sh")).toBe("terminal")
  })

  it("detects cargo and lock files", () => {
    expect(getFileCategory("Cargo.toml")).toBe("cargo")
    expect(getFileCategory("Cargo.lock")).toBe("lock")
    expect(getFileCategory("pnpm-lock.yaml")).toBe("lock")
  })

  it("detects yaml, json, license, and exe", () => {
    expect(getFileCategory("codemagic.yaml")).toBe("yaml")
    expect(getFileCategory("features.json")).toBe("json")
    expect(getFileCategory("LICENSE")).toBe("license")
    expect(getFileCategory("opencode-desktop.exe")).toBe("exe")
  })
})
