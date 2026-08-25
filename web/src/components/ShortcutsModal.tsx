import { memo, useState, useEffect, useCallback, useRef } from "react"
import { ModalHeader } from "./ModalHeader"
import { useT } from "../i18n-context"
import { loadShortcutsConfig, saveShortcutsConfig, DEFAULT_SHORTCUTS, type ShortcutItem } from "../shortcuts"
import { TrashIcon, RefreshIcon, PencilIcon } from "../Icons"

type Props = {
  onClose: () => void
  desktop?: boolean
}

export const ShortcutsModal = memo(function ShortcutsModal({ onClose, desktop: _desktop }: Props) {
  const t = useT()
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => loadShortcutsConfig())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [recordedKeys, setRecordedKeys] = useState<string>("")
  const recordRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    saveShortcutsConfig(shortcuts)
  }, [shortcuts])

  const handleToggle = (id: string) => {
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    )
  }

  const handleDelete = (id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id))
  }

  const handleReset = () => {
    setShortcuts(DEFAULT_SHORTCUTS.map((s) => ({ ...s })))
  }

  const startEditing = (id: string) => {
    setEditingId(id)
    setRecordedKeys("")
  }

  const handleKeyDownRecording = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.key === "Escape") {
      setEditingId(null)
      return
    }

    const modifiers: string[] = []
    if (e.ctrlKey || e.metaKey) modifiers.push("Ctrl")
    if (e.shiftKey) modifiers.push("Shift")
    if (e.altKey) modifiers.push("Alt")

    const key = e.key
    if (["Control", "Shift", "Alt", "Meta"].includes(key)) {
      setRecordedKeys(modifiers.join(" + "))
      return
    }

    const keyName = key.length === 1 ? key.toUpperCase() : key
    const fullKeys = [...modifiers, keyName].join(" + ")
    setRecordedKeys(fullKeys)

    if (editingId) {
      setShortcuts((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, keys: fullKeys } : s))
      )
      setEditingId(null)
    }
  }, [editingId])

  const categories = [
    { id: "tabs", title: "Pestañas" },
    { id: "splits", title: "Paneles & Splits (Escritorio)" },
    { id: "general", title: "General" },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t('shortcuts.title')}
        style={{ maxWidth: "600px", width: "95%" }}
      >
        <ModalHeader title={t('shortcuts.title') || "Atajos de teclado"} onClose={onClose} />
        <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
              Configura, activa/desactiva o personaliza los atajos de teclado.
            </span>
            <button
              type="button"
              className="btn-secondary compact"
              onClick={handleReset}
              title="Restablecer atajos por defecto"
              style={{ fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <RefreshIcon size={12} />
              <span>Restablecer</span>
            </button>
          </div>

          {categories.map((cat) => {
            const items = shortcuts.filter((s) => s.category === cat.id)
            if (items.length === 0) return null

            return (
              <div key={cat.id} style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)", margin: "0 0 8px 0" }}>
                  {cat.title}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {items.map((s) => {
                    const isEditing = editingId === s.id
                    return (
                      <div
                        key={s.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderRadius: "var(--radius-sm)",
                          background: s.enabled ? "var(--surface-2)" : "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--border)",
                          opacity: s.enabled ? 1 : 0.6,
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text)" }}>
                            {s.label}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {isEditing ? (
                            <div
                              ref={recordRef}
                              tabIndex={0}
                              autoFocus
                              onKeyDown={handleKeyDownRecording}
                              style={{
                                padding: "3px 8px",
                                border: "1px solid var(--primary)",
                                borderRadius: "var(--radius-sm)",
                                background: "var(--primary-soft)",
                                color: "var(--primary)",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                outline: "none",
                                cursor: "pointer",
                              }}
                            >
                              {recordedKeys || "Presiona teclas..."}
                            </div>
                          ) : (
                            <kbd
                              className="shortcut-key"
                              onClick={() => startEditing(s.id)}
                              title="Haz clic para cambiar la combinación de teclas"
                              style={{
                                cursor: "pointer",
                                fontSize: "0.78rem",
                                padding: "3px 7px",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-sm)",
                                background: "var(--bg)",
                              }}
                            >
                              {s.keys}
                            </kbd>
                          )}

                          <button
                            type="button"
                            className="btn-icon compact"
                            onClick={() => startEditing(s.id)}
                            title="Editar combinación"
                            aria-label="Editar combinación"
                          >
                            <PencilIcon size={13} />
                          </button>

                          {/* Toggle switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={s.enabled}
                            onClick={() => handleToggle(s.id)}
                            title={s.enabled ? "Desactivar atajo" : "Activar atajo"}
                            style={{
                              width: "36px",
                              height: "20px",
                              borderRadius: "10px",
                              background: s.enabled ? "var(--primary)" : "var(--border)",
                              position: "relative",
                              border: "none",
                              cursor: "pointer",
                              transition: "background 0.2s",
                              padding: 0,
                            }}
                          >
                            <span
                              style={{
                                display: "block",
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                background: "#fff",
                                position: "absolute",
                                top: "2px",
                                left: s.enabled ? "18px" : "2px",
                                transition: "left 0.2s",
                              }}
                            />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            className="btn-icon compact"
                            onClick={() => handleDelete(s.id)}
                            title="Borrar atajo"
                            aria-label="Borrar atajo"
                            style={{ color: "var(--danger, var(--danger))" }}
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})
