import { createContext, useContext, useMemo, type ReactNode } from "react"
import { createTranslator, normalizeLanguage, type LanguageCode } from "./i18n"

type Translator = ReturnType<typeof createTranslator>

const I18nContext = createContext<Translator>(() => "")
const LanguageContext = createContext<LanguageCode>("en")

export function I18nProvider({ language, children }: { language: LanguageCode; children: ReactNode }) {
  const t = useMemo(() => createTranslator(language), [language])
  return (
    <LanguageContext.Provider value={language}>
      <I18nContext.Provider value={t}>{children}</I18nContext.Provider>
    </LanguageContext.Provider>
  )
}

export function useT(): Translator {
  return useContext(I18nContext)
}

export function useLanguage(): LanguageCode {
  return useContext(LanguageContext)
}

export { normalizeLanguage }
export type { LanguageCode }
