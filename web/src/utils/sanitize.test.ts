import { describe, it, expect } from "vitest"
import { sanitizeHtml, sanitizeClassName } from "./sanitize"

describe("sanitizeHtml", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeHtml("")).toBe("")
  })

  it("leaves safe HTML untouched", () => {
    const html = '<div><p>Hello <strong>world</strong></p><a href="https://example.com">link</a></div>'
    expect(sanitizeHtml(html)).toBe(html)
  })

  it("removes simple script tag", () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe("")
  })

  it("removes script tag with attributes and multiline content", () => {
    const html = '<SCRIPT type="text/javascript">\nalert("xss")\n</SCRIPT><p>ok</p>'
    const out = sanitizeHtml(html)
    expect(out).not.toContain("script")
    expect(out).not.toContain("alert")
    expect(out).toContain("<p>ok</p>")
  })

  it("removes script tag containing nested <", () => {
    const html = '<script>if (a < b) alert(1)</script><span>safe</span>'
    expect(sanitizeHtml(html)).toBe("<span>safe</span>")
  })

  it("removes multiple script tags", () => {
    const html = '<script>one</script>hello<script>two</script>'
    expect(sanitizeHtml(html)).toBe("hello")
  })

  it("removes iframe tags completely", () => {
    expect(sanitizeHtml('<iframe src="https://evil.com"></iframe>')).toBe("")
  })

  it("removes iframe with attributes and inner content", () => {
    const html = '<div><iframe src="x" width="100">inner</iframe>after</div>'
    const out = sanitizeHtml(html)
    expect(out).not.toContain("iframe")
    expect(out).not.toContain("inner")
    expect(out).toContain("after")
  })

  it("removes event handler attributes double quoted", () => {
    const html = '<div onclick="alert(1)" class="x">hi</div>'
    const out = sanitizeHtml(html)
    expect(out).not.toContain("onclick")
    expect(out).not.toContain("alert")
    expect(out).toContain("hi")
  })

  it("removes event handler attributes single quoted and unquoted", () => {
    expect(sanitizeHtml("<img src=x onerror='alert(1)'>")).not.toContain("onerror")
    expect(sanitizeHtml('<img src=x onerror=alert(1)>')).not.toContain("onerror")
    expect(sanitizeHtml('<body ONLOAD="evil()">')).not.toContain("ONLOAD")
  })

  it("removes various on* handlers", () => {
    const html = '<a onmouseover="x" onfocus="y" ondrag="z">t</a>'
    const out = sanitizeHtml(html)
    expect(out).not.toMatch(/onmouseover|onfocus|ondrag/i)
    expect(out).toContain("t")
  })

  it("strips javascript: protocol case-insensitive with spaces", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">click</a>')).not.toContain("javascript")
    expect(sanitizeHtml('<a href="JaVaScRiPt :alert(1)">click</a>')).not.toContain("javascript")
    expect(sanitizeHtml('<a href="  javascript  :alert(1)">x</a>')).not.toContain("javascript")
  })

  it("removes style attribute containing expression (IE XSS)", () => {
    const html = '<div style="width: expression(alert(1)); color:red">x</div>'
    const out = sanitizeHtml(html)
    // the style attribute with expression should be removed
    expect(out).not.toContain("expression")
    // other safe style without expression should also be matched? Actually only expression styles are removed
    expect(sanitizeHtml('<div style="color:red">safe</div>')).toContain('style="color:red"')
  })

  it("removes style with single quotes containing expression", () => {
    expect(sanitizeHtml("<div style='height:expression(alert(1))'>x</div>")).not.toContain("expression")
  })

  it("removes srcdoc attribute double, single and unquoted", () => {
    expect(sanitizeHtml('<iframe srcdoc="<p>evil</p>"></iframe>')).not.toContain("srcdoc")
    expect(sanitizeHtml("<div srcdoc='<p>evil</p>'>x</div>")).not.toContain("srcdoc")
    expect(sanitizeHtml('<div srcdoc=evil>x</div>')).not.toContain("srcdoc")
  })

  it("removes data:text/html payloads", () => {
    expect(sanitizeHtml('<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>')).not.toContain("data:text/html")
    expect(sanitizeHtml('data:text/html, <script>alert(1)</script>')).not.toContain("data:text/html")
    // with spaces
    expect(sanitizeHtml('data : text/html ,evil')).not.toContain("data:text/html")
  })

  it("handles combined XSS payload", () => {
    const payload = `<div onclick="alert(1)" style="x:expression(alert(2))"><script>alert(3)</script><iframe srcdoc="evil"></iframe><a href="javascript:alert(4)">click</a></div>`
    const out = sanitizeHtml(payload)
    expect(out).not.toContain("script")
    expect(out).not.toContain("onclick")
    expect(out).not.toContain("javascript")
    expect(out).not.toContain("iframe")
    expect(out).not.toContain("expression")
    expect(out).not.toContain("srcdoc")
  })

  it("does not remove safe attributes like href https or class", () => {
    const html = '<a href="https://example.com" class="link" title="ok">safe</a>'
    expect(sanitizeHtml(html)).toBe(html)
  })

  it("is case-insensitive for script and iframe", () => {
    expect(sanitizeHtml('<ScRiPt>alert(1)</ScRiPt>')).toBe("")
    expect(sanitizeHtml('<IFRAME></IFRAME>')).toBe("")
  })
})

describe("sanitizeClassName", () => {
  it("returns empty for empty input", () => {
    expect(sanitizeClassName("")).toBe("")
  })

  it("keeps allowed chars alphanumeric dash underscore space", () => {
    expect(sanitizeClassName("foo bar-baz_qux 123")).toBe("foo bar-baz_qux 123")
  })

  it("removes special characters like . ; : /", () => {
    expect(sanitizeClassName("foo;bar:baz.qux/quux")).toBe("foobarbazquxquux")
  })

  it("removes XSS attempt in class name", () => {
    expect(sanitizeClassName('"><script>alert(1)</script>')).not.toContain("<")
    expect(sanitizeClassName('"><script>alert(1)</script>')).not.toContain(">")
    expect(sanitizeClassName('"><script>alert(1)</script>')).not.toContain('"')
  })

  it("removes brackets, quotes, equals, parentheses", () => {
    expect(sanitizeClassName("a[b]c(d)e=f\"g'h<i>j")).toBe("abcdefghij")
  })

  it("preserves spaces and collapses nothing (only filters)", () => {
    expect(sanitizeClassName("  hello   world  ")).toBe("  hello   world  ")
  })

  it("handles only disallowed chars", () => {
    expect(sanitizeClassName("!@#$%^&*()")).toBe("")
  })

  it("handles unicode stripped", () => {
    // non-ascii letters should be removed
    expect(sanitizeClassName("café naïve")).toBe("caf nave")
  })
})
