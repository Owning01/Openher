import { describe, it, expect, vi, beforeEach } from "vitest"
import { lowlight, langFromFilename } from "./highlight"

describe("langFromFilename", () => {
  it("maps js variants to javascript", () => {
    expect(langFromFilename("file.js")).toBe("javascript")
    expect(langFromFilename("app.jsx")).toBe("javascript")
    expect(langFromFilename("module.mjs")).toBe("javascript")
    expect(langFromFilename("common.cjs")).toBe("javascript")
  })

  it("maps ts variants to typescript", () => {
    expect(langFromFilename("file.ts")).toBe("typescript")
    expect(langFromFilename("comp.tsx")).toBe("typescript")
    expect(langFromFilename("mod.mts")).toBe("typescript")
  })

  it("maps python variants", () => {
    expect(langFromFilename("script.py")).toBe("python")
    expect(langFromFilename("script.pyw")).toBe("python")
  })

  it("maps json variants", () => {
    expect(langFromFilename("data.json")).toBe("json")
    expect(langFromFilename("config.jsonc")).toBe("json")
  })

  it("maps shell variants to bash", () => {
    expect(langFromFilename("run.sh")).toBe("bash")
    expect(langFromFilename("run.bash")).toBe("bash")
    expect(langFromFilename("run.zsh")).toBe("bash")
  })

  it("maps css variants", () => {
    expect(langFromFilename("style.css")).toBe("css")
    expect(langFromFilename("style.scss")).toBe("css")
    expect(langFromFilename("style.less")).toBe("css")
  })

  it("maps html variants", () => {
    expect(langFromFilename("index.html")).toBe("html")
    expect(langFromFilename("file.htm")).toBe("html")
    expect(langFromFilename("data.xml")).toBe("html")
    expect(langFromFilename("icon.svg")).toBe("html")
  })

  it("maps go", () => {
    expect(langFromFilename("main.go")).toBe("go")
  })

  it("maps rust variants", () => {
    expect(langFromFilename("lib.rs")).toBe("rust")
    expect(langFromFilename("lib.rust")).toBe("rust")
  })

  it("maps sql", () => {
    expect(langFromFilename("query.sql")).toBe("sql")
  })

  it("maps yaml variants", () => {
    expect(langFromFilename("config.yml")).toBe("yaml")
    expect(langFromFilename("config.yaml")).toBe("yaml")
  })

  it("maps toml/ini variants to toml", () => {
    expect(langFromFilename("cargo.toml")).toBe("toml")
    expect(langFromFilename("setup.ini")).toBe("toml")
    expect(langFromFilename("app.cfg")).toBe("toml")
  })

  it("maps markdown variants", () => {
    expect(langFromFilename("README.md")).toBe("markdown")
    expect(langFromFilename("doc.markdown")).toBe("markdown")
  })

  it("maps diff variants", () => {
    expect(langFromFilename("change.diff")).toBe("diff")
    expect(langFromFilename("fix.patch")).toBe("diff")
  })

  it("maps graphql variants", () => {
    expect(langFromFilename("schema.graphql")).toBe("graphql")
    expect(langFromFilename("query.gql")).toBe("graphql")
  })

  it("maps C/C++ to c/cpp", () => {
    expect(langFromFilename("main.c")).toBe("c")
    expect(langFromFilename("header.h")).toBe("c")
    expect(langFromFilename("app.cpp")).toBe("cpp")
    expect(langFromFilename("module.cxx")).toBe("cpp")
    expect(langFromFilename("code.cc")).toBe("cpp")
    expect(langFromFilename("header.hpp")).toBe("cpp")
  })

  it("maps jvm languages", () => {
    expect(langFromFilename("Main.java")).toBe("java")
    expect(langFromFilename("app.kt")).toBe("kotlin")
    expect(langFromFilename("script.kts")).toBe("kotlin")
  })

  it("maps other languages file extensions", () => {
    expect(langFromFilename("app.rb")).toBe("ruby")
    expect(langFromFilename("index.php")).toBe("php")
    expect(langFromFilename("view.swift")).toBe("swift")
    expect(langFromFilename("app.dart")).toBe("dart")
  })

  it("returns plaintext for unknown extension", () => {
    expect(langFromFilename("file.unknownxyz")).toBe("plaintext")
    expect(langFromFilename("file.abc")).toBe("plaintext")
  })

  it("returns plaintext when no extension", () => {
    expect(langFromFilename("Makefile")).toBe("plaintext")
    expect(langFromFilename("noext")).toBe("plaintext")
    expect(langFromFilename("")).toBe("plaintext")
  })

  it("is case-insensitive", () => {
    expect(langFromFilename("FILE.JS")).toBe("javascript")
    expect(langFromFilename("style.CSS")).toBe("css")
    expect(langFromFilename("README.MD")).toBe("markdown")
  })

  it("uses last extension for multiple dots", () => {
    expect(langFromFilename("my.test.js")).toBe("javascript")
    expect(langFromFilename("archive.tar.gz")).toBe("plaintext") // gz not mapped
    expect(langFromFilename("a.b.c.ts")).toBe("typescript")
  })

  it("handles dotfiles", () => {
    expect(langFromFilename(".gitignore")).toBe("plaintext")
    expect(langFromFilename(".eslintrc.json")).toBe("json")
  })
})

describe("lowlight instance", () => {
  it("is defined", () => {
    expect(lowlight).toBeDefined()
  })

  it("has highlight method", () => {
    expect(typeof lowlight.highlight).toBe("function")
  })

  it("can highlight javascript", () => {
    const tree = lowlight.highlight("javascript", "const x = 1;")
    expect(tree).toBeDefined()
    expect(tree.type).toBe("root")
    expect(Array.isArray((tree as unknown as { children: unknown[] }).children)).toBe(true)
  })

  it("can highlight typescript alias ts", () => {
    const tree = lowlight.highlight("ts", "const y: number = 2;")
    expect(tree.type).toBe("root")
  })

  it("can highlight python", () => {
    const tree = lowlight.highlight("python", "def foo(): pass")
    expect(tree.type).toBe("root")
  })

  it("can highlight using registered aliases js, sh, py, etc.", () => {
    expect(() => lowlight.highlight("js", "let a=1")).not.toThrow()
    expect(() => lowlight.highlight("sh", "echo hi")).not.toThrow()
    expect(() => lowlight.highlight("py", "print('hi')")).not.toThrow()
    expect(() => lowlight.highlight("md", "# title")).not.toThrow()
    expect(() => lowlight.highlight("yml", "key: value")).not.toThrow()
  })

  it("highlights plaintext without error", () => {
    const tree = lowlight.highlight("plaintext", "just text")
    expect(tree.type).toBe("root")
  })

  it("registered languages include expected set", () => {
    // lowlight has registered method in v3; check via highlight or list
    // we test that known languages don't throw, unknown may fallback
    const langs = ["javascript", "typescript", "json", "bash", "python", "css", "html", "go", "rust", "sql", "yaml", "toml", "markdown", "diff", "graphql", "plaintext"]
    for (const lang of langs) {
      expect(() => lowlight.highlight(lang, "test")).not.toThrow()
    }
  })
})
