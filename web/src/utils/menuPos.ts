// Posición `fixed` para menús flotantes (dropdowns), clampped al viewport.
// El menú "se mueve" en vez de cortarse: si no entra a la derecha se corre
// a la izquierda, y si no entra abajo hace flip hacia arriba.

export type MenuPos = { left: number; top?: number; bottom?: number }

export type MenuAnchor = { right: number; bottom: number; top: number }

/** Calcula dónde abrir un menú de `width`×`estHeight` anclado a `anchor`.
 *  Alineado al borde derecho del anchor (como dropdown de header), nunca
 *  fuera del viewport (margen M). */
export function calcMenuPos(
  anchor: MenuAnchor,
  width: number,
  estHeight: number,
  viewport: { w: number; h: number },
  margin = 8
): MenuPos {
  const M = margin
  const W = Math.min(width, Math.max(0, viewport.w - M * 2))
  const left = Math.max(M, Math.min(anchor.right - W, viewport.w - W - M))
  const below = viewport.h - anchor.bottom - M
  if (below >= Math.min(estHeight, 220) || below >= anchor.top - M) {
    return { left, top: anchor.bottom + 6 }
  }
  return { left, bottom: viewport.h - anchor.top + 6 }
}

/** Atajo con el viewport real de la ventana. */
export function calcMenuPosForAnchor(anchor: MenuAnchor, width: number, estHeight: number): MenuPos {
  return calcMenuPos(anchor, width, estHeight, { w: window.innerWidth, h: window.innerHeight })
}
