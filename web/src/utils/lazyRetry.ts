import { lazy, type ComponentType, type LazyExoticComponent } from "react"

export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err) => {
      const hasReloaded = sessionStorage.getItem("opencode_chunk_reloaded")
      if (!hasReloaded && String(err).includes("dynamically imported module")) {
        sessionStorage.setItem("opencode_chunk_reloaded", "1")
        window.location.reload()
      }
      throw err
    }),
  )
}
