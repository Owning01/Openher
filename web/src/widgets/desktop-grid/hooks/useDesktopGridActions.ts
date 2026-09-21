import type { UseDesktopGridActionsParams } from "./types"
import { usePanelLayoutOps } from "./usePanelLayoutOps"
import { useTabStackOps } from "./useTabStackOps"
import { usePanelDock } from "./usePanelDock"

export type { UseDesktopGridActionsParams } from "./types"

/**
 * Compositor de las acciones de la grilla desktop. Mantiene la superficie
 * plana que consumen `useAppController` y los componentes de la grilla,
 * delegando en tres hooks por responsabilidad:
 * - `usePanelLayoutOps`: estructura (split/add/close/swap de paneles)
 * - `useTabStackOps`: pestañas dentro de cada panel
 * - `usePanelDock`: drag & drop de docking y apertura de archivos
 */
export function useDesktopGridActions(params: UseDesktopGridActionsParams) {
  const { splitPanel, addPanel, closePanel, handleSwapPanels } = usePanelLayoutOps(params)
  const {
    openInPanel,
    switchTab,
    removeTab,
    moveTab,
    transferTab,
    addTerminalToPanel,
    closeOthers,
    closeRight,
    closeLeft,
    closeAll,
    detachTab,
  } = useTabStackOps(params)
  const { handleSessionDragStart, handleDockSession, handleOpenFile } = usePanelDock(params)

  return {
    openInPanel,
    switchTab,
    removeTab,
    moveTab,
    transferTab,
    addTerminalToPanel,
    detachTab,
    splitPanel,
    addPanel,
    closePanel,
    closeOthers,
    closeRight,
    closeLeft,
    closeAll,
    handleSessionDragStart,
    handleSwapPanels,
    handleDockSession,
    handleOpenFile,
  }
}
