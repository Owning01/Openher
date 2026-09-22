// Canal ǧnico para que otras superficies (anotaciones de diff, Design Mode,
// herramientas del IDE…) manden texto al composer sin conocerlo: encolan acǭ y
// el Composer lo consume en el próximo render. Mismo patrón que outboxStore.
// También acepta imágenes (Design Mode manda la captura de la zona elegida).
import { createStore } from "../shared/lib/store"

export type ComposerInjection = { id: string; text: string }

/** Imagen lista para adjuntar (mismo shape que `ImageAttachment` del composer). */
export type ComposerImageInjection = { id: string; base64: string; mime: string; name: string }

export const composerInjectStore = createStore<ComposerInjection[]>([])
export const composerImageInjectStore = createStore<ComposerImageInjection[]>([])

let seq = 0

/** Encola texto para el composer (ignora vacíos). */
export function injectToComposer(text: string): void {
  const clean = text.trim()
  if (!clean) return
  seq += 1
  composerInjectStore.set([...composerInjectStore.get(), { id: `inj_${seq}`, text: clean }])
}

/** Encola una imagen para el composer (ignora vacías). */
export function injectImageToComposer(img: { base64: string; mime?: string; name?: string }): void {
  if (!img?.base64) return
  seq += 1
  const clean: ComposerImageInjection = {
    id: `imginj_${seq}`,
    base64: img.base64,
    mime: img.mime || "image/png",
    name: img.name || `captura-${seq}.png`,
  }
  composerImageInjectStore.set([...composerImageInjectStore.get(), clean])
}

/** Saca (y limpia) todo lo pendiente, ya unido en un solo bloque. */
export function takeComposerInjections(): string {
  const pending = composerInjectStore.get()
  if (pending.length === 0) return ""
  composerInjectStore.set([])
  return pending.map((p) => p.text).join("\n\n")
}

/** Saca (y limpia) las imágenes pendientes. */
export function takeComposerImageInjections(): ComposerImageInjection[] {
  const pending = composerImageInjectStore.get()
  if (pending.length === 0) return []
  composerImageInjectStore.set([])
  return pending
}
