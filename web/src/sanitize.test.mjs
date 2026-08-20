import assert from "node:assert/strict"
import { sanitizeHtml } from "./utils/sanitize.ts"

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`) } catch (e) { console.error(`✗ ${name}:`, e.message); process.exitCode = 1 }
}

test("strip script", () => {
  assert.equal(sanitizeHtml('<script>alert(1)</script><b>ok</b>').includes("<script"), false)
  assert.ok(sanitizeHtml('<b>ok</b>').includes("<b>"))
})

test("strip onerror unquoted", () => {
  assert.equal(sanitizeHtml('<img onerror=alert(1)>').includes("onerror"), false)
  assert.equal(sanitizeHtml('<svg/onload=alert(1)>').includes("onload"), false)
  assert.equal(sanitizeHtml('<img onerror="alert(1)">').includes("onerror"), false)
})

test("strip javascript:", () => {
  assert.equal(sanitizeHtml('<a href="javascript:alert(1)">x</a>').includes("javascript:"), false)
  assert.equal(sanitizeHtml('<a href="JaVaScRiPt:alert(1)">x</a>').includes("javascript"), false)
})

test("keeps safe html", () => {
  assert.ok(sanitizeHtml('<b>ok</b><p>hi</p>').includes("<b>ok</b>"))
})

console.log("sanitize tests done")
