// Caja de actividad por TURNO: un prompt del usuario suele generar varios
// mensajes del asistente (uno por tramo de herramientas). Sin agrupar, cada
// mensaje dibujaba su propia caja y el chat se llenaba de líneas suéltas.
// Acá se junta pensamiento + herramientas + diffs de todo el turno en una sola
// caja, que va en el primer mensaje del turno (arriba del texto final).
import type { RenderedMessage, ThinkingPart, RenderedToolPart, FileDiff } from "../types"
import { isShellResultMessage } from "./messageShape"

export type TurnActivity = {
  thinkingParts: ThinkingPart[]
  toolParts: RenderedToolPart[]
  summaryDiffs: FileDiff[]
  /**
   * Textos intermedios del asistente (los que NO son la respuesta final del
   * turno). Al cerrar el turno se ocultan del chat y viven dentro de la caja.
   */
  intermediateTexts: Array<{ id: string; text: string }>
  /** El turno sigue en curso (su último mensaje no cerró). */
  working: boolean
}

export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return ""
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

export function buildTurnActivity(
  messages: RenderedMessage[],
  visibleIDs: Set<string>,
): { box: Map<string, TurnActivity>; absorbed: Set<string>; swallowed: Set<string> } {
  const box = new Map<string, TurnActivity>()
  const absorbed = new Set<string>()
  // Mensajes cuyo texto se mudó adentro de la caja "Trabajado". Solo se llenan
  // cuando el turno TERMINÓ: mientras trabaja, el texto sigue visible en el chat.
  const swallowed = new Set<string>()
  let turn: RenderedMessage[] = []

  const flush = () => {
    const current = turn
    turn = []
    if (current.length === 0) return
    const thinkingParts: ThinkingPart[] = []
    const toolParts: RenderedToolPart[] = []
    const summaryDiffs: FileDiff[] = []
    for (const m of current) {
      if (m.thinkingParts?.length) thinkingParts.push(...m.thinkingParts)
      if (m.toolParts?.length) toolParts.push(...m.toolParts)
      if (m.summaryDiffs?.length) summaryDiffs.push(...m.summaryDiffs)
    }
    // Respuesta final = último texto del turno; todo lo anterior es intermedio
    // (mensajes que acompañan tools: "Voy a revisar X", etc.).
    const withText = current.filter((m) => (m.text ?? "").trim().length > 0)
    const finalText = withText[withText.length - 1]
    const intermediateTexts = withText
      .filter((m) => m !== finalText)
      .map((m) => ({ id: m.info.id, text: m.text }))
    if (thinkingParts.length === 0 && toolParts.length === 0 && summaryDiffs.length === 0 && intermediateTexts.length === 0) return
    // Dueño de la caja: el ÚLTIMO mensaje visible del turno. Va pegado a la
    // respuesta final (y mientras trabaja queda a la vista, abajo, junto a lo
    // que se está ejecutando). Si el turno quedó cortado por el recorte de la
    // ventana se usa el último visible igual: nunca queda actividad huérfana.
    let owner: RenderedMessage | undefined
    // Los resultados de shell se acoplan a la caja pero no la poseen: si la
    // poseyeran, la caja se iría al fondo del turno, debajo de la respuesta
    // final (que también queda absorbida cuando hay caja).
    for (const m of current) if (visibleIDs.has(m.info.id) && !isShellResultMessage(m)) owner = m
    if (!owner) for (const m of current) if (visibleIDs.has(m.info.id)) owner = m
    if (!owner) return
    // El cierre lo decide el último mensaje del ASISTENTE: los avisos
    // sintéticos (resultado de shell) no traen `time.completed`/`finish` y
    // dejarían la caja "en curso" para siempre.
    const lastAssistant = [...current].reverse().find((m) => m.info.role === "assistant")
    const working = lastAssistant ? !lastAssistant.info.time.completed && !lastAssistant.info.finish : false
    box.set(owner.info.id, {
      thinkingParts,
      toolParts,
      summaryDiffs,
      intermediateTexts,
      working,
    })
    for (const m of current) {
      if (m.info.id !== owner.info.id) absorbed.add(m.info.id)
    }
    if (!working) for (const m of withText) if (m !== finalText) swallowed.add(m.info.id)
  }

  for (const m of messages) {
    if (m.info.role === "user") {
      flush()
      continue
    }
    // Los resultados de shell del turno se suman a su caja (comando + salida).
    if (m.info.role === "assistant" || isShellResultMessage(m)) turn.push(m)
  }
  flush()
  return { box, absorbed, swallowed }
}
