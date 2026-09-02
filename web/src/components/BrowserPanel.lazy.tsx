import { lazy } from "react"

export const LazyBrowserPanel = lazy(() => import("./BrowserPanel").then((m) => ({ default: m.BrowserPanel })))
