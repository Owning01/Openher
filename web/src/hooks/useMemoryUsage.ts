import { useState, useEffect } from "react"

interface MemoryInfo {
  jsHeapUsed: number
  jsHeapTotal: number
}

export function useMemoryUsage(intervalMs = 5000): MemoryInfo | null {
  const [mem, setMem] = useState<MemoryInfo | null>(null)

  useEffect(() => {
    const perf = (performance as any)
    if (!perf?.memory) return

    const poll = () => {
      try {
        setMem({
          jsHeapUsed: perf.memory.usedJSHeapSize,
          jsHeapTotal: perf.memory.jsHeapSizeLimit,
        })
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return mem
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`
  return `${(bytes / (1024 * 1024)).toFixed(0)}m`
}
