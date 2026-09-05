// Bloc de notas del chat: una nota de texto plano por sesión.
// localStorage directo + debounce en el panel (sin stores ni renders globales).
// Tope de 20KB: el panel vive solo mientras está abierto (bajo consumo de RAM).

export const CHAT_NOTES_MAX = 20_000

export function chatNotesKey(sessionID?: string | null): string {
  return sessionID ? `openher.chatNotes.${sessionID}` : "openher.chatNotes.global"
}

export function readChatNotes(sessionID?: string | null): string {
  try {
    return (localStorage.getItem(chatNotesKey(sessionID)) ?? "").slice(0, CHAT_NOTES_MAX)
  } catch {
    return ""
  }
}

export function writeChatNotes(sessionID: string | undefined | null, value: string): void {
  try {
    const k = chatNotesKey(sessionID)
    if (value) localStorage.setItem(k, value.slice(0, CHAT_NOTES_MAX))
    else localStorage.removeItem(k)
  } catch {
    /* storage lleno/bloqueado: la nota solo vive en memoria */
  }
}
