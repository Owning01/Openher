/**
 * Resuelve el `src` del iframe del canvas del Estudio.
 * - Rutas relativas (`/shell/preview/...`) son same-origin: se usan tal cual.
 * - Origen local (dev server) se usa directo en modo preview y por el proxy en
 *   modo inspección, para volverlo same-origin y poder inyectar el overlay.
 * - Remotos siempre por el proxy Rust.
 */
export function frameSrc(raw: string, forceProxy: boolean): string {
  if (!raw) return "about:blank"
  // Ruta relativa same-origin real. Se excluye `//host` y `/\host` (protocol-relative):
  // el navegador los resolvería como un origen externo y saltaría el proxy.
  if (raw.startsWith("/") && raw[1] !== "/" && raw[1] !== "\\") return raw
  const isLocal = /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/i.test(raw)
  if (isLocal && !forceProxy) return raw
  return `/shell/proxy?url=${encodeURIComponent(raw)}`
}
