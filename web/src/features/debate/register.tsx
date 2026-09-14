import { tabRegistry } from "../../plugins"
import { DebatePanel } from "./DebatePanel"
import type { ServerConfig } from "../../types"

/**
 * Registra la sala de debate como tab del grid (`plugin:debate:room`) para
 * poder abrirla al costado de una sesión o desacoplada. Idempotente.
 */
let registered = false

export function registerDebateTab(): void {
  if (registered) return
  registered = true
  tabRegistry.register("debate", {
    id: "room",
    title: "Debate",
    render: (props?: { config?: ServerConfig | null }) => <DebatePanel config={props?.config ?? null} />,
    order: 40,
  })
}

export const DEBATE_TAB_ID = "plugin:debate:room"
