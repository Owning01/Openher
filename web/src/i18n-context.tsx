import { createContext, useContext, useMemo, type ReactNode } from "react"
import { createTranslator, normalizeLanguage, type LanguageCode } from "./i18n"

type Translator = ReturnType<typeof createTranslator>

const I18nContext = createContext<Translator>(() => "")

export function I18nProvider({ language, children }: { language: LanguageCode; children: ReactNode }) {
  const t = useMemo(() => createTranslator(language), [language])
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>
}

export function useT(): Translator {
  return useContext(I18nContext)
}

export { normalizeLanguage }
export type { LanguageCode }
