import type { ModelOption, ModelSelection } from "../types"

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

export function resolveModelOption(
  options: ModelOption[],
  selection: { providerID: string; modelID: string } | null,
  variant: string | null
): ModelOption | null {
  const v = variant ?? undefined
  if (selection) {
    if (v) {
      const exact = options.find((opt) => sameModel(opt, selection) && opt.variant === v)
      if (exact) return exact
    }
    const base = options.find((opt) => sameModel(opt, selection) && !opt.variant)
    if (base) return base
    const any = options.find((opt) => sameModel(opt, selection))
    if (any) return any
  }
  return options.find((opt) => opt.isDefault) ?? options[0] ?? null
}

export type VariantGroup = { base: ModelOption; variants: ModelOption[] }

// Variantes de un modelo: SOLO las que el server reporta (model.variants),
// filtradas desde una lista de ModelOption. Fuente única usada por el menú
// del chat, el model sheet y las preferencias (DRY).
export function variantsOf(models: ModelOption[], base: ModelOption | ModelSelection | null | undefined): ModelOption[] {
  if (!base) return []
  return models.filter((m) => sameModel(m, base) && !!m.variant)
}

// Agrupa modelos por provider:modelID, con el base (sin variant) y sus variantes.
export function groupModels(models: ModelOption[]): Map<string, VariantGroup> {
  const groups = new Map<string, VariantGroup>()
  for (const opt of models) {
    const key = modelKey(opt)
    if (!groups.has(key)) {
      const plain = models.find((m) => m !== opt && sameModel(m, opt) && !m.variant)
      groups.set(key, { base: plain ?? opt, variants: [] })
    }
    const group = groups.get(key)!
    if (opt.variant && opt !== group.base) group.variants.push(opt)
  }
  return groups
}
