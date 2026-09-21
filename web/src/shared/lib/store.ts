import { useSyncExternalStore } from "react"

/**
 * Primitivo de estado externo a React (una sola implementacion para todos los
 * stores "de modulo").
 *
 * `createStore<T>(initial): Store<T>`
 *   - `get()` / `getState()`: valor actual (misma referencia hasta el proximo `set`).
 *   - `set(next | (prev) => next)`: reemplaza el valor y notifica a los suscriptores.
 *     Si el valor nuevo es `Object.is` igual al anterior, NO notifica (set con el
 *     mismo valor es un no-op observable). Es la regla que preservan los guards
 *     `if (actual === v) return` que habia a mano en cada store.
 *   - `subscribe(listener)`: alta; devuelve el unsubscribe.
 *
 * `createEmitter<T = void>(): Emitter<T>`
 *   - `subscribe(listener)`: alta; devuelve el unsubscribe.
 *   - `emit(payload)`: invoca a los suscriptores en orden de alta (sin try/catch:
 *     el aislamiento de errores, si se necesita, lo decide el consumidor).
 *
 * Hooks (React): `useStore(store)` devuelve el estado completo y
 * `useSelector(store, selector)` una porcion. El selector DEBE devolver un valor
 * primitivo o una referencia estable (igual que en `useSyncExternalStore`); un
 * selector que construye un objeto/array nuevo en cada llamada re-renderiza en
 * bucle.
 */

export type Store<T> = {
  /** Valor actual. */
  get: () => T
  /** Alias de `get` (nombre estilo store externo). */
  getState: () => T
  /** Reemplaza el valor (o aplica un updater) y notifica si cambio. */
  set: (next: T | ((prev: T) => T)) => void
  /** Alta de listener; devuelve el unsubscribe. */
  subscribe: (listener: () => void) => () => void
}

export type Emitter<T = void> = {
  /** Alta de listener; devuelve el unsubscribe. */
  subscribe: (listener: (payload: T) => void) => () => void
  /** Notifica a todos los listeners con el payload. */
  emit: (payload: T) => void
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial
  const listeners = new Set<() => void>()

  const get = (): T => value
  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
  const set = (next: T | ((prev: T) => T)): void => {
    const resolved = typeof next === "function" ? (next as (prev: T) => T)(value) : next
    if (Object.is(value, resolved)) return
    value = resolved
    for (const listener of listeners) listener()
  }

  return { get, getState: get, set, subscribe }
}

export function createEmitter<T = void>(): Emitter<T> {
  const listeners = new Set<(payload: T) => void>()

  const subscribe = (listener: (payload: T) => void): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
  const emit = (payload: T): void => {
    for (const listener of listeners) listener(payload)
  }

  return { subscribe, emit }
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

export function useSelector<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  )
}
