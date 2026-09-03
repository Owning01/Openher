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
  applyEdits,
  collectWords,
  diffLines,
  findMatchingBracket,
  wordBeforeCaret,
  type HastNode,
  type TextEdit,
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

export const LiteEditor = memo(function LiteEditor({ path, value, onChange, onSave, onCursor, vsPath, savedValue }: Props) {
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
  const [caretOffset, setCaretOffset] = useState(0)
  const [extraCursors, setExtraCursors] = useState<number[]>([])
  const [bracket, setBracket] = useState<{ open: number; close: number } | null>(null)
  const [marks, setMarks] = useState<Array<{ top: number; left: number; height: number; kind: "caret" | "bracket" }>>([])
  const [complete, setComplete] = useState<{ items: string[]; start: number; active: number } | null>(null)
  const [completePos, setCompletePos] = useState<{ top: number; left: number } | null>(null)
  const [diffOpen, setDiffOpen] = useState(false)

  const taRef = useRef<HTMLTextAreaElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const mirrorRef = useRef<HTMLDivElement | null>(null)
  const gutterInnerRef = useRef<HTMLDivElement | null>(null)
  const cursorRaf = useRef(0)
  const valueRef = useRef(value)
  valueRef.current = value
  const cursorsRef = useRef<number[]>([])
  cursorsRef.current = extraCursors
  // Las selecciones programáticas (jump/apply) no deben colapsar multi-cursor.
  // setSelectionRange no dispara 'select' en la mayoría de navegadores, pero
  // Safari/IME sí pueden: el flag lo hace determinista.
  const suppressSelectRef = useRef(false)
  const rafIds = useRef<number[]>([])
  const timeoutIds = useRef<number[]>([])
  useEffect(
    () => () => {
      for (const id of rafIds.current) cancelAnimationFrame(id)
      for (const id of timeoutIds.current) window.clearTimeout(id)
      if (cursorRaf.current) cancelAnimationFrame(cursorRaf.current)
    },
    []
  )
  const later = useCallback((fn: () => void) => {
    const id = requestAnimationFrame(() => {
      rafIds.current = rafIds.current.filter((x) => x !== id)
      fn()
    })
    rafIds.current.push(id)
  }, [])
  const setSel = useCallback((a: number, b: number) => {
    const ta = taRef.current
    if (!ta) return
    suppressSelectRef.current = true
    try {
      ta.setSelectionRange(a, b)
    } catch {
      /* ignore */
    }
    suppressSelectRef.current = false
  }, [])

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

  // Gutter: un solo string, sin N nodos. Sin trailing \n y con la línea
  // extra si el archivo no termina en \n: iguala las cajas del <pre>
  // (codeHtml siempre agrega línea de guarda). Con wrap se oculta.
  const gutterText = useMemo(() => {
    if (wrap) return ""
    const count = lineCount + (value.endsWith("\n") || value.length === 0 ? 0 : 1)
    if (count > GUTTER_MAX_LINES) return ""
    let s = ""
    for (let i = 1; i <= count; i++) s += i + (i < count ? "\n" : "")
    return s
  }, [wrap, lineCount, value])

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
      if (!ta) return
      const off = ta.selectionStart ?? 0
      setCaretOffset(off)
      if (!onCursor) return
      const { line, col } = getLineCol(valueRef.current, off)
      onCursor({ line, col })
    })
  }, [onCursor])

  // Aplica una edición y restaura selección/caret tras el onChange controlado
  const applyEdit = useCallback(
    (next: string, selStart: number, selEnd: number) => {
      onChange(next)
      setExtraCursors([]) // edición de un solo cursor invalida los extras
      later(() => {
        setSel(selStart, selEnd)
        taRef.current?.focus()
      })
    },
    [onChange, later, setSel]
  )

  const focusTa = useCallback(() => {
    taRef.current?.focus()
  }, [])

  const jumpToOffset = useCallback(
    (off: number, len = 0) => {
      setSel(off, off + len)
      taRef.current?.focus()
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
    [fontSize, reportCursor, setSel]
  )

  // Mide coordenadas de un offset con un mirror oculto de igual métrica.
  // Devuelve coords relativas al origen del contenido (sirven dentro del stack).
  const measureOffset = useCallback(
    (off: number): { top: number; left: number; height: number } | null => {
      const mirror = mirrorRef.current
      if (!mirror) return null
      try {
        const t = valueRef.current
        const safe = Math.max(0, Math.min(off, t.length))
        mirror.textContent = t.slice(0, safe)
        const dot = document.createElement("span")
        dot.textContent = "​"
        mirror.appendChild(dot)
        const top = dot.offsetTop
        const left = dot.offsetLeft
        const height = dot.offsetHeight || Math.round(fontSize * 1.55)
        mirror.textContent = ""
        return { top, left, height }
      } catch {
        return null
      }
    },
    [fontSize]
  )

  // Bracket pareja del caret (debounce para no escanear por tecla)
  useEffect(() => {
    if (value.length > 200_000) {
      setBracket(null)
      return
    }
    const id = window.setTimeout(() => {
      try {
        setBracket(findMatchingBracket(valueRef.current, caretOffset))
      } catch {
        setBracket(null)
      }
    }, 90)
    return () => window.clearTimeout(id)
  }, [caretOffset, value])

  // Recalcula carets extra + cajas de bracket tras cada render relevante.
  // Sin nada que medir no toca estado (evita un render extra por tecla).
  useEffect(() => {
    if (extraCursors.length === 0 && !bracket) {
      setMarks((prev) => (prev.length === 0 ? prev : []))
      return
    }
    const out: Array<{ top: number; left: number; height: number; kind: "caret" | "bracket" }> = []
    for (const c of extraCursors) {
      const m = measureOffset(c)
      if (m) out.push({ ...m, kind: "caret" })
    }
    if (bracket) {
      for (const o of [bracket.open, bracket.close]) {
        const m = measureOffset(o)
        if (m) out.push({ top: m.top, left: m.left, height: m.height, kind: "bracket" })
      }
    }
    setMarks(out)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraCursors, bracket, value, fontSize, wrap, tabSize])

  // Diccionario local para autocompletar (topeado)
  const words = useMemo(() => (value.length > 200_000 ? [] : collectWords(value)), [value])

  // Diff diferido: solo se calcula con el panel abierto (LCS caro por tecla no)
  const diff = useMemo(
    () =>
      !diffOpen || savedValue === undefined || savedValue === value
        ? null
        : diffLines(savedValue, value),
    [diffOpen, savedValue, value]
  )
  const DIFF_RENDER_CAP = 500
  const diffCapped = useMemo(() => {
    if (!diff) return null
    let total = 0
    for (const h of diff.hunks) total += h.lines.length
    if (total <= DIFF_RENDER_CAP) return { ...diff, total, capped: false }
    let shown = 0
    const hunks = diff.hunks
      .map((h) => {
        const take = Math.max(0, DIFF_RENDER_CAP - shown)
        shown += h.lines.length
        return { ...h, lines: h.lines.slice(0, take) }
      })
      .filter((h) => h.lines.length > 0)
    return { ...diff, hunks, total, capped: true }
  }, [diff])

  const matchIndex = useMemo(() => {
    if (!query) return 0
    const total = countOccurrences(value, query, matchCase, 5000)
    if (total === 0) return 0
    const n = countOccurrences(value.slice(0, caretOffset), query, matchCase, 5000)
    return Math.min(n + 1, total)
  }, [value, query, matchCase, caretOffset])

  // ---- multi-cursor ----
  const clearExtraCursors = useCallback(() => {
    if (cursorsRef.current.length > 0) setExtraCursors([])
  }, [])

  // Aplica la misma edición en primario + extras. Solo los cursores cuyas
  // ediciones entran (no solapadas) reciben nueva posición; el resto se pierde.
  const applyMulti = useCallback(
    (build: (pos: number, isPrimary: boolean, a: number, b: number) => TextEdit | null) => {
      const ta = taRef.current
      if (!ta) return false
      const t = valueRef.current
      const a = ta.selectionStart ?? 0
      const b = ta.selectionEnd ?? 0
      const points = [a, ...cursorsRef.current]
      const tagged: Array<{ i: number; e: TextEdit }> = []
      points.forEach((p, i) => {
        const e = build(p, i === 0, a, b)
        if (e) tagged.push({ i, e })
      })
      if (tagged.length === 0) return false
      const { text: next, applied } = applyEdits(t, tagged.map((x) => x.e))
      const appliedSet = new Set(applied)
      const asc = tagged
        .filter((x) => appliedSet.has(x.e))
        .sort((x, y) => x.e.start - y.e.start)
      let shift = 0
      const newPos = new Array<number>(points.length).fill(-1)
      for (const { i, e } of asc) {
        newPos[i] = Math.min(next.length, Math.max(0, e.start) + shift + e.insert.length)
        shift += e.insert.length - (e.end - e.start)
      }
      onChange(next)
      const primaryPos = newPos[0] >= 0 ? newPos[0] : a
      const rest = newPos
        .slice(1)
        .filter((p, idx, arr) => p >= 0 && p !== primaryPos && arr.indexOf(p) === idx)
      setExtraCursors(rest)
      later(() => {
        setSel(primaryPos, primaryPos)
        taRef.current?.focus()
      })
      return true
    },
    [onChange, later, setSel]
  )

  const typeAtCursors = useCallback(
    (ch: string) => {
      applyMulti((pos, isPrimary, a, b) =>
        isPrimary && b > a ? { start: a, end: b, insert: ch } : { start: pos, end: pos, insert: ch }
      )
    },
    [applyMulti]
  )

  const backspaceAtCursors = useCallback(() => {
    applyMulti((pos, isPrimary, a, b) => {
      if (isPrimary && b > a) return { start: a, end: b, insert: "" }
      if (pos <= 0) return null
      return { start: pos - 1, end: pos, insert: "" }
    })
  }, [applyMulti])

  const deleteAtCursors = useCallback(() => {
    const t = valueRef.current
    applyMulti((pos, isPrimary, a, b) => {
      if (isPrimary && b > a) return { start: a, end: b, insert: "" }
      if (pos >= t.length) return null
      return { start: pos, end: pos + 1, insert: "" }
    })
  }, [applyMulti])

  const enterAtCursors = useCallback(() => {
    const t = valueRef.current
    applyMulti((pos) => {
      const { start } = lineRangeOf(t, pos)
      const ins = autoIndentForEnter(t.slice(start, pos), tab)
      return { start: pos, end: pos, insert: ins }
    })
  }, [applyMulti, tab])

  // Ctrl+D: siguiente ocurrencia de la selección/palabra como cursor extra
  const selectNextOccurrence = useCallback(() => {
    const ta = taRef.current
    if (!ta) return
    const t = valueRef.current
    const a = ta.selectionStart ?? 0
    const b = ta.selectionEnd ?? 0
    let word = b > a ? t.slice(a, b) : ""
    let from = b
    if (!word) {
      const { start, end } = lineRangeOf(t, a)
      const line = t.slice(start, end)
      const rel = a - start
      const re = /[\w$\u00C0-\u024F]+/g
      let m: RegExpExecArray | null
      let hit: { word: string; idx: number } | null = null
      while ((m = re.exec(line)) !== null) {
        if (rel >= m.index && rel <= m.index + m[0].length) {
          hit = { word: m[0], idx: m.index }
          break
        }
      }
      if (!hit) return
      word = hit.word
      setSel(start + hit.idx, start + hit.idx + word.length)
      reportCursor()
      return
    }
    const idx = t.indexOf(word, from)
    if (idx === -1) return
    setExtraCursors((prev) => (prev.includes(idx) || idx === a ? prev : [...prev, idx].slice(-20)))
    jumpToOffset(idx, word.length)
  }, [jumpToOffset, reportCursor, setSel])

  const addCursorAtColumn = useCallback(
    (dir: -1 | 1) => {
      const ta = taRef.current
      if (!ta) return
      const t = valueRef.current
      const a = ta.selectionStart ?? 0
      const { line, col } = getLineCol(t, a)
      const target = line + dir
      if (target < 1) return
      const off = offsetFromLineCol(t, target, col)
      setExtraCursors((prev) => (prev.includes(off) ? prev : [...prev, off].slice(-20)))
    },
    []
  )

  // Offset desde coordenadas del puntero con el mirror (búsqueda binaria,
  // O(log n) layouts, solo en click). El textarea es elemento reemplazado:
  // caretRangeFromPoint no penetra, por eso el mirror propio cross-browser.
  const offsetFromPoint = useCallback((clientX: number, clientY: number): number | null => {
    const mirror = mirrorRef.current
    const sc = scrollRef.current
    if (!mirror || !sc) return null
    const t = valueRef.current
    if (t.length > 200_000) return null
    try {
      const rect = sc.getBoundingClientRect()
      const x = clientX - rect.left + sc.scrollLeft
      const y = clientY - rect.top + sc.scrollTop
      const dot = document.createElement("span")
      dot.textContent = "​"
      const pos = (off: number) => {
        mirror.textContent = t.slice(0, off)
        mirror.appendChild(dot)
        return { top: dot.offsetTop, left: dot.offsetLeft }
      }
      const INF = { top: Infinity, left: Infinity }
      let lo = 0
      let hi = t.length + 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        const p = mid <= t.length ? pos(mid) : INF
        if (p.top < y || (p.top === y && p.left <= x)) lo = mid + 1
        else hi = mid
      }
      mirror.textContent = ""
      return Math.max(0, Math.min(lo - 1, t.length))
    } catch {
      try {
        if (mirrorRef.current) mirrorRef.current.textContent = ""
      } catch {
        /* ignore */
      }
      return null
    }
  }, [])

  // Ctrl+Click: añade cursor sin mover el primario
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const off = offsetFromPoint(e.clientX, e.clientY)
      if (off === null) return
      setExtraCursors((prev) => (prev.includes(off) ? prev : [...prev, off].slice(-20)))
    },
    [offsetFromPoint]
  )

  // ---- autocompletado ----
  const openComplete = useCallback(
    (auto: boolean) => {
      const ta = taRef.current
      if (!ta || words.length === 0) return
      const t = valueRef.current
      const caret = ta.selectionStart ?? 0
      const { word, start } = wordBeforeCaret(t, caret)
      if (auto && word.length < 3) {
        setComplete(null)
        return
      }
      if (!word) {
        if (!auto) setComplete({ items: words.slice(0, 8), start: caret, active: 0 })
        return
      }
      const items = words.filter((w) => w.startsWith(word) && w !== word).slice(0, 8)
      if (items.length === 0) {
        setComplete(null)
        return
      }
      setComplete({ items, start, active: 0 })
      const m = measureOffset(caret)
      setCompletePos(m ? { top: m.top + m.height + 2, left: m.left } : null)
    },
    [words, measureOffset]
  )

  const acceptComplete = useCallback(
    (word: string) => {
      const ta = taRef.current
      if (!ta || !complete) return
      const t = valueRef.current
      const caret = ta.selectionStart ?? 0
      const pos = complete.start + word.length
      setComplete(null)
      applyEdit(t.slice(0, complete.start) + word + t.slice(caret), pos, pos)
    },
    [complete, applyEdit]
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
  // matchCount con tope: si llega al cap se muestra "5000+"
  const matchCount = useMemo(
    () => (query ? countOccurrences(value, query, matchCase) : 0),
    [value, query, matchCase]
  )
  const MATCH_CAP = 5000
  const matchTotal = matchCount >= MATCH_CAP ? `${MATCH_CAP}+` : `${matchCount}`
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
      // Reemplazo literal: "$&"/"$'" en el texto no deben expandirse
      out = t.replace(re, () => replaceWith)
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
      { id: "dup", label: "Duplicar línea o selección", hint: "Ctrl+Shift+D", run: doDuplicate },
      { id: "occur", label: "Añadir siguiente ocurrencia (multi-cursor)", hint: "Ctrl+D", run: selectNextOccurrence },
      { id: "curup", label: "Añadir cursor en línea superior", hint: "Ctrl+Alt+↑", run: () => addCursorAtColumn(-1) },
      { id: "curdn", label: "Añadir cursor en línea inferior", hint: "Ctrl+Alt+↓", run: () => addCursorAtColumn(1) },
      { id: "complete", label: "Autocompletar palabra", hint: "Ctrl+Espacio", run: () => openComplete(false) },
      { id: "diff", label: savedValue === undefined ? "Ver cambios sin guardar (no disponible)" : diffOpen ? "Cerrar diff de cambios" : "Ver cambios sin guardar", hint: "", run: () => setDiffOpen((v) => !v) },
      { id: "delline", label: "Eliminar línea", hint: "Ctrl+Shift+K", run: doDeleteLine },
      { id: "moveup", label: "Mover línea hacia arriba", hint: "Alt+↑", run: () => doMove(-1) },
      { id: "movedn", label: "Mover línea hacia abajo", hint: "Alt+↓", run: () => doMove(1) },
      { id: "trim", label: "Recortar espacios al final", hint: "", run: doTrim },
      { id: "upper", label: "Selección a MAYÚSCULAS", hint: "", run: () => doCase(true) },
      { id: "lower", label: "Selección a minúsculas", hint: "", run: () => doCase(false) },
    ],
    [onSave, wrap, tabSize, savedValue, diffOpen, doComment, doDuplicate, selectNextOccurrence, addCursorAtColumn, openComplete, doDeleteLine, doMove, doTrim, doCase, setPref]
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
    setComplete(null)
    setDiffOpen(false)
    focusTa()
  }, [focusTa])

  // Navegación nativa (click, flechas): colapsa multi-cursor.
  // Las programáticas van con setSel (flag) y no colapsan.
  const handleSelect = useCallback(() => {
    if (suppressSelectRef.current) return
    clearExtraCursors()
    reportCursor()
  }, [clearExtraCursors, reportCursor])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (cursorsRef.current.length === 0) return
      e.preventDefault()
      const text = e.clipboardData?.getData("text") ?? ""
      if (!text) return
      applyMulti((pos, isPrimary, a, b) =>
        isPrimary && b > a ? { start: a, end: b, insert: text } : { start: pos, end: pos, insert: text }
      )
    },
    [applyMulti]
  )

  // ---- teclado ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // IME en composición (CJK, Gboard): no interceptar nada, el texto llega
      // por onChange. Multi-cursor queda limitado a teclado físico (documentado).
      if ((e.nativeEvent as KeyboardEvent).isComposing) return
      const ta = e.currentTarget
      const mod = e.ctrlKey || e.metaKey
      if (e.key === "Escape") {
        e.preventDefault()
        if (complete) {
          setComplete(null)
          return
        }
        if (cursorsRef.current.length > 0) {
          setExtraCursors([])
          return
        }
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
      if (mod && e.key === " ") {
        e.preventDefault()
        openComplete(false)
        return
      }
      if (mod && (e.key === "d" || e.key === "D") && !e.shiftKey) {
        // Monaco-like: siguiente ocurrencia como cursor extra
        e.preventDefault()
        selectNextOccurrence()
        return
      }
      if (mod && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault()
        doDuplicate()
        return
      }
      if (mod && e.altKey && e.key === "ArrowUp") {
        e.preventDefault()
        addCursorAtColumn(-1)
        return
      }
      if (mod && e.altKey && e.key === "ArrowDown") {
        e.preventDefault()
        addCursorAtColumn(1)
        return
      }
      // Edición multi-cursor: va antes de la lógica de un solo cursor
      if (complete && (e.key === "Enter" || e.key === "Tab")) {
        e.preventDefault()
        const pick = complete.items[complete.active] ?? complete.items[0]
        if (pick) acceptComplete(pick)
        else setComplete(null)
        return
      }
      if (complete && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault()
        const d = e.key === "ArrowDown" ? 1 : -1
        setComplete((c) =>
          c ? { ...c, active: (c.active + d + c.items.length) % c.items.length } : c
        )
        return
      }
      if (cursorsRef.current.length > 0) {
        if (!mod && !e.altKey && e.key.length === 1) {
          e.preventDefault()
          typeAtCursors(e.key)
          if (/[\w$]/.test(e.key)) {
            const id = window.setTimeout(() => openComplete(true), 0)
            timeoutIds.current.push(id)
          }
          return
        }
        if (!mod && !e.altKey && e.key === "Backspace") {
          e.preventDefault()
          backspaceAtCursors()
          return
        }
        if (!mod && !e.altKey && e.key === "Delete") {
          e.preventDefault()
          deleteAtCursors()
          return
        }
        if (!mod && !e.altKey && e.key === "Enter") {
          e.preventDefault()
          enterAtCursors()
          return
        }
        if (!mod && !e.altKey && e.key === "Tab") {
          e.preventDefault()
          applyMulti((pos) => ({ start: pos, end: pos, insert: tab }))
          return
        }
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
        <button type="button" className="liteed-btn" onClick={() => { setPaletteFilter(""); setPaletteOpen((v) => !v) }} title="Paleta de comandos (Ctrl+Shift+P)" aria-expanded={paletteOpen}>Comandos</button>
        <button type="button" className={`liteed-btn${wrap ? " active" : ""}`} aria-pressed={wrap} onClick={() => setWrap((v) => { setPref(WRAP_KEY, v ? "off" : "on"); return !v })} title={wrap ? "Ajuste de línea activado" : "Ajuste de línea desactivado"}>Wrap</button>
        <button type="button" className="liteed-btn" onClick={() => { setFindOpen((v) => !v); setReplaceOpen(false) }} title="Buscar (Ctrl+F)">Buscar</button>
        <button type="button" className="liteed-btn" onClick={() => setFontSize((f) => { const n = Math.max(10, f - 1); setPref(FONT_KEY, String(n)); return n })} title="Reducir letra">A-</button>
        <button type="button" className="liteed-btn" onClick={() => setFontSize((f) => { const n = Math.min(24, f + 1); setPref(FONT_KEY, String(n)); return n })} title="Aumentar letra">A+</button>
        <button type="button" className="liteed-btn" onClick={() => setTabSize((t) => { const n = t === 2 ? 4 : 2; setPref(TAB_KEY, String(n)); return n })} title="Tamaño de indentación">Tab:{tabSize}</button>
        {savedValue !== undefined && (
          <button type="button" className={`liteed-btn${diffOpen ? " active" : ""}`} aria-pressed={diffOpen} onClick={() => setDiffOpen((v) => !v)} title="Cambios sin guardar">Diff</button>
        )}
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
                "--indch": `${tabSize}ch`,
              } as React.CSSProperties}
            ><code dangerouslySetInnerHTML={{ __html: codeHtml }} /></pre>
            <textarea
              ref={taRef}
              data-vs-path={vsPath}
              aria-label={`Editar ${path}`}
              className="liteed-input"
              style={{
                fontFamily: metrics.fontFamily,
                fontSize: metrics.fontSize,
                lineHeight: metrics.lineHeight,
                tabSize: metrics.tabSize,
                padding: metrics.padding,
                whiteSpace: metrics.whiteSpace,
                overflowWrap: wrap ? "anywhere" : "normal",
              }}
              wrap={wrap ? "soft" : "off"}
              value={value}
              onChange={(e) => {
                // Edición nativa (IME, menú): colapsa multi-cursor por seguridad
                clearExtraCursors()
                onChange(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              onMouseDown={handleMouseDown}
              onPaste={handlePaste}
              onSelect={handleSelect}
              onKeyUp={reportCursor}
              onClick={reportCursor}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <div className="liteed-marks" aria-hidden="true">
              {marks.map((m, i) => (
                <span
                  key={i}
                  className={`liteed-mark liteed-mark-${m.kind}`}
                  style={{ top: m.top, left: m.left, height: m.height }}
                />
              ))}
              {complete && completePos && (
                <div
                  className="liteed-complete"
                  style={{ top: completePos.top, left: completePos.left }}
                  role="listbox"
                  aria-label="Autocompletado"
                  aria-activedescendant={`liteed-c-${complete.active}`}
                >
                  {complete.items.map((w, wi) => (
                    <button
                      key={w}
                      id={`liteed-c-${wi}`}
                      type="button"
                      className={`liteed-complete-item${wi === complete.active ? " active" : ""}`}
                      role="option"
                      aria-selected={wi === complete.active}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        acceptComplete(w)
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div
            ref={mirrorRef}
            aria-hidden="true"
            className={`liteed-mirror${wrap ? " is-wrap" : ""}`}
            style={{
              fontFamily: metrics.fontFamily,
              fontSize: metrics.fontSize,
              lineHeight: metrics.lineHeight,
              tabSize: metrics.tabSize,
              padding: metrics.padding,
              whiteSpace: metrics.whiteSpace,
              overflowWrap: wrap ? "anywhere" : "normal",
            }}
          />
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
              <span className="liteed-count" title="Coincidencia actual / total">{query ? (matchCount > 0 ? `${matchIndex}/${matchTotal}` : "0") : "—"}</span>
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
          {diffOpen && savedValue !== undefined && (
            <div className="liteed-diff" role="dialog" aria-label="Cambios sin guardar">
              <div className="liteed-diff-head">
                <span>Cambios sin guardar</span>
                <button type="button" className="liteed-btn" onClick={() => setDiffOpen(false)} title="Cerrar (Esc)">×</button>
              </div>
              <div className="liteed-diff-body">
                {!diffCapped || diffCapped.tooLarge ? (
                  <div className="liteed-empty">{diffCapped?.tooLarge ? "Archivo muy grande para el diff" : "Sin cambios"}</div>
                ) : (
                  <>
                    {diffCapped.hunks.map((h, i) => (
                      <div key={i} className="liteed-hunk">
                        <div className="liteed-hunk-head">@@ {h.oldStart} → {h.newStart} @@</div>
                        {h.lines.map((l, j) => (
                          <div key={j} className={`liteed-dline liteed-dline-${l.t === "+" ? "add" : l.t === "-" ? "del" : "ctx"}`}>
                            <span className="liteed-dsign">{l.t}</span>
                            <span className="liteed-dtext">{l.text.length > 300 ? `${l.text.slice(0, 300)}…` : l.text || " "}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {diffCapped.capped && (
                      <div className="liteed-empty">…recortado ({diffCapped.total} líneas de diff)</div>
                    )}
                  </>
                )}
              </div>
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
