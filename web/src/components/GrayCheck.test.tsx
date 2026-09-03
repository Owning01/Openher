import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { GrayCheck } from "./GrayCheck"

describe("GrayCheck", () => {
  it("click alterna y avisa con el nuevo valor", () => {
    const onChange = vi.fn()
    render(<GrayCheck label="Noche" checked={false} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText("Noche"))
    expect(onChange).toHaveBeenCalledWith(true)
  })
  it("refleja checked en el input", () => {
    const { rerender } = render(<GrayCheck label="N" checked={false} onChange={() => {}} />)
    expect((screen.getByLabelText("N") as HTMLInputElement).checked).toBe(false)
    rerender(<GrayCheck label="N" checked={true} onChange={() => {}} />)
    expect((screen.getByLabelText("N") as HTMLInputElement).checked).toBe(true)
  })
  it("dibuja el círculo gris, no el checkbox nativo", () => {
    render(<GrayCheck label="N" checked={true} onChange={() => {}} />)
    expect(document.querySelector(".graycheck-mark")).toBeInTheDocument()
    expect(document.querySelector(".switch-checkbox")).toBeNull()
  })
})
