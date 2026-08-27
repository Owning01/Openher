import { useState, useRef, useCallback, useEffect } from "react"
import type { ViewType, ServerConfig } from "../../../types"
import { useBackButton } from "../../../hooks/useBackButton"

export type UseAppNavigationParams = {
  config: ServerConfig
  showNewSessionPicker: boolean
  setShowNewSessionPicker: (show: boolean) => void
  activeDetailSheet: any
  setActiveDetailSheet: (sheet: any) => void
  hasConfiguredServer: boolean
}

export function useAppNavigation({
  config,
  showNewSessionPicker,
  setShowNewSessionPicker,
  activeDetailSheet,
  setActiveDetailSheet,
  hasConfiguredServer,
}: UseAppNavigationParams) {
  const [view, setView] = useState<ViewType>(() =>
    config.host && config.port > 0 ? "sessions" : "settings"
  )
  const navStackRef = useRef<ViewType[]>(["sessions"])

  const navigate = useCallback(
    (target: ViewType) => {
      if (target === view) return
      navStackRef.current = [...navStackRef.current, view]
      setView(target)
    },
    [view]
  )

  const goBack = useCallback(() => {
    if (navStackRef.current.length === 0) return
    const last = navStackRef.current[navStackRef.current.length - 1]
    navStackRef.current = navStackRef.current.slice(0, -1)
    if (last) setView(last)
  }, [])

  useEffect(() => {
    if (!hasConfiguredServer) setView("settings")
  }, [hasConfiguredServer])

  useBackButton({
    view,
    showNewSessionPicker,
    activeDetailSheet,
    onClosePicker: () => setShowNewSessionPicker(false),
    onCloseSheet: () => setActiveDetailSheet(null),
    onBackToSessions: goBack,
  })

  return {
    view,
    setView,
    navigate,
    goBack,
    navStackRef,
  }
}
