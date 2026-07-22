import type { ModelSelection } from "../types"

export function modelKey(m: ModelSelection | { providerID: string; modelID: string }): string {
  return `${m.providerID}:${m.modelID}`
}

export function modelFromKey(key: string): { providerID: string; modelID: string } {
  const sep = key.indexOf(":")
  if (sep === -1) return { providerID: "", modelID: key }
  return { providerID: key.slice(0, sep), modelID: key.slice(sep + 1) }
}

export function sameModel(a?: ModelSelection | null, b?: ModelSelection | null): boolean {
  if (!a || !b) return false
  return a.providerID === b.providerID && a.modelID === b.modelID
}
