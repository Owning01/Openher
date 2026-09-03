import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { useState } from "react"
import { LedSwitch } from "./LedSwitch"

function Harness({ initial = false }: { initial?: boolean }) {
  const [v, setV] = useState(initial)
  return <LedSwitch label="Bandeja" checked={v} onChange={setV} />
}

describe("LedSwitch", () => {
  it("click alterna y avisa con el nuevo valor", () => {
    const onChange = vi.fn()
    render(<LedSwitch label="Bandeja" checked={false} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText("Bandeja"))
    expect(onChange).toHaveBeenCalledWith(true)
  })
  it("refleja checked en el input", () => {
    const { rerender } = render(<LedSwitch label="B" checked={false} onChange={() => {}} />)
    expect((screen.getByLabelText("B") as HTMLInputElement).checked).toBe(false)
    rerender(<LedSwitch label="B" checked={true} onChange={() => {}} />)
    expect((screen.getByLabelText("B") as HTMLInputElement).checked).toBe(true)
  })
  it("dos instancias no comparten id", () => {
    render(
      <>
        <Harness />
        <Harness initial />
      </>
    )
    const boxes = screen.getAllByLabelText("Bandeja") as HTMLInputElement[]
    expect(boxes).toHaveLength(2)
    expect(boxes[0].id).not.toBe(boxes[1].id)
    expect(boxes[0].checked).toBe(false)
    expect(boxes[1].checked).toBe(true)
  })
})
