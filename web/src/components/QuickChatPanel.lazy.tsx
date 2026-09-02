import { lazy } from "react"

export const LazyQuickChatPanel = lazy(() => import("./QuickChatPanel").then((m) => ({ default: m.QuickChatPanel })))
