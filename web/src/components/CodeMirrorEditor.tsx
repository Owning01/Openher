// CodeMirrorEditor — reemplazo de LiteEditor sobre CodeMirror 6 (maduro, modular).
// Misma firma de props que LiteEditor: los 3 puntos de montaje no se tocan.
// RAM/bundle: núcleo + solo el lenguaje del archivo activo (import dinámico
// cacheado); sin workers, sin Monaco. Táctil nativo (APK) y theme con las
// vars --code-* del proyecto.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Compartment, EditorState, type Extension } from "@codemirror/state"
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
} from "@codemirror/view"
import { history, defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands"
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search"
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete"
import {
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  HighlightStyle,
  foldGutter,
  foldKeymap,
} from "@codemirror/language"
import { tags as t } from "@lezer/highlight"

const FONT_KEY = "opencode.editor.fontSize"
const WRAP_KEY = "opencode.editor.wrap"
const TAB_KEY = "opencode.editor.tabSize"

export type EditorCursor = { line: number; col: number }

type Props = {
  path: string
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCursor?: (c: EditorCursor) => void
  vsPath?: string
  /** Contenido guardado: habilita el diff de "cambios sin guardar" */
  savedValue?: string
}

function readPref(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
function writePref(key: string, v: string): void {
  try {
    localStorage.setItem(key, v)
  } catch { /* privado: se pierde al recargar */ }
}

// Lenguaje por extensión, cacheado por clave (un solo parser vivo por tipo).
const langCache = new Map<string, Promise<Extension>>()
function langForPath(path: string): Promise<Extension> {
  const ext = path.split(".").pop()?.toLowerCase() ?? ""
  const hit = langCache.get(ext)
  if (hit) return hit
  const none = Promise.resolve([] as unknown as Extension)
  let p: Promise<Extension>
  switch (ext) {
    case "js": case "jsx": case "mjs": case "cjs":
      p = import("@codemirror/lang-javascript").then((m) => m.javascript())
      break
    case "ts": case "mts":
      p = import("@codemirror/lang-javascript").then((m) => m.javascript({ typescript: true }))
      break
    case "tsx":
      p = import("@codemirror/lang-javascript").then((m) => m.javascript({ typescript: true, jsx: true }))
      break
    case "json": case "jsonc":
      p = import("@codemirror/lang-json").then((m) => m.json())
      break
    case "py": case "pyw":
      p = import("@codemirror/lang-python").then((m) => m.python())
      break
    case "css": case "scss": case "less":
      p = import("@codemirror/lang-css").then((m) => m.css())
      break
    case "html": case "htm": case "svg": case "vue": case "svelte":
      p = import("@codemirror/lang-html").then((m) => m.html())
      break
    case "xml":
      p = import("@codemirror/lang-xml").then((m) => m.xml())
      break
    case "sql":
      p = import("@codemirror/lang-sql").then((m) => m.sql())
      break
    case "yml": case "yaml":
      p = import("@codemirror/lang-yaml").then((m) => m.yaml())
      break
    case "md": case "markdown":
      p = import("@codemirror/lang-markdown").then((m) => m.markdown())
      break
    case "go":
      p = import("@codemirror/lang-go").then((m) => m.go())
      break
    case "rs":
      p = import("@codemirror/lang-rust").then((m) => m.rust())
      break
    case "sh": case "bash": case "zsh":
      p = Promise.all([import("@codemirror/language"), import("@codemirror/legacy-modes/mode/shell")])
        .then(([cm, m]) => cm.StreamLanguage.define(m.shell))
      break
    case "diff": case "patch":
      p = Promise.all([import("@codemirror/language"), import("@codemirror/legacy-modes/mode/diff")])
        .then(([cm, m]) => cm.StreamLanguage.define(m.diff))
      break
    case "toml": case "ini": case "cfg":
      p = Promise.all([import("@codemirror/language"), import("@codemirror/legacy-modes/mode/toml")])
        .then(([cm, m]) => cm.StreamLanguage.define(m.toml))
      break
    default:
      p = none
      break
  }
  // Fallo de chunk (APK sin ese split): plano, nunca rompe el editor.
  const safe = p.catch(() => [] as unknown as Extension)
  langCache.set(ext, safe)
  return safe
}

// Paleta = tokens del editor (ver editor.css .liteed-hl).
const appHighlight = HighlightStyle.define([
  { tag: t.keyword, color: "#c678dd" },
  { tag: [t.string, t.regexp], color: "#98c379" },
  { tag: [t.number, t.bool, t.null], color: "#d19a66" },
  { tag: [t.comment, t.quote], color: "var(--muted)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: "#61afef" },
  { tag: [t.typeName, t.className, t.standard(t.name)], color: "#e5c07b" },
  { tag: [t.variableName, t.propertyName, t.attributeName], color: "#56b6c2" },
  { tag: [t.operator, t.punctuation], color: "var(--text)" },
])

const appTheme = EditorView.theme({
  "&": { backgroundColor: "var(--surface)", color: "var(--text)", height: "100%" },
  ".cm-scroller": { overflow: "auto" },
  ".cm-content": {
    fontFamily: "Consolas, 'Cascadia Mono', monospace",
    caretColor: "var(--primary)",
    padding: "10px 12px",
  },
  ".cm-gutters": {
    backgroundColor: "var(--surface-subtle)",
    color: "var(--muted)",
    borderRight: "1px solid var(--border-subtle)",
  },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--primary) 7%, transparent)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    background: "color-mix(in srgb, var(--primary) 28%, transparent)",
  },
  ".cm-cursor": { borderLeftColor: "var(--primary)" },
  ".cm-searchMatch": { backgroundColor: "color-mix(in srgb, var(--warning) 35%, transparent)" },
}, { dark: true })

export const CodeMirrorEditor = memo(function CodeMirrorEditor({ path, value, onChange, onSave, onCursor, savedValue }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const diffMountRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const langCompRef = useRef(new Compartment())
  const tabCompRef = useRef(new Compartment())
  const wrapCompRef = useRef(new Compartment())
  const lastEmittedRef = useRef(value)
  const suppressRef = useRef(false)
  const cbRef = useRef({ onChange, onSave, onCursor })
  cbRef.current = { onChange, onSave, onCursor }

  const [fontSize, setFontSize] = useState(() => {
    const n = parseInt(readPref(FONT_KEY, "13"), 10)
    return Number.isFinite(n) ? Math.min(24, Math.max(10, n)) : 13
  })
  const [wrap, setWrap] = useState(() => readPref(WRAP_KEY, "off") === "on")
  const [tabSize, setTabSize] = useState(() => (parseInt(readPref(TAB_KEY, "2"), 10) === 4 ? 4 : 2))
  const [diffOpen, setDiffOpen] = useState(false)

  // Crear vista una vez.
  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const view = new EditorView({
      doc: lastEmittedRef.current,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        syntaxHighlighting(appHighlight),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab,
          { key: "Mod-s", run: () => { cbRef.current.onSave(); return true }, preventDefault: true },
        ]),
        langCompRef.current.of([]),
        tabCompRef.current.of(EditorState.tabSize.of(tabSize)),
        wrapCompRef.current.of(wrap ? EditorView.lineWrapping : []),
        appTheme,
        EditorView.updateListener.of((u) => {
          if (u.docChanged && !suppressRef.current) {
            const doc = u.state.doc.toString()
            lastEmittedRef.current = doc
            cbRef.current.onChange(doc)
          }
          if (u.selectionSet) {
            const head = u.state.selection.main.head
            const line = u.state.doc.lineAt(head)
            cbRef.current.onCursor?.({ line: line.number, col: head - line.from + 1 })
          }
        }),
      ],
      parent: el,
    })
    viewRef.current = view
    return () => { view.destroy(); viewRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cambio de archivo: idioma + contenido.
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    let live = true
    void langForPath(path).then((lang) => {
      if (!live || !viewRef.current) return
      view.dispatch({ effects: langCompRef.current.reconfigure(lang) })
    })
    suppressRef.current = true
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      effects: undefined,
    })
    suppressRef.current = false
    lastEmittedRef.current = value
    setDiffOpen(false)
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  // Actualización externa del mismo archivo (revert, guardado externo).
  useEffect(() => {
    const view = viewRef.current
    if (!view || value === lastEmittedRef.current) return
    if (view.state.doc.toString() === value) {
      lastEmittedRef.current = value
      return
    }
    suppressRef.current = true
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
    suppressRef.current = false
    lastEmittedRef.current = value
  }, [value])

  // Prefs en vivo (mismas keys que LiteEditor).
  useEffect(() => {
    viewRef.current?.dispatch({ effects: tabCompRef.current.reconfigure(EditorState.tabSize.of(tabSize)) })
  }, [tabSize])
  useEffect(() => {
    viewRef.current?.dispatch({ effects: wrapCompRef.current.reconfigure(wrap ? EditorView.lineWrapping : []) })
  }, [wrap])

  const bumpFont = useCallback((d: number) => {
    setFontSize((f) => {
      const n = Math.min(24, Math.max(10, f + d))
      writePref(FONT_KEY, String(n))
      return n
    })
  }, [])
  const toggleTab = useCallback(() => {
    setTabSize((t) => {
      const n = t === 2 ? 4 : 2
      writePref(TAB_KEY, String(n))
      return n
    })
  }, [])
  const toggleWrap = useCallback(() => {
    setWrap((w) => {
      writePref(WRAP_KEY, w ? "off" : "on")
      return !w
    })
  }, [])

  // Diff vs guardado con @codemirror/merge (solo lectura, liviano).
  const diffExts = useMemo(() => [appTheme, syntaxHighlighting(appHighlight)], [])
  useEffect(() => {
    const el = diffMountRef.current
    if (!el || !diffOpen || savedValue === undefined) return
    let live = true
    let mv: { destroy(): void } | null = null
    void (async () => {
      const [{ MergeView }, lang] = await Promise.all([
        import("@codemirror/merge"),
        langForPath(path),
      ])
      if (!live) return
      mv = new MergeView({
        a: { doc: savedValue, extensions: [...diffExts, lang] },
        b: { doc: value, extensions: [...diffExts, lang, EditorState.readOnly.of(true)] },
        parent: el,
        orientation: "a-b",
      })
    })().catch(() => { /* chunk ausente: se queda el editor */ })
    return () => { live = false; mv?.destroy(); el.replaceChildren() }
  }, [diffOpen, savedValue, path, value, diffExts])

  return (
    <div className="cm-wrap" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, minWidth: 0 }}>
      <div className="liteed-toolbar" role="toolbar" aria-label="Editor">
        <button type="button" className="liteed-btn" onClick={() => bumpFont(-1)} title="Reducir letra">A-</button>
        <button type="button" className="liteed-btn" onClick={() => bumpFont(1)} title="Aumentar letra">A+</button>
        <button type="button" className="liteed-btn" onClick={toggleTab} title="Tamaño de indentación">T{tabSize}</button>
        <button type="button" className={`liteed-btn${wrap ? " active" : ""}`} onClick={toggleWrap} title="Ajuste de línea">Wrap</button>
        {savedValue !== undefined && (
          <button type="button" className={`liteed-btn${diffOpen ? " active" : ""}`}
            onClick={() => setDiffOpen((v) => !v)} title="Ver cambios sin guardar">
            {diffOpen ? "Cerrar diff" : "Diff"}
          </button>
        )}
      </div>
      <div className="cm-body" style={{ flex: 1, minHeight: 0, minWidth: 0, position: "relative", fontSize, display: diffOpen ? "none" : "block" }}>
        <div ref={mountRef} className="cm-mount" style={{ position: "absolute", inset: 0, overflow: "hidden" }} />
      </div>
      {diffOpen && savedValue !== undefined && (
        <div className="cm-diff" style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <div ref={diffMountRef} />
        </div>
      )}
    </div>
  )
})
