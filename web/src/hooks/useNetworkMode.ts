import { useEffect } from "react"
import { Network } from "@capacitor/network"
import type { DataMode } from "../types"

export function useNetworkMode(changeDataMode: (mode: DataMode) => void) {
  useEffect(() => {
    let cancelled = false
    Network.getStatus().then((s) => {
      if (cancelled) return
      if (s.connectionType === "cellular") {
        changeDataMode("ultra")
      } else if (s.connectionType === "wifi") {
        changeDataMode("full")
      }
    })
    let netH: any
    Network.addListener("networkStatusChange", (s) => {
      if (cancelled) return
      if (s.connectionType === "cellular") {
        changeDataMode("ultra")
      } else if (s.connectionType === "wifi") {
        changeDataMode("full")
      }
    }).then((hnd) => { netH = hnd })
    return () => { cancelled = true; if (netH) netH.remove() }
  }, [changeDataMode])
}
