import { memo, useCallback, useEffect, useState } from "react"
import { Markdown } from "./Markdown"
import { DiskIcon, RefreshIcon } from "../Icons"
import { shell } from "../shell"

type Props = {
  initialPath?: string
}

export const DocEditorPanel = memo(function DocEditorPanel({ initialPath }: Props) {
  const [filePath, setFilePath] = useState<string>(initialPath || "")
  const [content, setContent] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [statusMsg, setStatusMsg] = useState<string>("")
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split")

  const loadFile = useCallback(async (path: string) => {
    if (!path) return
    setLoading(true)
    setStatusMsg("")
    try {
      const ext = path.toLowerCase().split(".").pop() || ""
      if (ext === "docx" || ext === "pdf") {
        // Extraer texto a Markdown usando el motor ultra-rápido de Rust
        const res = await shell.doc.convert(path, "md")
        if (res.ok) {
          setContent(res.preview)
          setStatusMsg(`Convertido desde ${ext.toUpperCase()}`)
        }
      } else {
        // Leer archivo de texto normal
        const res = await shell.fs.read(path)
        if (res.content !== undefined) {
          setContent(res.content)
        }
      }
    } catch (err: any) {
      setStatusMsg(`Error cargando archivo: ${err.message || String(err)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialPath) {
      loadFile(initialPath)
    }
  }, [initialPath, loadFile])

  const handleSave = async (format: "md" | "docx" | "pdf" = "md") => {
    if (!filePath) {
      const p = window.prompt("Ruta para guardar archivo:", "documento." + format)
      if (!p) return
      setFilePath(p)
    }
    setSaving(true)
    setStatusMsg("")
    try {
      const savePath = filePath || "documento." + format
      const res = await shell.doc.save(savePath, content, format)
      if (res.ok) {
        setStatusMsg(`Guardado exitoso como ${format.toUpperCase()}`)
      }
    } catch (err: any) {
      setStatusMsg(`Error al guardar: ${err.message || String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  const insertText = (before: string, after: string = "") => {
    const textarea = document.getElementById("doc-editor-textarea") as HTMLTextAreaElement | null
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const sel = content.substring(start, end)
    const next = content.substring(0, start) + before + sel + after + content.substring(end)
    setContent(next)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: "#0d1117", color: "#e6edf3" }}>
      {/* Barra superior de herramientas */}
      <div style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
        padding: "6px 12px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        fontSize: 12,
      }}>
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="Ruta del archivo (.md, .docx, .pdf)..."
          style={{
            flex: 1,
            minWidth: 160,
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 4,
            padding: "4px 8px",
            color: "#fff",
            fontSize: 12,
          }}
        />

        <button
          type="button"
          className="btn-secondary compact"
          onClick={() => loadFile(filePath)}
          disabled={loading || !filePath}
          title="Recargar archivo"
        >
          <RefreshIcon size={12} /> Cargar
        </button>

        <div style={{ display: "inline-flex", gap: 4 }}>
          <button
            type="button"
            className="btn-primary compact"
            onClick={() => handleSave("md")}
            disabled={saving}
            title="Guardar como Markdown"
          >
            <DiskIcon size={12} /> Guardar .MD
          </button>
          <button
            type="button"
            className="btn-secondary compact"
            onClick={() => handleSave("docx")}
            disabled={saving}
            title="Exportar como Microsoft Word (.docx)"
          >
            Exportar DOCX
          </button>
          <button
            type="button"
            className="btn-secondary compact"
            onClick={() => handleSave("pdf")}
            disabled={saving}
            title="Exportar como PDF vectorial (.pdf)"
          >
            Exportar PDF
          </button>
        </div>

        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: 2 }}>
          <button
            type="button"
            className={`btn-icon compact${viewMode === "edit" ? " active" : ""}`}
            onClick={() => setViewMode("edit")}
            style={{ fontSize: 11, padding: "2px 6px" }}
          >
            Editar
          </button>
          <button
            type="button"
            className={`btn-icon compact${viewMode === "split" ? " active" : ""}`}
            onClick={() => setViewMode("split")}
            style={{ fontSize: 11, padding: "2px 6px" }}
          >
            Split
          </button>
          <button
            type="button"
            className={`btn-icon compact${viewMode === "preview" ? " active" : ""}`}
            onClick={() => setViewMode("preview")}
            style={{ fontSize: 11, padding: "2px 6px" }}
          >
            Vista Previa
          </button>
        </div>
      </div>

      {/* Barra de formato rápido (WYSIWYG Markdown Helpers) */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 12px",
        background: "rgba(0,0,0,0.2)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        fontSize: 11,
      }}>
        <button type="button" className="btn-icon compact" onClick={() => insertText("# ", "")} title="Título 1">H1</button>
        <button type="button" className="btn-icon compact" onClick={() => insertText("## ", "")} title="Título 2">H2</button>
        <button type="button" className="btn-icon compact" onClick={() => insertText("### ", "")} title="Título 3">H3</button>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
        <button type="button" className="btn-icon compact" onClick={() => insertText("**", "**")} title="Negrita"><b>B</b></button>
        <button type="button" className="btn-icon compact" onClick={() => insertText("*", "*")} title="Cursiva"><i>I</i></button>
        <button type="button" className="btn-icon compact" onClick={() => insertText("- ", "")} title="Lista con viñetas">• Lista</button>
        <button type="button" className="btn-icon compact" onClick={() => insertText("1. ", "")} title="Lista numerada">1. Lista</button>
        <button type="button" className="btn-icon compact" onClick={() => insertText("```\n", "\n```")} title="Bloque de código">&lt;/&gt;</button>
        <button type="button" className="btn-icon compact" onClick={() => insertText("> ", "")} title="Cita">” Cita</button>
        {statusMsg && (
          <span style={{ marginLeft: "auto", color: "#58a6ff", fontSize: 11 }}>{statusMsg}</span>
        )}
      </div>

      {/* Área de Edición y Vista Previa */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        {(viewMode === "edit" || viewMode === "split") && (
          <div style={{ flex: viewMode === "split" ? 1 : undefined, width: viewMode === "edit" ? "100%" : undefined, display: "flex", flexDirection: "column", borderRight: viewMode === "split" ? "1px solid rgba(255,255,255,0.08)" : undefined }}>
            <textarea
              id="doc-editor-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Escribe tu documento aquí en formato Markdown enriquecido...&#10;&#10;Puedes exportarlo instantáneamente a Word (.docx) o PDF profesional."
              style={{
                flex: 1,
                width: "100%",
                height: "100%",
                resize: "none",
                background: "transparent",
                color: "#e6edf3",
                border: "none",
                outline: "none",
                padding: 14,
                fontFamily: "var(--font-mono, 'Consolas', 'Fira Code', monospace)",
                fontSize: 13,
                lineHeight: 1.6,
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {(viewMode === "preview" || viewMode === "split") && (
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: 20,
            background: "rgba(255,255,255,0.01)",
          }}>
            <Markdown text={content || "*Documento vacío*"} />
          </div>
        )}
      </div>
    </div>
  )
})
