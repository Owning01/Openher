import type { PluginEventCallback, PluginDisposer } from "./types"

class PluginEventBus {
  private listeners = new Map<string, Set<PluginEventCallback>>()

  on(event: string, handler: PluginEventCallback): PluginDisposer {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(handler)
    return () => {
      set?.delete(handler)
      if (set?.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit(event: string, payload: any) {
    const set = this.listeners.get(event)
    if (set) {
      for (const handler of set) {
        try {
          handler(payload)
        } catch (err) {
          console.error(`[PluginBus] Error en listener del evento "${event}":`, err)
        }
      }
    }
    const wild = this.listeners.get("*")
    if (wild) {
      for (const handler of wild) {
        try {
          handler({ event, payload })
        } catch (err) {
          console.error(`[PluginBus] Error en wildcard listener:`, err)
        }
      }
    }
  }
}

export const pluginBus = new PluginEventBus()
