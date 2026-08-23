import { useSyncExternalStore } from "react"
import type { SlotId, SlotItem, PluginDisposer } from "./types"

class SlotRegistry {
  private slots = new Map<SlotId, SlotItem[]>()
  private listeners = new Set<() => void>()

  register(slotId: SlotId, item: SlotItem): PluginDisposer {
    const list = this.slots.get(slotId) ?? []
    this.slots.set(slotId, [...list.filter((s) => s.id !== item.id), item])
    this.notify()

    return () => {
      const current = this.slots.get(slotId) ?? []
      this.slots.set(slotId, current.filter((s) => s.id !== item.id))
      this.notify()
    }
  }

  get(slotId: SlotId): SlotItem[] {
    return this.slots.get(slotId) ?? []
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    for (const l of this.listeners) l()
  }
}

export const slotRegistry = new SlotRegistry()

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
