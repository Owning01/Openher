import { createPluginContext } from "./ctx"
import { shell } from "../shell"
import type { PluginManifest, PluginInstance, PluginModule } from "./types"

class PluginHost {
  private instances = new Map<string, PluginInstance>()
  private listeners = new Set<() => void>()

  getPlugins(): PluginInstance[] {
    return Array.from(this.instances.values())
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    for (const l of this.listeners) l()
  }

  async loadAll(manifests: PluginManifest[]) {
    for (const manifest of manifests) {
      await this.loadPlugin(manifest)
    }
  }

  async loadPlugin(manifest: PluginManifest): Promise<boolean> {
    const name = manifest.name

    if (this.instances.has(name)) {
      this.unloadPlugin(name)
    }

    const instance: PluginInstance = {
      manifest,
      state: "loading",
      disposers: [],
    }
    this.instances.set(name, instance)
    this.notify()

    if (manifest.enabled === false) {
      instance.state = "disabled"
      this.notify()
      return false
    }

    try {
      const entryUrl = manifest.entryUrl || `/shell/plugin/${name}/index.js`
      const fullUrl = `${window.location.origin}${entryUrl}?t=${Date.now()}`
      const mod: PluginModule = await import(/* @vite-ignore */ fullUrl)

      if (typeof mod.apply !== "function") {
        throw new Error(`El plugin ${name} no exporta una función apply(ctx)`)
      }

      const ctx = createPluginContext(manifest, instance.disposers)
      const cleanup = await mod.apply(ctx)
      if (typeof cleanup === "function") {
        instance.disposers.push(cleanup)
      }

      instance.state = "active"
      this.notify()
      console.log(`[PluginHost] Plugin activado: ${name} v${manifest.version || "1.0.0"}`)
      return true
    } catch (err: any) {
      console.error(`[PluginHost] Error al cargar plugin ${name}:`, err)
      instance.state = "error"
      instance.error = err?.message || String(err)
      this.notify()
      return false
    }
  }

  unloadPlugin(name: string) {
    const instance = this.instances.get(name)
    if (!instance) return

    while (instance.disposers.length > 0) {
      const d = instance.disposers.pop()
      try {
        d?.()
      } catch (err) {
        console.error(`[PluginHost] Error al limpiar plugin ${name}:`, err)
      }
    }

    instance.state = "unloaded"
    this.instances.delete(name)
    this.notify()
    console.log(`[PluginHost] Plugin descargado: ${name}`)
  }

  async reloadAll() {
    try {
      const res = await shell.plugins.list()
      if (res?.ok && Array.isArray(res.plugins)) {
        await this.loadAll(res.plugins as unknown as PluginManifest[])
      }
    } catch (err) {
      console.error("[PluginHost] Error al recargar plugins:", err)
    }
  }
}

export const pluginHost = new PluginHost()
