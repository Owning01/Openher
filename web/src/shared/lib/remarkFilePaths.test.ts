import { describe, it, expect } from "vitest"
import { remarkFilePaths } from "./remarkFilePaths"

type AnyNode = any

function paragraph(value: string): AnyNode {
  return { type: "root", children: [{ type: "paragraph", children: [{ type: "text", value }] }] }
}

describe("remarkFilePaths", () => {
  it("convierte una ruta en link openher-path", () => {
    const tree = paragraph("Abrí G:\\Proyectos\\web\\a.ts ahora")
    remarkFilePaths()(tree)
    const children = tree.children[0].children
    expect(children.map((c: AnyNode) => c.type)).toEqual(["text", "link", "text"])
    expect(children[1].url).toBe("openher-path:" + encodeURIComponent("G:\\Proyectos\\web\\a.ts"))
    expect(children[1].children[0].value).toBe("G:\\Proyectos\\web\\a.ts")
  })

  it("no toca links ni inline code existentes", () => {
    const tree: AnyNode = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "link", url: "https://x.com/G:\\a\\b.ts", children: [{ type: "text", value: "G:\\a\\b.ts" }] },
            { type: "inlineCode", value: "C:\\x\\y.md" },
          ],
        },
      ],
    }
    remarkFilePaths()(tree)
    expect(tree.children[0].children.map((c: AnyNode) => c.type)).toEqual(["link", "inlineCode"])
  })

  it("deja el texto intacto si no hay rutas", () => {
    const tree = paragraph("hola mundo")
    remarkFilePaths()(tree)
    expect(tree.children[0].children).toHaveLength(1)
    expect(tree.children[0].children[0].type).toBe("text")
  })
})
