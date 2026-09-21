import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { createStore, createEmitter, useStore, useSelector } from "./store"

describe("createStore", () => {
  it("expone get/getState y arranca con el valor inicial", () => {
    const store = createStore(1)
    expect(store.get()).toBe(1)
    expect(store.getState()).toBe(1)
  })

  it("set notifica a los suscriptores", () => {
    const store = createStore(0)
    const listener = vi.fn()
    store.subscribe(listener)
    store.set(1)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.get()).toBe(1)
  })

  it("set con el mismo valor NO notifica (Object.is)", () => {
    const store = createStore(0)
    const listener = vi.fn()
    store.subscribe(listener)
    store.set(0)
    expect(listener).not.toHaveBeenCalled()
  })

  it("set acepta un updater y notifica", () => {
    const store = createStore(2)
    const listener = vi.fn()
    store.subscribe(listener)
    store.set((p) => p + 3)
    expect(store.get()).toBe(5)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("unsubscribe corta las notificaciones", () => {
    const store = createStore(0)
    const listener = vi.fn()
    const unsub = store.subscribe(listener)
    store.set(1)
    unsub()
    store.set(2)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("useStore refleja el valor y re-renderiza al cambiar", () => {
    const store = createStore("a")
    const { result } = renderHook(() => useStore(store))
    expect(result.current).toBe("a")
    act(() => store.set("b"))
    expect(result.current).toBe("b")
  })

  it("useSelector devuelve solo la porcion elegida", () => {
    const store = createStore({ n: 1, label: "x" })
    const { result } = renderHook(() => useSelector(store, (s) => s.n))
    expect(result.current).toBe(1)
    act(() => store.set({ n: 2, label: "x" }))
    expect(result.current).toBe(2)
  })
})

describe("createEmitter", () => {
  it("emit entrega el payload a los suscriptores en orden de alta", () => {
    const emitter = createEmitter<number>()
    const order: number[] = []
    emitter.subscribe((n) => order.push(n))
    emitter.subscribe((n) => order.push(n * 10))
    emitter.emit(2)
    expect(order).toEqual([2, 20])
  })

  it("unsubscribe corta la recepcion", () => {
    const emitter = createEmitter<void>()
    const listener = vi.fn()
    const unsub = emitter.subscribe(listener)
    emitter.emit()
    unsub()
    emitter.emit()
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
