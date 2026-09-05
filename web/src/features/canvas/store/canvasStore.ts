import { useSyncExternalStore } from "react"
import type {
  CanvasDoc,
  CanvasPart,
  CanvasPartKind,
  CanvasScreen,
  ScreenPreset,
} from "../model/canvasTypes"
import {
  isValidDoc,
  makeDoc,
  makePart,
  makeScreen,
  partsOf,
  screenSizeOf,
  SCREEN_MARGIN,
  uid,
} from "../model/canvasTypes"

const DOCS_KEY = "opencode.canvas.docs.v1"
const ACTIVE_KEY = "opencode.canvas.active.v1"
const HISTORY_CAP = 50

export type CanvasSelection = { screenId: string; partId: string } | null

type CanvasState = {
  docs: CanvasDoc[]
  activeId: string | null
  selection: CanvasSelection
}

type Snapshot = { docs: CanvasDoc[]; activeId: string | null }

function loadDocs(): CanvasDoc[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidDoc)
  } catch {
    return []
  }
}

function loadActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function schedulePersist(docs: CanvasDoc[], activeId: string | null) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(DOCS_KEY, JSON.stringify(docs))
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId)
      else localStorage.removeItem(ACTIVE_KEY)
    } catch {
      // cuota llena o storage bloqueado: se sigue en memoria
    }
  }, 600)
}

const initialDocs = loadDocs()
const initialActive = loadActiveId()

let state: CanvasState = {
  docs: initialDocs,
  activeId: initialActive && initialDocs.some((d) => d.id === initialActive) ? initialActive : (initialDocs[0]?.id ?? null),
  selection: null,
}

const listeners = new Set<() => void>()
let past: Snapshot[] = []
let future: Snapshot[] = []

function snapshot(): Snapshot {
  return { docs: state.docs, activeId: state.activeId }
}

function pushHistory() {
  past.push(snapshot())
  if (past.length > HISTORY_CAP) past.shift()
  future = []
}

function setState(next: CanvasState, opts?: { history?: boolean; persist?: boolean }) {
  if (opts?.history) pushHistory()
  state = next
  schedulePersist(next.docs, next.activeId)
  for (const l of listeners) l()
}

function touch(docs: CanvasDoc[], id: string): CanvasDoc[] {
  return docs.map((d) => (d.id === id ? { ...d, updatedAt: Date.now() } : d))
}

export function getActiveDoc(): CanvasDoc | null {
  return state.docs.find((d) => d.id === state.activeId) ?? null
}

function updateActiveDoc(fn: (d: CanvasDoc) => CanvasDoc, opts?: { history?: boolean }): CanvasDoc | null {
  const active = getActiveDoc()
  if (!active) return null
  const next = touch(
    state.docs.map((d) => (d.id === active.id ? fn(d) : d)),
    active.id,
  )
  setState({ ...state, docs: next }, { history: opts?.history ?? true })
  return next.find((d) => d.id === active.id) ?? null
}

function clampPart(p: CanvasPart, sw: number, sh: number, h: number): CanvasPart {
  const w = Math.min(p.w ?? sw, sw)
  return {
    ...p,
    w,
    x: Math.max(0, Math.min(sw - Math.min(w, sw), Math.round(p.x))),
    y: Math.max(0, Math.min(sh - h, Math.round(p.y))),
  }
}

export const canvasStore = {
  subscribe(cb: () => void): () => void {
    listeners.add(cb)
    return () => { listeners.delete(cb) }
  },
  getSnapshot(): CanvasState {
    return state
  },

  createDoc(title: string): string {
    const doc = makeDoc(title.trim() || "Sin titulo")
    pushHistory()
    setState({ docs: [...state.docs, doc], activeId: doc.id, selection: null }, {})
    return doc.id
  },
  renameDoc(id: string, title: string) {
    setState(
      { ...state, docs: touch(state.docs.map((d) => (d.id === id ? { ...d, title } : d)), id) },
      { history: true },
    )
  },
  deleteDoc(id: string) {
    const docs = state.docs.filter((d) => d.id !== id)
    setState(
      {
        docs,
        activeId: state.activeId === id ? (docs[0]?.id ?? null) : state.activeId,
        selection: null,
      },
      { history: true },
    )
  },
  setActive(id: string) {
    if (state.activeId === id) return
    setState({ ...state, activeId: id, selection: null })
  },
  setBrief(brief: string) {
    updateActiveDoc((d) => ({ ...d, brief }))
  },
  setPlatform(platform: "android" | "web") {
    updateActiveDoc((d) => ({ ...d, platform }))
  },

  addScreen(name: string, preset: ScreenPreset = "phone"): string | null {
    const s = makeScreen(name.trim() || `Pantalla ${(getActiveDoc()?.screens.length ?? 0) + 1}`, preset)
    let id: string | null = null
    updateActiveDoc((d) => {
      id = s.id
      return { ...d, screens: [...d.screens, s], parts: { ...d.parts, [s.id]: [] } }
    })
    return id
  },
  renameScreen(screenId: string, name: string) {
    updateActiveDoc((d) => ({
      ...d,
      screens: d.screens.map((s) => (s.id === screenId ? { ...s, name } : s)),
    }))
  },
  setPreset(screenId: string, preset: ScreenPreset) {
    updateActiveDoc((d) => ({
      ...d,
      screens: d.screens.map((s) => (s.id === screenId ? { ...s, preset } : s)),
    }))
  },
  setScreenNote(screenId: string, note: string) {
    updateActiveDoc((d) => ({
      ...d,
      screens: d.screens.map((s) => (s.id === screenId ? { ...s, note } : s)),
    }), { history: false })
  },
  deleteScreen(screenId: string) {
    const active = getActiveDoc()
    if (!active || active.screens.length <= 1) return
    const screens = active.screens.filter((s) => s.id !== screenId)
    const parts = { ...active.parts }
    delete parts[screenId]
    for (const list of Object.values(parts)) {
      for (const p of list) {
        if (p.action?.to === screenId) delete p.action
      }
    }
    setState(
      {
        ...state,
        docs: touch(
          state.docs.map((d) => (d.id === active.id ? { ...d, screens, parts } : d)),
          active.id,
        ),
        selection: state.selection?.screenId === screenId ? null : state.selection,
      },
      { history: true },
    )
  },

  addPart(screenId: string, kind: CanvasPartKind, at?: { x: number; y: number }): string | null {
    const active = getActiveDoc()
    const screen = active?.screens.find((s) => s.id === screenId)
    if (!active || !screen) return null
    const { w: sw, h: sh } = screenSizeOf(screen)
    const list = partsOf(active, screenId)
    const p = makePart(kind, sw, at ?? { x: SCREEN_MARGIN, y: SCREEN_MARGIN + list.length * 8 })
    const h = kind === "topAppBar" || kind === "bottomNav" ? (kind === "topAppBar" ? 64 : 80) : 56
    const placed = kind === "bottomNav"
      ? { ...p, x: 0, y: sh - 80 }
      : kind === "topAppBar"
        ? { ...p, x: 0, y: 0 }
        : clampPart(p, sw, sh, h)
    updateActiveDoc((d) => ({ ...d, parts: { ...d.parts, [screenId]: [...partsOf(d, screenId), placed] } }))
    setState({ ...state, selection: { screenId, partId: placed.id } })
    return placed.id
  },
  updatePart(screenId: string, partId: string, patch: Partial<CanvasPart>, opts?: { history?: boolean }) {
    updateActiveDoc((d) => ({
      ...d,
      parts: {
        ...d.parts,
        [screenId]: partsOf(d, screenId).map((p) => (p.id === partId ? { ...p, ...patch, id: p.id, kind: p.kind } : p)),
      },
    }), { history: opts?.history ?? true })
  },
  movePart(screenId: string, partId: string, x: number, y: number, commit: boolean) {
    const active = getActiveDoc()
    const screen = active?.screens.find((s) => s.id === screenId)
    if (!active || !screen) return
    const { w: sw, h: sh } = screenSizeOf(screen)
    const apply = (d: CanvasDoc) => ({
      ...d,
      parts: {
        ...d.parts,
        [screenId]: partsOf(d, screenId).map((p) =>
          p.id === partId ? clampPart({ ...p, x, y }, sw, sh, 56) : p,
        ),
      },
    })
    if (commit) {
      updateActiveDoc(apply)
    } else {
      const next = touch(
        state.docs.map((d) => (d.id === active.id ? apply(d) : d)),
        active.id,
      )
      setState({ ...state, docs: next })
    }
  },
  deletePart(screenId: string, partId: string) {
    updateActiveDoc((d) => ({
      ...d,
      parts: { ...d.parts, [screenId]: partsOf(d, screenId).filter((p) => p.id !== partId) },
    }))
    if (state.selection?.partId === partId) setState({ ...state, selection: null })
  },
  duplicatePart(screenId: string, partId: string) {
    const active = getActiveDoc()
    const orig = partsOf(active!, screenId).find((p) => p.id === partId)
    if (!active || !orig) return
    const copy: CanvasPart = { ...orig, id: uid(), x: orig.x + 16, y: orig.y + 16 }
    updateActiveDoc((d) => ({ ...d, parts: { ...d.parts, [screenId]: [...partsOf(d, screenId), copy] } }))
    setState({ ...state, selection: { screenId, partId: copy.id } })
  },
  reorderPart(screenId: string, partId: string, dir: "front" | "back") {
    updateActiveDoc((d) => {
      const list = partsOf(d, screenId)
      const idx = list.findIndex((p) => p.id === partId)
      if (idx < 0) return d
      const next = [...list]
      const [item] = next.splice(idx, 1)
      if (dir === "front") next.push(item!)
      else next.unshift(item!)
      return { ...d, parts: { ...d.parts, [screenId]: next } }
    })
  },
  tidyScreen(screenId: string) {
    const active = getActiveDoc()
    const screen = active?.screens.find((s) => s.id === screenId)
    if (!active || !screen) return
    const { w: sw, h: sh } = screenSizeOf(screen)
    updateActiveDoc((d) => {
      let y = SCREEN_MARGIN
      const list = partsOf(d, screenId).map((p) => {
        if (p.kind === "topAppBar") return { ...p, x: 0, y: 0, w: sw }
        if (p.kind === "bottomNav") return { ...p, x: 0, y: sh - 80, w: sw }
        if (p.kind === "fab") return { ...p, x: sw - 56 - SCREEN_MARGIN, y: sh - 56 - 96 }
        const h = 56
        const w = Math.min(p.w ?? sw - SCREEN_MARGIN * 2, sw - SCREEN_MARGIN * 2)
        const out = { ...p, x: SCREEN_MARGIN, y, w }
        y += h + SCREEN_MARGIN
        return out
      })
      return { ...d, parts: { ...d.parts, [screenId]: list } }
    })
  },

  select(sel: CanvasSelection) {
    if (JSON.stringify(state.selection) === JSON.stringify(sel)) return
    setState({ ...state, selection: sel })
  },

  undo() {
    const prev = past.pop()
    if (!prev) return
    future.push(snapshot())
    setState({ ...state, docs: prev.docs, activeId: prev.activeId, selection: null })
  },
  redo() {
    const next = future.pop()
    if (!next) return
    past.push(snapshot())
    setState({ ...state, docs: next.docs, activeId: next.activeId, selection: null })
  },
}

export function useCanvasStore(): CanvasState {
  return useSyncExternalStore(canvasStore.subscribe, canvasStore.getSnapshot)
}

export type { CanvasScreen }
