const ALGO = "AES-GCM"
const KEY_LEN = 256
const KEY_STORAGE = "opencode.crypto.key"

function keyToBase64(key: CryptoKey): Promise<string> {
  return crypto.subtle.exportKey("raw", key).then((raw) => btoa(String.fromCharCode(...new Uint8Array(raw))))
}

function base64ToKey(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey("raw", raw, ALGO, false, ["encrypt", "decrypt"])
}

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = sessionStorage.getItem(KEY_STORAGE)
  if (stored) return base64ToKey(stored)
  const key = await crypto.subtle.generateKey({ name: ALGO, length: KEY_LEN }, false, ["encrypt", "decrypt"])
  const b64 = await keyToBase64(key)
  sessionStorage.setItem(KEY_STORAGE, b64)
  return key
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decrypt(ciphertextB64: string): Promise<string> {
  const key = await getOrCreateKey()
  const combined = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0))
  const iv = combined.subarray(0, 12)
  const data = combined.subarray(12)
  const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv }, key, data)
  return new TextDecoder().decode(decrypted)
}

export function isCiphertext(value: string): boolean {
  try {
    const decoded = atob(value)
    return decoded.length >= 12
  } catch { return false }
}
