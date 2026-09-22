// Filas "acopladas" para las listas planas de sesiones (Recientes/Favoritos).
// Un subagente/hija se muestra debajo de SU sesión padre, no como fila suelta
// intercalada por fecha. Comparte la REGLA con la lista de carpetas de
// proyecto (hija => va con su padre), pero no la implementación: esa lista
// agrupa en `renderSessionCards` conservando su orden y su colapso por padre.

type TreeSession = { id: string; parentID?: string | null; updated?: number }

export type SessionRow<T> = {
  session: T
  /** `true` si la fila va debajo de su padre (acoplada). */
  isChild: boolean
}

/**
 * Convierte una lista plana (ordenada por actividad) en filas acopladas:
 * cada sesión raíz seguida de sus hijas que también están en la lista, y los
 * grupos ordenados por la actividad más reciente del grupo.
 *
 * Reglas:
 *  - hija cuyo padre está en la lista → fila `isChild` dentro del grupo del padre.
 *  - hija cuyo padre existe (`knownIds`) pero no está en ESTA lista → se omite
 *    (mismo criterio que hoy: no duplicar lo que ya se ve con su padre).
 *  - hija huérfana (padre desconocido) → fila suelta normal.
 *  - cadenas A←B←C se resuelven hasta la raíz; ciclos defensivos se tratan
 *    como raíz para no perder filas.
 *
 * `knownIds` es el set de TODOS los ids de sesión (para distinguir "padre en
 * otra lista" de "padre borrado"). Sin él, toda hija sin padre en la lista
 * queda como fila suelta.
 */
export function coupleSessionRows<T extends TreeSession>(
  list: readonly T[],
  knownIds?: ReadonlySet<string> | null
): Array<SessionRow<T>> {
  const byId = new Map(list.map((s) => [s.id, s]))
  const resolveRoot = (start: T): T | null => {
    let cur = start
    const seen = new Set<string>([cur.id])
    for (;;) {
      const parentID = cur.parentID
      if (!parentID) return cur
      if (!byId.has(parentID)) return knownIds?.has(parentID) ? null : cur
      // Ciclo defensivo: la fila arranca suelta en vez de engancharse al
      // otro nodo del anillo (dos grupos espejo duplicarían las filas).
      if (seen.has(parentID)) return start
      seen.add(parentID)
      cur = byId.get(parentID) as T
    }
  }

  const groups = new Map<string, { max: number; root: T; kids: Array<SessionRow<T>> }>()
  for (const s of list) {
    const root = resolveRoot(s)
    if (!root) continue
    let g = groups.get(root.id)
    if (!g) {
      g = { max: root.updated ?? 0, root, kids: [] }
      groups.set(root.id, g)
    }
    if (s.id !== root.id) g.kids.push({ session: s, isChild: true })
    const updated = s.updated ?? 0
    if (updated > g.max) g.max = updated
  }
  for (const g of groups.values()) {
    // Raíz primero; hijas por actividad (la entrada puede venir en cualquier orden).
    g.kids.sort((a, b) => (b.session.updated ?? 0) - (a.session.updated ?? 0))
  }

  return [...groups.values()]
    .sort((a, b) => b.max - a.max)
    .flatMap((g) => [{ session: g.root, isChild: false }, ...g.kids])
}
