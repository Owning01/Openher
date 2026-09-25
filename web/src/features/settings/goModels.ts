// Tabla de referencia de OpenCode Go (snapshot de https://opencode.ai/docs/go,
// precios por 1M tokens, límite mensual en USD). La API en vivo
// (/zen/go/v1/models) solo trae ids: esta tabla aporta precios y topes.
export type GoModelRef = {
  limit: number
  input: number
  output: number
  cachedRead?: number
}

export const GO_MODELS_REF: Record<string, GoModelRef> = {
  "glm-5.3-flash": { limit: 60, input: 0.15, output: 0.5, cachedRead: 0.03 },
  "glm-5.3": { limit: 15, input: 1.4, output: 4.4, cachedRead: 0.26 },
  "glm-5.2": { limit: 60, input: 1.4, output: 4.4, cachedRead: 0.26 },
  "glm-5.1": { limit: 60, input: 1.4, output: 4.4, cachedRead: 0.26 },
  "kimi-k3": { limit: 15, input: 3.0, output: 15.0, cachedRead: 0.3 },
  "kimi-k2.7-code": { limit: 60, input: 0.95, output: 4.0, cachedRead: 0.19 },
  "kimi-k2.6": { limit: 60, input: 0.95, output: 4.0, cachedRead: 0.16 },
  "longcat-2.0": { limit: 60, input: 0.3, output: 1.2, cachedRead: 0.006 },
  "mimo-v2.5": { limit: 60, input: 0.14, output: 0.28, cachedRead: 0.0028 },
  "mimo-v2.5-pro": { limit: 15, input: 0.435, output: 0.87, cachedRead: 0.003625 },
  "minimax-m3": { limit: 60, input: 0.3, output: 1.2, cachedRead: 0.06 },
  "minimax-m2.7": { limit: 60, input: 0.3, output: 1.2, cachedRead: 0.06 },
  "minimax-m2.5": { limit: 60, input: 0.3, output: 1.2, cachedRead: 0.06 },
  "muse-spark-1.3-contributor": { limit: 60, input: 0.1, output: 0.2, cachedRead: 0.002 },
  "muse-spark-1.2-contributor": { limit: 60, input: 0.1, output: 0.2, cachedRead: 0.002 },
  "qwen3.8-max": { limit: 15, input: 2.0, output: 6.0, cachedRead: 0.25 },
  "qwen3.8-flash": { limit: 30, input: 0.15, output: 0.47, cachedRead: 0.016 },
  "qwen3.7-max": { limit: 30, input: 2.5, output: 7.5, cachedRead: 0.5 },
  "qwen3.7-plus": { limit: 60, input: 0.4, output: 1.6, cachedRead: 0.04 },
  "qwen3.6-plus": { limit: 60, input: 0.5, output: 3.0, cachedRead: 0.05 },
  "deepseek-v4.1-flash": { limit: 60, input: 0.15, output: 0.6, cachedRead: 0.003 },
  "deepseek-v4-pro": { limit: 15, input: 0.66, output: 1.98, cachedRead: 0.022 },
  "deepseek-v4-flash": { limit: 30, input: 0.15, output: 0.6, cachedRead: 0.003 },
  "deepseek-v4-flash-vision-exp": { limit: 15, input: 0.15, output: 0.6, cachedRead: 0.003 },
  "hy4-preview": { limit: 30, input: 0.834, output: 2.501, cachedRead: 0.042 },
  "hy3": { limit: 60, input: 0.14, output: 0.58, cachedRead: 0.035 },
  "grok-4.6": { limit: 15, input: 2.0, output: 6.0, cachedRead: 0.5 },
  "gpt-5.6-luna": { limit: 15, input: 0.2, output: 1.2, cachedRead: 0.02 },
}

/** Límite mensual del modelo (USD) o null si la API trae uno nuevo sin ficha. */
export function goModelLimit(id: string): number | null {
  return GO_MODELS_REF[id]?.limit ?? null
}

/** Fecha ISO de resetsAt → texto local corto; si no parsea, devuelve el crudo. */
export function formatReset(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
  } catch {
    return iso
  }
}

/** Tono de la barra según % usado. */
export function usageTone(percent: number): "ok" | "warn" | "bad" {
  if (percent >= 90) return "bad"
  if (percent >= 70) return "warn"
  return "ok"
}
