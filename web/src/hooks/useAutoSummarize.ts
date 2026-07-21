import { useEffect, useRef } from "react"
import { api } from "../api"
import type { ServerConfig } from "../types"
import { DEFAULT_AUTO_SUMMARIZE_THRESHOLD } from "../constants"

export function useAutoSummarize(
  config: ServerConfig | null,
  sessionID: string | null,
  directory: string,
  enabled: boolean,
  threshold: number,
  assistantResponseSignature: string,
  onSummarized?: () => void,
  providerID?: string,
  modelID?: string
) {
  const runningRef = useRef(false)
  const lastComputedSigRef = useRef("")

  useEffect(() => {
    if (!config || !sessionID || !enabled) return
    if (assistantResponseSignature === lastComputedSigRef.current) return
    if (runningRef.current) return

    runningRef.current = true

    const th = threshold > 0 ? threshold : DEFAULT_AUTO_SUMMARIZE_THRESHOLD
    api.loadMessages(config, sessionID, directory, undefined).then((msgs) => {
      let totalLen = 0
      for (const m of msgs) {
        if (m.info.role !== "user") {
          for (const p of m.parts) {
            totalLen += (p.text?.length ?? 0)
          }
        }
      }
      if (totalLen > th) {
        api.summarize(config, sessionID, providerID ?? "", modelID ?? "", directory).then(() => {
          onSummarized?.()
        }).catch((err) => {
          console.warn("[auto-summarize] summarize failed:", err)
        })
      }
      lastComputedSigRef.current = assistantResponseSignature
      runningRef.current = false
    }).catch((err) => {
      console.warn("[auto-summarize] loadMessages failed:", err)
      runningRef.current = false
    })
  }, [config, sessionID, directory, enabled, threshold, assistantResponseSignature, onSummarized])
}
