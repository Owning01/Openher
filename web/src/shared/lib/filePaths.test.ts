import { describe, it, expect } from "vitest"
import {
  basenameFsPath,
  cleanInlineCodePath,
  findTextFilePaths,
  isAbsoluteFsPath,
  pathFromOpenherHref,
  resolveFsPath,
  toOpenherPathHref,
} from "./filePaths"

describe("isAbsoluteFsPath", () => {
  it("acepta Windows, UNC y POSIX", () => {
    expect(isAbsoluteFsPath("C:\\Users\\perca\\a.md")).toBe(true)
    expect(isAbsoluteFsPath("C:/Users/perca/a.md")).toBe(true)
    expect(isAbsoluteFsPath("\\\\server\\share\\a.md")).toBe(true)
    expect(isAbsoluteFsPath("/home/user/a.md")).toBe(true)
  })
  it("rechaza nombres y relativas", () => {
    expect(isAbsoluteFsPath("a.md")).toBe(false)
    expect(isAbsoluteFsPath("src/a.md")).toBe(false)
  })
})

describe("cleanInlineCodePath", () => {
  it("acepta absolutas (incluso con espacios) y relativas con extensión", () => {
    expect(cleanInlineCodePath("C:\\Program Files\\App\\app.exe")).toBe("C:\\Program Files\\App\\app.exe")
    expect(cleanInlineCodePath("web/src/styles/layout.css")).toBe("web/src/styles/layout.css")
    expect(cleanInlineCodePath("/tmp/nota.md")).toBe("/tmp/nota.md")
  })
  it("rechaza texto que no es ruta", () => {
    expect(cleanInlineCodePath("npm run dev")).toBeNull()
    expect(cleanInlineCodePath("src")).toBeNull()
    expect(cleanInlineCodePath("v1.2.3")).toBeNull()
    expect(cleanInlineCodePath("C:\\")).toBeNull()
    expect(cleanInlineCodePath("a\nb")).toBeNull()
  })
})

describe("findTextFilePaths", () => {
  it("encuentra rutas Windows/UNC/POSIX/relativas", () => {
    const text = "Abrí G:\\Proyectos\\web\\src\\styles\\layout.css y \\\\nas\\share\\x.ts y /home/user/y.ts y src/components/ChatView.tsx listo"
    expect(findTextFilePaths(text).map((m) => m.path)).toEqual([
      "G:\\Proyectos\\web\\src\\styles\\layout.css",
      "\\\\nas\\share\\x.ts",
      "/home/user/y.ts",
      "src/components/ChatView.tsx",
    ])
  })

  it("recorta puntuación de la prosa", () => {
    const text = "En C:\\Users\\perca\\Documents\\nota.md. Y ver (src/components/ChatView.tsx)"
    expect(findTextFilePaths(text).map((m) => m.path)).toEqual([
      "C:\\Users\\perca\\Documents\\nota.md",
      "src/components/ChatView.tsx",
    ])
  })

  it("ignora URLs, fechas y falsos positivos", () => {
    const text = "https://github.com/x/y.ts 9/11/2026 y/o TCP/IP 24/7 and/or"
    expect(findTextFilePaths(text)).toEqual([])
  })

  it("no matchea una ruta pegada a una palabra", () => {
    expect(findTextFilePaths("abcC:\\x\\y.md")).toEqual([])
  })

  it("devuelve índices utilizables para partir el texto", () => {
    const text = "ver src/a.ts ahora"
    const [m] = findTextFilePaths(text)
    expect(m).toBeDefined()
    expect(text.slice(m!.index, m!.index + m!.length)).toBe("src/a.ts")
  })
})

describe("resolveFsPath", () => {
  it("deja las absolutas igual", () => {
    expect(resolveFsPath("C:\\x\\a.ts", "G:\\proj")).toBe("C:\\x\\a.ts")
  })
  it("resuelve relativas contra el directorio con su separador", () => {
    expect(resolveFsPath("src/a.ts", "G:\\Proyectos\\app")).toBe("G:\\Proyectos\\app\\src\\a.ts")
    expect(resolveFsPath("src/a.ts", "/home/user/app")).toBe("/home/user/app/src/a.ts")
  })
  it("sin directorio devuelve la relativa tal cual", () => {
    expect(resolveFsPath("src/a.ts")).toBe("src/a.ts")
  })
})

describe("href de rutas", () => {
  it("hace roundtrip con caracteres especiales", () => {
    const p = "G:\\a b\\ñandú.ts"
    expect(pathFromOpenherHref(toOpenherPathHref(p))).toBe(p)
  })
  it("rechaza otros esquemas", () => {
    expect(pathFromOpenherHref("https://x.com")).toBeNull()
  })
})

describe("basenameFsPath", () => {
  it("devuelve el último segmento", () => {
    expect(basenameFsPath("C:\\a\\b\\c.md")).toBe("c.md")
    expect(basenameFsPath("/a/b/c.md")).toBe("c.md")
  })
})
