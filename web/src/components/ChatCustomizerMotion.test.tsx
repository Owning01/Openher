import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { ChatCustomizer } from "./ChatCustomizer"
import type { ChatSettings } from "../types"

const base: ChatSettings = {
  fontSize: 14,
  messageSpacing: "normal",
  showThinking: true,
  thinkingDefault: "auto",
  showToolCalls: true,
  showTimestamps: true,
  showTodoButton: true,
  showModelInfo: true,
  showDiffs: true,
  showSubagentHint: true,
  showCompactionCheckpoint: true,
  showImages: true,
  bubbleRadius: 12,
  messageMaxWidth: "full",
  fontFamily: "system",
  compactTools: false,
  minimalistMode: false,
  completionSound: true,
  composerCharLimit: 0,
  desktopGutter: 12,
  reduceMotion: false,
}

afterEach(() => {
  cleanup()
})

function renderCustomizer(settings: ChatSettings, onSettingChange: (k: any, v: any) => void) {
  return render(
    <I18nProvider language="es">
      <ChatCustomizer settings={settings} onSettingChange={onSettingChange} onReset={() => {}} />
    </I18nProvider>,
  )
}

describe("ChatCustomizer reduceMotion", () => {
  it("muestra el switch Reducing animaciones", () => {
    renderCustomizer(base, () => {})
    expect(screen.getByText("Reduce motion (disable animations)")).not.toBeNull()
    expect((screen.getByLabelText("Reduce motion (disable animations)") as HTMLInputElement).checked).toBe(false)
  })

  it("click avisa onSettingChange con reduceMotion=true", () => {
    const onSettingChange = vi.fn()
    renderCustomizer(base, onSettingChange)
    fireEvent.click(screen.getByLabelText("Reduce motion (disable animations)"))
    expect(onSettingChange).toHaveBeenCalledWith("reduceMotion", true)
  })

  it("refleja checked cuando viene activado", () => {
    renderCustomizer({ ...base, reduceMotion: true }, () => {})
    expect((screen.getByLabelText("Reduce motion (disable animations)") as HTMLInputElement).checked).toBe(true)
  })
})
