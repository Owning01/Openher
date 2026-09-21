import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, renderHook, act, cleanup } from "@testing-library/react"
import { SessionChatPanel } from "./SessionChatPanel"
import { useChatActions } from "../features/chat/hooks/useChatActions"
import * as outboxStore from "../stores/outboxStore"

// Q2 — Parity tests del chat (F4 / C3).
//
// Fijan, con la MISMA tabla de casos, lo que hacen los DOS caminos del chat:
//   - movil: `useChatActions`
//   - desktop: `SessionChatPanel`
// Los casos "parity:" deben estar verdes ANTES y DESPUES de la unificacion.
// Los casos "divergencia:" caracterizan cada diferencia real que hoy existe
// para que C3 no la cambie en silencio. No se edita ningun assert existente.

const H = vi.hoisted(() => ({
  desktop: null as never,
  dismissSessionQuestions: vi.fn(),
  translateToEnglish: vi.fn(async (t: string) => `T(${t})`),
}))

vi.mock("./ChatView", () => ({
  ChatView: (p: unknown) => {
    H.desktop = p
    return null
  },
}))
vi.mock("../hooks/useSSE", () => ({ useSSE: () => ({ streamState: "idle", reconnect: vi.fn() }) }))
vi.mock("../hooks/useSSEHandler", () => ({ useSSEHandler: () => () => {} }))
vi.mock("../hooks/useQuestions", () => ({
  useQuestions: () => ({
    pendingQuestions: [],
    permissionRequest: null,
    handleQuestionReply: vi.fn(),
    handleQuestionReject: vi.fn(),
    handleDismissQuestion: vi.fn(),
    clearDismissedQuestions: vi.fn(),
    dismissSessionQuestions: H.dismissSessionQuestions,
    handlePermissionApprove: vi.fn(),
    handlePermissionReject: vi.fn(),
    handleDismissPermission: vi.fn(),
  }),
}))
vi.mock("../hooks/useOfflineCache", () => ({
  useOfflineCache: () => ({ getCachedMessages: vi.fn(async () => []), cacheMessages: vi.fn(async () => {}) }),
}))
vi.mock("../hooks/usePolling", () => ({
  usePolling: () => ({ pause: vi.fn(), resume: vi.fn(), fail: vi.fn(), succeed: vi.fn() }),
}))
vi.mock("../api", () => ({
  api: {
    abort: vi.fn(async () => {}),
    revert: vi.fn(async () => {}),
    unrevert: vi.fn(async () => {}),
    listStatuses: vi.fn(async () => ({})),
    sendShell: vi.fn(async () => {}),
    summarize: vi.fn(async () => true),
    loadMessages: vi.fn(async () => []),
  },
}))
vi.mock("../utils/promptHistory", () => ({ openPromptHistory: vi.fn() }))
vi.mock("../utils/translate", () => ({ translateToEnglish: H.translateToEnglish }))
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }))
vi.mock("@capacitor/filesystem", () => ({ Filesystem: { writeFile: vi.fn() }, Directory: { Cache: "CACHE" } }))
vi.mock("@capacitor/share", () => ({ Share: { share: vi.fn() } }))
vi.mock("./shellPanels", () => ({ isAbsoluteFsPath: (p: string) => /^([a-zA-Z]:[\\/]|\/)/.test(p) }))
vi.mock("../features/debate/DebateRoom", () => ({ DebateRoom: () => null }))
vi.mock("../features/debate/debateStore", () => ({ DEBATE_OPEN_EVENT: "debate:open" }))

// La cola compartida es real (store); el hook `useMessages` se inyecta por test.
vi.mock("../hooks/useMessages", async () => {
  const o = await import("../stores/outboxStore")
  return {
    useMessages: vi.fn(),
    claimSharedOutbox: vi.fn(o.claimSharedOutbox),
    releaseSharedOutbox: vi.fn(o.releaseSharedOutbox),
    holdSharedOutbox: vi.fn(o.holdSharedOutbox),
    resumeSharedOutbox: vi.fn(o.resumeSharedOutbox),
    isSharedOutboxHeld: vi.fn(o.isSharedOutboxHeld),
    enqueueSharedOutbox: o.enqueueSharedOutbox,
    removeSharedOutbox: o.removeSharedOutbox,
    buildOutboxMessage: o.buildOutboxMessage,
  }
})

import { api } from "../api"
import { useMessages, holdSharedOutbox, claimSharedOutbox, resumeSharedOutbox } from "../hooks/useMessages"
import { openPromptHistory } from "../utils/promptHistory"

const cfg = { host: "h", port: 1, username: "u", password: "p" } as never
const SID = "s1"
const DIR = "/dir"
const newSession = () => ({ id: SID, directory: DIR, title: "T", status: "idle", revert: undefined, updated: 0 }) as never

const msg = (id: string, role: "user" | "assistant", text: string, completed = 1) => ({
  info: { id, role, sessionID: SID, time: { created: Number(id.replace(/\D/g, "")) || 1, completed } },
  parts: [{ id: `p-${id}`, type: "text", text }],
  text,
})

type Bag = Record<string, unknown>
type Updater = unknown[] | ((prev: unknown[]) => unknown[])

function makeDesktopMsgs(over: Bag = {}) {
  let current: unknown[] = (over.messages as unknown[] | undefined) ?? []
  const setMessages = vi.fn((u: Updater) => {
    current = typeof u === "function" ? u(current) : u
  })
  return {
    messages: over.messages ?? [],
    setMessages,
    getMessages: () => current,
    renderedMessages: over.renderedMessages ?? [],
    pendingIndex: undefined,
    messageScrollSignature: "",
    composer: "",
    setComposer: vi.fn(),
    isSending: false,
    awaitingAssistantReply: false,
    setAwaitingAssistantReply: vi.fn(),
    runtimeError: null,
    setRuntimeError: vi.fn(),
    compacting: false,
    setCompacting: vi.fn(),
    outbox: over.outbox ?? [],
    enqueueOutbox: vi.fn(),
    removeOutbox: vi.fn(),
    loadSelected: vi.fn(async () => {}),
    preloadMessages: vi.fn(),
    clearSession: vi.fn(),
    send: vi.fn(async () => true),
    abortSession: vi.fn(async () => {}),
    undoMessage: vi.fn(),
    redoMessage: vi.fn(),
    compactSession: vi.fn(async () => {}),
    completionShouldPlayRef: { current: false },
    getAwaitingBaselineID: () => "",
    applyDelta: vi.fn(),
    applyPart: vi.fn(),
    ...(over.overrides ?? {}),
  } as never
}

function desktopDriver(over: Bag = {}) {
  const msgs = over.msgs ?? makeDesktopMsgs()
  vi.mocked(useMessages).mockReturnValue(msgs as never)
  const session = newSession()
  const props = {
    session,
    config: cfg,
    dataMode: "full",
    baseProps: {
      flags: { offlineCache: false },
      getModelForSession: () => null,
      activeModelOption: { providerID: "p", modelID: "m" },
      activeModelVariants: [],
      selectedVariant: null,
      activeAgentID: "agent",
      commands: [],
      onChangeVariant: vi.fn(),
      onOpenNewSession: vi.fn(),
    },
    active: true,
    connectionState: "online",
    panelIndex: 0,
    onActivate: vi.fn(),
    onClose: vi.fn(),
    onSplitSession: vi.fn(),
    onSettled: vi.fn(),
    onRefreshSessions: vi.fn(),
    onSetCommands: vi.fn(),
    onQueueAction: vi.fn(),
    onShellExecute: vi.fn(),
    onChangeAgentGlobal: vi.fn(),
    onOpenInThisPanel: vi.fn(),
    onSwapPanels: vi.fn(),
    onOpenConnect: vi.fn(),
    visualPromptContext: over.visualPromptContext,
    onClearVisualSelection: vi.fn(),
  }
  const view = render(<SessionChatPanel {...props} />)
  return { msgs, props, session, view, actions: () => H.desktop }
}

function makeMobileParams(over: Bag = {}) {
  let current: unknown[] = (over.messages as unknown[] | undefined) ?? []
  const setMessages = vi.fn((u: Updater) => {
    current = typeof u === "function" ? u(current) : u
  })
  const spies = {
    setComposer: vi.fn(),
    enqueueOutbox: vi.fn(),
    removeOutbox: vi.fn(),
    send: vi.fn(async () => true),
    abortSession: vi.fn(async () => {}),
    settleSession: vi.fn(async () => {}),
    undoMessage: vi.fn(),
    redoMessage: vi.fn(),
    compactSession: vi.fn(async () => {}),
    setSessions: vi.fn(),
    refreshSessions: vi.fn(async () => {}),
    loadSelected: vi.fn(async () => {}),
    queueAction: vi.fn(),
    setRuntimeError: vi.fn(),
    setAwaitingAssistantReply: vi.fn(),
    navigate: vi.fn(),
    setHelpPage: vi.fn(),
    setShowThemePicker: vi.fn(),
    setShowConnectSheet: vi.fn(),
    onNewSession: vi.fn(),
    setLocalRevertID: vi.fn(),
    setCommands: vi.fn(),
    setCompacting: vi.fn(),
    dismissSessionQuestions: vi.fn(),
  }
  const session = newSession()
  const vs = { hasSelection: false, promptContext: "", clear: vi.fn(), clearAnnotations: vi.fn() }
  const completionShouldPlayRef = { current: false }
  const params: Bag = {
    selectedSession: session,
    config: cfg,
    connectionState: "online",
    activeModel: { providerID: "p", modelID: "m", variant: undefined },
    activeAgentID: "agent",
    commands: [],
    composerRef: { current: "" },
    setComposer: spies.setComposer,
    setRuntimeError: spies.setRuntimeError,
    queueAction: spies.queueAction,
    stopGenerationRef: { current: false },
    localRevertID: null,
    setLocalRevertID: spies.setLocalRevertID,
    setMessages,
    setSessions: spies.setSessions,
    send: spies.send,
    refreshSessions: spies.refreshSessions,
    loadSelected: spies.loadSelected,
    setCommands: spies.setCommands,
    vs,
    navigate: spies.navigate,
    setHelpPage: spies.setHelpPage,
    setShowThemePicker: spies.setShowThemePicker,
    setShowConnectSheet: spies.setShowConnectSheet,
    onNewSession: spies.onNewSession,
    renderedMessages: over.renderedMessages ?? [],
    awaitingAssistantReply: over.awaiting ?? false,
    setAwaitingAssistantReply: spies.setAwaitingAssistantReply,
    outbox: over.outbox ?? [],
    enqueueOutbox: spies.enqueueOutbox,
    removeOutbox: spies.removeOutbox,
    completionShouldPlayRef,
    abortSession: spies.abortSession,
    settleSession: spies.settleSession,
    undoMessage: spies.undoMessage,
    redoMessage: spies.redoMessage,
    compactSession: spies.compactSession,
    setCompacting: spies.setCompacting,
    dismissSessionQuestions: spies.dismissSessionQuestions,
  }
  const view = renderHook((p: Bag) => useChatActions(p as never), { initialProps: params })
  return {
    spies: { ...spies, setMessages },
    params,
    session,
    vs,
    completionShouldPlayRef,
    getMessages: () => current,
    rerenderWith(extra: Bag) {
      Object.assign(params, extra)
      view.rerender(params)
    },
    result: view.result,
  }
}

beforeEach(() => {
  for (const item of outboxStore.getSharedOutbox()) outboxStore.removeSharedOutbox(item.id)
  outboxStore.resumeSharedOutbox(SID)
  vi.clearAllMocks()
  H.translateToEnglish.mockImplementation(async (t: string) => `T(${t})`)
})

afterEach(() => {
  cleanup()
  for (const item of outboxStore.getSharedOutbox()) outboxStore.removeSharedOutbox(item.id)
  outboxStore.resumeSharedOutbox(SID)
})

describe("Q2 — parity envio", () => {
  it("parity: con la sesion ocupada, ambos encolan en la cola visible y limpian el composer", async () => {
    const dm = makeDesktopMsgs()
    dm.awaitingAssistantReply = true
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams({ awaiting: true })

    await act(async () => { await d.actions().onSend(undefined, undefined, "hola") })
    await act(async () => { await m.result.current.handleSend(undefined, undefined, "hola") })

    expect(dm.enqueueOutbox).toHaveBeenCalledWith(SID, "hola", undefined)
    expect(m.spies.enqueueOutbox).toHaveBeenCalledWith(SID, "hola", undefined)
    expect(dm.setComposer).toHaveBeenCalledWith("")
    expect(m.spies.setComposer).toHaveBeenCalledWith("")
  })

  it("parity: en sesion libre, ambos reenvian texto e imagenes a send()", async () => {
    const dm = makeDesktopMsgs()
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams()
    const images = [{ base64: "aGk=", mime: "image/png" }]

    await act(async () => { await d.actions().onSend(images, undefined, "hola") })
    await act(async () => { await m.result.current.handleSend(images, undefined, "hola") })

    expect(dm.send).toHaveBeenCalled()
    expect(m.spies.send).toHaveBeenCalled()
    expect(dm.send.mock.calls[0][8]).toEqual(images)
    expect(m.spies.send.mock.calls[0][8]).toEqual(images)
    expect(dm.send.mock.calls[0][9]).toBe("hola")
    expect(m.spies.send.mock.calls[0][9]).toBe("hola")
  })

  it("parity: el envio manual reanuda la cola en hold (resumeSharedOutbox)", async () => {
    outboxStore.holdSharedOutbox(SID)
    const dm = makeDesktopMsgs()
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams()

    await act(async () => { await d.actions().onSend(undefined, undefined, "hola") })
    await act(async () => { await m.result.current.handleSend(undefined, undefined, "hola") })

    expect(resumeSharedOutbox).toHaveBeenCalledWith(SID)
    expect(outboxStore.isSharedOutboxHeld(SID)).toBe(false)
  })
})

describe("Q2 — parity stop", () => {
  it("parity: el Stop deja la cola en hold, aborta el server y apaga el awaiting", async () => {
    const dm = makeDesktopMsgs()
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams()

    await act(async () => { await d.actions().onAbort() })
    await act(async () => { await m.result.current.handleAbort() })

    expect(holdSharedOutbox).toHaveBeenCalledWith(SID)
    expect(dm.abortSession).toHaveBeenCalledWith(SID, DIR)
    expect(m.spies.abortSession).toHaveBeenCalledWith(SID, DIR)
    expect(dm.setAwaitingAssistantReply).toHaveBeenCalledWith(false)
    expect(m.spies.setAwaitingAssistantReply).toHaveBeenCalledWith(false)
    expect(H.dismissSessionQuestions).toHaveBeenCalledWith(SID)
    expect(m.spies.dismissSessionQuestions).toHaveBeenCalledWith(SID)
  })
})

describe("Q2 — parity revert / edit", () => {
  it("parity: revert llama api.revert y recarga la sesion en ambos caminos", async () => {
    const msgs = [msg("u1", "user", "uno"), msg("a1", "assistant", "r1"), msg("u2", "user", "dos"), msg("a2", "assistant", "r2")]
    const dm = makeDesktopMsgs({ messages: msgs, renderedMessages: msgs })
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams({ messages: msgs, renderedMessages: msgs })

    await act(async () => { await d.actions().onRevertToMessage("u2") })
    await act(async () => { await m.result.current.handleRevertToMessage("u2") })

    expect(api.revert).toHaveBeenCalledWith(cfg, SID, "u2", DIR)
    expect(dm.loadSelected).toHaveBeenCalledWith(SID, DIR)
    expect(m.spies.loadSelected).toHaveBeenCalledWith(SID, DIR)
    expect(dm.setComposer).toHaveBeenCalledWith("dos")
    expect(m.spies.setComposer).toHaveBeenCalledWith("dos")
  })

  it("parity: edit revierte y pone el texto en el composer en ambos caminos", async () => {
    const msgs = [msg("u1", "user", "uno"), msg("a1", "assistant", "r1"), msg("u2", "user", "dos")]
    const dm = makeDesktopMsgs({ messages: msgs, renderedMessages: msgs })
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams({ messages: msgs, renderedMessages: msgs })

    await act(async () => { await d.actions().onEditMessage("u1", "editado") })
    await act(async () => { await m.result.current.handleEditMessage("u1", "editado") })

    expect(api.revert).toHaveBeenCalledWith(cfg, SID, "u1", DIR)
    expect(dm.setComposer).toHaveBeenCalledWith("editado")
    expect(m.spies.setComposer).toHaveBeenCalledWith("editado")
  })
})

describe("Q2 — parity undo / redo", () => {
  it("parity: undo delega en undoMessage con el borde de revert de la sesion", async () => {
    const dm = makeDesktopMsgs()
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams()

    act(() => { d.actions().onUndo() })
    act(() => { m.result.current.handleUndo() })

    expect(dm.undoMessage).toHaveBeenCalled()
    expect(m.spies.undoMessage).toHaveBeenCalled()
    expect(dm.undoMessage.mock.calls[0][0]).toBe(SID)
    expect(m.spies.undoMessage.mock.calls[0][0]).toBe(SID)
    expect(dm.undoMessage.mock.calls[0][1]).toBe(DIR)
    expect(m.spies.undoMessage.mock.calls[0][1]).toBe(DIR)
  })

  it("parity: redo delega en redoMessage con el borde de revert de la sesion", async () => {
    const dm = makeDesktopMsgs()
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams()

    act(() => { d.actions().onRedo() })
    act(() => { m.result.current.handleRedo() })

    expect(dm.redoMessage.mock.calls[0][0]).toBe(SID)
    expect(m.spies.redoMessage.mock.calls[0][0]).toBe(SID)
    expect(dm.redoMessage.mock.calls[0][1]).toBe(DIR)
    expect(m.spies.redoMessage.mock.calls[0][1]).toBe(DIR)
  })
})

describe("Q2 — cola visible (claim / hold / cooldown)", () => {
  it("parity: Enviar-ahora reclama, saca de la cola, reanuda el hold y fuerza el envio", async () => {
    // Items separados: removeOutbox es un espia, no borra el item real del store,
    // y el claim del primer camino dejaria al segundo sin nada que reclamar.
    const itemD = outboxStore.enqueueSharedOutbox(SID, "pendiente-desktop", undefined)
    const dm = makeDesktopMsgs({ outbox: [itemD] })
    const d = desktopDriver({ msgs: dm })
    await act(async () => { await d.actions().outboxActions[itemD.id].onSendNow() })
    expect(claimSharedOutbox).toHaveBeenCalledWith(itemD.id)
    expect(dm.removeOutbox).toHaveBeenCalledWith(itemD.id)
    expect(dm.send.mock.calls[0][9]).toBe("pendiente-desktop")
    expect(dm.enqueueOutbox).not.toHaveBeenCalled()
    outboxStore.releaseSharedOutbox(itemD.id)

    const itemM = outboxStore.enqueueSharedOutbox(SID, "pendiente-movil", undefined)
    const m = makeMobileParams({ outbox: [itemM] })
    await act(async () => { await m.result.current.outboxActions[itemM.id].onSendNow() })
    expect(claimSharedOutbox).toHaveBeenCalledWith(itemM.id)
    expect(m.spies.removeOutbox).toHaveBeenCalledWith(itemM.id)
    expect(m.spies.send.mock.calls[0][9]).toBe("pendiente-movil")
    // force=true => el item no se re-encola cuando sale bien
    expect(m.spies.enqueueOutbox).not.toHaveBeenCalled()
  })

  it("parity: editar un pendiente lo saca de la cola y lo pone en el composer", () => {
    const item = outboxStore.enqueueSharedOutbox(SID, "pendiente", undefined)
    const dm = makeDesktopMsgs({ outbox: [item] })
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams({ outbox: [item] })

    act(() => { d.actions().outboxActions[item.id].onEdit() })
    act(() => { m.result.current.outboxActions[item.id].onEdit() })

    expect(dm.setComposer).toHaveBeenCalledWith("pendiente")
    expect(m.spies.setComposer).toHaveBeenCalledWith("pendiente")
    expect(dm.removeOutbox).toHaveBeenCalledWith(item.id)
    expect(m.spies.removeOutbox).toHaveBeenCalledWith(item.id)
  })
})

describe("Q2 — divergencias caracterizadas (no cambian en C3)", () => {
  it("divergencia: el revert del desktop poda en optimista; el movil solo recarga", async () => {
    const msgs = [msg("u1", "user", "uno"), msg("a1", "assistant", "r1"), msg("u2", "user", "dos"), msg("a2", "assistant", "r2")]
    const dm = makeDesktopMsgs({ messages: msgs, renderedMessages: msgs })
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams({ messages: msgs, renderedMessages: msgs })

    await act(async () => { await d.actions().onRevertToMessage("u2") })
    await act(async () => { await m.result.current.handleRevertToMessage("u2") })

    expect(dm.setMessages).toHaveBeenCalled()
    expect(dm.getMessages().map((x: { info: { id: string } }) => x.info.id)).toEqual(["u1", "a1", "u2"])
    expect(m.spies.setMessages).not.toHaveBeenCalled()
  })

  it("divergencia: el movil marca la sesion busy en optimista y guarda idle si el envio falla", async () => {
    const dm = makeDesktopMsgs()
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams()
    m.spies.send.mockResolvedValue(false)

    await act(async () => { await d.actions().onSend(undefined, undefined, "hola") })
    await act(async () => { await m.result.current.handleSend(undefined, undefined, "hola") })

    const applied = m.spies.setSessions.mock.calls.map((c: unknown[]) => (c[0] as (prev: unknown[]) => unknown[])([{ id: SID, status: "idle" }]))
    expect(applied.some((s: { status?: string }[]) => s[0].status === "busy")).toBe(true)
    expect(applied.some((s: { status?: string }[]) => s[0].status === "idle")).toBe(true)
  })

  it("divergencia: solo el movil pasa setLocalRevertID como 11er argumento de send", async () => {
    const dm = makeDesktopMsgs()
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams()

    await act(async () => { await d.actions().onSend(undefined, undefined, "hola") })
    await act(async () => { await m.result.current.handleSend(undefined, undefined, "hola") })

    expect(dm.send.mock.calls[0][10]).toBeUndefined()
    expect(m.spies.send.mock.calls[0][10]).toBe(m.spies.setLocalRevertID)
  })

  it("divergencia: el orden visual/traduccion difiere (desktop formatea y traduce; movil traduce y formatea)", async () => {
    const dm = makeDesktopMsgs()
    const d = desktopDriver({ msgs: dm, visualPromptContext: "CTX" })
    const m = makeMobileParams()
    m.vs.hasSelection = true
    m.vs.promptContext = "CTX"
    m.rerenderWith({ vs: m.vs })

    await act(async () => { await d.actions().onSend(undefined, { translate: true }, "hola") })
    await act(async () => { await m.result.current.handleSend(undefined, { translate: true }, "hola") })

    expect(dm.send.mock.calls[0][9]).toBe("T(hola\n\nCTX)")
    expect(m.spies.send.mock.calls[0][9]).toBe("T(hola)\n\nCTX")
  })

  it("divergencia: solo el movil marca completionShouldPlayRef al compactar", async () => {
    const dm = makeDesktopMsgs()
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams()

    await act(async () => { await d.actions().onCompact() })
    await act(async () => { await m.result.current.handleCompact() })

    expect(dm.compactSession).toHaveBeenCalled()
    expect(m.spies.compactSession).toHaveBeenCalled()
    expect(dm.completionShouldPlayRef.current).toBe(false)
    expect(m.completionShouldPlayRef.current).toBe(true)
  })

  it("divergencia: solo el movil parchea session.revert en undo/redo", () => {
    const dm = makeDesktopMsgs()
    const d = desktopDriver({ msgs: dm })
    const m = makeMobileParams()

    act(() => { d.actions().onUndo() })
    act(() => { m.result.current.handleUndo() })

    expect(dm.undoMessage.mock.calls[0][5]).toBeUndefined()
    expect(typeof m.spies.undoMessage.mock.calls[0][5]).toBe("function")
  })

  it("caracteriza: el desktop publica comandos locales via openPromptHistory/onOpenNewSession/onOpenConnect", async () => {
    const dm = makeDesktopMsgs()
    dm.send.mockResolvedValue("history")
    const d = desktopDriver({ msgs: dm })
    await act(async () => { await d.actions().onSend(undefined, undefined, "cmd") })
    expect(openPromptHistory).toHaveBeenCalled()
  })
})
