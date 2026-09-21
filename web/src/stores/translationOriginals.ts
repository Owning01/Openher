// Translation originals: maps message ID → original (pre-translation) text.
// Populated when TSL is active and a message is sent.
// CAP FIFO: map module-level vivo toda la sesión — sin tope, crece eterno.
// (Onda 3 / B2: extraído tal cual desde hooks/useMessages.ts; useMessages lo
// re-exporta para no romper a MessageBubble.)
const TRANSLATION_ORIGINALS_CAP = 200
const translationOriginals = new Map<string, string>()

export function getTranslationOriginal(id: string): string | undefined {
  return translationOriginals.get(id)
}

export function setTranslationOriginal(id: string, text: string) {
  if (!translationOriginals.has(id) && translationOriginals.size >= TRANSLATION_ORIGINALS_CAP) {
    const oldest = translationOriginals.keys().next().value
    if (oldest !== undefined) translationOriginals.delete(oldest)
  }
  translationOriginals.set(id, text)
}
