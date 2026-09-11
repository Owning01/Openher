import { useEffect, useState } from "react"

export type BuildInfo = {
  builtAt?: string
  gitHead?: string | null
  source?: string
}

let cached: BuildInfo | null | undefined

export function useBuildInfo(): BuildInfo | null {
  const [info, setInfo] = useState<BuildInfo | null>(cached ?? null)
  useEffect(() => {
    if (cached !== undefined) {
      setInfo(cached)
      return
    }
    let alive = true
    fetch("build-info.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        cached = (j ?? null) as BuildInfo | null
        if (alive) setInfo(cached)
      })
      .catch(() => {
        cached = null
        if (alive) setInfo(null)
      })
    return () => {
      alive = false
    }
  }, [])
  return info
}

export function BuildStamp() {
  const info = useBuildInfo()
  if (!info?.gitHead && !info?.builtAt) return null
  const when = info.builtAt ? info.builtAt.slice(0, 16).replace("T", " ") : ""
  return (
    <span className="settings-build-stamp" title={info.source ?? ""}>
      Build {info.gitHead ?? "?"} {when}
    </span>
  )
}
