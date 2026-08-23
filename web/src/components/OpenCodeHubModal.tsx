import { memo, useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { CloseIcon, SearchIcon, SaveIcon, LoadingIcon } from "../Icons"
import { shell } from "../shell"
import type { AgentOption } from "../types"

type TabType = "agents" | "skills" | "config"

type SkillItem = {
  name: string
  description: string
  path: string
  skillFile: string
  source: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  agents?: AgentOption[]
  activeAgentID?: string
  onSelectAgent?: (id: string) => void
}

export const OpenCodeHubModal = memo(function OpenCodeHubModal({
  isOpen,
  onClose,
  agents = [],
  activeAgentID,
  onSelectAgent,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("agents")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const [globalData, setGlobalData] = useState<{
    configPath: string
    configContent: string
    skills: SkillItem[]
    scannedRoots: string[]
  } | null>(null)

  const [rawConfig, setRawConfig] = useState("")
  const [jsonError, setJsonError] = useState<string | null>(null)

  const loadGlobal = useCallback(async () => {
    setLoading(true)
    try {
      const res = await shell.opencode.getGlobal()
      setGlobalData(res)
      setRawConfig(res.configContent || "{}")
    } catch (err) {
      console.error("Error al cargar configuración global:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadGlobal()
    }
  }, [isOpen, loadGlobal])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  const handleConfigChange = (text: string) => {
    setRawConfig(text)
    try {
      JSON.parse(text)
      setJsonError(null)
    } catch (e: any) {
      setJsonError(e.message)
    }
  }

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(rawConfig)
      setRawConfig(JSON.stringify(parsed, null, 2))
      setJsonError(null)
    } catch (e: any) {
      setJsonError(e.message)
    }
  }

  const handleSaveConfig = async () => {
    if (!globalData?.configPath) return
    if (jsonError) {
      setSaveStatus("JSON inválido: " + jsonError)
      return
    }
    setSaving(true)
    setSaveStatus(null)
    try {
      const res = await shell.opencode.saveGlobal(globalData.configPath, rawConfig)
      if (res.ok) {
        setSaveStatus("¡Configuración guardada exitosamente!")
        setTimeout(() => setSaveStatus(null), 3000)
      } else {
        setSaveStatus("Error al guardar.")
      }
    } catch (err: any) {
      setSaveStatus("Error: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredAgents = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return agents
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
    )
  }, [agents, search])

  const filteredSkills = useMemo(() => {
    const list = globalData?.skills || []
    const q = search.toLowerCase().trim()
    if (!q) return list
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.source.toLowerCase().includes(q)
    )
  }, [globalData?.skills, search])

  if (!isOpen) return null

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-content opencode-hub-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90vw",
          maxWidth: "960px",
          height: "85vh",
          maxHeight: "750px",
          background: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderBottom: "1px solid #21262d",
            background: "#161b22",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🤖</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "15px", color: "#f0f6fc" }}>
                OpenCode Hub & Configuración Global
              </div>
              <div style={{ fontSize: "11px", color: "#8b949e" }}>
                Agentes oficiales, skills del entorno y archivo de configuración
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#8b949e",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
            }}
            title="Cerrar (Esc)"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #21262d",
            background: "#0d1117",
            padding: "0 16px",
            gap: "8px",
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab("agents"); setSearch("") }}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "agents" ? "2px solid #58a6ff" : "2px solid transparent",
              color: activeTab === "agents" ? "#58a6ff" : "#8b949e",
              fontWeight: activeTab === "agents" ? 600 : 400,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🤖</span>
            <span>Agentes Oficiales ({agents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("skills"); setSearch("") }}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "skills" ? "2px solid #58a6ff" : "2px solid transparent",
              color: activeTab === "skills" ? "#58a6ff" : "#8b949e",
              fontWeight: activeTab === "skills" ? 600 : 400,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>⚡</span>
            <span>Skills del Sistema ({globalData?.skills?.length ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("config"); setSearch("") }}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "config" ? "2px solid #58a6ff" : "2px solid transparent",
              color: activeTab === "config" ? "#58a6ff" : "#8b949e",
              fontWeight: activeTab === "config" ? 600 : 400,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>⚙️</span>
            <span>Configuración Global (JSON)</span>
          </button>

          {activeTab !== "config" && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", position: "relative" }}>
              <span style={{ position: "absolute", left: "10px", color: "#8b949e", display: "flex", alignItems: "center" }}><SearchIcon size={13} /></span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar ${activeTab === "agents" ? "agentes" : "skills"}...`}
                style={{
                  background: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: "6px",
                  padding: "4px 8px 4px 28px",
                  color: "#f0f6fc",
                  fontSize: "12px",
                  width: "200px",
                }}
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "8px", color: "#8b949e" }}>
              <LoadingIcon size={18} />
              <span>Cargando datos de OpenCode...</span>
            </div>
          ) : activeTab === "agents" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {filteredAgents.length === 0 ? (
                <div style={{ color: "#8b949e", padding: "20px", gridColumn: "1 / -1", textAlign: "center" }}>
                  No se encontraron agentes que coincidan con la búsqueda.
                </div>
              ) : (
                filteredAgents.map((agent) => {
                  const isSelected = agent.id === activeAgentID
                  return (
                    <div
                      key={agent.id}
                      style={{
                        background: isSelected ? "rgba(88, 166, 255, 0.08)" : "#161b22",
                        border: isSelected ? "1px solid #58a6ff" : "1px solid #30363d",
                        borderRadius: "8px",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "18px" }}>{agent.name.toLowerCase().includes("plan") ? "🧭" : agent.name.toLowerCase().includes("build") ? "🛠️" : "🤖"}</span>
                          <span style={{ fontWeight: 600, fontSize: "14px", color: "#f0f6fc" }}>{agent.name}</span>
                        </div>
                        {isSelected && (
                          <span style={{ fontSize: "10px", background: "#1f6feb", color: "#fff", padding: "2px 6px", borderRadius: "10px", fontWeight: 600 }}>
                            ACTIVO
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: "12px", color: "#8b949e", lineHeight: "1.4", flex: 1 }}>
                        {agent.description || "Agente especializado de OpenCode para ejecución y asistencia técnica."}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #21262d", fontSize: "11px" }}>
                        <span style={{ color: "#58a6ff", fontFamily: "monospace" }}>id: {agent.id}</span>
                        {onSelectAgent && !isSelected && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectAgent(agent.id)
                              onClose()
                            }}
                            style={{
                              background: "#21262d",
                              border: "1px solid #30363d",
                              borderRadius: "4px",
                              color: "#f0f6fc",
                              padding: "3px 8px",
                              cursor: "pointer",
                              fontSize: "11px",
                            }}
                          >
                            Usar Agente
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : activeTab === "skills" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#8b949e" }}>
                <span>📁 Rutas escaneadas:</span>
                {globalData?.scannedRoots?.map((r) => (
                  <span key={r} style={{ background: "#21262d", padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace", fontSize: "10px" }}>
                    {r.split(/[\/\\]/).slice(-2).join("/")}
                  </span>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                {filteredSkills.length === 0 ? (
                  <div style={{ color: "#8b949e", padding: "20px", gridColumn: "1 / -1", textAlign: "center" }}>
                    No se detectaron skills en las carpetas estándar.
                  </div>
                ) : (
                  filteredSkills.map((skill) => (
                    <div
                      key={skill.path}
                      style={{
                        background: "#161b22",
                        border: "1px solid #30363d",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "14px" }}>⚡</span>
                          <span style={{ fontWeight: 600, fontSize: "13px", color: "#58a6ff" }}>{skill.name}</span>
                        </div>
                        <span style={{ fontSize: "10px", background: "#21262d", color: "#8b949e", padding: "2px 6px", borderRadius: "4px" }}>
                          {skill.source}
                        </span>
                      </div>

                      <div style={{ fontSize: "12px", color: "#c9d1d9", lineHeight: "1.4", flex: 1 }}>
                        {skill.description}
                      </div>

                      <div style={{ fontSize: "10px", color: "#8b949e", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={skill.path}>
                        {skill.path}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "12px", color: "#8b949e" }}>
                  Archivo activo: <span style={{ color: "#58a6ff", fontFamily: "monospace" }}>{globalData?.configPath || "opencode.json"}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {jsonError && <span style={{ fontSize: "11px", color: "#f85149" }}>⚠️ {jsonError}</span>}
                  {saveStatus && <span style={{ fontSize: "11px", color: saveStatus.includes("Error") ? "#f85149" : "#3fb950" }}>{saveStatus}</span>}
                  <button
                    type="button"
                    onClick={handleFormatJson}
                    style={{
                      background: "#21262d",
                      border: "1px solid #30363d",
                      borderRadius: "6px",
                      color: "#c9d1d9",
                      padding: "4px 10px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Formatear JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={saving || Boolean(jsonError)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#238636",
                      border: "1px solid rgba(240,246,252,0.1)",
                      borderRadius: "6px",
                      color: "#fff",
                      padding: "4px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: saving || Boolean(jsonError) ? "not-allowed" : "pointer",
                      opacity: saving || Boolean(jsonError) ? 0.6 : 1,
                    }}
                  >
                    {saving ? <LoadingIcon size={12} /> : <SaveIcon size={12} />}
                    <span>Guardar Configuración</span>
                  </button>
                </div>
              </div>

              <textarea
                value={rawConfig}
                onChange={(e) => handleConfigChange(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  minHeight: "350px",
                  background: "#090d13",
                  border: jsonError ? "1px solid #f85149" : "1px solid #30363d",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#f0f6fc",
                  fontFamily: "Consolas, Menlo, Monaco, 'Courier New', monospace",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  resize: "none",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
})
