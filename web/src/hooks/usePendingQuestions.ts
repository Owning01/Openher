import type { Question } from "../types"

// El badge de preguntas pendientes usa el poll de App.tsx (pendingQuestions
// llega por prop): es estado derivado directo, sin useState + useEffect.
export function usePendingQuestions(pendingQuestions?: Question[]) {
  return pendingQuestions?.length ?? 0
}
