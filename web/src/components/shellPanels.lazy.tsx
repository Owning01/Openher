import { lazy } from "react"
import { lazyRetry } from "../utils/lazyRetry"

// Unique lazy wrappers for every export of shellPanels.tsx — single dynamic import point
export const LazySingleTerminal = lazy(() => import("./shellPanels").then((m) => ({ default: m.SingleTerminal })))
export const LazyTerminalPanel = lazy(() => import("./shellPanels").then((m) => ({ default: m.TerminalPanel })))
export const LazyExplorerPanel = lazy(() => import("./shellPanels").then((m) => ({ default: m.ExplorerPanel })))
export const LazyKanbanPanel = lazy(() => import("./shellPanels").then((m) => ({ default: m.KanbanPanel })))
export const LazyDocsPanel = lazy(() => import("./shellPanels").then((m) => ({ default: m.DocsPanel })))
export const LazyUpdatesPanel = lazy(() => import("./shellPanels").then((m) => ({ default: m.UpdatesPanel })))
export const LazyStatsPanel = lazy(() => import("./shellPanels").then((m) => ({ default: m.StatsPanel })))
export const LazyLabsPanel = lazy(() => import("./shellPanels").then((m) => ({ default: m.LabsPanel })))
export const LazyConfigPanel = lazy(() => import("./shellPanels").then((m) => ({ default: m.ConfigPanel })))
export const LazyFileEditorPanel = lazyRetry(() => import("./shellPanels").then((m) => ({ default: m.FileEditorPanel })))
export const LazySessionStatsPanel = lazy(() => import("./shellPanels").then((m) => ({ default: m.SessionStatsPanel })))
export const LazyShellPanel = lazy(() => import("./shellPanels").then((m) => ({ default: m.ShellPanel })))
