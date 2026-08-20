import { describe, it, expect, vi } from "vitest"
import { isDeltaEvent, isSettledEvent, getEventType, createEventRouter, createSSEHandler } from "./handler"
import type { SSEEvent } from "../../types"

function evt(type: string, overrides: Partial<SSEEvent> = {}): SSEEvent {
  return { id: "1", type, properties: {}, ...overrides }
}

describe("isDeltaEvent", () => {
  it("returns true for message.part.delta", () => {
    expect(isDeltaEvent("message.part.delta")).toBe(true)
  })
  it("returns true for session.next.text.delta", () => {
    expect(isDeltaEvent("session.next.text.delta")).toBe(true)
  })
  it("returns true for session.next.reasoning.delta", () => {
    expect(isDeltaEvent("session.next.reasoning.delta")).toBe(true)
  })
  it("returns true for session.next.tool.input.delta", () => {
    expect(isDeltaEvent("session.next.tool.input.delta")).toBe(true)
  })
  it("returns false for message.part.updated", () => {
    expect(isDeltaEvent("message.part.updated")).toBe(false)
  })
  it("returns false for random type", () => {
    expect(isDeltaEvent("session.status")).toBe(false)
    expect(isDeltaEvent("unknown")).toBe(false)
    expect(isDeltaEvent("")).toBe(false)
  })
})

describe("isSettledEvent", () => {
  it("returns true for session.status", () => {
    expect(isSettledEvent("session.status")).toBe(true)
  })
  it("returns true for session.idle", () => {
    expect(isSettledEvent("session.idle")).toBe(true)
  })
  it("returns true for session.completed", () => {
    expect(isSettledEvent("session.completed")).toBe(true)
  })
  it("returns false for delta events", () => {
    expect(isSettledEvent("message.part.delta")).toBe(false)
  })
  it("returns false for unknown", () => {
    expect(isSettledEvent("unknown")).toBe(false)
    expect(isSettledEvent("")).toBe(false)
  })
})

describe("getEventType", () => {
  it("returns event.type when present", () => {
    expect(getEventType(evt("my.type"))).toBe("my.type")
  })
  it("returns unknown when type is undefined", () => {
    const e = { id: "1", properties: {} } as unknown as SSEEvent
    expect(getEventType(e)).toBe("unknown")
  })
  it("returns unknown when type is nullish", () => {
    const e = { id: "1", type: undefined as unknown as string, properties: {} } as SSEEvent
    expect(getEventType(e)).toBe("unknown")
  })
})

describe("createEventRouter", () => {
  it("routes delta events to onDelta", () => {
    const onDelta = vi.fn()
    const router = createEventRouter({ onDelta })
    router(evt("message.part.delta"))
    expect(onDelta).toHaveBeenCalledTimes(1)
    router(evt("session.next.text.delta"))
    expect(onDelta).toHaveBeenCalledTimes(2)
  })

  it("routes message.part.updated to onPart", () => {
    const onPart = vi.fn()
    const router = createEventRouter({ onPart })
    router(evt("message.part.updated"))
    expect(onPart).toHaveBeenCalledWith(expect.objectContaining({ type: "message.part.updated" }))
  })

  it("routes message.updated to onPart", () => {
    const onPart = vi.fn()
    const router = createEventRouter({ onPart })
    router(evt("message.updated"))
    expect(onPart).toHaveBeenCalledTimes(1)
  })

  it("routes settled events to onSettled", () => {
    const onSettled = vi.fn()
    const router = createEventRouter({ onSettled })
    router(evt("session.status"))
    router(evt("session.idle"))
    router(evt("session.completed"))
    expect(onSettled).toHaveBeenCalledTimes(3)
  })

  it("routes error-containing types to onError", () => {
    const onError = vi.fn()
    const router = createEventRouter({ onError })
    router(evt("session.error"))
    router(evt("message.error.thing"))
    expect(onError).toHaveBeenCalledTimes(2)
  })

  it("prioritizes error check over unknown", () => {
    const onError = vi.fn()
    const onUnknown = vi.fn()
    const router = createEventRouter({ onError, onUnknown })
    router(evt("something.error.here"))
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onUnknown).not.toHaveBeenCalled()
  })

  it("routes unknown types to onUnknown", () => {
    const onUnknown = vi.fn()
    const router = createEventRouter({ onUnknown })
    router(evt("some.random.type"))
    expect(onUnknown).toHaveBeenCalledTimes(1)
  })

  it("does not throw when callbacks missing", () => {
    const router = createEventRouter({})
    expect(() => router(evt("message.part.delta"))).not.toThrow()
    expect(() => router(evt("some.random"))).not.toThrow()
  })

  it("delta takes precedence over other checks", () => {
    const onDelta = vi.fn()
    const onError = vi.fn()
    const router = createEventRouter({ onDelta, onError })
    // Though delta string doesn't contain error, ensure delta not mistakenly routed to error
    router(evt("message.part.delta"))
    expect(onDelta).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()
  })

  it("unknown fallback when no handler matched", () => {
    const onPart = vi.fn()
    const onSettled = vi.fn()
    const onDelta = vi.fn()
    const onError = vi.fn()
    const onUnknown = vi.fn()
    const router = createEventRouter({ onPart, onSettled, onDelta, onError, onUnknown })
    router(evt("totally.unknown"))
    expect(onUnknown).toHaveBeenCalledTimes(1)
    expect(onDelta).not.toHaveBeenCalled()
    expect(onPart).not.toHaveBeenCalled()
  })
})

describe("createSSEHandler", () => {
  it("calls router when shouldFilter not provided", () => {
    const onDelta = vi.fn()
    const handler = createSSEHandler({ onDelta })
    handler(evt("message.part.delta"))
    expect(onDelta).toHaveBeenCalledTimes(1)
  })

  it("does not call router when shouldFilter returns true", () => {
    const onDelta = vi.fn()
    const handler = createSSEHandler({ onDelta, shouldFilter: () => true })
    handler(evt("message.part.delta"))
    expect(onDelta).not.toHaveBeenCalled()
  })

  it("calls router when shouldFilter returns false", () => {
    const onDelta = vi.fn()
    const handler = createSSEHandler({ onDelta, shouldFilter: () => false })
    handler(evt("message.part.delta"))
    expect(onDelta).toHaveBeenCalledTimes(1)
  })

  it("shouldFilter receives the event", () => {
    const shouldFilter = vi.fn(() => false)
    const onUnknown = vi.fn()
    const handler = createSSEHandler({ onUnknown, shouldFilter })
    const e = evt("some.unknown")
    handler(e)
    expect(shouldFilter).toHaveBeenCalledWith(e)
    expect(onUnknown).toHaveBeenCalledWith(e)
  })

  it("filters only filtered events, passes others", () => {
    const shouldFilter = vi.fn((e: SSEEvent) => e.type === "session.status")
    const onSettled = vi.fn()
    const onDelta = vi.fn()
    const handler = createSSEHandler({ onSettled, onDelta, shouldFilter })
    handler(evt("session.status"))
    expect(onSettled).not.toHaveBeenCalled()
    handler(evt("message.part.delta"))
    expect(onDelta).toHaveBeenCalledTimes(1)
  })

  it("uses internal createEventRouter so all routes respect filtering", () => {
    const onPart = vi.fn()
    const onError = vi.fn()
    const handler = createSSEHandler({ onPart, onError, shouldFilter: (e) => e.type.includes("error") })
    handler(evt("message.error.boom"))
    expect(onError).not.toHaveBeenCalled()
    handler(evt("message.part.updated"))
    expect(onPart).toHaveBeenCalledTimes(1)
  })
})
