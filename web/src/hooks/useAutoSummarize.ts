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
  const lastSigRef = useRef("")
  const runningRef = useRef(false)

  useEffect(() => {
    if (!config || !sessionID || !enabled) return
    if (assistantResponseSignature === lastSigRef.current) return
    lastSigRef.current = assistantResponseSignature

    if (runningRef.current) return

    const th = threshold > 0 ? threshold : DEFAULT_AUTO_SUMMARIZE_THRESHOLD
    api.loadMessages(config, sessionID, directory, 0).then((msgs) => {
      if (runningRef.current) return
      let totalLen = 0
      for (const m of msgs) {
        if (m.info.role !== "user") {
          for (const p of m.parts) {
            totalLen += (p.text?.length ?? 0)
          }
        }
      }
      if (totalLen > th) {
        runningRef.current = true
        api.summarize(config, sessionID, providerID ?? "", modelID ?? "", directory).then(() => {
          runningRef.current = false
          onSummarized?.()
        }).catch(() => { runningRef.current = false })
      }
    }).catch(() => {})
  }, [config, sessionID, directory, enabled, threshold, assistantResponseSignature, onSummarized])
}
