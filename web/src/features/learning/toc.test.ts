import { describe, it, expect } from "vitest"
import { extractToc } from "./LessonView"

describe("extractToc", () => {
  it("extrae h1-h3 con ids slug", () => {
    const toc = extractToc("# Título\n\n## Sección A\n\n### Detalle\n\n#### Ignorado\n")
    expect(toc).toHaveLength(3)
    expect(toc[0]).toMatchObject({ level: 1, text: "Título", id: "titulo" })
    expect(toc[1]).toMatchObject({ level: 2, text: "Sección A" })
  })

  it("desambigua duplicados", () => {
    const toc = extractToc("## Repo\n\n## Repo\n")
    expect(toc.map((t) => t.id)).toEqual(["repo", "repo-2"])
  })

  it("ignora líneas sin heading y vacías", () => {
    expect(extractToc("texto\n\n# \n\n## Ok\n")).toHaveLength(1)
  })
})
