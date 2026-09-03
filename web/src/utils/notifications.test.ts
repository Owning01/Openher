import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const mockIsNativePlatform = vi.fn()
const mockCheckPermissions = vi.fn()
const mockRequestPermissions = vi.fn()
const mockSchedule = vi.fn()

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    get isNativePlatform() {
      return mockIsNativePlatform
    },
    isNativePlatform: (...args: any[]) => mockIsNativePlatform(...args),
  },
}))

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    checkPermissions: (...args: any[]) => mockCheckPermissions(...args),
    requestPermissions: (...args: any[]) => mockRequestPermissions(...args),
    schedule: (...args: any[]) => mockSchedule(...args),
  },
}))

import { sendNotification, requestNotificationPermission } from "./notifications"

// helpers for web Notification mock
class MockNotification {
  static permission: NotificationPermission = "default"
  static requestPermission = vi.fn()
  constructor(public title: string, public opts?: any) {
    MockNotification.instances.push(this)
  }
  static instances: MockNotification[] = []
}

function setupWebNotification(permission: NotificationPermission) {
  MockNotification.permission = permission
  MockNotification.instances = []
  MockNotification.requestPermission = vi.fn().mockResolvedValue(permission)
  // @ts-ignore
  globalThis.Notification = MockNotification as any
}

describe("sendNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    MockNotification.instances = []
    // reset Date.now mock not needed
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("native: programa notificación cuando permiso ya concedido", async () => {
    mockIsNativePlatform.mockReturnValue(true)
    mockCheckPermissions.mockResolvedValue({ display: "granted" })
    mockSchedule.mockResolvedValue(undefined)

    sendNotification("Title", "Body", "icon")
    // esperar microtasks
    await vi.waitFor(() => expect(mockSchedule).toHaveBeenCalled())

    expect(mockCheckPermissions).toHaveBeenCalled()
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({ title: "Title", body: "Body" }),
        ]),
      }),
    )
  })

  it("native: solicita permiso si no está granted y luego programa", async () => {
    mockIsNativePlatform.mockReturnValue(true)
    mockCheckPermissions.mockResolvedValue({ display: "prompt" })
    mockRequestPermissions.mockResolvedValue({ display: "granted" })
    mockSchedule.mockResolvedValue(undefined)

    sendNotification("Hello")
    await vi.waitFor(() => expect(mockSchedule).toHaveBeenCalled())

    expect(mockRequestPermissions).toHaveBeenCalled()
    expect(mockSchedule).toHaveBeenCalled()
  })

  it("native: no programa si permiso denegado tras request", async () => {
    mockIsNativePlatform.mockReturnValue(true)
    mockCheckPermissions.mockResolvedValue({ display: "prompt" })
    mockRequestPermissions.mockResolvedValue({ display: "denied" })

    sendNotification("Title")
    await new Promise((r) => setTimeout(r, 50))
    expect(mockSchedule).not.toHaveBeenCalled()
  })

  it("native: incluye smallIcon y iconColor cuando se pasa icon", async () => {
    mockIsNativePlatform.mockReturnValue(true)
    mockCheckPermissions.mockResolvedValue({ display: "granted" })
    mockSchedule.mockResolvedValue(undefined)

    sendNotification("T", "B", "myIcon")
    await vi.waitFor(() => expect(mockSchedule).toHaveBeenCalled())
    const arg = mockSchedule.mock.calls[0][0]
    expect(arg.notifications[0].smallIcon).toBe("myIcon")
    expect(arg.notifications[0].iconColor).toBe("#a1a1aa")
  })

  it("native: no incluye icon si no se pasa", async () => {
    mockIsNativePlatform.mockReturnValue(true)
    mockCheckPermissions.mockResolvedValue({ display: "granted" })
    mockSchedule.mockResolvedValue(undefined)

    sendNotification("T", "B")
    await vi.waitFor(() => expect(mockSchedule).toHaveBeenCalled())
    const arg = mockSchedule.mock.calls[0][0]
    expect(arg.notifications[0].smallIcon).toBeUndefined()
  })

  it("native: silencia errores de schedule", async () => {
    mockIsNativePlatform.mockReturnValue(true)
    mockCheckPermissions.mockResolvedValue({ display: "granted" })
    mockSchedule.mockRejectedValue(new Error("fail"))

    sendNotification("T")
    await new Promise((r) => setTimeout(r, 50))
    // no debe lanzar
    expect(true).toBe(true)
  })

  it("native: silencia errores de checkPermissions", async () => {
    mockIsNativePlatform.mockReturnValue(true)
    mockCheckPermissions.mockRejectedValue(new Error("no support"))

    sendNotification("T")
    await new Promise((r) => setTimeout(r, 50))
    expect(mockSchedule).not.toHaveBeenCalled()
  })

  it("web: crea Notification si permission granted", () => {
    mockIsNativePlatform.mockReturnValue(false)
    setupWebNotification("granted")

    sendNotification("WebTitle", "WebBody", "icon.png")
    expect(MockNotification.instances).toHaveLength(1)
    expect(MockNotification.instances[0].title).toBe("WebTitle")
  })

  it("web: solicita permiso y crea si se concede", async () => {
    mockIsNativePlatform.mockReturnValue(false)
    setupWebNotification("default")
    // requestPermission resolves to granted, but initial permission is default so it will call request
    MockNotification.requestPermission.mockResolvedValue("granted")

    sendNotification("Title")
    // necesita esperar then
    await new Promise((r) => setTimeout(r, 20))
    expect(MockNotification.requestPermission).toHaveBeenCalled()
    await new Promise((r) => setTimeout(r, 20))
    expect(MockNotification.instances).toHaveLength(1)
  })

  it("web: no crea si permission denied", () => {
    mockIsNativePlatform.mockReturnValue(false)
    setupWebNotification("denied")

    sendNotification("Title")
    expect(MockNotification.instances).toHaveLength(0)
    expect(MockNotification.requestPermission).not.toHaveBeenCalled()
  })

  it("web: no crea si requestPermission resulta denied", async () => {
    mockIsNativePlatform.mockReturnValue(false)
    setupWebNotification("default")
    MockNotification.requestPermission.mockResolvedValue("denied")

    sendNotification("Title")
    await new Promise((r) => setTimeout(r, 20))
    expect(MockNotification.instances).toHaveLength(0)
  })

  it("web: retorna sin hacer nada si Notification no existe en window", () => {
    mockIsNativePlatform.mockReturnValue(false)
    // @ts-ignore
    delete (globalThis as any).Notification
    // también window.Notification
    // @ts-ignore
    if (typeof window !== "undefined") delete (window as any).Notification

    expect(() => sendNotification("Title")).not.toThrow()
  })

  it("web: no crea notificación si requestPermission resuelve a denied (manejo sin rechazo)", async () => {
    mockIsNativePlatform.mockReturnValue(false)
    setupWebNotification("default")
    MockNotification.requestPermission.mockResolvedValue("denied" as any)

    sendNotification("Title")
    await new Promise((r) => setTimeout(r, 20))
    expect(MockNotification.instances).toHaveLength(0)
  })

  it("web: sendNotification propaga body e icon correctamente cuando granted", () => {
    mockIsNativePlatform.mockReturnValue(false)
    setupWebNotification("granted")

    sendNotification("T2", "Body2", "icon2.png")
    expect(MockNotification.instances[0].opts).toEqual(expect.objectContaining({ body: "Body2", icon: "icon2.png" }))
  })
})

describe("requestNotificationPermission", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("native: retorna true si ya está granted", async () => {
    mockIsNativePlatform.mockReturnValue(true)
    mockCheckPermissions.mockResolvedValue({ display: "granted" })

    const result = await requestNotificationPermission()
    expect(result).toBe(true)
    expect(mockRequestPermissions).not.toHaveBeenCalled()
  })

  it("native: solicita y retorna true si concede", async () => {
    mockIsNativePlatform.mockReturnValue(true)
    mockCheckPermissions.mockResolvedValue({ display: "prompt" })
    mockRequestPermissions.mockResolvedValue({ display: "granted" })

    const result = await requestNotificationPermission()
    expect(result).toBe(true)
  })

  it("native: retorna false si deniega", async () => {
    mockIsNativePlatform.mockReturnValue(true)
    mockCheckPermissions.mockResolvedValue({ display: "prompt" })
    mockRequestPermissions.mockResolvedValue({ display: "denied" })

    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })

  it("native: retorna false si hay excepción", async () => {
    mockIsNativePlatform.mockReturnValue(true)
    mockCheckPermissions.mockRejectedValue(new Error("fail"))

    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })

  it("web: retorna false si Notification no existe", async () => {
    mockIsNativePlatform.mockReturnValue(false)
    // @ts-ignore
    delete (globalThis as any).Notification
    if (typeof window !== "undefined") delete (window as any).Notification

    const result = await requestNotificationPermission()
    expect(result).toBe(false)
    // restaurar para siguientes tests
    setupWebNotification("default")
  })

  it("web: retorna true si permission ya es granted", async () => {
    mockIsNativePlatform.mockReturnValue(false)
    setupWebNotification("granted")

    const result = await requestNotificationPermission()
    expect(result).toBe(true)
    expect(MockNotification.requestPermission).not.toHaveBeenCalled()
  })

  it("web: retorna false si permission es denied", async () => {
    mockIsNativePlatform.mockReturnValue(false)
    setupWebNotification("denied")

    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })

  it("web: solicita y retorna true si usuario concede", async () => {
    mockIsNativePlatform.mockReturnValue(false)
    setupWebNotification("default")
    MockNotification.requestPermission.mockResolvedValue("granted")

    const result = await requestNotificationPermission()
    expect(result).toBe(true)
    expect(MockNotification.requestPermission).toHaveBeenCalled()
  })

  it("web: solicita y retorna false si usuario deniega", async () => {
    mockIsNativePlatform.mockReturnValue(false)
    setupWebNotification("default")
    MockNotification.requestPermission.mockResolvedValue("denied")

    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })

  it("web: propaga granted/denied correctamente cuando permission default y request retorna default", async () => {
    mockIsNativePlatform.mockReturnValue(false)
    setupWebNotification("default")
    MockNotification.requestPermission.mockResolvedValue("default")

    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })
})
