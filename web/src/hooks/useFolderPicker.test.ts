import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { dirParent, dirParts, partsToDir, toAbsolute, isAbsoluteDir, useFolderPicker } from "./useFolderPicker"
import { api } from "../api"
import { STORAGE_KEYS } from "../constants"

vi.mock("../api", () => ({
  api: { listFiles: vi.fn(), loadPath: vi.fn() },
}))

describe("dirParent", () => {
  it("raíces devuelven null", () => {
    expect(dirParent("")).toBeNull()
    expect(dirParent("/")).toBeNull()
    expect(dirParent("C:\\")).toBeNull()
    expect(dirParent("C:/")).toBeNull()
    expect(dirParent("D:")).toBeNull()
  })
  it("rutas relativas sin raíz devuelven null", () => {
    expect(dirParent("proyectos")).toBeNull()
    expect(dirParent("a/b")).toBeNull()
  })
  it("windows sube un nivel con backslashes", () => {
    expect(dirParent("C:\\a\\b")).toBe("C:\\a")
    expect(dirParent("C:\\a")).toBe("C:\\")
    expect(dirParent("C:\\a\\b\\")).toBe("C:\\a")
  })
  it("unix sube un nivel", () => {
    expect(dirParent("/a/b")).toBe("/a")
    expect(dirParent("/a")).toBe("/")
    expect(dirParent("/a/b/")).toBe("/a")
  })
})

describe("dirParts", () => {
  it("vacío y raíz", () => {
    expect(dirParts("")).toEqual([])
    expect(dirParts("/")).toEqual(["/"])
  })
  it("windows separa unidad y segmentos", () => {
    expect(dirParts("C:\\")).toEqual(["C:"])
    expect(dirParts("C:\\a\\b")).toEqual(["C:", "a", "b"])
    expect(dirParts("C:/a/b/")).toEqual(["C:", "a", "b"])
  })
  it("unix ignora trailing slashes", () => {
    expect(dirParts("/a/b/")).toEqual(["a", "b"])
  })
})

describe("partsToDir", () => {
  it("casos base", () => {
    expect(partsToDir([])).toBe("")
    expect(partsToDir(["/"])).toBe("/")
  })
  it("reconstruye unidad windows", () => {
    expect(partsToDir(["C:"])).toBe("C:\\")
    expect(partsToDir(["C:", "a", "b"])).toBe("C:\\a\\b")
  })
  it("reconstruye unix", () => {
    expect(partsToDir(["a", "b"])).toBe("/a/b")
  })
  it("roundtrip con dirParts", () => {
    expect(partsToDir(dirParts("C:\\a\\b"))).toBe("C:\\a\\b")
    expect(partsToDir(dirParts("/a/b"))).toBe("/a/b")
  })
})

// Regresión del 500 en consola: el dir guardado (proyecto borrado,
// p.ej. G:\Proyectos\elder-plinius) hacía /fs/list → 500 y el picker quedaba
// en error. Ahora cae al home y limpia la preferencia muerta.
describe("useFolderPicker: dir guardado que ya no existe", () => {
  const config = { host: "127.0.0.1", port: 4098 } as never

  function httpError(status: number): Error {
    const e = new Error(`HTTP ${status}`) as Error & { cause?: unknown }
    e.cause = { status }
    return e
  }

  function homeInfo(dir: string) {
    return { home: dir, state: dir, config: dir, worktree: dir, directory: dir }
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it("si el guardado responde 500, cae al home y limpia la preferencia", async () => {
    localStorage.setItem(STORAGE_KEYS.CURSOR, JSON.stringify("G:\\Proyectos\\elder-plinius"))
    vi.mocked(api.listFiles).mockRejectedValueOnce(httpError(500)).mockResolvedValueOnce([])
    vi.mocked(api.loadPath).mockResolvedValue(homeInfo("C:\\Users\\perca"))

    const { result } = renderHook(() => useFolderPicker(config))
    await act(async () => { await result.current.openNewSessionPicker() })

    expect(api.listFiles).toHaveBeenNthCalledWith(1, config, "", "G:\\Proyectos\\elder-plinius")
    expect(api.loadPath).toHaveBeenCalledTimes(1)
    expect(api.listFiles).toHaveBeenNthCalledWith(2, config, "", "C:\\Users\\perca")
    expect(result.current.pickerDir).toBe("C:\\Users\\perca")
    expect(result.current.pickerError).toBeNull()
    expect(result.current.newSessionDirectory).toBe("")
  })

  it("un fallo de red (sin status) conserva la preferencia", async () => {
    localStorage.setItem(STORAGE_KEYS.CURSOR, JSON.stringify("G:\\dead"))
    vi.mocked(api.listFiles).mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce([])
    vi.mocked(api.loadPath).mockResolvedValue(homeInfo("C:\\Users\\perca"))

    const { result } = renderHook(() => useFolderPicker(config))
    await act(async () => { await result.current.openNewSessionPicker() })

    expect(result.current.newSessionDirectory).toBe("G:\\dead")
    expect(result.current.pickerDir).toBe("C:\\Users\\perca")
  })

  it("si el guardado funciona, no pide el home", async () => {
    localStorage.setItem(STORAGE_KEYS.CURSOR, JSON.stringify("G:\\ok"))
    vi.mocked(api.listFiles).mockResolvedValue([])

    const { result } = renderHook(() => useFolderPicker(config))
    await act(async () => { await result.current.openNewSessionPicker() })

    expect(api.loadPath).not.toHaveBeenCalled()
    expect(result.current.pickerDir).toBe("G:\\ok")
    expect(result.current.newSessionDirectory).toBe("G:\\ok")
  })

  it("un cursor relativo (bug v2) se descarta y cae al home", async () => {
    localStorage.setItem(STORAGE_KEYS.CURSOR, JSON.stringify(".config"))
    vi.mocked(api.listFiles).mockResolvedValue([])
    vi.mocked(api.loadPath).mockResolvedValue(homeInfo("C:\\Users\\perca"))

    const { result } = renderHook(() => useFolderPicker(config))
    await act(async () => { await result.current.openNewSessionPicker() })

    expect(api.listFiles).toHaveBeenCalledTimes(1)
    expect(api.listFiles).toHaveBeenCalledWith(config, "", "C:\\Users\\perca")
    expect(result.current.newSessionDirectory).toBe("")
    expect(result.current.pickerDir).toBe("C:\\Users\\perca")
  })
})

describe("isAbsoluteDir", () => {
  it("detecta Windows, Unix y UNC; rechaza relativos", () => {
    expect(isAbsoluteDir("C:\\a")).toBe(true)
    expect(isAbsoluteDir("D:/x")).toBe(true)
    expect(isAbsoluteDir("/a/b")).toBe(true)
    expect(isAbsoluteDir("\\\\server\\share")).toBe(true)
    expect(isAbsoluteDir(".config")).toBe(false)
    expect(isAbsoluteDir("sub/dir")).toBe(false)
    expect(isAbsoluteDir("")).toBe(false)
  })
})

describe("toAbsolute", () => {
  it("manual vacío conserva el dir", () => {
    expect(toAbsolute("C:\\a", "  ")).toBe("C:\\a")
  })
  it("acepta unidad sola y rutas absolutas windows", () => {
    expect(toAbsolute("C:\\a", "D:")).toBe("D:\\")
    expect(toAbsolute("C:\\a", "D:\\x\\y")).toBe("D:\\x\\y")
    expect(toAbsolute("C:\\a", "D:/x/y")).toBe("D:\\x\\y")
  })
  it("acepta absolutas unix", () => {
    expect(toAbsolute("/a/b", "/x/y")).toBe("/x/y")
  })
  it("resuelve relativas contra el dir (windows y unix)", () => {
    expect(toAbsolute("C:\\a", "sub")).toBe("C:\\a\\sub")
    expect(toAbsolute("/a/b", "sub")).toBe("/a/b/sub")
  })
  it("resuelve .. client-side (el server los rechaza con 500)", () => {
    expect(toAbsolute("/a/b", "..")).toBe("/a")
    expect(toAbsolute("C:\\a\\b", "..")).toBe("C:\\a")
    expect(toAbsolute("/a/b", "sub/../c")).toBe("/a/b/c")
    expect(toAbsolute("/a/b", ".")).toBe("/a/b")
  })
  it(".. nunca escapa de la unidad ni de la raíz", () => {
    expect(toAbsolute("C:\\a", "..\\..\\..")).toBe("C:\\")
    expect(toAbsolute("/a", "../../..")).toBe("/")
  })
})
