// Draft del composer por sesión. Antes era una key global
// ("opencode.remote.composer") + init una sola vez: al cambiar de chat el
// texto de A se veía en B y el intervalo lo grababa bajo la key de B.

const GLOBAL_KEY = "opencode.remote.composer"

/** Key de draft para una sesión (o la global legacy si no hay sesión). */
export function composerDraftKey(sessionID?: string | null): string {
  return sessionID ? `composer-${sessionID}` : GLOBAL_KEY
}

/** Lee el draft ("" si no hay o falla el storage). */
export function readComposerDraft(sessionID?: string | null): string {
  try {
    return localStorage.getItem(composerDraftKey(sessionID)) ?? ""
  } catch {
    return ""
  }
}

/** Guarda el draft (borra la key si queda vacío). Nunca tira. */
export function writeComposerDraft(sessionID: string | undefined | null, value: string): void {
  try {
    const k = composerDraftKey(sessionID)
    if (value) localStorage.setItem(k, value)
    else localStorage.removeItem(k)
  } catch {
    /* storage lleno/bloqueado: el draft solo vive en memoria */
  }
}
