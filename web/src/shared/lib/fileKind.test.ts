import { describe, it, expect } from "vitest"
import { isExecScript } from "./fileKind"

describe("isExecScript", () => {
  it("reconoce scripts y ejecutables por extensión", () => {
    for (const p of ["run.bat", "run.cmd", "run.vbs", "run.ps1", "run.exe", "run.sh"]) {
      expect(isExecScript(p)).toBe(true)
    }
  })

  it("no marca otros archivos ni rutas vacías", () => {
    expect(isExecScript("notas.txt")).toBe(false)
    expect(isExecScript("script.js")).toBe(false)
    expect(isExecScript()).toBe(false)
    expect(isExecScript("")).toBe(false)
    expect(isExecScript(null)).toBe(false)
  })

  it("ignora mayúsculas y usa el último segmento de la ruta", () => {
    expect(isExecScript("C:\\tools\\BUILD.PS1")).toBe(true)
    expect(isExecScript("/home/u/deploy.SH")).toBe(true)
  })
})
