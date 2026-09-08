import { describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import { DefaultModelPicker } from "./DefaultModelPicker"
import { modelKey } from "../utils/model-utils"

function opt(providerID: string, providerName: string, modelID: string, modelName: string): any {
  return { providerID, providerName, modelID, modelName }
}

const options = [
  opt("anthropic", "Anthropic", "claude-opus", "Claude Opus"),
  opt("anthropic", "Anthropic", "claude-sonnet", "Claude Sonnet"),
  opt("openai", "OpenAI", "gpt-5", "GPT-5"),
]

const base = {
  modelOptions: options,
  selectedModelKey: "anthropic:claude-sonnet",
  onChangeModel: () => {},
  modelKey,
  isBlocked: () => false,
}

describe("DefaultModelPicker", () => {
  it("muestra el modelo actual en el botón", () => {
    const { container } = render(<DefaultModelPicker {...base} />)
    expect(container.querySelector(".dmp-btn-label")?.textContent).toBe("Claude Sonnet (Anthropic)")
  })

  it("agrupa por proveedor con título y sus modelos", () => {
    const { container } = render(<DefaultModelPicker {...base} />)
    fireEvent.click(container.querySelector(".dmp-btn")!)
    const titles = [...container.querySelectorAll(".dmp-group-title")].map((el) => el.textContent)
    expect(titles).toEqual(["Anthropic", "OpenAI"])
    expect(container.querySelectorAll('[role="option"]').length).toBe(3)
  })

  it("el buscador filtra por nombre de modelo y de proveedor", () => {
    const { container } = render(<DefaultModelPicker {...base} />)
    fireEvent.click(container.querySelector(".dmp-btn")!)
    const search = container.querySelector(".dmp-search") as HTMLInputElement
    fireEvent.change(search, { target: { value: "gpt" } })
    expect(container.querySelectorAll('[role="option"]').length).toBe(1)
    expect(container.querySelector(".dmp-group-title")?.textContent).toBe("OpenAI")
    fireEvent.change(search, { target: { value: "anthropic" } })
    expect(container.querySelectorAll('[role="option"]').length).toBe(2)
  })

  it("oculta los modelos bloqueados en Modelos", () => {
    const { container } = render(
      <DefaultModelPicker {...base} isBlocked={(k) => k.startsWith("openai:")} />
    )
    fireEvent.click(container.querySelector(".dmp-btn")!)
    expect(container.querySelectorAll('[role="option"]').length).toBe(2)
    expect(container.textContent).not.toContain("GPT-5")
  })

  it("marca el actual como oculto si se bloqueó después de elegirlo", () => {
    const { container } = render(
      <DefaultModelPicker {...base} isBlocked={(k) => k === "anthropic:claude-sonnet"} />
    )
    // Sigue visible como valor actual (no se pierde la selección), marcado.
    expect(container.querySelector(".dmp-btn-label")?.textContent).toContain("Claude Sonnet")
    fireEvent.click(container.querySelector(".dmp-btn")!)
    // ...pero no aparece en la lista elegible.
    expect(container.querySelectorAll('[role="option"]').length).toBe(2)
  })

  it("elegir un modelo llama onChangeModel y cierra", () => {
    const onChangeModel = vi.fn()
    const { container } = render(<DefaultModelPicker {...base} onChangeModel={onChangeModel} />)
    fireEvent.click(container.querySelector(".dmp-btn")!)
    const gpt = [...container.querySelectorAll('[role="option"]')].find((el) =>
      el.textContent?.includes("GPT-5")
    )!
    fireEvent.click(gpt)
    expect(onChangeModel).toHaveBeenCalledWith("openai:gpt-5")
    expect(container.querySelector(".dmp-pop")).toBeNull()
  })

  it("Escape cierra el desplegable", () => {
    const { container } = render(<DefaultModelPicker {...base} />)
    fireEvent.click(container.querySelector(".dmp-btn")!)
    expect(container.querySelector(".dmp-pop")).not.toBeNull()
    fireEvent.keyDown(container.querySelector(".dmp-wrap")!, { key: "Escape" })
    expect(container.querySelector(".dmp-pop")).toBeNull()
  })
})
