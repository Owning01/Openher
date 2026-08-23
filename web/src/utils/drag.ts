export type DragPayload =
  | { kind: "panel"; idx: number; payload: string; raw: string }
  | { kind: "session"; id: string; raw: string }
  | { kind: "kind"; value: string; raw: string }
  | { kind: "tab"; raw: string }
  | { kind: "file"; path: string; raw: string }
  | { kind: "unknown"; raw: string }

export function parseDragPayload(raw: string): DragPayload {
  if (!raw) return { kind: "unknown", raw }
  if (raw.startsWith("panel:")) {
    const parts = raw.split(":")
    const idx = Number(parts[1])
    const payload = parts.slice(2).join(":")
    return { kind: "panel", idx, payload, raw }
  }
  if (raw.startsWith("session:")) {
    return { kind: "session", id: raw.slice("session:".length), raw }
  }
  if (raw.startsWith("kind:")) {
    return { kind: "kind", value: raw.slice("kind:".length), raw }
  }
  if (raw.startsWith("tab:")) {
    return { kind: "tab", raw }
  }
  if (raw.includes("/") || raw.includes("\\") || raw.includes(".")) {
    return { kind: "file", path: raw, raw }
  }
  return { kind: "unknown", raw }
}

export type DockTarget = {
  targetKind: string
  targetSessionId: string | null
  fromIndex: number | null
}

const LEGACY_SHELL_KINDS = new Set(["terminal", "explorer", "kanban", "stats", "browser", "editor", "design"])

export function parseDockPayload(raw: string): DockTarget {
  let targetKind = "session"
  let targetSessionId: string | null = null
  let fromIndex: number | null = null

  if (raw.startsWith("panel:")) {
    const parts = raw.split(":")
    fromIndex = Number(parts[1])
    const payload = parts.slice(2).join(":")
    if (payload.startsWith("kind:")) {
      targetKind = payload.replace("kind:", "")
      targetSessionId = null
    } else if (payload.startsWith("terminal") || LEGACY_SHELL_KINDS.has(payload)) {
      targetKind = payload.startsWith("terminal") ? "session" : payload
      targetSessionId = payload
    } else if (payload.startsWith("session:")) {
      const sid = payload.replace("session:", "")
      if (sid.startsWith("terminal")) {
        targetKind = "session"
        targetSessionId = sid
      } else {
        targetKind = "session"
        targetSessionId = sid
      }
    } else {
      targetKind = "session"
      targetSessionId = payload
    }
  } else if (raw.startsWith("kind:")) {
    targetKind = raw.replace("kind:", "")
    targetSessionId = null
  } else if (raw.startsWith("terminal") || LEGACY_SHELL_KINDS.has(raw)) {
    targetKind = raw.startsWith("terminal") ? "session" : raw
    targetSessionId = raw
  } else if (raw.startsWith("session:")) {
    const sid = raw.replace("session:", "")
    targetKind = "session"
    targetSessionId = sid
  } else {
    targetKind = "session"
    targetSessionId = raw
  }

  return { targetKind, targetSessionId, fromIndex }
}
