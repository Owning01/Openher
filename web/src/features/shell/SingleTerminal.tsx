// Terminal xterm individual. Extraído de shellPanels.tsx (F4-P3): el componente
// solo monta el host y toda la maquinaria vive en useXtermSession.
import { memo } from "react"
import { useXtermSession } from "./useXtermSession"

export const SingleTerminal = memo(function SingleTerminal({ cwd, shellName, tabId }: { cwd?: string; shellName?: string; tabId: string }) {
  const ref = useXtermSession({ cwd, shellName, tabId })
  return <div ref={ref} style={{ width: "100%", height: "100%", background: "#0d1117", padding: 6, touchAction: "none", overscrollBehavior: "contain" }} />
})
