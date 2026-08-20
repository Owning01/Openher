// app/providers — Composition Root: React providers wiring (Fase 4 scaffold).
// Re-exports from original providers for thin pages to consume.
// TODO: mover ThemeVariantProvider, I18nProvider, etc. desde App.tsx
export { ThemeVariantProvider } from "../../context/themeVariant"
export { I18nProvider } from "../../i18n-context"
