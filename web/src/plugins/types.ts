import type { ReactNode } from "react"

export type PluginCapability = "ui" | "events" | "commands" | "storage" | "shell"

export type PluginManifest = {
  name: string
  title?: string
  version?: string
  description?: string
  entry?: string
  entryUrl?: string
  capabilities: PluginCapability[]
  config?: Record<string, any>
  enabled?: boolean
  type?: "esm" | "web" | "command" | "link"
}

export type SlotId =
  | "sidebar.activity"
  | "shell.overlay"
  | "composer.actions"
  | "message.decorate"
  | "settings.section"
  | (string & {})

export type SlotItem = {
  id: string
  pluginName: string
  title?: string
  icon?: string | ReactNode
  render: (props?: any) => ReactNode
  order?: number
}

export type CommandItem = {
  name: string
  description?: string
  execute: (args?: string) => Promise<any> | any
}

export type PluginEventCallback = (payload: any) => void

export type PluginDisposer = () => void

export type PluginContextUI = {
  registerSlot: (slotId: SlotId, item: Omit<SlotItem, "pluginName">) => PluginDisposer
}

export type PluginContextEvents = {
  on: (event: string, handler: PluginEventCallback) => PluginDisposer
  emit: (event: string, payload: any) => void
}

export type PluginContextCommands = {
  register: (command: CommandItem) => PluginDisposer
}

export type PluginContextStorage = {
  get: <T = any>(key: string, fallback?: T) => T | null
  set: (key: string, value: any) => void
  remove: (key: string) => void
}

export type PluginContext = {
  pluginName: string
  config: Record<string, any>
  ui: PluginContextUI
  events: PluginContextEvents
  commands: PluginContextCommands
  storage: PluginContextStorage
  shell: any
  on: (event: string, handler: PluginEventCallback) => PluginDisposer
  effect: (fn: () => PluginDisposer | void) => void
}

export type PluginModule = {
  apply: (ctx: PluginContext) => PluginDisposer | void | Promise<PluginDisposer | void>
}

export type PluginState = "unloaded" | "loading" | "active" | "error" | "disabled"

export type PluginInstance = {
  manifest: PluginManifest
  state: PluginState
  error?: string
  disposers: PluginDisposer[]
}
