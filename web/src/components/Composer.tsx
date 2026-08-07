import { memo, useRef, useCallback, useEffect, useState, useMemo } from "react"
import { SendIcon, StopCircleIcon, MicIcon, CloseIcon, AttachmentIcon, LayersIcon } from "../Icons"
import { useT, useLanguage } from "../i18n-context"
import { useSpeechRecognition } from "../hooks/useSpeechRecognition"
import { api } from "../api"
import type { AgentOption, CommandInfo, ServerConfig } from "../types"

type ImageAttachment = { id: string; base64: string; mime: string; name: string }

const HISTORY_KEY = "opencode.remote.promptHistory"
const MAX_HISTORY = 50

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(h: string[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)) } catch { }
}

type MentionItem = { id: string; name: string; description?: string; source: "agent" | "file" | "mcp" }

type ComposerProps = {
  value: string
  commands: CommandInfo[]
  onChange: (value: string) => void
  onSend: (images?: ImageAttachment[]) => void | Promise<void>
  onShellSend?: (command: string) => void
  onAbort: () => void
  disabled: boolean
  isWorking: boolean
  activeAgentID: string
  primaryAgentOptions: AgentOption[]
  onChangeAgent: (id: string) => void
  contextLabel?: string | null
  config?: ServerConfig
  directory?: string
  onThemeCommand?: () => void
  queueEnabled?: boolean
  onToggleQueue?: () => void
}

let imgId = 0

const LOCAL_SLASH_COMMANDS: CommandInfo[] = [
  { name: "help", description: "Show help and available commands", source: "command" },
  { name: "status", description: "Show current session status", source: "command" },
  { name: "undo", description: "Undo last message", source: "command" },
  { name: "redo", description: "Redo last undone message", source: "command" },
  { name: "compact", description: "Compact/compress conversation history", source: "command" },
  { name: "theme", description: "Open theme picker", source: "command" },
]

export const Composer = memo(function Composer({ value, commands, onChange, onSend, onShellSend, onAbort, disabled, isWorking, activeAgentID, primaryAgentOptions, onChangeAgent, contextLabel, config, directory, onThemeCommand, queueEnabled = false, onToggleQueue }: ComposerProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashIndex, setSlashIndex] = useState(0)
  const [showAtMenu, setShowAtMenu] = useState(false)
  const [atQuery, setAtQuery] = useState("")
  const [atIndex, setAtIndex] = useState(0)

  const promptHistoryRef = useRef<string[]>(loadHistory())
  const historyIndexRef = useRef(-1)
  const [historyDraft, setHistoryDraft] = useState<string | null>(null)

  const visibleAgents = useMemo(
    () => primaryAgentOptions.filter((a) => !a.hidden),
    [primaryAgentOptions],
  )

  const [mentionItems, setMentionItems] = useState<MentionItem[]>([])
  const [mentionLoading, setMentionLoading] = useState(false)

  useEffect(() => {
    if (!showAtMenu) { setMentionItems([]); return }

    const agentItems: MentionItem[] = visibleAgents.map((a) => ({
      id: a.id, name: a.name, description: a.description, source: "agent" as const,
    }))

    const q = atQuery.toLowerCase()
    const filteredAgents = !atQuery ? agentItems : agentItems.filter((a) =>
      a.name.toLowerCase().includes(q) || (a.description?.toLowerCase() ?? "").includes(q))

    setMentionItems(filteredAgents)
    setMentionLoading(true)

    let cancelled = false
    const timer = setTimeout(() => {
      const fileFetch = config ? api.findFiles(config, atQuery, directory, 10).then((files) =>
        files.map((f) => ({ id: f.path, name: f.path, source: "file" as const, description: f.type }))
      ).catch(() => [] as MentionItem[]) : Promise.resolve([] as MentionItem[])

      const mcpFetch = config ? api.listMCPResources(config).then((resources) =>
        resources.filter((r) => !atQuery || r.name.toLowerCase().includes(q))
          .map((r) => ({ id: r.id, name: r.name, description: r.description, source: "mcp" as const }))
      ).catch(() => [] as MentionItem[]) : Promise.resolve([] as MentionItem[])

      Promise.all([fileFetch, mcpFetch]).then(([files, mcps]) => {
        if (cancelled) return
        setMentionItems([...filteredAgents, ...files, ...mcps])
        setMentionLoading(false)
      })
    }, 150)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [showAtMenu, atQuery, config, directory, visibleAgents])

  useEffect(() => {
    setAtIndex(0)
  }, [mentionItems.length])

  const allSlashCommands = useMemo(() => {
    const seen = new Set<string>()
    const merged: CommandInfo[] = [...LOCAL_SLASH_COMMANDS]
    for (const c of LOCAL_SLASH_COMMANDS) seen.add(c.name)
    for (const c of commands) {
      if (!seen.has(c.name)) {
        merged.push(c)
        seen.add(c.name)
      }
    }
    return merged
  }, [commands])

  const slashFiltered = useMemo(() => {
    if (!value.startsWith("/")) return allSlashCommands
    const afterSlash = value.slice(1).split(" ")[0]?.toLowerCase() ?? ""
    if (!afterSlash) return allSlashCommands
    return allSlashCommands.filter((c) => c.name.toLowerCase().includes(afterSlash))
  }, [value, allSlashCommands])

  useEffect(() => {
    if (value.startsWith("/")) {
      setShowSlashMenu(true)
      setSlashIndex(0)
    } else {
      setShowSlashMenu(false)
    }
    const atMatch = value.match(/(?:^|\s)@(\w*)$/)
    if (atMatch) {
      setShowAtMenu(true)
      setAtQuery(atMatch[1] ?? "")
    } else {
      setShowAtMenu(false)
    }
  }, [value])

  useEffect(() => {
    setSlashIndex(0)
  }, [slashFiltered.length])

  const isShellMode = value.startsWith("!")

  const pushHistory = useCallback((text: string) => {
    const h = promptHistoryRef.current
    if (h[0] === text) return
    const next = [text, ...h].slice(0, MAX_HISTORY)
    promptHistoryRef.current = next
    saveHistory(next)
  }, [])

  const selectMention = useCallback((item: MentionItem) => {
    const cleaned = value.replace(/(?:^|\s)@\w*$/, `@${item.name} `)
    onChange(cleaned)
    setShowAtMenu(false)
    if (item.source === "agent" && composerRef.current) {
      onChangeAgent(item.id)
    }
    if (composerRef.current) composerRef.current.querySelector("textarea")?.focus()
  }, [value, onChange, onChangeAgent])

  const selectSlashCommand = useCallback((cmd: CommandInfo) => {
    onChange(`/${cmd.name} `)
    setShowSlashMenu(false)
    if (composerRef.current) composerRef.current.querySelector("textarea")?.focus()
  }, [onChange])

  const handleSlashKeys = useCallback((e: React.KeyboardEvent): boolean => {
    if (showAtMenu && mentionItems.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setAtIndex((i) => (i + 1) % mentionItems.length); return true }
      if (e.key === "ArrowUp") { e.preventDefault(); setAtIndex((i) => (i - 1 + mentionItems.length) % mentionItems.length); return true }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); selectMention(mentionItems[atIndex]); return true }
      if (e.key === "Escape") { e.preventDefault(); setShowAtMenu(false); return true }
      return true
    }
    if (showSlashMenu && slashFiltered.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIndex((i) => (i + 1) % slashFiltered.length); return true }
      if (e.key === "ArrowUp") { e.preventDefault(); setSlashIndex((i) => (i - 1 + slashFiltered.length) % slashFiltered.length); return true }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); selectSlashCommand(slashFiltered[slashIndex]); return true }
      if (e.key === "Escape") { e.preventDefault(); setShowSlashMenu(false); return true }
      return true
    }
    return false
  }, [showSlashMenu, slashFiltered, slashIndex, selectSlashCommand, showAtMenu, mentionItems, atIndex, selectMention])

  const t = useT()
  const language = useLanguage()
  const { isListening, supported, start, stop } = useSpeechRecognition(language)
  const prefixRef = useRef("")
  const composerRef = useRef<HTMLDivElement | null>(null)
  const [images, setImages] = useState<ImageAttachment[]>([])

  const handleFocus = useCallback(() => {
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
    window.addEventListener("resize", onResize)
    setTimeout(() => window.removeEventListener("resize", onResize), 2000)
  }, [])

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stop()
    } else {
      prefixRef.current = value
      start((text) => onChange(prefixRef.current + (prefixRef.current && text ? " " : "") + text))
    }
  }, [isListening, start, stop, onChange, value])

  const addImage = useCallback((base64: string, mime: string, name: string) => {
    setImages((prev) => [...prev, { id: `img-${++imgId}`, base64, mime, name }])
  }, [])



  const handleFilePick = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.onchange = () => {
      const files = input.files; if (!files) return
      for (const f of Array.from(files)) {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result
          if (typeof result === "string") addImage(result, f.type || "application/octet-stream", f.name)
        }
        reader.readAsDataURL(f)
      }
    }
    input.click()
  }, [addImage])

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }, [])

  const handleSendWithImages = useCallback(() => {
    onSend(images.length > 0 ? images : undefined)
    setImages([])
  }, [onSend, images])

  const isCommandValid = useMemo(() => {
    if (!value.startsWith("/")) return false
    const firstWord = value.slice(1).split(" ")[0]
    if (!firstWord) return false
    return allSlashCommands.some((c) => c.name.toLowerCase().startsWith(firstWord.toLowerCase()))
  }, [value, allSlashCommands])

  const agentColorIdx = useMemo(() => {
    const visible = primaryAgentOptions.filter((a) => !a.hidden)
    const idx = visible.findIndex((a) => a.id === activeAgentID)
    return idx >= 0 ? idx % 7 : 0
  }, [primaryAgentOptions, activeAgentID])

  const handleToggleAgent = useCallback(() => {
    const visible = primaryAgentOptions.filter((a) => !a.hidden)
    if (visible.length < 2) return
    const curIdx = visible.findIndex((a) => a.id === activeAgentID)
    const next = visible[(curIdx + 1) % visible.length]
    onChangeAgent(next.id)
  }, [primaryAgentOptions, activeAgentID, onChangeAgent])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (handleSlashKeys(e)) return

    if (e.key === "ArrowUp" && !showSlashMenu && !showAtMenu && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
      const h = promptHistoryRef.current
      if (h.length === 0) return
      const idx = historyIndexRef.current
      if (idx === -1 && !value) { e.preventDefault(); historyIndexRef.current = 0; onChange(h[0]) }
      else if (idx === -1 && value) { e.preventDefault(); setHistoryDraft(value); historyIndexRef.current = 0; onChange(h[0]) }
      else if (idx + 1 < h.length) { e.preventDefault(); historyIndexRef.current = idx + 1; onChange(h[idx + 1]) }
      return
    }

    if (e.key === "ArrowDown" && !showSlashMenu && !showAtMenu) {
      const idx = historyIndexRef.current
      if (idx === -1) return
      if (idx === 0 && historyDraft !== null) { e.preventDefault(); historyIndexRef.current = -1; onChange(historyDraft); setHistoryDraft(null) }
      else if (idx > 0) { e.preventDefault(); historyIndexRef.current = idx - 1; onChange(promptHistoryRef.current[idx - 1]) }
      return
    }

    if (isShellMode) {
      if (e.key === "Enter" && !e.shiftKey && !showSlashMenu && !showAtMenu) {
        e.preventDefault()
        const cmd = value.slice(1).trim()
        if (cmd && onShellSend) { pushHistory(value); historyIndexRef.current = -1; setHistoryDraft(null); onShellSend(cmd) }
      }
      return
    }

    if (e.key === "Enter" && !e.shiftKey && !showSlashMenu && !showAtMenu && value.trim().startsWith("/theme")) {
      e.preventDefault()
      onChange("")
      pushHistory(value)
      historyIndexRef.current = -1; setHistoryDraft(null)
      onThemeCommand?.()
      return
    }

    if (e.key === "Enter" && !e.shiftKey && !showSlashMenu && !showAtMenu) {
      e.preventDefault()
      if (value.trim()) pushHistory(value)
      historyIndexRef.current = -1; setHistoryDraft(null)
      handleSendWithImages()
    }
  }, [value, showSlashMenu, showAtMenu, isShellMode, onShellSend, pushHistory, onChange, handleSendWithImages, handleSlashKeys, historyDraft, onThemeCommand])

  return (
    <div className={`composer${isCommandValid ? " composer-command-mode" : ""}${isShellMode ? " composer-shell-mode" : ""}`} ref={composerRef} style={{ borderColor: `var(--agent-${agentColorIdx})` } as React.CSSProperties}>
      {showSlashMenu && slashFiltered.length > 0 && (
        <div className="slash-menu">
          {slashFiltered.map((cmd, i) => (
            <div
              key={cmd.name}
              className={`slash-menu-item${i === slashIndex ? " active" : ""}`}
              onPointerDown={(e) => { e.preventDefault(); selectSlashCommand(cmd) }}
              onMouseEnter={() => setSlashIndex(i)}
            >
              <span className="slash-menu-name">/{cmd.name}</span>
              {cmd.description && <span className="slash-menu-desc">{cmd.description}</span>}
              {cmd.source && cmd.source !== "command" && <span className="slash-menu-source">{cmd.source}</span>}
            </div>
          ))}
        </div>
      )}
      {showAtMenu && (mentionItems.length > 0 || mentionLoading) && (
        <div className="slash-menu at-menu">
          {mentionItems.length === 0 && mentionLoading && <div className="slash-menu-item"><span className="slash-menu-desc">Searching...</span></div>}
          {mentionItems.map((item, i) => (
            <div
              key={item.id}
              className={`slash-menu-item${i === atIndex ? " active" : ""}`}
              onPointerDown={(e) => { e.preventDefault(); selectMention(item) }}
              onMouseEnter={() => setAtIndex(i)}
            >
              <span className="slash-menu-name">@{item.name}</span>
              {item.description && <span className="slash-menu-desc">{item.description}</span>}
              <span className={`slash-menu-source source-${item.source}`}>{item.source}</span>
            </div>
          ))}
        </div>
      )}
      {images.length > 0 && (
        <div className="image-strip">
          {images.map((img) => {
            const isImage = img.mime.startsWith("image/")
            const ext = img.name.split(".").pop()?.toLowerCase() || ""
            const iconClass = isImage ? "" :
              ["ts","tsx","js","jsx","rs","go","py","java","c","cpp","h","hpp"].includes(ext) ? "attach-icon-code" :
              ["md","txt","json","yaml","yml","toml","xml","csv","env","gitignore"].includes(ext) ? "attach-icon-text" :
              "attach-icon-other"
            return (
              <div key={img.id} className="image-preview" title={img.name}>
                {isImage ? <img src={img.base64} alt={img.name} /> : (
                  <div className={`image-preview-placeholder ${iconClass}`}>
                    <span>.{ext}</span>
                  </div>
                )}
                <span className="file-info">{img.name}</span>
                <button className="image-preview-remove" onClick={() => handleRemoveImage(img.id)}
                  aria-label={t('session.removeImage')}><CloseIcon size={12} /></button>
              </div>
            )
          })}
        </div>
      )}
      <div className="composer-input-wrap">
        <button onClick={handleFilePick} disabled={disabled}
          className="composer-inline-btn composer-img-btn" title="Attach file"
          tabIndex={-1}>
          <AttachmentIcon size={18} />
        </button>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={t('composer.inputLabel')}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={isShellMode ? "shell-input" : ""}
        />
        {supported && (
          <button onClick={handleMicClick}
            className={`composer-inline-btn composer-mic-btn${isListening ? " recording" : ""}`}
            aria-pressed={isListening}
            aria-label={isListening ? t('voice.listening') : t('voice.input')}
            title={isListening ? t('voice.listening') : t('voice.input')}
            tabIndex={-1}>
            <MicIcon size={18} />
          </button>
        )}
      </div>
      <div className="composer-bar">
        <div className="composer-bar-left">
          {onToggleQueue && (
            <button onClick={onToggleQueue} disabled={disabled}
              className="composer-queue-btn"
              aria-pressed={queueEnabled}
              title={queueEnabled ? t('session.queueToggleOn') : t('session.queueToggleOff')}>
              <LayersIcon size={16} />
            </button>
          )}
          {visibleAgents.length > 1 && (
            <button onClick={handleToggleAgent} disabled={disabled}
              className="agent-toggle"
              style={{ borderColor: `var(--agent-${agentColorIdx})`, color: `var(--agent-${agentColorIdx})` } as React.CSSProperties}>
              <span>{visibleAgents.find((a) => a.id === activeAgentID)?.name ?? activeAgentID}</span>
            </button>
          )}
          {contextLabel && <span className="context-usage-label">{contextLabel}</span>}
        </div>
        <div className="composer-bar-right">
          {isWorking && (
            <button onClick={onAbort} className="btn-danger composer-bar-btn" title={t('composer.stop')} aria-label={t('composer.stop')}>
              <StopCircleIcon size={16} />
            </button>
          )}
          <button onClick={handleSendWithImages} disabled={disabled} className="btn-primary composer-bar-btn" title={t('composer.send')} aria-label={t('composer.send')}>
            <SendIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  )
})
