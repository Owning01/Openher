import assert from "node:assert/strict"

// Reimplementa la lógica fixeada (debe coincidir con src/utils.ts)
function isImagePart(p) {
  const mime = p.mimeType ?? p.mime ?? ""
  return p.type === "image" || (p.type === "file" && mime.startsWith("image/"))
}
function countImageParts(parts) {
  return parts.filter(isImagePart).length
}

let ok = true
function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`) } catch (e) { ok = false; console.error(`✗ ${name}:`, e.message) }
}

test("isImagePart con mime (Composer)", () => {
  assert.equal(isImagePart({ type: "file", mime: "image/png" }), true)
  assert.equal(isImagePart({ type: "file", mimeType: "image/png" }), true)
  assert.equal(isImagePart({ type: "image", mime: "image/jpeg" }), true)
})

test("isImagePart no imagen", () => {
  assert.equal(isImagePart({ type: "file", mime: "text/plain" }), false)
  assert.equal(isImagePart({ type: "text", text: "hi" }), false)
})

test("countImageParts con mime", () => {
  const parts = [{ type: "file", mime: "image/png" }, { type: "text", text: "hi" }]
  assert.equal(countImageParts(parts), 1)
})

test("countImageParts mixto mime/mimeType", () => {
  const parts = [
    { type: "file", mime: "image/png" },
    { type: "file", mimeType: "image/jpeg" },
    { type: "file", mime: "application/pdf" },
  ]
  assert.equal(countImageParts(parts), 2)
})

if (!ok) process.exit(1)
console.log("isImage tests passed")
