import * as React from "react"
import { tabRegistry } from "../../plugins"
import { CodeIcon } from "../../Icons"

export const CANVAS_TAB_KEY = "openher:canvas"

export function registerCanvas() {
  try {
    if (tabRegistry.get(CANVAS_TAB_KEY)) return () => {}
  } catch {}
  const Lazy = React.lazy(() => import("./components/CanvasPanel").then((m) => ({ default: m.CanvasPanel })))
  const disposer = tabRegistry.register("openher", {
    id: "canvas",
    title: "Canvas M3E",
    icon: React.createElement(CodeIcon, { size: 14 }),
    render: () =>
      React.createElement(
        React.Suspense,
        { fallback: React.createElement("div", { style: { padding: 16, color: "var(--muted)" } }, "Cargando canvas…") },
        React.createElement(Lazy as any, null),
      ),
  })
  return disposer
}

let _registered = false
export function ensureCanvasRegistered() {
  if (_registered) return
  _registered = true
  registerCanvas()
}
