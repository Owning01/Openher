import { Suspense, lazy } from "react"
import { useDevbarEnabled } from "./devbarStore"

const LazyDevbar = lazy(() => import("./DevbarLazy").then((m) => ({ default: m.DevbarLazy })))

export function DevbarHost() {
  const enabled = useDevbarEnabled()
  if (!enabled) return null
  return (
    <Suspense fallback={null}>
      <LazyDevbar />
    </Suspense>
  )
}
