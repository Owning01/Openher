import { describe, it, expect } from "vitest"
import {
  escapeHtml,
  hastToHtml,
  commentPrefixFor,
  getLineCol,
  offsetFromLineCol,
  lineRangeOf,
  toggleLineComment,
  duplicateLineOrSelection,
  moveLine,
  deleteLine,
  trimTrailingWhitespace,
  indentSelection,
  autoIndentForEnter,
  pairCloser,
  isCloser,
  toBase64Chunked,
  countOccurrences,
  findNext,
  findMatchingBracket,
  collectWords,
  wordBeforeCaret,
  applyEdits,
  diffLines,
} from "./editorOps"

describe("escapeHtml/hastToHtml", () => {
  it("escapa entidades", () => {
    expect(escapeHtml(`<a href="x">&`)).toBe(`&lt;a href=&quot;x&quot;&gt;&amp;`)
  })
  it("serializa spans de lowlight y filtra tags raros", () => {
    const html = hastToHtml([
      { type: "element", tagName: "span", properties: { className: ["hljs-keyword"] }, children: [{ type: "text", value: "const" }] },
      { type: "text", value: " x < y" },
      { type: "element", tagName: "script", children: [{ type: "text", value: "evil()" }] },
    ])
    expect(html).toBe(`<span class="hljs-keyword">const</span> x &lt; y<span>evil()</span>`)
  })
})

describe("commentPrefixFor", () => {
  it("elige # para python/yaml/shell", () => {
    expect(commentPrefixFor("a.py")).toBe("#")
    expect(commentPrefixFor("a.yml")).toBe("#")
    expect(commentPrefixFor("a.sh")).toBe("#")
  })
  it("elige -- para sql/lua", () => {
    expect(commentPrefixFor("a.sql")).toBe("--")
    expect(commentPrefixFor("a.lua")).toBe("--")
  })
  it("default // y Makefile con #", () => {
    expect(commentPrefixFor("a.ts")).toBe("//")
    expect(commentPrefixFor("Makefile")).toBe("#")
  })
})

describe("getLineCol/offsetFromLineCol", () => {
  const text = "ab\ncdef\n\ngh"
  it("calcula línea y columna", () => {
    expect(getLineCol(text, 0)).toEqual({ line: 1, col: 1 })
    expect(getLineCol(text, 3)).toEqual({ line: 2, col: 1 })
    expect(getLineCol(text, 5)).toEqual({ line: 2, col: 3 })
    expect(getLineCol(text, text.length)).toEqual({ line: 4, col: 3 })
  })
  it("roundtrip", () => {
    expect(offsetFromLineCol(text, 2, 3)).toBe(5)
    expect(offsetFromLineCol(text, 4, 9)).toBe(text.length)
    expect(offsetFromLineCol(text, 99, 1)).toBe(text.length)
  })
  it("lineRangeOf", () => {
    expect(lineRangeOf(text, 4)).toEqual({ start: 3, end: 7 })
  })
})

describe("toggleLineComment", () => {
  it("comenta y descomenta preservando indent", () => {
    const text = "  const x = 1\n  const y = 2"
    const c = toggleLineComment(text, 0, text.length, "//")
    expect(c.text).toBe("  // const x = 1\n  // const y = 2")
    const u = toggleLineComment(c.text, 0, c.text.length, "//")
    expect(u.text).toBe(text)
  })
  it("salta líneas vacías", () => {
    const c = toggleLineComment("a = 1\n\nb = 2", 0, 9, "#")
    expect(c.text).toBe("# a = 1\n\n# b = 2")
  })
})

describe("duplicateLineOrSelection", () => {
  it("duplica línea actual debajo", () => {
    const r = duplicateLineOrSelection("ab\ncd", 0, 0)
    expect(r.text).toBe("ab\nab\ncd")
  })
  it("duplica última línea sin romper archivo", () => {
    const r = duplicateLineOrSelection("ab\ncd", 4, 4)
    expect(r.text).toBe("ab\ncd\ncd")
  })
  it("duplica selección", () => {
    const r = duplicateLineOrSelection("abcdef", 1, 3)
    expect(r.text).toBe("abcbcdef")
  })
})

describe("moveLine", () => {
  it("sube y baja líneas", () => {
    expect(moveLine("a\nb\nc", 2, 2, -1)?.text).toBe("b\na\nc")
    expect(moveLine("a\nb\nc", 0, 0, 1)?.text).toBe("b\na\nc")
  })
  it("respeta bordes", () => {
    expect(moveLine("a\nb", 0, 0, -1)).toBeNull()
    expect(moveLine("a\nb", 2, 2, 1)).toBeNull()
  })
})

describe("deleteLine", () => {
  it("borra línea actual", () => {
    expect(deleteLine("a\nb\nc", 2, 2).text).toBe("a\nc")
  })
  it("archivo de una línea queda vacío", () => {
    expect(deleteLine("solo", 0, 0)).toEqual({ text: "", selStart: 0, selEnd: 0 })
  })
})

describe("trim/indent", () => {
  it("trim cuenta caracteres", () => {
    const r = trimTrailingWhitespace("a  \nb\t\nc")
    expect(r).toEqual({ text: "a\nb\nc", removed: 3 })
  })
  it("indent/outdent con espacios", () => {
    const ind = indentSelection("a\nb", 0, 3, "  ", false)
    expect(ind.text).toBe("  a\n  b")
    expect(indentSelection(ind.text, 0, ind.text.length, "  ", true).text).toBe("a\nb")
  })
})

describe("autoIndent/pairs", () => {
  it("hereda indent y suma tras {", () => {
    expect(autoIndentForEnter("  if (x) {", "  ")).toBe("\n    ")
    expect(autoIndentForEnter("  return y", "  ")).toBe("\n  ")
  })
  it("pares y closers", () => {
    expect(pairCloser("(")).toBe(")")
    expect(pairCloser("x")).toBeNull()
    expect(isCloser("]")).toBe(true)
    expect(isCloser("a")).toBe(false)
  })
})

describe("toBase64Chunked", () => {
  it("equivale a btoa clásico incl. unicode", () => {
    const s = "hola ñ mundo 🚀 " + "x".repeat(100000)
    const expected = btoa(unescape(encodeURIComponent(s)))
    expect(toBase64Chunked(s)).toBe(expected)
  })
})

describe("search helpers", () => {
  it("cuenta con y sin case", () => {
    expect(countOccurrences("Aa aa aA", "aa", false)).toBe(3)
    expect(countOccurrences("Aa aa aA", "aa", true)).toBe(1)
  })
  it("findNext envuelve al inicio", () => {
    expect(findNext("ab ab", "ab", 3, true)).toBe(3)
    expect(findNext("ab ab", "ab", 4, true)).toBe(0)
  })
})

describe("findMatchingBracket", () => {
  it("encuentra pareja hacia adelante y atrás", () => {
    expect(findMatchingBracket("a(b)c", 2)).toEqual({ open: 1, close: 3 })
    expect(findMatchingBracket("a(b)c", 4)).toEqual({ open: 1, close: 3 })
  })
  it("anida por profundidad", () => {
    expect(findMatchingBracket("(a(b))", 1)).toEqual({ open: 0, close: 5 })
    expect(findMatchingBracket("(a(b))", 3)).toEqual({ open: 2, close: 4 })
  })
  it("null si no hay bracket o no cierra", () => {
    expect(findMatchingBracket("abc", 1)).toBeNull()
    expect(findMatchingBracket("(abc", 1)).toBeNull()
  })
})

describe("collectWords/wordBeforeCaret", () => {
  it("ordena por frecuencia y filtra cortas", () => {
    expect(collectWords("foo bar foo x ab foo bar", 2)).toEqual(["foo", "bar", "ab"])
  })
  it("prefijo antes del caret", () => {
    expect(wordBeforeCaret("const myVar1", 12)).toEqual({ word: "myVar1", start: 6 })
    expect(wordBeforeCaret("a+b", 3)).toEqual({ word: "b", start: 2 })
  })
})

describe("applyEdits", () => {
  it("aplica multi-cursor sin corromper offsets", () => {
    expect(applyEdits("aaa", [{ start: 0, end: 0, insert: "X" }, { start: 2, end: 2, insert: "Y" }])).toBe("XaaYa")
    expect(applyEdits("abcdef", [{ start: 1, end: 3, insert: "" }])).toBe("adef")
  })
  it("solapadas: gana la de mayor offset, la otra se descarta", () => {
    expect(applyEdits("abcdef", [{ start: 1, end: 4, insert: "1" }, { start: 2, end: 3, insert: "2" }])).toBe("ab2def")
  })
})

describe("diffLines", () => {
  it("iguales → sin hunks", () => {
    expect(diffLines("a\nb", "a\nb")).toEqual({ hunks: [], tooLarge: false })
  })
  it("cambio simple con contexto del recorte", () => {
    const { hunks, tooLarge } = diffLines("l1\nl2\nl3\nl4\nl5", "l1\nl2\nX\nl4\nl5")
    expect(tooLarge).toBe(false)
    expect(hunks).toHaveLength(1)
    expect(hunks[0].lines.filter((l) => l.t !== " ").map((l) => l.t + l.text)).toEqual(["-l3", "+X"])
    expect(hunks[0].oldStart).toBe(1)
    expect(hunks[0].lines.map((l) => l.t + l.text)).toEqual([" l1", " l2", "-l3", "+X", " l4", " l5"])
  })
  it("cambios lejanos → dos hunks", () => {
    const oldT = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"].join("\n")
    const newT = ["A", "b", "c", "d", "e", "f", "g", "h", "i", "j", "K"].join("\n")
    expect(diffLines(oldT, newT).hunks).toHaveLength(2)
  })
  it("gigante → tooLarge", () => {
    const big = Array.from({ length: 21000 }, (_, i) => `l${i}`).join("\n")
    expect(diffLines(big, big + "\nx").tooLarge).toBe(true)
  })
})
