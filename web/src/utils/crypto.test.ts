import { describe, it, expect, beforeEach } from "vitest"
import { isCiphertext, encrypt, decrypt } from "./crypto"

describe("isCiphertext", () => {
  it("returns false for invalid base64", () => {
    expect(isCiphertext("not-base64!!!")).toBe(false)
  })
  it("returns false for short decoded string (<12 bytes)", () => {
    // "a" base64-encoded is "YQ==" -> decoded length 1
    expect(isCiphertext(btoa("a"))).toBe(false)
  })
  it("returns false for empty string", () => {
    expect(isCiphertext("")).toBe(false)
  })
  it("returns true for base64 with decoded length exactly 12", () => {
    const twelve = "a".repeat(12)
    expect(isCiphertext(btoa(twelve))).toBe(true)
  })
  it("returns true for longer valid base64", () => {
    const long = "a".repeat(50)
    expect(isCiphertext(btoa(long))).toBe(true)
  })
  it("returns false for string with invalid chars but b64 length check", () => {
    expect(isCiphertext("!!!")).toBe(false)
  })
})

describe("encrypt / decrypt roundtrip", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("encrypts and decrypts simple string", async () => {
    const plaintext = "hello world"
    const cipher = await encrypt(plaintext)
    expect(typeof cipher).toBe("string")
    expect(cipher.length).toBeGreaterThan(0)
    // cipher should be recognized as ciphertext
    expect(isCiphertext(cipher)).toBe(true)
    const decrypted = await decrypt(cipher)
    expect(decrypted).toBe(plaintext)
  })

  it("encrypts and decrypts empty string", async () => {
    const cipher = await encrypt("")
    const decrypted = await decrypt(cipher)
    expect(decrypted).toBe("")
  })

  it("encrypts and decrypts unicode / emoji", async () => {
    const plaintext = " hola — unicode test "
    const cipher = await encrypt(plaintext)
    const decrypted = await decrypt(cipher)
    expect(decrypted).toBe(plaintext)
  })

  it("produces different ciphertexts for same plaintext (random IV)", async () => {
    const plaintext = "same input"
    const c1 = await encrypt(plaintext)
    const c2 = await encrypt(plaintext)
    expect(c1).not.toBe(c2)
    expect(await decrypt(c1)).toBe(plaintext)
    expect(await decrypt(c2)).toBe(plaintext)
  })

  it("roundtrips long string", async () => {
    const plaintext = "a".repeat(5000)
    const cipher = await encrypt(plaintext)
    expect(await decrypt(cipher)).toBe(plaintext)
  })

  it("uses same key across multiple encrypt calls (localStorage persistence)", async () => {
    const c1 = await encrypt("first")
    const storedKey = localStorage.getItem("opencode.crypto.key")
    expect(storedKey).not.toBeNull()
    const c2 = await encrypt("second")
    // both decryptable with same key
    expect(await decrypt(c1)).toBe("first")
    expect(await decrypt(c2)).toBe("second")
    // key unchanged
    expect(localStorage.getItem("opencode.crypto.key")).toBe(storedKey)
  })

  it("isCiphertext returns false for plaintext", () => {
    expect(isCiphertext("hello world")).toBe(false)
  })

  it("decrypt fails with tampered ciphertext", async () => {
    const cipher = await encrypt("tamper me")
    // flip last char
    const tampered = cipher.slice(0, -2) + (cipher.slice(-2, -1) === "A" ? "B" : "A") + cipher.slice(-1)
    await expect(decrypt(tampered)).rejects.toThrow()
  })

  it("decrypt fails after key cleared and replaced", async () => {
    const cipher = await encrypt("key rotation test")
    // clear storage forces new key generation
    localStorage.clear()
    await expect(decrypt(cipher)).rejects.toThrow()
  })
})
