// Escape HTML único. La versión del renderer de markdown solo escapaba
// `& < >` (dejaba pasar `"`); la del editor escapaba además `"`. Esta es la
// más estricta: cubre los cinco caracteres peligrosos (& < > " ') y reemplaza
// a ambas. El orden importa: `&` primero para no doble-escapar entidades.
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
