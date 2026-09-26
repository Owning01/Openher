import { memo, useRef, useCallback, useEffect, useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { SendIcon, StopCircleIcon, MicIcon, AttachmentIcon } from "../Icons"
import { useT, useLanguage } from "../i18n-context"
import { useSpeechRecognition } from "../hooks/useSpeechRecognition"
import type { AgentOption, CommandInfo, ServerConfig, ModelOption, TurnChanges } from "../types"
import { ImageEditor } from "./ImageEditor"
import { readComposerDraft, writeComposerDraft } from "../utils/composerDraft"
import { useStore } from "../shared/lib/store"
import { bottomTarget, bottomDistance } from "../shared/lib/useFollowTail"
import { composerInjectStore, composerImageInjectStore, takeComposerInjections, takeComposerImageInjections } from "../stores/composerInjectStore"
import { SlashMenu } from "./composer/SlashMenu"
import { MentionMenu } from "./composer/MentionMenu"
import { useMentions } from "./composer/useMentions"
import { ImageStrip } from "./composer/ImageStrip"
import { TurnChangesPanel } from "./composer/TurnChangesPanel"
import { ComposerBar } from "./composer/ComposerBar"
import { downscaleImage } from "./composer/downscaleImage"
import { LOCAL_SLASH_COMMANDS, MAX_HISTORY, loadHistory, saveHistory } from "./composer/composerData"
import type { ImageAttachment, MentionItem } from "./composer/types"

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
  // El contador de contexto se movió al header del chat (25-sep): ya no es prop
  // del Composer. El botón TSL (Translate ES→EN) también se retiró del composer.
  /** Contador de contexto de la fila del composer ("401.1K (38%)"). */
  contextLabel?: string | null
  config?: ServerConfig
  directory?: string
  onThemeCommand?: () => void
  charLimit?: number
  activeModelOption?: ModelOption | null
  activeModelVariants?: ModelOption[]
  selectedVariant?: string | null
  onChangeVariant?: (variant: string | null, sessionID?: string) => void
  modelOptions?: ModelOption[]
  onChangeModel?: (key: string, variant?: string | null, sessionID?: string) => void
  variantGroups?: { recentModels: ModelOption[]; groups: Map<string, any> }
  sessionID?: string
  turnChanges?: TurnChanges[]
}

export const Composer = memo(function Composer({
  value,
  commands,
  onChange,
  onSend,
  onShellSend,
  onAbort,
  disabled,
  isWorking,
  isSending = false,
  activeAgentID,
  primaryAgentOptions,
  allAgentOptions,
  onChangeAgent,
  config,
  directory,
  contextLabel,
  onThemeCommand,
  charLimit = 0,
  activeModelOption,
  activeModelVariants,
  selectedVariant,
  onChangeVariant,
  modelOptions,
  onChangeModel,
  variantGroups,
  sessionID,
  turnChanges,
}: ComposerProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashIndex, setSlashIndex] = useState(0)
  const [showAtMenu, setShowAtMenu] = useState(false)
  const [atQuery, setAtQuery] = useState("")
  const [atIndex, setAtIndex] = useState(0)
  // Contador de ids de adjuntos: ref local por instancia (antes era un
  // contador de módulo compartido entre todos los composers).
  const imgIdRef = useRef(0)
  const [editingImage, setEditingImage] = useState<ImageAttachment | null>(null)

  // En móvil (táctil) Enter = nueva línea; en desktop Enter envía.
  // En wry desktop (WebView2) forzamos desktop aunque el device reporte pointer:coarse (laptop táctil)
  const [isMobileInput, setIsMobileInput] = useState(
    () => typeof window !== "undefined" && !(window as any).__OPENHER_DESKTOP__ && window.matchMedia("(pointer: coarse)").matches,
  )
  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)")
    const onChange = () => setIsMobileInput(!(window as any).__OPENHER_DESKTOP__ && mql.matches)
    mql.addEventListener?.("change", onChange)
    return () => mql.removeEventListener?.("change", onChange)
  }, [])

  // Local value: fuente de verdad mientras se tipea. El padre NO recibe cada
  // keystroke (eso re-renderizaba App completa y su eco stale REVERTÍA los
  // borrados). Push al padre solo con debounce largo (higiene/persistencia),
  // en send/clear, y en cambios externos (share, snippet, historial).
  // Local value: fuente de verdad absoluta mientras se tipea.
  // Init desde el draft por sesión (más fresco que el value del padre).
  const [localValue, setLocalValue] = useState(() => readComposerDraft(sessionID) || value)
  const localValueRef = useRef(value)
  localValueRef.current = localValue
  const lastSyncedRef = useRef(value)   // último value visto del padre
  const lastPushedRef = useRef(value)   // último valor que notificamos o tenemos localmente
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const pushNow = useCallback((v: string) => {
    if (pushTimerRef.current) { clearTimeout(pushTimerRef.current); pushTimerRef.current = null }
    lastPushedRef.current = v
    onChangeRef.current(v)
  }, [])

  // Persistencia por tecla en la key POR SESIÓN (sin re-render del padre).
  // Antes era una key global: al cambiar de chat el texto de A se veía en B.
  useEffect(() => {
    writeComposerDraft(sessionID, localValue)
  }, [localValue, sessionID])

  // Inyecciones de otras superficies (anotaciones de diff, Design Mode): se
  // agregan al texto actual y se propagan al padre, igual que un tipeo.
  const injections = useStore(composerInjectStore)
  useEffect(() => {
    if (injections.length === 0) return
    const block = takeComposerInjections()
    if (!block) return
    const current = localValueRef.current
    const next = current.trim() ? `${current.trimEnd()}\n\n${block}` : block
    setLocalValue(next)
    localValueRef.current = next
    if (textareaRef.current) textareaRef.current.value = next
    pushNow(next)
  }, [injections, pushNow])

  // Sync SOLO de cambios externos del padre (reset a "", inserción en composer vacío, etc.).
  // NUNCA sobreescribe texto local con versiones intermedias o más cortas del padre.
  // Cambio de chat (sessionID distinto): el draft es por sesión, se adopta sin guards.
  const prevSessionIDRef = useRef(sessionID)
  useEffect(() => {
    if (sessionID !== prevSessionIDRef.current) {
      prevSessionIDRef.current = sessionID
      const draft = readComposerDraft(sessionID)
      setLocalValue(draft)
      localValueRef.current = draft
      lastSyncedRef.current = draft
      lastPushedRef.current = draft
      if (textareaRef.current) textareaRef.current.value = draft
      onChangeRef.current(draft)
      return
    }
    if (value === lastSyncedRef.current) return
    lastSyncedRef.current = value
    if (value === localValueRef.current || value === lastPushedRef.current) return

    // Si el usuario tiene texto local activo y el padre envía algo distinto que no sea vacío,
    // protegemos el texto local contra truncamientos o ecos viejos.
    if (localValueRef.current.trim().length > 0 && value !== "") {
      return
    }

    setLocalValue(value)
    localValueRef.current = value
    lastPushedRef.current = value
    if (textareaRef.current) {
      textareaRef.current.value = value
    }
  }, [value, sessionID])

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue)
    localValueRef.current = newValue
    // No notificar al padre en cada tecla: evita re-render del God Component (App)
    // El padre se sincroniza solo en send/clear/blur (pushNow) y el envio lee del DOM.
    // Debounce 0 para envio: texto completo via textareaRef + localValueRef.
    lastPushedRef.current = newValue
    // Persistencia diferida sin re-render: guardamos en ref para que App lo lea en blur/send
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    // Debounce 0 nominal: no programamos push al padre por tipeo (evita corte y recarga DOM)
    // Si se requiere persistencia inmediata, usar 0ms: pushTimerRef.current = setTimeout(() => onChangeRef.current(newValue), 0)
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

  const promptHistoryRef = useRef<string[]>(loadHistory(sessionID))
  const historyIndexRef = useRef(-1)
  const [historyDraft, setHistoryDraft] = useState<string | null>(null)

  // Cambio de chat: se adopta el historial de esa sesión (no el global).
  useEffect(() => {
    promptHistoryRef.current = loadHistory(sessionID)
    historyIndexRef.current = -1
    setHistoryDraft(null)
  }, [sessionID])

  const visibleAgentsRaw = useMemo(
    () => (allAgentOptions ?? primaryAgentOptions).filter((a) => !a.hidden),
    [allAgentOptions, primaryAgentOptions],
  )
  const prevAgentsRef = useRef(visibleAgentsRaw)
  useEffect(() => { if (visibleAgentsRaw.length > 0) prevAgentsRef.current = visibleAgentsRaw }, [visibleAgentsRaw])
  const visibleAgents = visibleAgentsRaw.length > 0 ? visibleAgentsRaw : prevAgentsRef.current

  const { items: mentionItems, loading: mentionLoading } = useMentions({
    active: showAtMenu,
    query: atQuery,
    config,
    directory,
    visibleAgents,
  })

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
      // Comando ya elegido (nombre + espacio/args, ej "/compact foco"):
      // NO reabrir el menú. Antes se reabría tras cada autocompletado y el
      // Enter quedaba atrapado en el loop completar→reabrir→completar,
      // obligando a 2-3 Enters para enviar un slash command.
      if (/^\/\S+\s/.test(localValue)) {
        if (showSlashMenu) setShowSlashMenu(false)
      } else {
        setShowSlashMenu(true)
        setSlashIndex(0)
      }
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

  const pushHistory = useCallback((text: string) => {
    const h = promptHistoryRef.current
    if (h[0] === text) return
    const next = [text, ...h].slice(0, MAX_HISTORY)
    promptHistoryRef.current = next
    saveHistory(sessionID, next)
  }, [sessionID])

  const selectMention = useCallback((item: MentionItem) => {
    const cur = localValueRef.current ?? ""
    const cleaned = cur.replace(/(?:^|\s)@\w*$/, `@${item.name} `)
    handleChange(cleaned)
    setShowAtMenu(false)
    // Como el TUI: @agente/@skill delega vía el texto que viaja al server.
    // No se cambia el agente de la sesión (eso es el pill del header).
    if (composerRef.current) composerRef.current.querySelector("textarea")?.focus()
  }, [handleChange])

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
      return false
    }
    if (showSlashMenu && slashFiltered.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIndex((i) => (i + 1) % slashFiltered.length); return true }
      if (e.key === "ArrowUp") { e.preventDefault(); setSlashIndex((i) => (i - 1 + slashFiltered.length) % slashFiltered.length); return true }
      if (e.key === "Tab") { e.preventDefault(); selectSlashCommand(slashFiltered[slashIndex]); return true }
      if (e.key === "Enter") {
        const cur = localValueRef.current ?? ""
        const m = cur.match(/^\/([A-Za-z0-9_-]+)(\s|$)/)
        const exact = m != null && allSlashCommands.some((c) => c.name.toLowerCase() === m[1].toLowerCase())
        if (exact) return false
        e.preventDefault(); selectSlashCommand(slashFiltered[slashIndex]); return true
      }
      if (e.key === "Escape") { e.preventDefault(); setShowSlashMenu(false); return true }
      return false
    }
    return false
  }, [showSlashMenu, slashFiltered, slashIndex, selectSlashCommand, showAtMenu, mentionItems, atIndex, selectMention, allSlashCommands])

  const t = useT()
  const language = useLanguage()
  const { isListening, supported, start, stop } = useSpeechRecognition(language)
  const prefixRef = useRef("")
  const composerRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [images, setImages] = useState<ImageAttachment[]>([])

  // Capturas (Design Mode) que llegan como imagen adjunta al próximo envío.
  const imageInjections = useStore(composerImageInjectStore)
  useEffect(() => {
    if (imageInjections.length === 0) return
    const pending = takeComposerImageInjections()
    if (pending.length === 0) return
    setImages((prev) => [...prev, ...pending.map((p) => ({ id: p.id, base64: p.base64, mime: p.mime, name: p.name }))])
  }, [imageInjections])

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
    // en Android la página salta para arriba). Y SOLO si ya estábamos al
    // fondo: si el usuario lee a mitad (retorno donde lo dejó), el foco no
    // debe robarle la posición 400ms después ("se cambia donde lo dejé").
    setTimeout(() => {
      const wrap = composerRef.current?.closest<HTMLElement>(".app-mobile-content, .session-panel")
      const container = wrap?.querySelector<HTMLElement>(".messages")
      if (!container) return
      // "Fondo" = fin de los mensajes (no el fin del scroller: hay cola
      // vacía por debajo); si el usuario lee a mitad, el foco no roba su lugar.
      if (bottomDistance(container) > 200) return
      container.scrollTo({ top: bottomTarget(container), behavior: "smooth" })
    }, 400)
  }, [])

  const [micNotice, setMicNotice] = useState<string | null>(null)
  const micNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showMicNotice = useCallback((message: string) => {
    setMicNotice(message)
    if (micNoticeTimerRef.current) clearTimeout(micNoticeTimerRef.current)
    micNoticeTimerRef.current = setTimeout(() => setMicNotice(null), 6000)
  }, [])

  // El plugin nativo rechaza con sus propios textos ("No match", "No speech
  // input", "RecognitionService busy", "Network error"): cada uno tiene su
  // aviso. Antes cualquier error no-permiso se mostraba como "no disponible en
  // este dispositivo", que es falso para un "no te escuché" o un servicio
  // ocupado (y mandaba a buscar el problema al lugar equivocado).
  const voiceNotice = useCallback((raw: string) => {
    const code = raw || ""
    if (/denied|denegado|permission|not-allowed/i.test(code)) return t('voice.permissionDenied')
    if (/no match|no speech|didn't understand/i.test(code)) return t('voice.noSpeech')
    if (/busy/i.test(code)) return t('voice.busy')
    if (/not available|unavailable/i.test(code)) return t('voice.unavailable')
    if (/privacy|policy/i.test(code)) return t('voice.privacy')
    if (/language|not supported/i.test(code)) return t('voice.unavailable')
    return `${t('voice.error')} (${code})`
  }, [t])

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stop()
    } else if (!supported) {
      showMicNotice(t('voice.unavailable'))
    } else {
      prefixRef.current = localValueRef.current ?? ""
      start(
        (text) => handleChange(prefixRef.current + (prefixRef.current && text ? " " : "") + text),
        (code) => showMicNotice(voiceNotice(code)),
      )
        .catch((err: unknown) => {
          stop()
          showMicNotice(voiceNotice((err as Error)?.message ?? ""))
        })
    }
  }, [isListening, stop, supported, start, handleChange, showMicNotice, t, voiceNotice])

  useEffect(() => {
    return () => {
      if (micNoticeTimerRef.current) clearTimeout(micNoticeTimerRef.current)
    }
  }, [])

  // Dictado vs límite: si el texto dictado supera N, se detiene el mic pero
  // el texto SE CONSERVA (antes maxLength lo truncaba en silencio). El envío
  // sigue bloqueado hasta editar por debajo del límite. Aviso una sola vez
  // por episodio para no spamear mientras el usuario edita.
  const overNotifiedRef = useRef(false)
  useEffect(() => {
    if (!isListening) {
      overNotifiedRef.current = false
      return
    }
    if (charLimit > 0 && localValue.length > charLimit && !overNotifiedRef.current) {
      overNotifiedRef.current = true
      try {
        stop()
      } catch {
        /* ignore */
      }
      showMicNotice(t('composer.limitExceeded') || `Límite ${charLimit} caracteres excedido — dictado detenido, el texto se conserva`)
    }
  }, [isListening, localValue, charLimit, stop, showMicNotice, t])

  const addImage = useCallback((base64: string, mime: string, name: string) => {
    setImages((prev) => [...prev, { id: `img-${++imgIdRef.current}`, base64, mime, name }])
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
    if (disabled || isSending) return
    // Sin bloqueo por isWorking: handleSend encola en el outbox visible
    // cuando la sesión está ocupada, en vez de rechazar el envío.
    // Fuente de verdad: localValueRef (actualizada sincrónicamente en handleChange).
    // El fallback al DOM causaba duplicados: cuando el DOM aún reflejaba el
    // valor anterior (controlled component con render pendiente), la comparación
    // por longitud elegía el texto viejo si tenía igual o mayor longitud.
    const textToSend = localValueRef.current ?? ""
    if (!textToSend.trim() && images.length === 0) return
    if (charLimit > 0 && textToSend.length > charLimit) {
      showMicNotice(t('composer.limitExceeded') || `Límite ${charLimit} caracteres excedido (${textToSend.length}/${charLimit})`)
      return
    }
    const imgs = images.length > 0 ? images : undefined

    setImages([])
    if (textareaRef.current) textareaRef.current.value = ""
    setLocalValue("")
    localValueRef.current = ""
    lastPushedRef.current = ""
    lastSyncedRef.current = ""
    pushNow("")
    resizeTextarea()
    const ok = await onSend(imgs, undefined, textToSend)
    if (ok === false) {
      if (imgs) setImages(imgs)
      setLocalValue(textToSend)
      localValueRef.current = textToSend
      lastPushedRef.current = textToSend
      if (textareaRef.current) textareaRef.current.value = textToSend
      pushNow(textToSend)
    }
  }, [onSend, images, resizeTextarea, disabled, isSending, charLimit, pushNow, showMicNotice, t])

  const isCommandValid = useMemo(() => {
    if (!localValue.startsWith("/")) return false
    const firstWord = localValue.slice(1).split(" ")[0]
    if (!firstWord) return false
    return allSlashCommands.some((c) => c.name.toLowerCase().startsWith(firstWord.toLowerCase()))
  }, [localValue, allSlashCommands])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Enter con comando slash EXACTO (ej "/compact" o "/compact args"):
    // ENVÍA al primer Enter. Antes caía en handleSlashKeys, que lo
    // "autocompletaba" a "/compact " y el menú se reabría, atrapando el
    // siguiente Enter en el mismo loop (2-3 Enters para enviar).
    if (e.key === "Enter" && !e.shiftKey && !showAtMenu) {
      const curExact = localValueRef.current ?? ""
      if (curExact.startsWith("/")) {
        const m = curExact.match(/^\/([A-Za-z0-9_-]+)(\s|$)/)
        const name = m?.[1]?.toLowerCase()
        if (name === "theme") {
          if (isMobileInput) return
          e.preventDefault()
          setShowSlashMenu(false)
          handleChange("")
          pushHistory(curExact)
          historyIndexRef.current = -1; setHistoryDraft(null)
          onThemeCommand?.()
          return
        }
        if (m && allSlashCommands.some((c) => c.name.toLowerCase() === name)) {
          if (isMobileInput || isSending) return
          e.preventDefault()
          setShowSlashMenu(false)
          if (curExact.trim()) pushHistory(curExact)
          historyIndexRef.current = -1; setHistoryDraft(null)
          handleSendWithImages()
          return
        }
      }
    }
    if (handleSlashKeys(e)) return
    const cur = localValueRef.current

    if (e.key === "ArrowUp" && !showSlashMenu && !showAtMenu && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
      const h = promptHistoryRef.current
      if (h.length === 0) return
      const idx = historyIndexRef.current
      const isAtStart = textareaRef.current ? textareaRef.current.selectionStart === 0 && textareaRef.current.selectionEnd === 0 : true
      if (idx === -1 && !isAtStart) return

      if (idx === -1 && !cur) { e.preventDefault(); historyIndexRef.current = 0; handleChange(h[0]) }
      else if (idx === -1 && cur) { e.preventDefault(); setHistoryDraft(cur); historyIndexRef.current = 0; handleChange(h[0]) }
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

    const curIsShell = cur.startsWith("!")
    if (curIsShell) {
      if (e.key === "Enter" && !e.shiftKey && !showSlashMenu && !showAtMenu) {
        if (isMobileInput) return
        e.preventDefault()
        const cmd = cur.slice(1).trim()
        if (cmd && onShellSend) { pushHistory(cur); historyIndexRef.current = -1; setHistoryDraft(null); onShellSend(cmd) }
      }
      return
    }

    if (e.key === "Enter" && !e.shiftKey && !showSlashMenu && !showAtMenu && cur.trim().startsWith("/theme")) {
      if (isMobileInput) return
      e.preventDefault()
      handleChange("")
      pushHistory(cur)
      historyIndexRef.current = -1; setHistoryDraft(null)
      onThemeCommand?.()
      return
    }

    if (e.key === "Enter" && !e.shiftKey && !showSlashMenu && !showAtMenu) {
      if (isMobileInput || isSending) return
      e.preventDefault()
      if (cur.trim()) pushHistory(cur)
      historyIndexRef.current = -1; setHistoryDraft(null)
      handleSendWithImages()
    }
  }, [showSlashMenu, showAtMenu, onShellSend, pushHistory, handleChange, handleSendWithImages, handleSlashKeys, historyDraft, onThemeCommand, isMobileInput, isSending, allSlashCommands])

  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const dragDepthRef = useRef(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current += 1
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.length > 0) {
      setIsDraggingOver(true)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // effectAllowed "move" (arrastres del explorador interno) es incompatible
    // con "copy": el navegador no dispara drop y la ruta nunca llega.
    e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed === "move" ? "move" : "copy"
    if (!isDraggingOver) setIsDraggingOver(true)
  }, [isDraggingOver])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) {
      setIsDraggingOver(false)
    }
  }, [])

  const handleComposerDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current = 0
    setIsDraggingOver(false)
    // 1. Archivos externos arrastrados desde el SO
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (const f of Array.from(e.dataTransfer.files)) {
        downscaleImage(f).then((base64) => addImage(base64, f.type || "application/octet-stream", f.name))
      }
      return
    }
    // 2. Elemento arrastrado desde el panel Explorador interno o pestañas
    const path = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain")
    if (path) {
      const cur = localValueRef.current ?? ""
      const sep = cur ? (cur.endsWith(" ") ? "" : " ") : ""
      handleChange(cur + sep + path)
    }
  }, [handleChange, addImage])

  return (
    <div className={`composer${isCommandValid ? " composer-command-mode" : ""}${isShellMode ? " composer-shell-mode" : ""}`} ref={composerRef}>
      {showSlashMenu && slashFiltered.length > 0 && (
        <SlashMenu
          commands={slashFiltered}
          activeIndex={slashIndex}
          onSelect={selectSlashCommand}
          onHover={setSlashIndex}
        />
      )}
      {showAtMenu && (mentionItems.length > 0 || mentionLoading) && (
        <MentionMenu
          items={mentionItems}
          loading={mentionLoading}
          activeIndex={atIndex}
          onSelect={selectMention}
          onHover={setAtIndex}
        />
      )}
      {micNotice && <div className="composer-notice" role="alert">{micNotice}</div>}
      {images.length > 0 && (
        <ImageStrip images={images} onEdit={setEditingImage} onRemove={handleRemoveImage} />
      )}
      <TurnChangesPanel turns={turnChanges} directory={directory} />
      <div
        className={`composer-input-wrap${supported ? " has-mic" : ""}${isDraggingOver ? " drag-over" : ""}${isWorking ? " is-working" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
          placeholder={t('composer.placeholder') || "Ask anything, @ to mention, / for actions"}
          enterKeyHint="send"
          rows={1}
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
          // Sin maxLength mientras se dicta: el browser truncaría en silencio
          // el texto del mic al superar N y parecería que "se borra el audio".
          // El límite solo bloquea el envío (541) y el texto se conserva.
          maxLength={charLimit > 0 && !isListening ? charLimit : undefined}
        />
        {isDraggingOver && (
          <div className="composer-drop-overlay" aria-hidden="true">
            <span className="composer-drop-text">
              {t('composer.dropToAdd') || "Drop to add to Agent"}
            </span>
          </div>
        )}
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
        {isWorking && (
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
        )}
        <button
          type="button"
          onClick={handleSendWithImages}
          disabled={disabled || isSending || (!localValue.trim() && images.length === 0) || (charLimit > 0 && localValue.length > charLimit)}
          className={`composer-inline-btn composer-send-btn${supported ? " with-mic" : ""}`}
          title={t('composer.send')}
          aria-label={t('composer.send')}
          tabIndex={-1}
        >
          <SendIcon size={18} />
        </button>
      </div>
      {/* Fila de metadatos DEBAJO de la caja de texto, en ambos modos (25-sep).
          Orden: [modo] modelo . contexto, con el agente a la derecha. Los botones
          (adjuntar / enviar / micro) van DENTRO de la caja, absolutos. */}
      <ComposerBar
          activeModelOption={activeModelOption}
          activeModelVariants={activeModelVariants}
          selectedVariant={selectedVariant}
          onChangeVariant={onChangeVariant}
          modelOptions={modelOptions}
          onChangeModel={onChangeModel}
          variantGroups={variantGroups}
          sessionID={sessionID}
          primaryAgentOptions={primaryAgentOptions}
          activeAgentID={activeAgentID}
          onChangeAgent={onChangeAgent}
          disabled={disabled}
          contextLabel={contextLabel}
          valueLength={localValue.length}
          charLimit={charLimit}
        />
      {/* Portal a body: dentro de .composer el backdrop-filter crea un
          containing block que atrapa el fixed y el modal quedaba pegado
          abajo oculto en vez de centrado en viewport. */}
      {editingImage && createPortal(
        <ImageEditor
          src={editingImage.base64}
          mime={editingImage.mime}
          onApply={(base64) => {
            setImages((prev) => prev.map((img) => img.id === editingImage.id ? { ...img, base64 } : img))
            setEditingImage(null)
          }}
          onClose={() => setEditingImage(null)} />,
        document.body
      )}
    </div>
  )
})
