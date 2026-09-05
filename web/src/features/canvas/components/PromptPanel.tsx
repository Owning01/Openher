import { useMemo, useState } from "react"
import type { CanvasDoc } from "../model/canvasTypes"
import { generatePrompt, type PromptLang } from "../model/prompt"
import { canvasStore } from "../store/canvasStore"
import { CheckIcon, CopyIcon, SendIcon } from "../../../Icons"

type Props = {
  doc: CanvasDoc
}

export function sendPromptToComposer(text: string) {
  window.dispatchEvent(new CustomEvent("plugin:insert-text", { detail: text }))
}

export function PromptPanel({ doc }: Props) {
  const [lang, setLang] = useState<PromptLang>("es")
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)
  const prompt = useMemo(
    () => generatePrompt(doc, { lang, platform: doc.platform }),
    [doc, lang],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = prompt
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const send = () => {
    sendPromptToComposer(prompt)
    setSent(true)
    setTimeout(() => setSent(false), 2500)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <select
          aria-label="Idioma del prompt"
          value={lang}
          onChange={(e) => setLang(e.target.value as PromptLang)}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 13, padding: "6px 8px" }}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
        <select
          aria-label="Plataforma destino"
          value={doc.platform}
          onChange={(e) => canvasStore.setPlatform(e.target.value as "android" | "web")}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 13, padding: "6px 8px" }}
        >
          <option value="android">Android</option>
          <option value="web">Web</option>
        </select>
        <span style={{ flex: 1 }} />
        <button type="button" className="btn-secondary compact" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={copy}>{copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}{copied ? "Copiado" : "Copiar"}</button>
        <button type="button" className="btn-primary compact" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={send}><SendIcon size={12} />{sent ? "Enviado al chat" : "Enviar al Composer"}</button>
      </div>
      <textarea
        readOnly
        value={prompt}
        aria-label="Prompt generado"
        style={{
          flex: 1,
          minHeight: 220,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          color: "var(--text)",
          fontSize: 12,
          fontFamily: "ui-monospace, monospace",
          padding: 10,
          resize: "vertical",
          whiteSpace: "pre-wrap",
        }}
      />
    </div>
  )
}
