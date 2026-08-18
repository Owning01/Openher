/**
 * Lightweight Spanish → English translator using Google Translate's public endpoint.
 * No API keys, no dependencies — just a fetch + parse.
 */

const ENDPOINT = "https://translate.googleapis.com/translate_a/single"

export async function translateToEnglish(text: string): Promise<string> {
  if (!text.trim()) return text
  const url = `${ENDPOINT}?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Translation failed: ${res.status}`)
  const data = await res.json()
  // Response shape: [[["translated","original",null,null,10], ...], null, "es"]
  // Each sub-array is a sentence pair [translated, original, ...]
  const sentences: string[] = []
  if (Array.isArray(data?.[0])) {
    for (const block of data[0]) {
      if (Array.isArray(block) && block[0]) {
        sentences.push(block[0])
      }
    }
  }
  return sentences.join("") || text
}
