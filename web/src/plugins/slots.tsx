import { useSyncExternalStore } from "react"
import { createEmitter } from "../shared/lib/store"
import type { SlotId, SlotItem, PluginDisposer } from "./types"

const EMPTY_SLOT_ITEMS: SlotItem[] = []

class SlotRegistry {
  private slots = new Map<SlotId, SlotItem[]>()
  private emitter = createEmitter()

  register(slotId: SlotId, item: SlotItem): PluginDisposer {
    const list = this.slots.get(slotId) ?? EMPTY_SLOT_ITEMS
    this.slots.set(slotId, [...list.filter((s) => s.id !== item.id), item])
    this.notify()

    return () => {
      const current = this.slots.get(slotId) ?? EMPTY_SLOT_ITEMS
      const next = current.filter((s) => s.id !== item.id)
      if (next.length === 0) {
        this.slots.delete(slotId)
      } else {
        this.slots.set(slotId, next)
      }
      this.notify()
    }
  }

  get(slotId: SlotId): SlotItem[] {
    return this.slots.get(slotId) ?? EMPTY_SLOT_ITEMS
  }

  subscribe(listener: () => void): () => void {
    return this.emitter.subscribe(listener)
  }

  private notify() {
    this.emitter.emit()
  }
}

export const slotRegistry = new SlotRegistry()

// --- Tab registry for plugins that want to open as grid tabs ---
import type { PluginTabDefinition } from "./types"

class TabRegistry {
  private tabs = new Map<string, PluginTabDefinition & { pluginName: string }>()
  private emitter = createEmitter()
  private cached: Array<PluginTabDefinition & { pluginName: string; key: string }> = []
  private dirty = true
  register(pluginName: string, tab: PluginTabDefinition): import("./types").PluginDisposer {
    const key = `${pluginName}:${tab.id}`
    this.tabs.set(key, { ...tab, pluginName } as PluginTabDefinition & { pluginName: string })
    this.dirty = true
    this.notify()
    return () => {
      this.tabs.delete(key)
      this.dirty = true
      this.notify()
    }
  }
  getAll(): Array<PluginTabDefinition & { pluginName: string; key: string }> {
    if (this.dirty) {
      this.cached = Array.from(this.tabs.entries()).map(([key, v]) => ({ ...v, key }))
      this.dirty = false
    }
    return this.cached
  }
  get(key: string): (PluginTabDefinition & { pluginName: string }) | undefined {
    return this.tabs.get(key)
  }
  getSnapshot = (): Array<PluginTabDefinition & { pluginName: string; key: string }> => this.getAll()
  subscribe = (listener: () => void): (() => void) => {
    return this.emitter.subscribe(listener)
  }
  private notify() {
    this.emitter.emit()
  }
}

export const tabRegistry = new TabRegistry()

export function PluginSlot({ id, props }: { id: SlotId; props?: any }) {
  const items = useSyncExternalStore(
    (cb) => slotRegistry.subscribe(cb),
    () => slotRegistry.get(id),
  )

  if (items.length === 0) return null

  return (
    <>
      {items.map((item) => (
        <div key={`${item.pluginName}:${item.id}`} className={`plugin-slot-item plugin-slot-${id.replace(/\./g, "-")}`}>
          {item.render(props)}
        </div>
      ))}
    </>
  )
}
