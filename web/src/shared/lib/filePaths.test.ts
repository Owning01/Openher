import { describe, it, expect } from "vitest"
import {
  basenameFsPath,
  cleanInlineCodePath,
  extColor,
  findTextFilePaths,
  isAbsoluteFsPath,
  localFsPathFromImageSrc,
  pathFromOpenherHref,
  resolveFsPath,
  splitFsPath,
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

describe("splitFsPath", () => {
  it("separa carpeta (con separador) y nombre", () => {
    expect(splitFsPath("G:\\a\\b\\c.ts")).toEqual({ dir: "G:\\a\\b\\", name: "c.ts" })
    expect(splitFsPath("/home/u/a.md")).toEqual({ dir: "/home/u/", name: "a.md" })
    expect(splitFsPath("c.ts")).toEqual({ dir: "", name: "c.ts" })
  })
})

describe("extColor", () => {
  it("colorea por extensión con fallback muted", () => {
    expect(extColor("a.tsx")).toBe("#7dd3fc")
    expect(extColor("a.css")).toBe("#f0abfc")
    expect(extColor("a.ZIP")).toBe("#fcd34d")
    expect(extColor("a.desconocida")).toBe("#a1a1aa")
    expect(extColor("sin-extension")).toBe("#a1a1aa")
  })
})

describe("localFsPathFromImageSrc", () => {
  it("detecta rutas del FS local", () => {
    expect(localFsPathFromImageSrc("C:\\a\\b.png")).toBe("C:\\a\\b.png")
    expect(localFsPathFromImageSrc("file:///C:/a/b.png")).toBe("C:/a/b.png")
    expect(localFsPathFromImageSrc("\\\\nas\\share\\b.png")).toBe("\\\\nas\\share\\b.png")
    expect(localFsPathFromImageSrc("/home/user/b.png")).toBe("/home/user/b.png")
    expect(localFsPathFromImageSrc("/tmp/b.png")).toBe("/tmp/b.png")
  })
  it("decodifica backslashes percent-encodeados por micromark", () => {
    expect(localFsPathFromImageSrc("C:%5CUsers%5Cperca%5Cshot.png")).toBe("C:\\Users\\perca\\shot.png")
  })
  it("no toca web, remotas ni data/blob", () => {
    expect(localFsPathFromImageSrc("https://x.com/a.png")).toBeNull()
    expect(localFsPathFromImageSrc("/img/logo.png")).toBeNull()
    expect(localFsPathFromImageSrc("data:image/png;base64,AAAA")).toBeNull()
    expect(localFsPathFromImageSrc("blob:http://x/abc")).toBeNull()
  })
})
