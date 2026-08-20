import { describe, it, expect, vi, beforeEach } from "vitest"
import { toErrorMessage } from "./error"

describe("toErrorMessage", () => {
  it("returns message for Error instance", () => {
    expect(toErrorMessage(new Error("boom"))).toBe("boom")
  })

  it("returns message for Error subclass", () => {
    class CustomError extends Error {}
    expect(toErrorMessage(new CustomError("custom"))).toBe("custom")
  })

  it("returns empty string for Error with empty message", () => {
    expect(toErrorMessage(new Error(""))).toBe("")
  })

  it("returns message for TypeError", () => {
    expect(toErrorMessage(new TypeError("type fail"))).toBe("type fail")
  })

  it("returns string directly when err is string", () => {
    expect(toErrorMessage("plain string")).toBe("plain string")
  })

  it("returns empty string when err is empty string", () => {
    expect(toErrorMessage("")).toBe("")
  })

  it("stringifies plain object", () => {
    expect(toErrorMessage({ code: 500, msg: "fail" })).toBe(JSON.stringify({ code: 500, msg: "fail" }))
  })

  it("stringifies array", () => {
    expect(toErrorMessage([1, 2, 3])).toBe(JSON.stringify([1, 2, 3]))
  })

  it("stringifies number", () => {
    expect(toErrorMessage(42 as unknown as string)).toBe("42")
  })

  it("stringifies null", () => {
    expect(toErrorMessage(null as unknown as string)).toBe("null")
  })

  it("stringifies boolean true", () => {
    expect(toErrorMessage(true as unknown as string)).toBe("true")
  })

  it("stringifies boolean false", () => {
    expect(toErrorMessage(false as unknown as string)).toBe("false")
  })

  it("returns Unknown error when JSON.stringify throws (circular)", () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(toErrorMessage(circular as unknown as string)).toBe("Unknown error")
  })

  it("returns Unknown error when JSON.stringify throws via mocked error", () => {
    const spy = vi.spyOn(JSON, "stringify").mockImplementation(() => {
      throw new Error("stringify fail")
    })
    expect(toErrorMessage({ a: 1 } as unknown as string)).toBe("Unknown error")
    spy.mockRestore()
  })

  it("handles undefined via JSON.stringify returning undefined", () => {
    // JSON.stringify(undefined) returns undefined, not a string
    const result = toErrorMessage(undefined as unknown as string)
    // The function returns JSON.stringify(undefined) which is undefined
    expect(result as unknown).toBe(undefined)
  })

  it("handles object with toJSON that throws", () => {
    const obj = {
      toJSON() {
        throw new Error("toJSON fail")
      },
    }
    expect(toErrorMessage(obj as unknown as string)).toBe("Unknown error")
  })

  it("prefers Error branch over stringifiable object", () => {
    const err = new Error("priority")
    // even though Error is also an object, instanceof check wins
    expect(toErrorMessage(err)).toBe("priority")
  })

  it("does not treat string object as Error", () => {
    // new String creates object, not primitive string
    const strObj = new String("hello") as unknown as string
    // typeof strObj is "object", so it goes to JSON.stringify
    expect(toErrorMessage(strObj)).toBe(JSON.stringify(strObj))
  })
})
