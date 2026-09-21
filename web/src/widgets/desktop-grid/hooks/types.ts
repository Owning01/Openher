import type { DesktopLayout } from "../../../types"

export type UseDesktopGridActionsParams = {
  isDesktop: boolean
  desktopLayout: DesktopLayout
  desktopLayoutRef: React.MutableRefObject<DesktopLayout>
  setDesktopLayout: (updater: (prev: DesktopLayout) => DesktopLayout) => void
  tabStacks: string[][]
  setTabStacks: (updater: (prev: string[][]) => string[][]) => void
  activePanel: number
  setActivePanel: (idx: number | ((prev: number) => number)) => void
  setShowTerminal?: React.Dispatch<React.SetStateAction<boolean>>
  setFileEditorPath: (path: string | null) => void
  setDesktopState?: React.Dispatch<React.SetStateAction<any>>
}
