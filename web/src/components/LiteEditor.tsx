// LiteEditor — mini-editor tipo Monaco con cero dependencias.
// Técnica overlay: un <textarea> transparente captura input nativo (IME, táctil,
// accesibilidad) sobre un <pre> con highlight diferido vía lowlight existente.
// RAM: un solo string (vive en el padre), highlight con debounce + cap para
// archivos grandes, gutter como un único bloque de texto (sin divs por línea).
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { lowlight, langFromFilename } from "../utils/highlight"
import {
  autoIndentForEnter,
  commentPrefixFor,
  countOccurrences,
  deleteLine,
  duplicateLineOrSelection,
  escapeHtml,
  findNext,
  getLineCol,
  hastToHtml,
  indentSelection,
  isCloser,
  lineRangeOf,
  moveLine,
  offsetFromLineCol,
  pairCloser,
  toggleLineComment,
  trimTrailingWhitespace,
  type HastNode,
} from "../utils/editorOps"

const HL_MAX_CHARS = 200_000
const HL_MAX_LINES = 5000
const GUTTER_MAX_LINES = 20000
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
}

function readPref(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export const LiteEditor = memo(function LiteEditor({ path, value, onChange, onSave, onCursor, vsPath }: Props) {
  const [fontSize, setFontSize] = useState(() => {
    const n = parseInt(readPref(FONT_KEY, "13"), 10)
    return Number.isFinite(n) ? Math.min(24, Math.max(10, n)) : 13
  })
  const [wrap, setWrap] = useState(() => readPref(WRAP_KEY, "off") === "on")
  const [tabSize, setTabSize] = useState(() => {
    const n = parseInt(readPref(TAB_KEY, "2"), 10)
    return n === 4 ? 4 : 2
  })
  const [findOpen, setFindOpen] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [replaceWith, setReplaceWith] = useState("")
  const [matchCase, setMatchCase] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteFilter, setPaletteFilter] = useState("")
  const [gotoOpen, setGotoOpen] = useState(false)
  const [gotoValue, setGotoValue] = useState("")
  const [hlHtml, setHlHtml] = useState("")

  const taRef = useRef<HTMLTextAreaElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const gutterInnerRef = useRef<HTMLDivElement | null>(null)
  const cursorRaf = useRef(0)
  const valueRef = useRef(value)
  valueRef.current = value

  const tab = tabSize === 4 ? "    " : "  "

  const setPref = useCallback((key: string, v: string) => {
    try {
      localStorage.setItem(key, v)
    } catch {
      /* privado: se pierde al recargar */
    }
  }, [])

  // Conteo de líneas sin split (sin duplicar el archivo en RAM)
  const lineCount = useMemo(() => {
    let n = 1
    for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) === 10) n++
    return n
  }, [value])
  const highlightable = value.length <= HL_MAX_CHARS && lineCount <= HL_MAX_LINES
  const plainMode = !highlightable

  // Highlight diferido: no bloquea el tipeo; archivos grandes van en plano
  useEffect(() => {
    if (!highlightable) {
      setHlHtml("")
      return
    }
    const id = window.setTimeout(() => {
      try {
        const lang = langFromFilename(path)
        if (lang === "plaintext") {
          setHlHtml("")
          return
        }
        const tree = lowlight.highlight(lang, valueRef.current) as unknown as { children?: HastNode[] }
        setHlHtml(hastToHtml(tree.children))
      } catch {
        setHlHtml("")
      }
    }, 130)
    return () => window.clearTimeout(id)
  }, [value, path, highlightable])

  const codeHtml = useMemo(() => {
    const body = hlHtml || escapeHtml(value)
    return body + (value.endsWith("\n") ? " " : "\n ")
  }, [hlHtml, value])

  // Gutter: un solo string, sin N nodos. Con wrap se oculta (las líneas
  // visuales no coinciden con las lógicas; VSCode resuelve con layout caro).
  const gutterText = useMemo(() => {
    if (wrap || lineCount > GUTTER_MAX_LINES) return ""
    let s = ""
    for (let i = 1; i <= lineCount; i++) s += i + "\n"
    return s
  }, [wrap, lineCount])

  const syncGutter = useCallback(() => {
    const sc = scrollRef.current
    const g = gutterInnerRef.current
    if (sc && g) g.style.transform = `translateY(${-sc.scrollTop}px)`
  }, [])

  const reportCursor = useCallback(() => {
    if (cursorRaf.current) return
    cursorRaf.current = requestAnimationFrame(() => {
      cursorRaf.current = 0
      const ta = taRef.current
      if (!ta || !onCursor) return
      const { line, col } = getLineCol(valueRef.current, ta.selectionStart ?? 0)
      onCursor({ line, col })
    })
  }, [onCursor])

  // Aplica una edición y restaura selección/caret tras el onChange controlado
  const applyEdit = useCallback(
    (next: string, selStart: number, selEnd: number) => {
      onChange(next)
      requestAnimationFrame(() => {
        const ta = taRef.current
        if (!ta) return
        try {
          ta.setSelectionRange(selStart, selEnd)
        } catch {
          /* ignore */
        }
        ta.focus()
      })
    },
    [onChange]
  )

  const focusTa = useCallback(() => {
    taRef.current?.focus()
  }, [])

  const jumpToOffset = useCallback(
    (off: number, len = 0) => {
      const ta = taRef.current
      if (!ta) return
      try {
        ta.setSelectionRange(off, off + len)
      } catch {
        /* ignore */
      }
      ta.focus()
      // Lleva el match al viewport vertical
      try {
        const { line } = getLineCol(valueRef.current, off)
        const sc = scrollRef.current
        if (sc) {
          const lh = fontSize * 1.55
          const y = (line - 1) * lh
          if (y < sc.scrollTop || y > sc.scrollTop + sc.clientHeight - lh * 2) {
            sc.scrollTop = Math.max(0, y - sc.clientHeight / 3)
          }
        }
      } catch {
        /* ignore */
      }
      reportCursor()
    },
    [fontSize, reportCursor]
  )

  // ---- operaciones sobre la selección actual ----
  const withSelection = useCallback(
    (fn: (text: string, a: number, b: number) => { text: string; selStart: number; selEnd: number } | null) => {
      const ta = taRef.current
      if (!ta) return
      const r = fn(valueRef.current, ta.selectionStart ?? 0, ta.selectionEnd ?? 0)
      if (r) applyEdit(r.text, r.selStart, r.selEnd)
    },
    [applyEdit]
  )

  const doComment = useCallback(() => {
    const prefix = commentPrefixFor(path)
    withSelection((t, a, b) => toggleLineComment(t, a, b, prefix))
  }, [path, withSelection])
  const doDuplicate = useCallback(() => withSelection((t, a, b) => duplicateLineOrSelection(t, a, b)), [withSelection])
  const doDeleteLine = useCallback(() => withSelection((t, a, b) => deleteLine(t, a, b)), [withSelection])
  const doMove = useCallback((dir: -1 | 1) => withSelection((t, a, b) => moveLine(t, a, b, dir)), [withSelection])
  const doIndent = useCallback(
    (outdent: boolean) => withSelection((t, a, b) => indentSelection(t, a, b, tab, outdent)),
    [tab, withSelection]
  )
  const doTrim = useCallback(() => {
    const { text, removed } = trimTrailingWhitespace(valueRef.current)
    if (removed > 0) {
      const ta = taRef.current
      const pos = ta ? Math.min(ta.selectionStart ?? 0, text.length) : 0
      applyEdit(text, pos, pos)
    }
  }, [applyEdit])
  const doCase = useCallback(
    (upper: boolean) => {
      const ta = taRef.current
      if (!ta) return
      const a = ta.selectionStart ?? 0
      const b = ta.selectionEnd ?? 0
      if (b <= a) return
      const t = valueRef.current
      const chunk = t.slice(a, b)
      applyEdit(t.slice(0, a) + (upper ? chunk.toUpperCase() : chunk.toLowerCase()) + t.slice(b), a, b)
    },
    [applyEdit]
  )

  // ---- find / replace ----
  const matchCount = useMemo(
    () => (query ? countOccurrences(value, query, matchCase) : 0),
    [value, query, matchCase]
  )
  const findJump = useCallback(
    (forward: boolean) => {
      const ta = taRef.current
      if (!ta || !query) return
      const t = valueRef.current
      const from = forward ? ta.selectionEnd ?? 0 : Math.max(0, (ta.selectionStart ?? 0) - query.length - 1)
      let idx: number
      if (!forward) {
        const h = matchCase ? t : t.toLowerCase()
        const n = matchCase ? query : query.toLowerCase()
        let j = h.lastIndexOf(n, from)
        if (j === -1) j = h.lastIndexOf(n)
        idx = j
      } else {
        idx = findNext(t, query, from, matchCase)
      }
      if (idx >= 0) jumpToOffset(idx, query.length)
    },
    [query, matchCase, jumpToOffset]
  )
  const doReplaceOne = useCallback(() => {
    const ta = taRef.current
    if (!ta || !query) return
    const t = valueRef.current
    const a = ta.selectionStart ?? 0
    const sel = t.slice(a, ta.selectionEnd ?? 0)
    const eq = matchCase ? sel === query : sel.toLowerCase() === query.toLowerCase()
    if (eq) {
      applyEdit(t.slice(0, a) + replaceWith + t.slice(a + sel.length), a, a + replaceWith.length)
    } else {
      findJump(true)
    }
  }, [query, replaceWith, matchCase, applyEdit, findJump])
  const doReplaceAll = useCallback(() => {
    if (!query) return
    const t = valueRef.current
    let out: string
    if (matchCase) out = t.split(query).join(replaceWith)
    else {
      const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
      out = t.replace(re, replaceWith)
    }
    if (out !== t) {
      const ta = taRef.current
      const pos = ta ? Math.min(ta.selectionStart ?? 0, out.length) : 0
      applyEdit(out, pos, pos)
    }
  }, [query, replaceWith, matchCase, applyEdit])

  const doGoto = useCallback(() => {
    const m = gotoValue.trim().match(/^(\d+)(?::(\d+))?$/)
    if (!m) return
    const off = offsetFromLineCol(valueRef.current, parseInt(m[1], 10), m[2] ? parseInt(m[2], 10) : 1)
    setGotoOpen(false)
    jumpToOffset(off)
  }, [gotoValue, jumpToOffset])

  // ---- paleta de comandos (automatización) ----
  const commands = useMemo(
    () => [
      { id: "save", label: "Guardar archivo", hint: "Ctrl+S", run: () => onSave() },
      { id: "find", label: "Buscar en archivo", hint: "Ctrl+F", run: () => { setFindOpen(true); setReplaceOpen(false) } },
      { id: "replace", label: "Buscar y reemplazar", hint: "Ctrl+H", run: () => { setFindOpen(true); setReplaceOpen(true) } },
      { id: "goto", label: "Ir a línea…", hint: "Ctrl+G", run: () => setGotoOpen(true) },
      { id: "wrap", label: wrap ? "Desactivar ajuste de línea" : "Activar ajuste de línea", hint: "", run: () => { setWrap((v) => { setPref(WRAP_KEY, v ? "off" : "on"); return !v }) } },
      { id: "font+", label: "Aumentar tamaño de letra", hint: "Ctrl++", run: () => setFontSize((f) => { const n = Math.min(24, f + 1); setPref(FONT_KEY, String(n)); return n }) },
      { id: "font-", label: "Reducir tamaño de letra", hint: "Ctrl+-", run: () => setFontSize((f) => { const n = Math.max(10, f - 1); setPref(FONT_KEY, String(n)); return n }) },
      { id: "tab", label: tabSize === 2 ? "Usar indent de 4 espacios" : "Usar indent de 2 espacios", hint: "", run: () => setTabSize((t) => { const n = t === 2 ? 4 : 2; setPref(TAB_KEY, String(n)); return n }) },
      { id: "comment", label: "Comentar / descomentar líneas", hint: "Ctrl+/", run: doComment },
      { id: "dup", label: "Duplicar línea o selección", hint: "Ctrl+D", run: doDuplicate },
      { id: "delline", label: "Eliminar línea", hint: "Ctrl+Shift+K", run: doDeleteLine },
      { id: "moveup", label: "Mover línea hacia arriba", hint: "Alt+↑", run: () => doMove(-1) },
      { id: "movedn", label: "Mover línea hacia abajo", hint: "Alt+↓", run: () => doMove(1) },
      { id: "trim", label: "Recortar espacios al final", hint: "", run: doTrim },
      { id: "upper", label: "Selección a MAYÚSCULAS", hint: "", run: () => doCase(true) },
      { id: "lower", label: "Selección a minúsculas", hint: "", run: () => doCase(false) },
    ],
    [onSave, wrap, tabSize, doComment, doDuplicate, doDeleteLine, doMove, doTrim, doCase, setPref]
  )
  const filteredCommands = useMemo(() => {
    const q = paletteFilter.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q))
  }, [commands, paletteFilter])

  const closeOverlays = useCallback(() => {
    setPaletteOpen(false)
    setGotoOpen(false)
    setFindOpen(false)
    focusTa()
  }, [focusTa])

  // ---- teclado ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget
      const mod = e.ctrlKey || e.metaKey
      if (e.key === "Escape") {
        e.preventDefault()
        closeOverlays()
        return
      }
      if (mod && e.shiftKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault()
        setPaletteFilter("")
        setPaletteOpen(true)
        return
      }
      if (e.key === "F1") {
        e.preventDefault()
        setPaletteFilter("")
        setPaletteOpen(true)
        return
      }
      if (mod && (e.key === "s" || e.key === "S")) {
        e.preventDefault()
        onSave()
        return
      }
      if (mod && (e.key === "f" || e.key === "F")) {
        e.preventDefault()
        setFindOpen(true)
        setReplaceOpen(false)
        return
      }
      if (mod && (e.key === "h" || e.key === "H")) {
        e.preventDefault()
        setFindOpen(true)
        setReplaceOpen(true)
        return
      }
      if (mod && (e.key === "g" || e.key === "G")) {
        e.preventDefault()
        setGotoValue("")
        setGotoOpen(true)
        return
      }
      if (mod && e.key === "/") {
        e.preventDefault()
        doComment()
        return
      }
      if (mod && (e.key === "d" || e.key === "D")) {
        e.preventDefault()
        doDuplicate()
        return
      }
      if (mod && e.shiftKey && (e.key === "K" || e.key === "k")) {
        e.preventDefault()
        doDeleteLine()
        return
      }
      if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault()
        setFontSize((f) => { const n = Math.min(24, f + 1); setPref(FONT_KEY, String(n)); return n })
        return
      }
      if (mod && e.key === "-") {
        e.preventDefault()
        setFontSize((f) => { const n = Math.max(10, f - 1); setPref(FONT_KEY, String(n)); return n })
        return
      }
      if (e.altKey && e.key === "ArrowUp") {
        e.preventDefault()
        doMove(-1)
        return
      }
      if (e.altKey && e.key === "ArrowDown") {
        e.preventDefault()
        doMove(1)
        return
      }
      if (e.key === "Tab") {
        e.preventDefault()
        doIndent(e.shiftKey)
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        const t = valueRef.current
        const caret = ta.selectionStart ?? 0
        const { start } = lineRangeOf(t, caret)
        const lineBefore = t.slice(start, caret)
        const ins = autoIndentForEnter(lineBefore, tab)
        const a = ta.selectionStart ?? 0
        const b = ta.selectionEnd ?? 0
        applyEdit(t.slice(0, a) + ins + t.slice(b), a + ins.length, a + ins.length)
        return
      }
      // Auto-cierre de pares + salto sobre el cierre ya escrito
      if (!mod && !e.altKey && e.key.length === 1) {
        const closer = pairCloser(e.key)
        const t = valueRef.current
        const a = ta.selectionStart ?? 0
        const b = ta.selectionEnd ?? 0
        if (closer && a === b) {
          const next = t[a]
          if (next === e.key && isCloser(e.key)) {
            e.preventDefault()
            try { ta.setSelectionRange(a + 1, a + 1) } catch { /* ignore */ }
            reportCursor()
            return
          }
          if (/["'`]/.test(e.key) && (/\w/.test(next ?? "") || next === e.key)) {
            return // no auto-cerrar ante palabra o mismo quote: escribe normal
          }
          e.preventDefault()
          applyEdit(t.slice(0, a) + e.key + closer + t.slice(a), a + 1, a + 1)
          return
        }
      }
    },
    [closeOverlays, onSave, doComment, doDuplicate, doDeleteLine, doMove, doIndent, tab, applyEdit, reportCursor, setPref]
  )

  const metrics = useMemo(
    () => ({
      fontFamily: "Consolas, 'Cascadia Mono', monospace",
      fontSize,
      lineHeight: 1.55,
      tabSize,
      padding: "10px 12px",
      whiteSpace: (wrap ? "pre-wrap" : "pre") as "pre-wrap" | "pre",
    }),
    [fontSize, tabSize, wrap]
  )

  return (
    <div className="liteed" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0 }}>
      <div className="liteed-toolbar" role="toolbar" aria-label="Herramientas del editor">
        <button type="button" className="liteed-btn" onClick={() => { setPaletteFilter(""); setPaletteOpen((v) => !v) }} title="Paleta de comandos (Ctrl+Shift+P)">Comandos</button>
        <button type="button" className={`liteed-btn${wrap ? " active" : ""}`} onClick={() => setWrap((v) => { setPref(WRAP_KEY, v ? "off" : "on"); return !v })} title={wrap ? "Ajuste de línea activado" : "Ajuste de línea desactivado"}>Wrap</button>
        <button type="button" className="liteed-btn" onClick={() => { setFindOpen((v) => !v); setReplaceOpen(false) }} title="Buscar (Ctrl+F)">Buscar</button>
        <button type="button" className="liteed-btn" onClick={() => setFontSize((f) => { const n = Math.max(10, f - 1); setPref(FONT_KEY, String(n)); return n })} title="Reducir letra">A-</button>
        <button type="button" className="liteed-btn" onClick={() => setFontSize((f) => { const n = Math.min(24, f + 1); setPref(FONT_KEY, String(n)); return n })} title="Aumentar letra">A+</button>
        <button type="button" className="liteed-btn" onClick={() => setTabSize((t) => { const n = t === 2 ? 4 : 2; setPref(TAB_KEY, String(n)); return n })} title="Tamaño de indentación">Tab:{tabSize}</button>
        {plainMode && <span className="liteed-plain" title="Archivo grande: resaltado desactivado para mantener la respuesta">plano</span>}
      </div>
      <div className="liteed-body">
        {!wrap && gutterText && (
          <div className="liteed-gutter" aria-hidden="true" style={{ fontSize, lineHeight: metrics.lineHeight }}>
            <div ref={gutterInnerRef} className="liteed-gutter-inner">{gutterText}</div>
          </div>
        )}
        <div ref={scrollRef} className="liteed-scroll" onScroll={syncGutter}>
          <div className={`liteed-stack${wrap ? " is-wrap" : ""}`}>
            <pre
              aria-hidden="true"
              className={`liteed-hl${hlHtml ? " has-hl" : ""}`}
              style={{
                fontFamily: metrics.fontFamily,
                fontSize: metrics.fontSize,
                lineHeight: metrics.lineHeight,
                tabSize: metrics.tabSize,
                padding: metrics.padding,
                whiteSpace: metrics.whiteSpace,
                overflowWrap: wrap ? "anywhere" : "normal",
              }}
            ><code dangerouslySetInnerHTML={{ __html: codeHtml }} /></pre>
            <textarea
              ref={taRef}
              data-vs-path={vsPath}
              className="liteed-input"
              style={{
                fontFamily: metrics.fontFamily,
                fontSize: metrics.fontSize,
                lineHeight: metrics.lineHeight,
                tabSize: metrics.tabSize,
                padding: metrics.padding,
                whiteSpace: metrics.whiteSpace,
              }}
              wrap={wrap ? "soft" : "off"}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onSelect={reportCursor}
              onKeyUp={reportCursor}
              onClick={reportCursor}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
        </div>
        {findOpen && (
            <div className="liteed-find" role="search">
              <input
                autoFocus
                className="liteed-find-input"
                placeholder="Buscar…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") findJump(!e.shiftKey)
                  else if (e.key === "Escape") { e.stopPropagation(); closeOverlays() }
                }}
              />
              <span className="liteed-count" title="Coincidencias">{query ? matchCount : "—"}</span>
              <button type="button" className="liteed-btn" onClick={() => findJump(false)} title="Anterior (Shift+Enter)">↑</button>
              <button type="button" className="liteed-btn" onClick={() => findJump(true)} title="Siguiente (Enter)">↓</button>
              <button type="button" className={`liteed-btn${matchCase ? " active" : ""}`} onClick={() => setMatchCase((v) => !v)} title="Distinguir mayúsculas">Aa</button>
              {!replaceOpen && (
                <button type="button" className="liteed-btn" onClick={() => setReplaceOpen(true)} title="Mostrar reemplazo">±</button>
              )}
              <button type="button" className="liteed-btn" onClick={closeOverlays} title="Cerrar (Esc)">×</button>
              {replaceOpen && (
                <div className="liteed-replace-row">
                  <input
                    className="liteed-find-input"
                    placeholder="Reemplazar por…"
                    value={replaceWith}
                    onChange={(e) => setReplaceWith(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") doReplaceOne()
                      else if (e.key === "Escape") { e.stopPropagation(); closeOverlays() }
                    }}
                  />
                  <button type="button" className="liteed-btn" onClick={doReplaceOne} title="Reemplazar actual">1×</button>
                  <button type="button" className="liteed-btn" onClick={doReplaceAll} title="Reemplazar todas">Todo</button>
                </div>
              )}
            </div>
          )}
          {gotoOpen && (
            <div className="liteed-goto" role="dialog" aria-label="Ir a línea">
              <input
                autoFocus
                className="liteed-find-input"
                placeholder="línea[:col] — ej 120:8"
                value={gotoValue}
                onChange={(e) => setGotoValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") doGoto()
                  else if (e.key === "Escape") { e.stopPropagation(); closeOverlays() }
                }}
              />
              <span className="liteed-count">de {lineCount}</span>
              <button type="button" className="liteed-btn" onClick={doGoto} title="Ir">Ir</button>
              <button type="button" className="liteed-btn" onClick={closeOverlays} title="Cerrar (Esc)">×</button>
            </div>
          )}
          {paletteOpen && (
            <div className="liteed-palette" role="dialog" aria-label="Paleta de comandos">
              <input
                autoFocus
                className="liteed-find-input"
                placeholder="Escribe un comando…"
                value={paletteFilter}
                onChange={(e) => setPaletteFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredCommands[0]) {
                    const cmd = filteredCommands[0]
                    setPaletteOpen(false)
                    focusTa()
                    cmd.run()
                  } else if (e.key === "Escape") { e.stopPropagation(); closeOverlays() }
                }}
              />
              <div className="liteed-palette-list">
                {filteredCommands.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="liteed-palette-item"
                    onClick={() => { setPaletteOpen(false); focusTa(); c.run() }}
                  >
                    <span>{c.label}</span>
                    {c.hint && <span className="liteed-hint">{c.hint}</span>}
                  </button>
                ))}
                {filteredCommands.length === 0 && <div className="liteed-empty">Sin coincidencias</div>}
              </div>
            </div>
          )}
      </div>
    </div>
  )
})
