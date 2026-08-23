import { memo, useRef, useCallback, useEffect, useState, useMemo } from "react"
import { SendIcon, StopCircleIcon, MicIcon, CloseIcon, AttachmentIcon, PencilIcon } from "../Icons"
import { useT, useLanguage } from "../i18n-context"
import { useSpeechRecognition } from "../hooks/useSpeechRecognition"
import { api } from "../api"
import type { AgentOption, CommandInfo, PromptSnippet, ServerConfig } from "../types"
import { ImageEditor } from "./ImageEditor"
import { PluginSlot } from "../plugins"

type ImageAttachment = { id: string; base64: string; mime: string; name: string }

const IMAGE_MAX_SIZE = 1600

/** Downscale de imágenes grandes antes de base64: reduce heap ~4x y tiempo de upload. */
async function downscaleImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }
  const canOffscreen = typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap !== "undefined"
  const canCreateBitmap = typeof createImageBitmap !== "undefined"
  try {
    const bitmap = canCreateBitmap ? await createImageBitmap(file) : null
    if (!bitmap) throw new Error("no bitmap")
    const scale = Math.min(1, IMAGE_MAX_SIZE / Math.max(bitmap.width, bitmap.height))
    if (scale >= 1) {
      bitmap.close()
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    }
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    let blob: Blob
    if (canOffscreen) {
      const canvas = new OffscreenCanvas(w, h)
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(bitmap, 0, 0, w, h)
      bitmap.close()
      blob = await canvas.convertToBlob({ type: file.type || "image/jpeg", quality: 0.85 })
    } else {
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(bitmap as any, 0, 0, w, h)
      bitmap.close()
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error("toBlob failed")), file.type || "image/jpeg", 0.85)
      })
    }
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    // Fallback iOS/Capacitor viejo sin OffscreenCanvas/createImageBitmap
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }
}

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
  onSend: (images?: ImageAttachment[], options?: { translate?: boolean }, text?: string) => void | boolean | Promise<boolean | void>
  onShellSend?: (command: string) => void
  onAbort: () => void
  disabled: boolean
  isWorking: boolean
  isSending?: boolean
  activeAgentID: string
  primaryAgentOptions: AgentOption[]
  allAgentOptions?: AgentOption[]
  onChangeAgent: (id: string) => void
  contextLabel?: string | null
  config?: ServerConfig
  directory?: string
  onThemeCommand?: () => void
  snippets?: PromptSnippet[]
  charLimit?: number
}

let imgId = 0

const LOCAL_SLASH_COMMANDS: CommandInfo[] = [
  { name: "help", description: "Show help and available commands", source: "command" },
  { name: "status", description: "Show current session status", source: "command" },
  { name: "undo", description: "Undo last message", source: "command" },
  { name: "redo", description: "Redo last undone message", source: "command" },
  { name: "compact", description: "Compact/compress conversation history", source: "command" },
  { name: "theme", description: "Open theme picker", source: "command" },
  { name: "connect", description: "Connect providers (API keys, OpenAI-compatible)", source: "command" },
]

export const Composer = memo(function Composer({ value, commands, onChange, onSend, onShellSend, onAbort, disabled, isWorking, isSending = false, activeAgentID, primaryAgentOptions, allAgentOptions, onChangeAgent, contextLabel, config, directory, onThemeCommand, snippets = [], charLimit = 0 }: ComposerProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashIndex, setSlashIndex] = useState(0)
  const [showAtMenu, setShowAtMenu] = useState(false)
  const [atQuery, setAtQuery] = useState("")
  const [tslEnabled, setTslEnabled] = useState(false)
  const [atIndex, setAtIndex] = useState(0)
  const [showSnippetMenu, setShowSnippetMenu] = useState(false)
  const snippetMenuRef = useRef<HTMLDivElement | null>(null)
  const snippetToggleRef = useRef<HTMLButtonElement | null>(null)
  const [editingImage, setEditingImage] = useState<ImageAttachment | null>(null)

  // En móvil (táctil) Enter = nueva línea; en desktop Enter envía.
  // En wry desktop (WebView2) forzamos desktop aunque el device reporte pointer:coarse (laptop táctil)
  const isMobileInput = useMemo(
    () => typeof window !== "undefined" && !(window as any).__OPENCODE_DESKTOP__ && window.matchMedia("(pointer: coarse)").matches,
    [],
  )

  // Local value: fuente de verdad mientras se tipea. El padre NO recibe cada
  // keystroke (eso re-renderizaba App completa y su eco stale REVERTÍA los
  // borrados). Push al padre solo con debounce largo (higiene/persistencia),
  // en send/clear, y en cambios externos (share, snippet, historial).
  const [localValue, setLocalValue] = useState(value)
  const localValueRef = useRef(value)
  localValueRef.current = localValue
  const lastSyncedRef = useRef(value)   // último value visto del padre
  const lastPushedRef = useRef(value)   // último valor que notificamos al padre
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const pushNow = useCallback((v: string) => {
    if (pushTimerRef.current) { clearTimeout(pushTimerRef.current); pushTimerRef.current = null }
    lastPushedRef.current = v
    onChangeRef.current(v)
  }, [])

  // Sync SOLO de cambios externos del padre. Reglas:
  // 1. Echo propio (el debounce del padre devolvió lo que empujamos) → ignorar.
  // 2. Con foco en el textarea y value≠"" → ignorar (protege lo tipeado/borrado).
  // 3. Clear ("") o cambio externo real sin foco → aplicar.
  useEffect(() => {
    if (value === lastSyncedRef.current) return
    lastSyncedRef.current = value
    if (value === lastPushedRef.current) return
    const ta = textareaRef.current
    const focused = ta ? document.activeElement === ta : false
    if (focused && value !== "") return
    setLocalValue(value)
    lastPushedRef.current = value
  }, [value])

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue)
    // Push diferido al padre: persistencia del draft y estado del padre,
    // sin acoplar el ritmo de tipeo al re-render de App.
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    pushTimerRef.current = setTimeout(() => {
      pushTimerRef.current = null
      lastPushedRef.current = newValue
      onChangeRef.current(newValue)
    }, 800)
  }, [])

  // Listener para eventos emitidos por plugins para insertar texto en el prompt
  useEffect(() => {
    const handleInsert = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (typeof detail === "string") {
        handleChange(localValueRef.current ? `${localValueRef.current} ${detail}` : detail)
      }
    }
    window.addEventListener("plugin:insert-text", handleInsert)
    return () => window.removeEventListener("plugin:insert-text", handleInsert)
  }, [handleChange])

  const promptHistoryRef = useRef<string[]>(loadHistory())
  const historyIndexRef = useRef(-1)
  const [historyDraft, setHistoryDraft] = useState<string | null>(null)

  const visibleAgentsRaw = useMemo(
    () => (allAgentOptions ?? primaryAgentOptions).filter((a) => !a.hidden),
    [allAgentOptions, primaryAgentOptions],
  )
  const prevAgentsRef = useRef(visibleAgentsRaw)
  useEffect(() => { if (visibleAgentsRaw.length > 0) prevAgentsRef.current = visibleAgentsRaw }, [visibleAgentsRaw])
  const visibleAgents = visibleAgentsRaw.length > 0 ? visibleAgentsRaw : prevAgentsRef.current

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
    if (!localValue.startsWith("/")) return allSlashCommands
    const afterSlash = localValue.slice(1).split(" ")[0]?.toLowerCase() ?? ""
    if (!afterSlash) return allSlashCommands
    return allSlashCommands.filter((c) => c.name.toLowerCase().includes(afterSlash))
  }, [localValue, allSlashCommands])

  useEffect(() => {
    // Short-circuit: la mayoría de keystrokes no activan menúes.
    // Solo corre regex cuando el valor podría coincidir.
    if (!localValue.startsWith("/") && !/(?:^|\s)@/.test(localValue)) {
      if (showSlashMenu) setShowSlashMenu(false)
      if (showAtMenu) setShowAtMenu(false)
      return
    }
    if (localValue.startsWith("/")) {
      setShowSlashMenu(true)
      setSlashIndex(0)
    } else {
      setShowSlashMenu(false)
    }
    const atMatch = localValue.match(/(?:^|\s)@(\w*)$/)
    if (atMatch) {
      setShowAtMenu(true)
      setAtQuery(atMatch[1] ?? "")
    } else {
      setShowAtMenu(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue])

  useEffect(() => {
    setSlashIndex(0)
  }, [slashFiltered.length])

  const isShellMode = localValue.startsWith("!")

  const insertSnippet = useCallback((s: PromptSnippet) => {
    const prefix = localValue && !localValue.endsWith("\n") ? `${localValue}\n` : localValue
    handleChange(prefix + s.text)
    setShowSnippetMenu(false)
    if (composerRef.current) composerRef.current.querySelector("textarea")?.focus()
  }, [localValue, handleChange])

  const pushHistory = useCallback((text: string) => {
    const h = promptHistoryRef.current
    if (h[0] === text) return
    const next = [text, ...h].slice(0, MAX_HISTORY)
    promptHistoryRef.current = next
    saveHistory(next)
  }, [])

  const selectMention = useCallback((item: MentionItem) => {
    const cleaned = localValue.replace(/(?:^|\s)@\w*$/, `@${item.name} `)
    handleChange(cleaned)
    setShowAtMenu(false)
    if (item.source === "agent" && composerRef.current) {
      onChangeAgent(item.id)
    }
    if (composerRef.current) composerRef.current.querySelector("textarea")?.focus()
  }, [localValue, handleChange, onChangeAgent])

  const selectSlashCommand = useCallback((cmd: CommandInfo) => {
    handleChange(`/${cmd.name} `)
    setShowSlashMenu(false)
    if (composerRef.current) composerRef.current.querySelector("textarea")?.focus()
  }, [handleChange])

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [images, setImages] = useState<ImageAttachment[]>([])

  // Auto-grow: la caja crece mientras se escribe (hasta 120px) y vuelve a su
  // alto mínimo cuando se vacía (al enviar/limpiar). Un solo rAF alcanza
  // para que el DOM haga reflow y scrollHeight sea correcto durante typing.
  const resizeTextarea = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    requestAnimationFrame(() => {
      ta.style.height = "auto"
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
    })
  }, [])

  useEffect(() => {
    resizeTextarea()
  }, [localValue, resizeTextarea])

  const handleFocus = useCallback(() => {
    // Scrollear SOLO el contenedor de mensajes de este panel (nunca
    // scrollIntoView: scrollea también la ventana y con el teclado abierto
    // en Android la página salta para arriba).
    setTimeout(() => {
      const wrap = composerRef.current?.closest<HTMLElement>(".app-mobile-content, .session-panel")
      const container = wrap?.querySelector<HTMLElement>(".messages")
      if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
    }, 400)
  }, [])

  const [micNotice, setMicNotice] = useState<string | null>(null)
  const micNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showMicNotice = useCallback((message: string) => {
    setMicNotice(message)
    if (micNoticeTimerRef.current) clearTimeout(micNoticeTimerRef.current)
    micNoticeTimerRef.current = setTimeout(() => setMicNotice(null), 6000)
  }, [])

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stop()
    } else if (!supported) {
      showMicNotice(t('voice.unavailable'))
    } else {
      prefixRef.current = localValue
      start((text) => handleChange(prefixRef.current + (prefixRef.current && text ? " " : "") + text))
        .catch((err: unknown) => {
          stop()
          const msg = (err as Error)?.message ?? ""
          showMicNotice(/denied|denegado|permission/i.test(msg)
            ? t('voice.permissionDenied')
            : (err as Error)?.message ?? t('voice.unavailable'))
        })
    }
  }, [isListening, stop, supported, start, handleChange, localValue, showMicNotice, t])

  useEffect(() => {
    return () => {
      if (micNoticeTimerRef.current) clearTimeout(micNoticeTimerRef.current)
    }
  }, [])

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
        downscaleImage(f).then((base64) => addImage(base64, f.type || "application/octet-stream", f.name))
      }
    }
    input.click()
  }, [addImage])

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }, [])

  const handleSendWithImages = useCallback(async () => {
    if (disabled) return
    if (!localValue.trim() && images.length === 0) return
    const opts = tslEnabled ? { translate: true } : undefined
    const imgs = images.length > 0 ? images : undefined
    const textToSend = localValue
    // Limpiar imágenes y texto INMEDIATAMENTE antes de esperar la respuesta
    // del server (evita que la preview quede 10s en el composer).
    setImages([])
    setLocalValue("")
    localValueRef.current = ""
    pushNow("")
    resizeTextarea()
    const ok = await onSend(imgs, opts, textToSend)
    if (ok === false) {
      // Si falló, restaurar las imágenes y el texto (best-effort)
      if (imgs) setImages(imgs)
      setLocalValue(textToSend)
      localValueRef.current = textToSend
      pushNow(textToSend)
    }
  }, [onSend, images, resizeTextarea, disabled, localValue, tslEnabled, pushNow])

  const isCommandValid = useMemo(() => {
    if (!localValue.startsWith("/")) return false
    const firstWord = localValue.slice(1).split(" ")[0]
    if (!firstWord) return false
    return allSlashCommands.some((c) => c.name.toLowerCase().startsWith(firstWord.toLowerCase()))
  }, [localValue, allSlashCommands])

  const primaryVisibleAgents = useMemo(() => {
    return primaryAgentOptions.filter((a) => !a.hidden && a.mode !== "subagent")
  }, [primaryAgentOptions])

  const agentColorIdx = useMemo(() => {
    const visible = primaryVisibleAgents
    const idx = visible.findIndex((a) => a.id === activeAgentID)
    return idx >= 0 ? idx % 7 : 0
  }, [primaryVisibleAgents, activeAgentID])

  const handleToggleAgent = useCallback(() => {
    const visible = primaryVisibleAgents
    if (visible.length < 2) return
    const curIdx = visible.findIndex((a) => a.id === activeAgentID)
    const next = visible[(curIdx + 1) % visible.length]
    onChangeAgent(next.id)
  }, [primaryVisibleAgents, activeAgentID, onChangeAgent])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (handleSlashKeys(e)) return

    if (e.key === "ArrowUp" && !showSlashMenu && !showAtMenu && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
      const h = promptHistoryRef.current
      if (h.length === 0) return
      const idx = historyIndexRef.current
      if (idx === -1 && !localValue) { e.preventDefault(); historyIndexRef.current = 0; handleChange(h[0]) }
      else if (idx === -1 && localValue) { e.preventDefault(); setHistoryDraft(localValue); historyIndexRef.current = 0; handleChange(h[0]) }
      else if (idx + 1 < h.length) { e.preventDefault(); historyIndexRef.current = idx + 1; handleChange(h[idx + 1]) }
      return
    }

    if (e.key === "ArrowDown" && !showSlashMenu && !showAtMenu) {
      const idx = historyIndexRef.current
      if (idx === -1) return
      if (idx === 0 && historyDraft !== null) { e.preventDefault(); historyIndexRef.current = -1; handleChange(historyDraft); setHistoryDraft(null) }
      else if (idx > 0) { e.preventDefault(); historyIndexRef.current = idx - 1; handleChange(promptHistoryRef.current[idx - 1]) }
      return
    }

    if (isShellMode) {
      if (e.key === "Enter" && !e.shiftKey && !showSlashMenu && !showAtMenu) {
        if (isMobileInput) return
        e.preventDefault()
        const cmd = localValue.slice(1).trim()
        if (cmd && onShellSend) { pushHistory(localValue); historyIndexRef.current = -1; setHistoryDraft(null); onShellSend(cmd) }
      }
      return
    }

    if (e.key === "Enter" && !e.shiftKey && !showSlashMenu && !showAtMenu && localValue.trim().startsWith("/theme")) {
      if (isMobileInput) return
      e.preventDefault()
      handleChange("")
      pushHistory(localValue)
      historyIndexRef.current = -1; setHistoryDraft(null)
      onThemeCommand?.()
      return
    }

    if (e.key === "Enter" && !e.shiftKey && !showSlashMenu && !showAtMenu) {
      if (isMobileInput || isSending) return
      e.preventDefault()
      if (localValue.trim()) pushHistory(localValue)
      historyIndexRef.current = -1; setHistoryDraft(null)
      handleSendWithImages()
    }
  }, [localValue, showSlashMenu, showAtMenu, isShellMode, onShellSend, pushHistory, handleChange, handleSendWithImages, handleSlashKeys, historyDraft, onThemeCommand, isMobileInput, isSending])

  const handleComposerDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    // 1. Archivos externos arrastrados desde el SO
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (const f of Array.from(e.dataTransfer.files)) {
        if (f.type.startsWith("image/")) {
          downscaleImage(f).then((base64) => addImage(base64, f.type, f.name))
        } else {
          const sep = localValue ? (localValue.endsWith(" ") ? "" : " ") : ""
          handleChange(localValue + sep + f.name)
        }
      }
      return
    }
    // 2. Elemento arrastrado desde el panel Explorador interno
    const path = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain")
    if (path) {
      const sep = localValue ? (localValue.endsWith(" ") ? "" : " ") : ""
      handleChange(localValue + sep + path)
    }
  }, [localValue, handleChange, addImage])

  return (
    <div className={`composer${isCommandValid ? " composer-command-mode" : ""}${isShellMode ? " composer-shell-mode" : ""}`} ref={composerRef}>
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
      {micNotice && <div className="composer-notice" role="alert">{micNotice}</div>}
      {showSnippetMenu && snippets.length > 0 && (
        <div className="slash-menu snippet-menu" ref={snippetMenuRef}>
          {snippets.map((s) => (
            <div key={s.id} className="slash-menu-item"
              onPointerDown={(e) => { e.preventDefault(); insertSnippet(s) }}>
              <span className="slash-menu-name">{s.name}</span>
              <span className="slash-menu-desc">{s.text.slice(0, 60)}{s.text.length > 60 ? "…" : ""}</span>
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
                {isImage ? (
                  <>
                    <img src={img.base64} alt={img.name} />
                    <button className="image-preview-edit" onClick={() => setEditingImage(img)}
                      aria-label={t('image.editorTitle')} title={t('image.editorTitle')}>
                      <PencilIcon size={13} />
                    </button>
                  </>
                ) : (
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
      <div
        className={`composer-input-wrap${supported ? " has-mic" : ""}`}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy" }}
        onDrop={handleComposerDrop}
      >
        <button onClick={handleFilePick} disabled={disabled}
          className="composer-inline-btn composer-img-btn" title="Attach file"
          tabIndex={-1}>
          <AttachmentIcon size={18} />
        </button>
        <textarea
          ref={textareaRef}
          value={localValue}
          onBlur={() => {
            // Contrato: al perder foco, el padre queda SIEMPRE sincronizado
            // (persistencia de draft, atajos, queue offline).
            if (localValueRef.current !== lastPushedRef.current) pushNow(localValueRef.current)
          }}
          onChange={(event) => {
            // Edición manual: cancela la navegación por historial (↑/↓) en curso.
            if (historyIndexRef.current !== -1) {
              historyIndexRef.current = -1
              setHistoryDraft(null)
            }
            handleChange(event.target.value)
          }}
          onPaste={(e) => {
            const items = e.clipboardData?.items
            if (!items) return
            for (const item of Array.from(items)) {
              if (item.type.startsWith("image/")) {
                e.preventDefault()
                const blob = item.getAsFile()
                if (!blob) continue
                downscaleImage(blob).then((base64) => addImage(base64, blob.type, blob.name || "clipboard.png"))
                return
              }
            }
          }}
          aria-label={t('composer.inputLabel')}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={charLimit > 0 ? charLimit : undefined}
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
        {isWorking ? (
          <button
            type="button"
            onClick={onAbort}
            className={`composer-inline-btn composer-stop-btn${supported ? " with-mic" : ""}`}
            title={t('composer.stop')}
            aria-label={t('composer.stop')}
            tabIndex={-1}
          >
            <StopCircleIcon size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSendWithImages}
            disabled={disabled || isSending || (!localValue.trim() && images.length === 0)}
            className={`composer-inline-btn composer-send-btn${supported ? " with-mic" : ""}`}
            title={t('composer.send')}
            aria-label={t('composer.send')}
            tabIndex={-1}
          >
            <SendIcon size={18} />
          </button>
        )}
      </div>
      <div className="composer-bar">
        <div className="composer-bar-left">
          {snippets.length > 0 && (
            <button onClick={() => setShowSnippetMenu((v) => !v)} disabled={disabled}
              ref={snippetToggleRef}
              className="composer-snippet-btn"
              aria-expanded={showSnippetMenu}
              aria-label={t('composer.snippets')}
              title={t('composer.snippets')}>
              <svg width="15" height="15" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="2.5" width="8" height="2.2" rx="0.8" />
                <rect x="2" y="6.5" width="8" height="2.2" rx="0.8" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => setTslEnabled((v) => !v)}
            disabled={disabled}
            className="composer-tsl-btn"
            style={{ color: tslEnabled ? "var(--primary)" : undefined }}
            title={tslEnabled ? "Translate ES→EN (active)" : "Translate ES→EN"}
            aria-pressed={tslEnabled}
          >
            TSL
          </button>
          {primaryVisibleAgents.length > 1 && (
            <button onClick={handleToggleAgent} disabled={disabled}
              className="agent-toggle"
              title={`Agente activo: ${primaryVisibleAgents.find((a) => a.id === activeAgentID)?.name ?? activeAgentID} (click para cambiar)`}
              style={{ color: `var(--agent-${agentColorIdx})`, border: "none", outline: "none", background: "transparent", padding: "0 4px" } as React.CSSProperties}>
              <span>{primaryVisibleAgents.find((a) => a.id === activeAgentID)?.name ?? activeAgentID}</span>
            </button>
          )}
          <PluginSlot id="composer.actions" />
          {contextLabel && <span className="context-usage-label">{contextLabel}</span>}
        </div>
        <div className="composer-bar-right">
          {localValue.length > 0 && (            <span className={`composer-char-count${charLimit > 0 && localValue.length >= charLimit ? " over" : ""}`}
              title={charLimit > 0 ? `${localValue.length}/${charLimit}` : `${localValue.length} chars`}>
              {charLimit > 0 ? `${localValue.length}/${charLimit}` : localValue.length}
            </span>
          )}
        </div>
      </div>
      {editingImage && (
        <ImageEditor
          src={editingImage.base64}
          mime={editingImage.mime}
          onApply={(base64) => {
            setImages((prev) => prev.map((img) => img.id === editingImage.id ? { ...img, base64 } : img))
            setEditingImage(null)
          }}
          onClose={() => setEditingImage(null)} />
      )}
    </div>
  )
})
