import { memo, useRef, useCallback, useEffect, useState } from "react"
import { Capacitor } from "@capacitor/core"
import { Camera } from "@capacitor/camera"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { SendIcon, StopCircleIcon, SettingsIcon, MicIcon, CloseIcon } from "../Icons"
import { useT } from "../i18n-context"
import { useSpeechRecognition } from "../hooks/useSpeechRecognition"
import type { AgentOption, ModelOption } from "../types"

type ImageAttachment = { id: string; base64: string; mime: string; name: string }

type ComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: (images?: ImageAttachment[]) => void | Promise<void>
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

let imgId = 0

export const Composer = memo(function Composer({ value, onChange, onSend, onAbort, disabled, isWorking, placeholder, activeAgentID, primaryAgentOptions, onChangeAgent, activeModelOption, onSheetOpen }: ComposerProps) {
  const t = useT()
  const { isListening, supported, start, stop } = useSpeechRecognition()
  const composerRef = useRef<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [images, setImages] = useState<ImageAttachment[]>([])

  function syncChatBottomClearance() {
    const container = document.querySelector<HTMLElement>(".messages")
    const composer = composerRef.current
    if (!container || !composer) return
    const r = composer.getBoundingClientRect()
    const clearance = Math.ceil(window.innerHeight - r.top + 8)
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

  const addImage = useCallback((base64: string, mime: string, name: string) => {
    setImages((prev) => [...prev, { id: `img-${++imgId}`, base64, mime, name }])
  }, [])

  const handleImagePick = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await Camera.pickImages({ limit: 4 })
        for (const p of photo.photos) {
          const pp = p.path
          if (!pp) continue
          const data = await Filesystem.readFile({ path: pp, directory: Directory.Data })
          addImage(`data:image/jpeg;base64,${data.data}`, "image/jpeg", pp.split("/").pop() || "photo")
        }
      } catch (err: any) {
        if (err.message?.includes("cancel")) return
      }
    } else {
      fileRef.current?.click()
    }
  }, [addImage])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue
      const reader = new FileReader()
      reader.onload = () => addImage(reader.result as string, f.type, f.name)
      reader.readAsDataURL(f)
    }
    e.target.value = ""
  }, [addImage])

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }, [])

  const handleSendWithImages = useCallback(() => {
    onSend(images.length > 0 ? images : undefined)
    setImages([])
  }, [onSend, images])

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
            handleSendWithImages()
          }
        }}
        disabled={disabled}
      />
      {images.length > 0 && (
        <div className="image-strip">
          {images.map((img) => (
            <div key={img.id} className="image-preview">
              <img src={img.base64} alt={img.name} />
              <button className="image-preview-remove" onClick={() => handleRemoveImage(img.id)}
                aria-label="Remove"><CloseIcon size={12} /></button>
            </div>
          ))}
        </div>
      )}
      <div className="composer-tools">
        <input ref={fileRef} type="file" accept="image/*" multiple
          onChange={handleFileChange} style={{ display: "none" }} />
        <button onClick={handleImagePick} disabled={disabled}
          className="image-pick-btn" title="Attach image">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
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
        <button onClick={handleSendWithImages} disabled={disabled} className="btn-primary">
          <SendIcon size={18} />
        </button>
      </div>
    </div>
  )
})
