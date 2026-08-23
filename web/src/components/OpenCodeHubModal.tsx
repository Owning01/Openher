import { memo, useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { CloseIcon, SearchIcon, SaveIcon, LoadingIcon } from "../Icons"
import { shell } from "../shell"
import { api } from "../api"
import type { AgentOption, ServerConfig } from "../types"

type TabType = "agents" | "skills" | "config"

type SkillItem = {
  name: string
  description: string
  path: string
  skillFile: string
  source: string
}

type ConfigFileItem = {
  path: string
  name: string
  content: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  agents?: AgentOption[]
  activeAgentID?: string
  onSelectAgent?: (id: string) => void
  serverConfig?: ServerConfig
}

export const OpenCodeHubModal = memo(function OpenCodeHubModal({
  isOpen,
  onClose,
  agents = [],
  activeAgentID,
  onSelectAgent,
  serverConfig,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("agents")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [globalData, setGlobalData] = useState<{
    configPath: string
    configContent: string
    configFiles: ConfigFileItem[]
    instructionsFiles: ConfigFileItem[]
    skills: SkillItem[]
    scannedRoots: string[]
  } | null>(null)

  const [selectedConfigPath, setSelectedConfigPath] = useState<string>("")
  const [rawConfig, setRawConfig] = useState("")
  const [jsonError, setJsonError] = useState<string | null>(null)

  const loadGlobal = useCallback(async () => {
    setLoading(true)
    try {
      let shellRes: any = null
      try {
        shellRes = await shell.opencode.getGlobal()
      } catch {}

      if (shellRes && (shellRes.configContent || (shellRes.configFiles && shellRes.configFiles.length > 0))) {
        setGlobalData(shellRes)
        const primaryPath = shellRes.configPath || (shellRes.configFiles?.[0]?.path ?? "")
        setSelectedConfigPath(primaryPath)
        const primaryContent = shellRes.configContent || (shellRes.configFiles?.[0]?.content ?? "{}")
        setRawConfig(primaryContent)
      } else if (serverConfig) {
        try {
          const liveCfg = await api.loadRawConfig(serverConfig)
          const pretty = JSON.stringify(liveCfg, null, 2)
          setRawConfig(pretty)
          setGlobalData({
            configPath: "Servidor OpenCode (en vivo /config)",
            configContent: pretty,
            configFiles: [{ path: "/config", name: "Servidor OpenCode (en vivo)", content: pretty }],
            instructionsFiles: [],
            skills: [],
            scannedRoots: [],
          })
        } catch {}
      }
    } catch (err) {
      console.error("Error al cargar configuración global:", err)
    } finally {
      setLoading(false)
    }
  }, [serverConfig])

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

  const handleSelectConfigFile = (filePath: string) => {
    setSelectedConfigPath(filePath)
    const found = globalData?.configFiles?.find((f) => f.path === filePath)
    if (found) {
      setRawConfig(found.content)
      try {
        JSON.parse(found.content)
        setJsonError(null)
      } catch (e: any) {
        setJsonError(e.message)
      }
    }
  }

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
    const targetPath = selectedConfigPath || globalData?.configPath
    if (!targetPath) return
    if (jsonError) {
      setSaveStatus("JSON inválido: " + jsonError)
      return
    }
    setSaving(true)
    setSaveStatus(null)
    try {
      const res = await shell.opencode.saveGlobal(targetPath, rawConfig)
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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredAgents = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return agents
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.prompt && a.prompt.toLowerCase().includes(q))
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
          maxWidth: "1000px",
          height: "85vh",
          maxHeight: "780px",
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
                OpenCode Hub (Agentes, Skills & Configuración)
              </div>
              <div style={{ fontSize: "11px", color: "#8b949e" }}>
                Inspecciona prompts de sistema, modelos asignados, catálogo de skills y archivos de configuración
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
            <span>Configuración Oficial ({globalData?.configFiles?.length ? globalData.configFiles.length : "opencode.json"})</span>
          </button>

          {activeTab !== "config" && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", position: "relative" }}>
              <span style={{ position: "absolute", left: "10px", color: "#8b949e", display: "flex", alignItems: "center" }}>
                <SearchIcon size={13} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar ${activeTab === "agents" ? "agentes o prompts" : "skills"}...`}
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
              <span>Cargando configuración de OpenCode...</span>
            </div>
          ) : activeTab === "agents" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {filteredAgents.length === 0 ? (
                <div style={{ color: "#8b949e", padding: "20px", textAlign: "center" }}>
                  No se encontraron agentes configurados.
                </div>
              ) : (
                filteredAgents.map((agent) => {
                  const isSelected = agent.id === activeAgentID
                  const isExpanded = expandedPromptId === agent.id
                  const promptText = agent.prompt || (agent.description ? `// Descripción:\n${agent.description}` : "// Sin prompt de sistema configurado")

                  return (
                    <div
                      key={agent.id}
                      style={{
                        background: isSelected ? "rgba(88, 166, 255, 0.06)" : "#161b22",
                        border: isSelected ? "1px solid #58a6ff" : "1px solid #30363d",
                        borderRadius: "8px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "20px" }}>
                            {agent.name.toLowerCase().includes("plan") ? "🧭" : agent.name.toLowerCase().includes("build") ? "🛠️" : "🤖"}
                          </span>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: 600, fontSize: "15px", color: "#f0f6fc" }}>{agent.name}</span>
                              <span style={{ fontSize: "11px", background: "#21262d", color: "#8b949e", padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace" }}>
                                {agent.id}
                              </span>
                              {agent.mode && (
                                <span style={{ fontSize: "10px", background: "rgba(88,166,255,0.15)", color: "#58a6ff", padding: "2px 6px", borderRadius: "4px" }}>
                                  {agent.mode}
                                </span>
                              )}
                            </div>
                            {agent.description && (
                              <div style={{ fontSize: "12px", color: "#8b949e", marginTop: "2px" }}>
                                {agent.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {isSelected && (
                            <span style={{ fontSize: "11px", background: "#1f6feb", color: "#fff", padding: "3px 8px", borderRadius: "10px", fontWeight: 600 }}>
                              ACTIVO EN CHAT
                            </span>
                          )}
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
                                borderRadius: "6px",
                                color: "#f0f6fc",
                                padding: "4px 10px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              Seleccionar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* System Prompt Box */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Prompt del Sistema / Instrucciones
                          </span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleCopy(agent.id, promptText)}
                              style={{
                                background: "#21262d",
                                border: "1px solid #30363d",
                                borderRadius: "4px",
                                color: "#c9d1d9",
                                fontSize: "11px",
                                padding: "2px 8px",
                                cursor: "pointer",
                              }}
                            >
                              {copiedId === agent.id ? "✓ Copiado" : "Copiar Prompt"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedPromptId(isExpanded ? null : agent.id)}
                              style={{
                                background: "#21262d",
                                border: "1px solid #30363d",
                                borderRadius: "4px",
                                color: "#58a6ff",
                                fontSize: "11px",
                                padding: "2px 8px",
                                cursor: "pointer",
                              }}
                            >
                              {isExpanded ? "Contraer ▲" : "Expandir ▼"}
                            </button>
                          </div>
                        </div>

                        <pre
                          style={{
                            background: "#090d13",
                            border: "1px solid #30363d",
                            borderRadius: "6px",
                            padding: "10px 12px",
                            color: "#e6edf3",
                            fontSize: "11px",
                            fontFamily: "Consolas, Menlo, Monaco, 'Courier New', monospace",
                            lineHeight: "1.4",
                            maxHeight: isExpanded ? "400px" : "80px",
                            overflowY: "auto",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            margin: 0,
                          }}
                        >
                          {promptText}
                        </pre>
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
                    {r.split(/[\\/]/).slice(-2).join("/")}
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
              {/* File switcher bar */}
              {globalData?.configFiles && globalData.configFiles.length > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#8b949e", whiteSpace: "nowrap" }}>Archivos detectados:</span>
                  {globalData.configFiles.map((file) => {
                    const isActive = file.path === selectedConfigPath
                    return (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => handleSelectConfigFile(file.path)}
                        style={{
                          background: isActive ? "#1f6feb" : "#21262d",
                          color: isActive ? "#fff" : "#c9d1d9",
                          border: "none",
                          borderRadius: "4px",
                          padding: "3px 8px",
                          fontSize: "11px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        📄 {file.name}
                      </button>
                    )
                  })}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "12px", color: "#8b949e" }}>
                  Ruta: <span style={{ color: "#58a6ff", fontFamily: "monospace" }}>{selectedConfigPath || globalData?.configPath || "opencode.json"}</span>
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