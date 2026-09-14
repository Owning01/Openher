import { memo } from "react"
import { useT } from "../../i18n-context"
import { ChatIcon } from "../../Icons"
import { openDebateRoom, useDebatesForSession } from "./debateStore"
import "../../styles/debate.css"

/**
 * Chip del header del chat origen (DEBATE.md §8.1): `Debate · N turnos ·
 * consenso X%` con dot pulsante si hay debate activo. Solo se renderiza si
 * ESA sesión tiene debate activo o reciente; click → abre la sala
 * (drawer en desktop / bottom sheet en mobile) vía evento `debate:open`.
 */

export type DebateChipProps = {
  originSessionID: string | null | undefined
  onOpen?: (originSessionID: string) => void
}

export const DebateChip = memo(function DebateChip({ originSessionID, onOpen }: DebateChipProps) {
  const t = useT()
  const debates = useDebatesForSession(originSessionID)
  if (!originSessionID || debates.length === 0) return null
  const running = debates.filter((d) => d.running)
  const active = running.length > 0 ? running[running.length - 1]! : debates[debates.length - 1]!
  const turns = active.status.turns > 0 ? active.status.turns : active.messages.length
  const pct = Math.round(active.status.consensusPct)

  return (
    <button
      type="button"
      className={`debate-chip${active.running ? " live" : ""}`}
      onClick={() => (onOpen ? onOpen(originSessionID) : openDebateRoom(originSessionID))}
      title={active.topic || t("debate.title")}
      aria-label={t("debate.openRoom")}
    >
      {active.running ? <span className="debate-dot" aria-hidden="true" /> : null}
      <ChatIcon size={12} />
      <span>{t("debate.chip", { turns: String(turns), pct: String(pct) })}</span>
    </button>
  )
})
