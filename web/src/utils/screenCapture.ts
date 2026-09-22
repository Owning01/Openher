// Design Mode: captura de la zona elegida del preview → PNG para el composer.
//
// El desktop devuelve BMP por GDI (`/shell/browser/screenshot`); acá se decodifica
// y se re-encoda a PNG con canvas (queda ~10x más liviano). Si algo falla se
// devuelve null y el pick sigue funcionando solo con HTML/estilos.
export type ShotRect = { x: number; y: number; w: number; h: number }

export type ShotImage = { base64: string; mime: string; name: string }

function bmpDataUrlToImage(bmpBase64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("BMP no decodificable"))
    img.src = `data:image/bmp;base64,${bmpBase64}`
  })
}

/**
 * Captura `rect` (CSS px, relativo al área cliente de la ventana) con `pad` px
 * de margen. Devuelve PNG en base64, o null si no se pudo.
 */
export async function captureRegionToPng(rect: ShotRect, pad = 12): Promise<ShotImage | null> {
  if (!rect || rect.w < 1 || rect.h < 1) return null
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
  const body = {
    x: Math.round(rect.x - pad),
    y: Math.round(rect.y - pad),
    w: Math.round(rect.w + pad * 2),
    h: Math.round(rect.h + pad * 2),
    dpr,
  }
  try {
    const res = await fetch("/shell/browser/screenshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.bmp) return null
    const img = await bmpDataUrlToImage(String(data.bmp))
    const natural = { w: img.naturalWidth || img.width, h: img.naturalHeight || img.height }
    if (natural.w === 0 || natural.h === 0) return null
    // Tope de lado mayor: una zona enorme no debe inflar el prompt (PNG base64).
    const MAX_SIDE = 1600
    const scale = Math.min(1, MAX_SIDE / Math.max(natural.w, natural.h))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(natural.w * scale))
    canvas.height = Math.max(1, Math.round(natural.h * scale))
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL("image/png")
    const base64 = dataUrl.split(",")[1]
    if (!base64) return null
    return { base64, mime: "image/png", name: "design-shot.png" }
  } catch {
    return null
  }
}
