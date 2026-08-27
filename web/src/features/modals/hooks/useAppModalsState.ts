import { useState } from "react"
import { loadDesktopConfig } from "../../../desktop"
import type { FileDiff } from "../../../types"

export function useAppModalsState() {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [readingMode, setReadingMode] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [showThemeCreator, setShowThemeCreator] = useState(false)
  const [showConnectSheet, setShowConnectSheet] = useState(false)
  const [showMCPBrowser, setShowMCPBrowser] = useState(false)
  const [showArchivedView, setShowArchivedView] = useState(false)
  const [showOpenCodeHub, setShowOpenCodeHub] = useState(false)
  const [showFavoritesManager, setShowFavoritesManager] = useState(false)
  const [showRemoteDesktop, setShowRemoteDesktop] = useState(false)
  const [showPluginsModal, setShowPluginsModal] = useState(false)
  const [fileEditorPath, setFileEditorPath] = useState<string | null>(null)
  const [desktopCfg, setDesktopCfg] = useState<any>(() => loadDesktopConfig())
  const [desktopDiffData, setDesktopDiffData] = useState<{
    selectedFile?: string
    diffs?: FileDiff[]
  } | null>(null)

  return {
    showShortcuts,
    setShowShortcuts,
    readingMode,
    setReadingMode,
    showThemePicker,
    setShowThemePicker,
    showThemeCreator,
    setShowThemeCreator,
    showConnectSheet,
    setShowConnectSheet,
    showMCPBrowser,
    setShowMCPBrowser,
    showArchivedView,
    setShowArchivedView,
    showOpenCodeHub,
    setShowOpenCodeHub,
    showFavoritesManager,
    setShowFavoritesManager,
    showRemoteDesktop,
    setShowRemoteDesktop,
    showPluginsModal,
    setShowPluginsModal,
    fileEditorPath,
    setFileEditorPath,
    desktopCfg,
    setDesktopCfg,
    desktopDiffData,
    setDesktopDiffData,
  }
}
