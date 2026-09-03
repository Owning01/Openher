import { useCallback, useState, useMemo, useEffect } from "react"

export type VisualSelection = {
  id: string
  filePath: string
  fileName: string
  lineStart: number | null
  lineEnd: number | null
  selectedText: string
  surroundingContext: string
  language?: string
  boundingRect?: { x: number; y: number; w: number; h: number }
  outerHTML?: string
  selector?: string
  timestamp: number
}

export type VisualSource = { file: string; line: number | null } | null

export type VisualMember = {
  tmpId?: string
  tag: string
  selector: string
  outerHTML: string
  innerText?: string
  boundingRect?: { x: number; y: number; w: number; h: number }
  source?: VisualSource
}

export type VisualAnnotation = {
  id: string
  tmpId?: string
  mode?: "picker" | "pod"
  members?: VisualMember[]
  tag: string
  selector: string
  xpath?: string
  outerHTML: string
  innerText: string
  boundingRect: { x: number; y: number; w: number; h: number }
  bx?: number
  by?: number
  url: string
  source?: VisualSource
  comment: string
  styleDraft?: Record<string, string>
  styleBefore?: Record<string, string | null>
  timestamp: number
}

function extToLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? ""
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", rs: "rust", go: "go", java: "java",
    html: "html", css: "css", scss: "scss", json: "json",
    md: "markdown", yaml: "yaml", yml: "yaml", sh: "bash",
    sql: "sql", toml: "toml", xml: "xml",
  }
  return map[ext] ?? ext
}

function buildPromptContext(sel: VisualSelection | null): string {
  if (!sel) return ""
  // Caso preview/DOM (outerHTML presente): scropear a elemento visual
  if (sel.outerHTML) {
    const loc = sel.filePath // para preview filePath es URL
    const selPath = sel.selector ? ` selector \`${sel.selector}\`` : ""
    const header = `<!-- SELECTED ZONE: elemento visual en ${loc}${selPath} — el agente debe concentrarse SOLO aquí -->`
    const rect = sel.boundingRect ? `Posición: x=${Math.round(sel.boundingRect.x)} y=${Math.round(sel.boundingRect.y)} w=${Math.round(sel.boundingRect.w)} h=${Math.round(sel.boundingRect.h)}` : ""
    const html = sel.outerHTML.trim().slice(0, 4000)
    return `${header}\n${rect ? `${rect}\n` : ""}HTML seleccionado:\n\`\`\`html\n${html}\n\`\`\`${sel.selectedText ? `\nTexto interno: "${sel.selectedText.slice(0, 500)}"` : ""}`
  }
  const lines = sel.lineStart != null && sel.lineEnd != null
    ? `Líneas ${sel.lineStart}-${sel.lineEnd} en \`${sel.filePath}\``
    : `Archivo \`${sel.filePath}\``
  const lang = sel.language ?? extToLanguage(sel.filePath)
  const snippet = sel.selectedText.trim()
  const ctx = sel.surroundingContext.trim()
  const header = `<!-- SELECTED ZONE: ${lines} — el agente debe concentrarse SOLO aquí -->`
  if (snippet) {
    return `${header}\n\`\`\`${lang}\n// ${lines}\n${snippet}\n\`\`\`\n${ctx && ctx !== snippet ? `\nContexto cercano:\n\`\`\`${lang}\n${ctx}\n\`\`\`` : ""}`
  }
  return `${header}\nArchivo: \`${sel.filePath}\`\n${ctx ? `\`\`\`${lang}\n${ctx}\n\`\`\`` : ""}`
}

const ZONE_ICONS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"]

function zoneIcon(idx: number): string {
  return ZONE_ICONS[idx] ?? `${idx + 1}`
}

export function formatAnnotationZone(a: VisualAnnotation, idx: number): string {
  const icon = zoneIcon(idx)
  const loc = a.source?.file
    ? `${a.source.file}${a.source.line != null ? `:${a.source.line}` : ""}`
    : a.selector
  const note = a.comment.trim() ? `\nNota del usuario: "${a.comment.trim()}"` : "\nNota del usuario: (sin nota — inferir qué falta de la zona)"
  const styleLines = styleDiffLines(a)
  const styleBlock = styleLines.length > 0
    ? `\nAjustes visuales aplicados en el preview (intent del usuario — replicar en el código fuente):\n${styleLines.map((l) => `- ${l}`).join("\n")}`
    : ""
  if (a.members && a.members.length > 0) {
    // Zona pod: múltiples elementos enclosed
    const list = a.members.slice(0, 6).map((m, i) => {
      const mloc = m.source?.file ? ` · \`${m.source.file}${m.source.line != null ? `:${m.source.line}` : ""}\`` : ""
      return `${i + 1}. <${m.tag}> selector \`${m.selector}\`${mloc}`
    }).join("\n")
    const htmls = a.members.slice(0, 6).map((m) => m.outerHTML.trim().slice(0, 800)).join("\n")
    const extra = a.members.length > 6 ? `\n(+${a.members.length - 6} elementos más en la misma área)` : ""
    return [
      `Zona ${icon} (área arrastrada) · \`${loc}\`${note}${styleBlock}`,
      `Elementos dentro del área:\n${list}${extra}`,
      "HTML:",
      "```html",
      htmls,
      "```",
    ].join("\n")
  }
  const html = a.outerHTML.trim().slice(0, 2500)
  return [
    `Zona ${icon} <${a.tag}> · \`${loc}\`${note}${styleBlock}`,
    "HTML:",
    "```html",
    html,
    "```",
  ].join("\n")
}

function styleDiffLines(a: VisualAnnotation): string[] {
  if (!a.styleDraft) return []
  const before = a.styleBefore ?? {}
  return Object.entries(a.styleDraft)
    .filter(([k, v]) => v && String(v).trim() !== "" && before[k] !== String(v))
    .map(([k, v]) => `${k}: ${before[k] ?? "(valor inicial)"} → ${v}`)
}

function buildAnnotationsPrompt(annotations: VisualAnnotation[]): string {
  if (annotations.length === 0) return ""
  const zones = annotations.map((a, i) => formatAnnotationZone(a, i)).join("\n\n---\n\n")
  const header = `<!-- SELECTED ZONES: ${annotations.length} elemento(s) marcados en el navegador embebido — concentrarse SOLO en estas zonas -->`
  const footer = `<!-- Las rutas \`archivo:línea\` vienen del dev server (React/Vite DEV); si no coinciden exactamente, buscar por el HTML/selector. Editar el código fuente real, nunca solo el DOM. -->`
  return `${header}\n\n${zones}\n\n${footer}`
}

const VISUAL_ANNOTATIONS_KEY = "opencode.visual.annotations"
export function useVisualSelection() {
  const [selection, setSelection] = useState<VisualSelection | null>(null)
  const [annotations, setAnnotations] = useState<VisualAnnotation[]>(() => {
    try {
      const raw = localStorage.getItem(VISUAL_ANNOTATIONS_KEY)
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) return arr.filter((x: any) => x && typeof x.id === "string").slice(0, 9)
      }
    } catch {}
    return []
  })
  const [inspectMode, setInspectMode] = useState(false)
  const [inspectTool, setInspectTool] = useState<"picker" | "pod">("picker")

  useEffect(() => {
    try { localStorage.setItem(VISUAL_ANNOTATIONS_KEY, JSON.stringify(annotations.slice(0, 9))) } catch (e) { console.warn("[Visual] persist annotations failed", e) }
  }, [annotations])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (annotations.length > 0) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    if (annotations.length > 0) window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [annotations.length])

  const select = useCallback((sel: Omit<VisualSelection, "id" | "timestamp">) => {
    setSelection({
      ...sel,
      id: `sel-${Date.now().toString(36)}`,
      timestamp: Date.now(),
    })
    setInspectMode(false)
  }, [])

  const clear = useCallback(() => setSelection(null), [])
  const toggleInspect = useCallback(() => setInspectMode((v) => !v), [])

  const addAnnotation = useCallback((a: Omit<VisualAnnotation, "comment" | "timestamp"> & { comment?: string }) => {
    // El bridge ya etiquetó el elemento con data-oc-tmp=tmpId: usarlo como id
    // para que applyStyle/removeBadge lo encuentren en el DOM.
    const id = a.id || a.tmpId || `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    setAnnotations((prev) => prev.length >= 9 ? prev : [...prev, { ...a, id, comment: a.comment ?? "", timestamp: Date.now() }])
    return id
  }, [])

  const setAnnotationComment = useCallback((id: string, comment: string) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, comment } : a)))
  }, [])

  const setAnnotationStyle = useCallback((id: string, draft: Record<string, string>) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, styleDraft: draft } : a)))
  }, [])

  const setAnnotationStyleBefore = useCallback((id: string, before: Record<string, string | null>) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, styleBefore: before } : a)))
  }, [])

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const clearAnnotations = useCallback(() => setAnnotations([]), [])

  const promptContext = useMemo(() => {
    if (annotations.length > 0) return buildAnnotationsPrompt(annotations)
    return buildPromptContext(selection)
  }, [annotations, selection])

  const hasSelection = selection != null || annotations.length > 0

  return {
    selection,
    annotations,
    annotationCount: annotations.length,
    zoneIcon,
    hasSelection,
    inspectMode,
    inspectTool,
    setInspectMode,
    setInspectTool,
    toggleInspect,
    select,
    clear,
    addAnnotation,
    setAnnotationComment,
    setAnnotationStyle,
    setAnnotationStyleBefore,
    removeAnnotation,
    clearAnnotations,
    promptContext,
    buildPromptContext,
  }
}

export function formatSelectionForPrompt(userText: string, ctx: string): string {
  if (!ctx) return userText
  if (!userText.trim()) return `${ctx}\n\nAplica los cambios pedidos en las zonas marcadas.`
  return `${userText}\n\n${ctx}`
}

export function getVisualSelectionLabel(sel: VisualSelection): string {
  if (sel.outerHTML) {
    const tag = sel.outerHTML.match(/<(\w+)/)?.[1] ?? "elemento"
    const shortSel = sel.selector ? sel.selector.slice(0, 24) : tag
    return `${tag} · ${shortSel}`
  }
  const name = sel.fileName || sel.filePath.split("/").pop() || "archivo"
  if (sel.lineStart != null && sel.lineEnd != null) {
    return sel.lineStart === sel.lineEnd ? `${name}:${sel.lineStart}` : `${name}:${sel.lineStart}-${sel.lineEnd}`
  }
  return name
}
