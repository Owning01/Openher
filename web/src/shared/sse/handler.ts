import type { SSEEvent } from "../../types"

export function isDeltaEvent(type: string): boolean {
  return type === "message.part.delta" || type === "session.next.text.delta" || type === "session.next.reasoning.delta" || type === "session.next.tool.input.delta"
}

export function isSettledEvent(type: string): boolean {
  return type === "session.status" || type === "session.idle" || type === "session.completed"
}

export function getEventType(event: SSEEvent): string {
  return event.type ?? "unknown"
}

export type SSEHandlerCallbacks = {
  onDelta?: (event: SSEEvent) => void
  onPart?: (event: SSEEvent) => void
  onSettled?: (event: SSEEvent) => void
  onError?: (event: SSEEvent) => void
  onUnknown?: (event: SSEEvent) => void
}

export function createEventRouter(callbacks: SSEHandlerCallbacks) {
  return (event: SSEEvent) => {
    const t = getEventType(event)
    if (isDeltaEvent(t)) callbacks.onDelta?.(event)
    else if (t === "message.part.updated" || t === "message.updated") callbacks.onPart?.(event)
    else if (isSettledEvent(t)) callbacks.onSettled?.(event)
    else if (t.includes("error")) callbacks.onError?.(event)
    else callbacks.onUnknown?.(event)
  }
}

export function createSSEHandler(callbacks: SSEHandlerCallbacks & { shouldFilter?: (e: SSEEvent) => boolean }) {
  const router = createEventRouter(callbacks)
  return (event: SSEEvent) => {
    if (callbacks.shouldFilter?.(event)) return
    router(event)
  }
}
