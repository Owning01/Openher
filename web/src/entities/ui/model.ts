/**
 * Entidad UI — tipos de presentación y preferencias de interfaz.
 *
 * Extraído de `web/src/types.ts` (Fase 2).
 * Nota de coordinación: otros subagentes pueden haber extraído los mismos
 * símbolos en `entities/config` o `entities/agent`. La deduplicación se
 * resolverá en la fase de unificación del barrel `types.ts`.
 * Este archivo es la fuente canónica para ChatSettings / PromptSnippet /
 * ThemePreference desde el punto de vista de UI.
 */

// ---------------------------------------------------------------------------
// ChatSettings — preferencias de render del chat (persistidas en localStorage)
// Ver defaults y migración en `hooks/useChatSettings.ts`
// ---------------------------------------------------------------------------
export type ChatSettings = {
  fontSize: number
  messageSpacing: "compact" | "normal" | "comfortable"
  showThinking: boolean
  thinkingDefault: "auto" | "expanded" | "collapsed"
  showToolCalls: boolean
  showTimestamps: boolean
  showTodoButton: boolean
  showModelInfo: boolean
  showDiffs: boolean
  showSubagentHint: boolean
  showCompactionCheckpoint: boolean
  showImages: boolean
  bubbleRadius: number
  messageMaxWidth: "normal" | "wide" | "full"
  fontFamily: "system" | "serif" | "mono"
  compactTools: boolean
  minimalistMode: boolean
  completionSound: boolean
  composerCharLimit: number
  /** Margen lateral del chat en vista escritorio en px (solo aplica en desktop). */
  desktopGutter: number
}

// ---------------------------------------------------------------------------
// PromptSnippet — fragmento reutilizable de prompt
// ---------------------------------------------------------------------------
export type PromptSnippet = {
  id: string
  name: string
  text: string
}

// ---------------------------------------------------------------------------
// ThemePreference — preferencia de tema visual
// ---------------------------------------------------------------------------
export type ThemePreference = "system" | "light" | "dark" | "scheduled"

// ---------------------------------------------------------------------------
// NoticeType — nivel semántico de una notificación toast/banner
// ---------------------------------------------------------------------------
export type NoticeType = "info" | "success" | "error"
