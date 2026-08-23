import { describe, it, expect } from "vitest"
import { modelKey, modelFromKey, sameModel, resolveModelOption, variantsOf, groupModels } from "./model-utils"
import type { ModelOption, ModelSelection } from "../types"

function makeOption(overrides: Partial<ModelOption> & { providerID: string; modelID: string }): ModelOption {
  return {
    providerName: overrides.providerID,
    modelName: overrides.modelID,
    ...overrides,
  }
}

const baseOpt = makeOption({ providerID: "anthropic", modelID: "claude-3", providerName: "Anthropic", modelName: "Claude 3" })
const variantOpt = makeOption({ providerID: "anthropic", modelID: "claude-3", providerName: "Anthropic", modelName: "Claude 3", variant: "thinking" })
const variantOpt2 = makeOption({ providerID: "anthropic", modelID: "claude-3", providerName: "Anthropic", modelName: "Claude 3", variant: "fast" })
const otherOpt = makeOption({ providerID: "openai", modelID: "gpt-4", providerName: "OpenAI", modelName: "GPT-4" })
const defaultOpt = makeOption({ providerID: "openai", modelID: "gpt-4", providerName: "OpenAI", modelName: "GPT-4", isDefault: true })

describe("modelKey", () => {
  it("returns providerID:modelID", () => {
    expect(modelKey({ providerID: "anthropic", modelID: "claude-3" })).toBe("anthropic:claude-3")
  })

  it("handles empty providerID", () => {
    expect(modelKey({ providerID: "", modelID: "model-x" })).toBe(":model-x")
  })

  it("handles modelID with colons", () => {
    expect(modelKey({ providerID: "p", modelID: "a:b:c" })).toBe("p:a:b:c")
  })

  it("works with ModelSelection that has variant", () => {
    const sel: ModelSelection = { providerID: "anthropic", modelID: "claude-3", variant: "thinking" }
    expect(modelKey(sel)).toBe("anthropic:claude-3")
  })

  it("handles empty strings", () => {
    expect(modelKey({ providerID: "", modelID: "" })).toBe(":")
  })
})

describe("modelFromKey", () => {
  it("parses provider and model", () => {
    expect(modelFromKey("anthropic:claude-3")).toEqual({ providerID: "anthropic", modelID: "claude-3" })
  })

  it("returns empty provider when no colon", () => {
    expect(modelFromKey("claude-3")).toEqual({ providerID: "", modelID: "claude-3" })
  })

  it("handles colon at start", () => {
    expect(modelFromKey(":model-x")).toEqual({ providerID: "", modelID: "model-x" })
  })

  it("splits only on first colon", () => {
    expect(modelFromKey("p:a:b:c")).toEqual({ providerID: "p", modelID: "a:b:c" })
  })

  it("handles empty string", () => {
    expect(modelFromKey("")).toEqual({ providerID: "", modelID: "" })
  })

  it("roundtrips with modelKey", () => {
    const original = { providerID: "openai", modelID: "gpt-4" }
    expect(modelFromKey(modelKey(original))).toEqual(original)
  })

  it("roundtrips with colon in modelID", () => {
    const key = "p:a:b"
    const parsed = modelFromKey(key)
    expect(modelKey(parsed)).toBe(key)
  })
})

describe("sameModel", () => {
  it("returns true for same provider and model", () => {
    expect(sameModel({ providerID: "a", modelID: "b" }, { providerID: "a", modelID: "b" })).toBe(true)
  })

  it("returns false for different provider", () => {
    expect(sameModel({ providerID: "a", modelID: "b" }, { providerID: "x", modelID: "b" })).toBe(false)
  })

  it("returns false for different model", () => {
    expect(sameModel({ providerID: "a", modelID: "b" }, { providerID: "a", modelID: "x" })).toBe(false)
  })

  it("returns false when a is null", () => {
    expect(sameModel(null, { providerID: "a", modelID: "b" })).toBe(false)
  })

  it("returns false when b is undefined", () => {
    expect(sameModel({ providerID: "a", modelID: "b" }, undefined)).toBe(false)
  })

  it("returns false when both are null", () => {
    expect(sameModel(null, null)).toBe(false)
  })

  it("returns false when both are undefined", () => {
    expect(sameModel(undefined, undefined)).toBe(false)
  })

  it("ignores variant when comparing", () => {
    const a: ModelSelection = { providerID: "a", modelID: "b", variant: "v1" }
    const b: ModelSelection = { providerID: "a", modelID: "b", variant: "v2" }
    expect(sameModel(a, b)).toBe(true)
  })
})

describe("resolveModelOption", () => {
  it("returns exact variant match when variant provided", () => {
    const options = [baseOpt, variantOpt, variantOpt2]
    const result = resolveModelOption(options, { providerID: "anthropic", modelID: "claude-3" }, "thinking")
    expect(result).toBe(variantOpt)
  })

  it("falls back to base (no variant) when exact variant not found", () => {
    const options = [baseOpt, variantOpt]
    const result = resolveModelOption(options, { providerID: "anthropic", modelID: "claude-3" }, "nonexistent")
    expect(result).toBe(baseOpt)
  })

  it("falls back to any match when no base without variant exists", () => {
    const options = [variantOpt, variantOpt2]
    const result = resolveModelOption(options, { providerID: "anthropic", modelID: "claude-3" }, "nonexistent")
    // base search fails (no opt without variant), then any match returns first found
    expect(result).toBe(variantOpt)
  })

  it("returns base when variant is null", () => {
    const options = [baseOpt, variantOpt]
    const result = resolveModelOption(options, { providerID: "anthropic", modelID: "claude-3" }, null)
    expect(result).toBe(baseOpt)
  })

  it("returns default option when selection is null", () => {
    const options = [baseOpt, defaultOpt]
    const result = resolveModelOption(options, null, null)
    expect(result).toBe(defaultOpt)
  })

  it("returns first option when no default and selection is null", () => {
    const options = [baseOpt, otherOpt]
    const result = resolveModelOption(options, null, null)
    expect(result).toBe(baseOpt)
  })

  it("returns null for empty options", () => {
    expect(resolveModelOption([], null, null)).toBeNull()
  })

  it("returns default when selection does not match any option", () => {
    const options = [baseOpt, defaultOpt]
    const result = resolveModelOption(options, { providerID: "unknown", modelID: "unknown" }, null)
    expect(result).toBe(defaultOpt)
  })

  it("returns first option when no default and selection mismatches", () => {
    const options = [baseOpt, otherOpt]
    const result = resolveModelOption(options, { providerID: "unknown", modelID: "unknown" }, null)
    expect(result).toBe(baseOpt)
  })

  it("prefers exact variant over base when both exist", () => {
    const options = [baseOpt, variantOpt]
    const result = resolveModelOption(options, { providerID: "anthropic", modelID: "claude-3" }, "thinking")
    expect(result).not.toBe(baseOpt)
    expect(result).toBe(variantOpt)
  })
})

describe("variantsOf", () => {
  it("returns empty when base is null", () => {
    expect(variantsOf([baseOpt, variantOpt], null)).toEqual([])
  })

  it("returns empty when base is undefined", () => {
    expect(variantsOf([baseOpt, variantOpt], undefined)).toEqual([])
  })

  it("returns variants of same model excluding base itself", () => {
    const result = variantsOf([baseOpt, variantOpt, variantOpt2, otherOpt], baseOpt)
    expect(result).toEqual([variantOpt, variantOpt2])
  })

  it("returns empty when no variants exist", () => {
    expect(variantsOf([baseOpt, otherOpt], baseOpt)).toEqual([])
  })

  it("includes all variants of the model family", () => {
    const result = variantsOf([baseOpt, variantOpt, variantOpt2], variantOpt)
    expect(result).toEqual([variantOpt, variantOpt2])
  })

  it("returns empty when models list is empty", () => {
    expect(variantsOf([], baseOpt)).toEqual([])
  })

  it("does not include options with different model", () => {
    const result = variantsOf([baseOpt, variantOpt, otherOpt], otherOpt)
    expect(result).toEqual([])
  })
})

describe("groupModels", () => {
  it("groups models by provider:modelID", () => {
    const models = [baseOpt, variantOpt, otherOpt]
    const groups = groupModels(models)
    expect(groups.size).toBe(2)
    expect(groups.has("anthropic:claude-3")).toBe(true)
    expect(groups.has("openai:gpt-4")).toBe(true)
  })

  it("sets base correctly and collects variants", () => {
    const models = [baseOpt, variantOpt, variantOpt2]
    const groups = groupModels(models)
    const group = groups.get("anthropic:claude-3")!
    expect(group.base).toBe(baseOpt)
    expect(group.variants).toEqual([variantOpt, variantOpt2])
  })

  it("handles variant appearing before base", () => {
    const models = [variantOpt, baseOpt]
    const groups = groupModels(models)
    const group = groups.get("anthropic:claude-3")!
    // When variant comes first, it looks for a plain (no variant) different element -> finds baseOpt
    // So base is still baseOpt
    expect(group.base).toBe(baseOpt)
    expect(group.variants).toEqual([variantOpt])
  })

  it("uses first variant as base when no plain exists", () => {
    const models = [variantOpt, variantOpt2]
    const groups = groupModels(models)
    const group = groups.get("anthropic:claude-3")!
    expect(group.base).toBe(variantOpt)
    expect(group.variants).toEqual([variantOpt2])
  })

  it("returns empty map for empty input", () => {
    expect(groupModels([]).size).toBe(0)
  })

  it("handles single model without variants", () => {
    const groups = groupModels([otherOpt])
    const group = groups.get("openai:gpt-4")!
    expect(group.base).toBe(otherOpt)
    expect(group.variants).toEqual([])
  })

  it("separates different providers with same modelID", () => {
    const a = makeOption({ providerID: "p1", modelID: "m1", providerName: "P1", modelName: "M1" })
    const b = makeOption({ providerID: "p2", modelID: "m1", providerName: "P2", modelName: "M1" })
    const groups = groupModels([a, b])
    expect(groups.size).toBe(2)
    expect(groups.has("p1:m1")).toBe(true)
    expect(groups.has("p2:m1")).toBe(true)
  })
})
