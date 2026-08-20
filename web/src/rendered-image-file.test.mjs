import assert from "node:assert/strict"

// Lógica fixeada: debe detectar file con mime image/*
function isImagePart(p) {
  const mime = p.mimeType ?? p.mime ?? ""
  return p.type === "image" || (p.type === "file" && mime.startsWith("image/"))
}

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`) } catch (e) { console.error(`✗ ${name}:`, e.message); process.exitCode = 1 }
}

test("file image mime renders", () => {
  const parts = [{ id: "p1", type: "file", mime: "image/png" }]
  assert.equal(parts.some(isImagePart), true, "file image debe detectarse")
})

test("file non-image not count as image", () => {
  const parts = [{ id: "p1", type: "file", mime: "application/pdf" }]
  assert.equal(parts.some(isImagePart), false, "pdf no debe contar como imagen")
})

console.log("rendered-image-file tests done")
