// Tipos compartidos del panel de ajustes (F4-P4).
export type BlockedModelsApi = {
  isBlocked: (key: string) => boolean
  toggleBlocked: (key: string) => void
  toggleAllForProvider: (providerID: string, block: boolean) => void
  providerBlockedCount: (providerID: string) => number
  blockedCount: number
}
