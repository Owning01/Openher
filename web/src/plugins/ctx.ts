import { slotRegistry, tabRegistry } from "./slots"
import { pluginBus } from "./bus"
import { shell } from "../shell"
import type { PluginManifest, PluginContext, PluginDisposer } from "./types"

export function createPluginContext(manifest: PluginManifest, disposers: PluginDisposer[]): PluginContext {
  const name = manifest.name
  const caps = new Set(manifest.capabilities || [])
  const config = manifest.config || {}
  const storagePrefix = `opencode.plugin.${name}.`

  const deny = (cap: string) => {
    throw new Error(`[Plugin:${name}] Capability "${cap}" no declarada en el manifiesto`)
  }

  const rawUI = {
    registerSlot: (slotId: any, item: any) => {
      if (!caps.has("ui")) deny("ui")
      const unreg = slotRegistry.register(slotId, { ...item, pluginName: name })
      disposers.push(unreg)
      return unreg
    },
    registerTab: (tab: any) => {
      if (!caps.has("ui")) deny("ui")
      const unreg = tabRegistry.register(name, tab)
      disposers.push(unreg)
      return unreg
    },
  }

  const rawEvents = {
    on: (event: string, handler: any) => {
      if (!caps.has("events")) deny("events")
      const unreg = pluginBus.on(event, handler)
      disposers.push(unreg)
      return unreg
    },
    emit: (event: string, payload: any) => {
      if (!caps.has("events")) deny("events")
      pluginBus.emit(event, payload)
    },
  }

  const rawCommands = {
    register: (cmd: any) => {
      if (!caps.has("commands")) deny("commands")
      // comando registrado en el bus de plugins
      const unreg = pluginBus.on(`cmd:${cmd.name}`, cmd.execute)
      disposers.push(unreg)
      return unreg
    },
  }

  const rawStorage = {
    get: (key: string, fallback: any = null) => {
      if (!caps.has("storage")) deny("storage")
      try {
        const raw = localStorage.getItem(`${storagePrefix}${key}`)
        return raw !== null ? JSON.parse(raw) : fallback
      } catch {
        return fallback
      }
    },
    set: (key: string, value: any) => {
      if (!caps.has("storage")) deny("storage")
      try {
        localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value))
      } catch (err) {
        console.error(`[Plugin:${name}] Storage set error:`, err)
      }
    },
    remove: (key: string) => {
      if (!caps.has("storage")) deny("storage")
      try {
        localStorage.removeItem(`${storagePrefix}${key}`)
      } catch {}
    },
  }

  const rawShell = new Proxy(shell, {
    get(target, prop, receiver) {
      if (!caps.has("shell")) deny("shell")
      return Reflect.get(target, prop, receiver)
    },
  })

  const baseCtx: PluginContext = {
    pluginName: name,
    config,
    ui: rawUI,
    events: rawEvents,
    commands: rawCommands,
    storage: rawStorage,
    shell: rawShell,
    on: (event: string, handler: any) => rawEvents.on(event, handler),
    effect: (fn: () => PluginDisposer | void) => {
      const d = fn()
      if (typeof d === "function") disposers.push(d)
    },
  }

  return baseCtx
}
