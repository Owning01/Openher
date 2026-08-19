// Static logo renderer only. The WebGL PixelScanField (three.js) was removed.
const LOGO_SRC = '/logo-scan.svg';

let logoImgPromise: Promise<HTMLImageElement> | null = null;
function loadLogo(): Promise<HTMLImageElement> {
  logoImgPromise ??= new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`[pixel-scan] failed to load ${LOGO_SRC}`));
    img.src = LOGO_SRC;
  });
  return logoImgPromise;
}

function rasteriseLogo(
  w: number,
  h: number,
  dpr: number,
  img: HTMLImageElement | null,
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }
  return c;
}

export function drawStaticLogo(canvas: HTMLCanvasElement, host: HTMLElement) {
  void loadLogo()
    .then((img) => {
      const r = host.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(rasteriseLogo(r.width, r.height, dpr, img), 0, 0);
    })
    .catch((err: unknown) => console.error(err));
}
