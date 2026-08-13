import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { createTranslator, loadLanguage, normalizeLanguage, type LanguageCode } from "./i18n"

type Translator = ReturnType<typeof createTranslator>

const I18nContext = createContext<Translator>(() => "")
const LanguageContext = createContext<LanguageCode>("en")

export function I18nProvider({ language, children }: { language: LanguageCode; children: ReactNode }) {
  // El chunk del idioma se carga async (i18n.ts): mientras llega se usa la
  // tabla cargada (en como fallback). Al resolver, re-render con el idioma real.
  const [loadedLang, setLoadedLang] = useState<LanguageCode | null>(null)
  useEffect(() => {
    let cancelled = false
    loadLanguage(language).then(() => {
      if (!cancelled) setLoadedLang(language)
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [language])

  const t = useMemo(() => createTranslator(loadedLang ?? "en"), [loadedLang])

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
