import * as React from "react"
import { tabRegistry } from "../../plugins"
import { CodeIcon } from "../../Icons"

export function registerCssPlayground() {
  // Evita doble registro en HMR
  try {
    const existing = tabRegistry.get("openher:css-playground")
    if (existing) return () => {}
  } catch {}
  const Lazy = React.lazy(() => import("./CssPlayground"))
  const disposer = tabRegistry.register("openher", {
    id: "css-playground",
    title: "CSS Playground",
    icon: React.createElement(CodeIcon, { size: 14 }),
    render: () =>
      React.createElement(
        React.Suspense,
        { fallback: React.createElement("div", { style: { padding: 16, color: "var(--muted)" } }, "Cargando playground…") },
        React.createElement(Lazy as any, null)
      ),
  })
  return disposer
}

// auto-registro en import (para main.tsx side-effect)
let _auto: (() => void) | null = null
export function ensureCssPlaygroundRegistered() {
  if (!_auto) _auto = registerCssPlayground()
  return _auto
}
