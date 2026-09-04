type MessageWithInfo = { info?: { sessionID?: string; id?: string } }

/** Conserva el historial visible hasta el mensaje objetivo según su orden real. */
export function keepMessagesThrough<T extends MessageWithInfo>(messages: T[], sessionID: string, targetID: string): T[] {
  let targetFound = false
  return messages.filter((message) => {
    if (message.info?.sessionID && message.info.sessionID !== sessionID) return true
    if (targetFound) return false
    if (message.info?.id === targetID) targetFound = true
    return true
  })
}

/** Conserva el historial visible estrictamente antes del mensaje objetivo (excluyendo el objetivo y los posteriores). */
export function keepMessagesBefore<T extends MessageWithInfo>(messages: T[], sessionID: string, targetID: string): T[] {
  let targetFound = false
  return messages.filter((message) => {
    if (message.info?.sessionID && message.info.sessionID !== sessionID) return true
    if (targetFound) return false
    if (message.info?.id === targetID) {
      targetFound = true
      return false
    }
    return true
  })
}
