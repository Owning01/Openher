const IMAGE_MAX_SIZE = 1600

/** Downscale de imágenes grandes antes de base64: reduce heap ~4x y tiempo de upload. */
export async function downscaleImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }
  const canOffscreen = typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap !== "undefined"
  const canCreateBitmap = typeof createImageBitmap !== "undefined"
  try {
    const bitmap = canCreateBitmap ? await createImageBitmap(file) : null
    if (!bitmap) throw new Error("no bitmap")
    const scale = Math.min(1, IMAGE_MAX_SIZE / Math.max(bitmap.width, bitmap.height))
    if (scale >= 1) {
      bitmap.close()
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    }
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    let blob: Blob
    if (canOffscreen) {
      const canvas = new OffscreenCanvas(w, h)
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(bitmap, 0, 0, w, h)
      bitmap.close()
      blob = await canvas.convertToBlob({ type: file.type || "image/jpeg", quality: 0.85 })
    } else {
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(bitmap as any, 0, 0, w, h)
      bitmap.close()
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error("toBlob failed")), file.type || "image/jpeg", 0.85)
      })
    }
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    // Fallback iOS/Capacitor viejo sin OffscreenCanvas/createImageBitmap
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }
}
