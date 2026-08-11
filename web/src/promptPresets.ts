export type PromptPreset = {
  id: string
  nameKey: string
  textKey: string
}

// Prompts pre-armados (built-in) para acciones puntuales. Los textos viven en
// i18n (en/es; it/zh-TW caen al inglés por fallback de createTranslator).
export const PROMPT_PRESETS: PromptPreset[] = [
  { id: "explain", nameKey: "prompts.explain", textKey: "prompts.explainText" },
  { id: "review", nameKey: "prompts.review", textKey: "prompts.reviewText" },
  { id: "bugs", nameKey: "prompts.bugs", textKey: "prompts.bugsText" },
  { id: "tests", nameKey: "prompts.tests", textKey: "prompts.testsText" },
  { id: "optimize", nameKey: "prompts.optimize", textKey: "prompts.optimizeText" },
  { id: "refactor", nameKey: "prompts.refactor", textKey: "prompts.refactorText" },
  { id: "docs", nameKey: "prompts.docs", textKey: "prompts.docsText" },
  { id: "commit", nameKey: "prompts.commit", textKey: "prompts.commitText" },
  { id: "debug", nameKey: "prompts.debug", textKey: "prompts.debugText" },
  { id: "explainSimple", nameKey: "prompts.explainSimple", textKey: "prompts.explainSimpleText" },
  { id: "summarize", nameKey: "prompts.summarize", textKey: "prompts.summarizeText" },
  { id: "security", nameKey: "prompts.security", textKey: "prompts.securityText" },
]
