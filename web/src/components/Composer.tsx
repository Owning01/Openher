import { memo, useRef, useCallback, useEffect } from "react"
import { SendIcon, StopCircleIcon, SettingsIcon, MicIcon } from "../Icons"
import { useT } from "../i18n-context"
import { useSpeechRecognition } from "../hooks/useSpeechRecognition"
import type { AgentOption, ModelOption } from "../types"

type ComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onAbort: () => void
  disabled: boolean
  isWorking: boolean
  placeholder: string
  activeAgentID: string
  primaryAgentOptions: AgentOption[]
  onChangeAgent: (id: string) => void
  activeModelOption: ModelOption | null
  onSheetOpen: (sheet: "ai" | "details") => void
}

export const Composer = memo(function Composer({ value, onChange, onSend, onAbort, disabled, isWorking, placeholder, activeAgentID, primaryAgentOptions, onChangeAgent, activeModelOption, onSheetOpen }: ComposerProps) {
  const t = useT()
  const { isListening, supported, start, stop } = useSpeechRecognition()
  const composerRef = useRef<HTMLDivElement | null>(null)

  function syncChatBottomClearance() {
    const container = document.querySelector<HTMLElement>(".messages")
    const composer = composerRef.current
    if (!container || !composer) return
    const composerRect = composer.getBoundingClientRect()
    const composerStyles = window.getComputedStyle(composer)
    const composerBottom = Number.parseFloat(composerStyles.bottom) || 0
    const clearance = Math.ceil(composerRect.height + composerBottom + 16)
    container.style.setProperty("--chat-bottom-clearance", `${clearance}px`)
  }

  useEffect(() => {
    const composer = composerRef.current
    if (!composer) return
    let rafId: number
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(syncChatBottomClearance)
    })
    observer.observe(composer)
    syncChatBottomClearance()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [])

  const handleFocus = useCallback(() => {
    syncChatBottomClearance()
    setTimeout(() => {
      const container = document.querySelector<HTMLElement>(".messages")
      const end = document.querySelector<HTMLElement>(".messages-end")
      if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
      end?.scrollIntoView({ block: "end", behavior: "smooth" })
    }, 400)
    const onResize = () => {
      const container = document.querySelector<HTMLElement>(".messages")
      const end = document.querySelector<HTMLElement>(".messages-end")
      if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
      end?.scrollIntoView({ block: "end", behavior: "smooth" })
    }
    window.addEventListener("resize", onResize, { once: true })
  }, [])

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stop()
    } else {
      start((text) => onChange(text))
    }
  }, [isListening, start, stop, onChange])

  const handleToggleAgent = useCallback(() => {
    if (primaryAgentOptions.length < 2) return
    const next = primaryAgentOptions[0]?.id === activeAgentID ? primaryAgentOptions[1]!.id : primaryAgentOptions[0]!.id
    onChangeAgent(next)
  }, [primaryAgentOptions, activeAgentID, onChangeAgent])

  return (
    <div className="composer" ref={composerRef}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        onFocus={handleFocus}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            onSend()
          }
        }}
        disabled={disabled}
      />
      <div className="composer-tools">
        {primaryAgentOptions.length > 1 && (
          <button onClick={handleToggleAgent} disabled={disabled}
            className={`agent-toggle ${activeAgentID === "plan" ? "agent-plan" : "agent-build"}`}
            aria-pressed={activeAgentID === "plan"}>
            <span>{activeAgentID === "plan" ? "Plan" : "Build"}</span>
          </button>
        )}
        {supported && (
          <button onClick={handleMicClick}
            className={`mic-toggle${isListening ? " recording" : ""}`}
            aria-pressed={isListening}
            aria-label={isListening ? t('voice.listening') : t('voice.input')}
            title={isListening ? t('voice.listening') : t('voice.input')}>
            <MicIcon size={16} />
          </button>
        )}
        <button onClick={() => onSheetOpen("ai")} className="model-toggle"
          title={`${activeModelOption?.modelName ?? t('detail.modelLoading')}${activeModelOption?.variant ? ` · ${t('detail.modelVariant', { variant: activeModelOption.variant })}` : ""}`}>
          <SettingsIcon size={12} />
          <span className="model-toggle-name">{activeModelOption?.modelName ?? t('detail.modelLoading')}</span>
          {activeModelOption?.variant && <span className="model-toggle-variant">{activeModelOption.variant}</span>}
        </button>
      </div>
      <div className="composer-actions">
        {isWorking && (
          <button onClick={onAbort} className="btn-danger">
            <StopCircleIcon size={18} />
          </button>
        )}
        <button onClick={onSend} disabled={disabled} className="btn-primary">
          <SendIcon size={18} />
        </button>
      </div>
    </div>
  )
})
