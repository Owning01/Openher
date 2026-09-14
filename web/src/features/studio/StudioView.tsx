import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ChatViewProps } from "../../components/ChatView"
import type { SessionView, ServerConfig, ConnectionState, DataMode } from "../../types"
import { SessionChatPanel } from "../../components/SessionChatPanel"
import { ExternalIframePanel } from "../external-plugins/ExternalIframePanel"
import type { BrowserPickedElement } from "../../components/BrowserVisualOverlay"
import { useT } from "../../i18n-context"
import { useStudioProject } from "./useStudioProject"
import { useOpenDesign } from "./useOpenDesign"
import { StudioCanvas } from "./StudioCanvas"
import { StudioZones } from "./StudioZones"
import { dirKey } from "../../utils/sessionDirs"

export type StudioViewProps = {
  config: ServerConfig | null
  dataMode: DataMode
  connectionState: ConnectionState
  busySessions: Set<string>
  baseChatProps: ChatViewProps
  vs: any
  onEnsureProjectSession: (directory: string) => Promise<SessionView | null>
  onRefreshSessions: () => Promise<void> | void
  onSetCommands: (cmds: any) => void
  onQueueAction: (action: any) => void
  onShellExecute: (cmd: string, sid?: string, dir?: string) => void
  onChangeAgent: (agentId: string) => void
  onOpenInThisPanel: (panelIdx: number, id: string) => void
  onSwapPanels: (a: number, b: number) => void
  onSettleSession: (id: string, dir: string) => void
  onOpenFile: (file: string) => void
  onOpenConnect: () => void
  onOpenBrowser: (url: string) => void
  onToggleInspectTool: (tool: "picker" | "pod") => void
  onBrowserVisualPick: (url: string, el: any) => void
}

const Icon = function Icon({ path, size = 16 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

const FOLDER_PATH = "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"
const SPARK_PATH = "m12 3 1.6 3.8L17 8.4l-3.4 1.6L12 13.8l-1.6-3.8L7 8.4l3.4-1.6zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z"
const X_PATH = "M6 6l12 12M18 6L6 18"
const PLAY_PATH = "M6 4l14 8-14 8z"
const STOP_PATH = "M6 6h12v12H6z"
const REFRESH_PATH = "M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"

const ActionButton = function ActionButton({
  onClick, disabled, icon, label, variant = "secondary",
}: { onClick: () => void; disabled?: boolean; icon: string; label: string; variant?: "primary" | "secondary" }) {
  return (
    <button type="button" className={variant === "primary" ? "btn-primary compact" : "btn-secondary compact"}
      onClick={onClick} disabled={disabled}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
      <Icon path={icon} size={14} /> {label}
    </button>
  )
}

export function StudioView(props: StudioViewProps) {
  const {
    config, dataMode, connectionState, busySessions, baseChatProps, vs,
    onEnsureProjectSession, onRefreshSessions, onSetCommands, onQueueAction,
    onShellExecute, onChangeAgent, onOpenInThisPanel, onSwapPanels, onSettleSession,
    onOpenFile, onOpenConnect, onOpenBrowser, onToggleInspectTool, onBrowserVisualPick,
  } = props
  const t = useT()
  const studio = useStudioProject()
  const [mode, setMode] = useState<"empty" | "design">("empty")
  const [session, setSession] = useState<SessionView | null>(null)
  const [sessionFailed, setSessionFailed] = useState(false)
  const [sessionNonce, setSessionNonce] = useState(0)
  const sessionRequestRef = useRef<string | null>(null)

  const { projects: odProjects, loading: odLoading, error: odError, refresh: odRefresh } =
    useOpenDesign(mode === "design")

  // Asegura una sesión de agente para el directorio del proyecto, sin duplicar.
  // El callback vive en un ref: su identidad cambia en cada render de producción
  // (depende de `sessions`/`creatingSession`), y usarlo como dep cancelaría la
  // request en vuelo y perdería la sesión.
  const ensureRef = useRef(onEnsureProjectSession)
  useEffect(() => { ensureRef.current = onEnsureProjectSession }, [onEnsureProjectSession])

  useEffect(() => {
    const dir = studio.project?.directory
    if (!dir) {
      setSession(null)
      setSessionFailed(false)
      sessionRequestRef.current = null
      return
    }
    const dirK = dirKey(dir)
    // La sesión de otro proyecto no debe quedar visible bajo el proyecto actual
    // (evita que el agente edite un directorio distinto al del canvas).
    if (session && dirKey(session.directory ?? "") !== dirK) {
      setSession(null)
      setSessionFailed(false)
      sessionRequestRef.current = null
      return
    }
    if (session && dirKey(session.directory ?? "") === dirK) return
    const token = `${dirK}#${sessionNonce}`
    if (sessionRequestRef.current === token) return
    sessionRequestRef.current = token
    let cancelled = false
    setSessionFailed(false)
    void ensureRef.current(dir)
      .then((s) => {
        if (cancelled) return
        if (s) setSession(s)
        else setSessionFailed(true)
      })
      .catch(() => { if (!cancelled) setSessionFailed(true) })
    return () => {
      cancelled = true
      // StrictMode (dev) ejecuta setup→cleanup→setup: liberar el token permite
      // que el replay reintente en vez de quedar en "Preparing…" para siempre.
      if (sessionRequestRef.current === token) sessionRequestRef.current = null
    }
  }, [studio.project?.directory, session, sessionNonce])

  const handlePick = useCallback((el: BrowserPickedElement) => {
    onBrowserVisualPick(studio.previewUrl, el)
  }, [onBrowserVisualPick, studio.previewUrl])

  const openDetected = useCallback(async (dir: string) => {
    await studio.openDirectory(dir)
    setMode("empty")
  }, [studio])

  const annotations = useMemo(() => (vs?.annotations ?? []) as any[], [vs?.annotations])

  // ---------- Sin proyecto: elección / generador ----------
  if (!studio.project) {
    return (
      <div className="studio-root" style={{ height: "100%", overflow: "auto", background: "var(--bg)" }}>
        {mode === "design" ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
              <button type="button" className="btn-icon compact" onClick={() => setMode("empty")} title={t('studio.back')} aria-label={t('studio.back')}>
                <Icon path="M15 18l-6-6 6-6" size={16} />
              </button>
              <strong style={{ fontSize: 13 }}>{t('studio.newWithOpenDesign')}</strong>
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{t('studio.newWithOpenDesignHint')}</span>
              <span style={{ flex: 1 }} />
              <ActionButton onClick={() => void odRefresh()} disabled={odLoading} icon={REFRESH_PATH} label={t('studio.refresh')} />
            </div>
            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
              <div style={{ flex: 1, minWidth: 0, borderRight: "1px solid var(--border)" }}>
                <Suspense fallback={<div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>{t('studio.loading')}</div>}>
                  <ExternalIframePanel name="opendesign" title="Open Design" url="http://127.0.0.1:3000" />
                </Suspense>
              </div>
              <aside style={{ width: 320, flexShrink: 0, background: "var(--surface)", padding: 12, overflow: "auto" }}>
                <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
                  {t('studio.detected')}
                </div>
                {odError && <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 8, lineHeight: 1.5 }}>{odError}</div>}
                {odLoading && <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{t('studio.loading')}</div>}
                {!odLoading && !odError && odProjects.length === 0 && (
                  <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 }}>{t('studio.noProjects')}</div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {odProjects.map((p) => (
                    <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface-subtle)", padding: 9 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.name}>{p.name}</div>
                      <div style={{ fontSize: 10.5, color: "var(--muted)", marginBottom: 7, wordBreak: "break-all" }}>
                        {p.directory || t('studio.noDirectory')}{p.status ? ` · ${p.status}` : ""}
                      </div>
                      <button type="button" className="btn-primary compact" disabled={!p.directory}
                        onClick={() => p.directory && void openDetected(p.directory)}
                        style={{ width: "100%", justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Icon path={FOLDER_PATH} size={13} /> {t('studio.openInStudio')}
                      </button>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-.01em" }}>{t('studio.emptyTitle')}</h1>
            <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>{t('studio.emptyHint')}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 14 }}>
              <button type="button" onClick={() => setMode("design")}
                style={{ textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, cursor: "pointer", color: "var(--text)", fontFamily: "inherit" }}>
                <span style={{ display: "flex", width: 38, height: 38, borderRadius: 10, background: "var(--primary-soft)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Icon path={SPARK_PATH} size={19} />
                </span>
                <strong style={{ display: "block", fontSize: 14, marginBottom: 4 }}>{t('studio.newWithOpenDesign')}</strong>
                <span style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.55 }}>{t('studio.newWithOpenDesignDesc')}</span>
              </button>
              <button type="button" onClick={() => void studio.openFolder()} disabled={studio.serving}
                style={{ textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, cursor: "pointer", color: "var(--text)", fontFamily: "inherit" }}>
                <span style={{ display: "flex", width: 38, height: 38, borderRadius: 10, background: "var(--surface-strong)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Icon path={FOLDER_PATH} size={19} />
                </span>
                <strong style={{ display: "block", fontSize: 14, marginBottom: 4 }}>{t('studio.openFolder')}</strong>
                <span style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.55 }}>{t('studio.openFolderDesc')}</span>
              </button>
            </div>
            {studio.error && <div style={{ marginTop: 16, fontSize: 12, color: "var(--muted)" }}>{studio.error}</div>}
          </div>
        )}
      </div>
    )
  }

  // ---------- Con proyecto: 3 columnas ----------
  const dev = studio.devServer
  return (
    <div className="studio-root" style={{ display: "flex", height: "100%", minHeight: 0, background: "var(--bg)" }}>
      {/* Izquierda: proyecto + zonas */}
      <section style={{ width: 258, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", background: "var(--surface)", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px", height: 40, flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
          <strong style={{ fontSize: 12.5 }}>{t('studio.project')}</strong>
          <span style={{ flex: 1 }} />
          <button type="button" className="btn-icon compact" onClick={() => { studio.close(); setMode("empty") }} title={t('studio.closeProject')} aria-label={t('studio.closeProject')}>
            <Icon path={X_PATH} size={14} />
          </button>
        </div>
        <div style={{ padding: 10, borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={studio.project.directory}>
            {studio.project.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: dev.status === "running" ? "var(--success)" : "var(--muted)" }} />
            {dev.status === "running"
              ? t('studio.devRunning', { url: dev.serverUrl ?? "" })
              : studio.project.kind === "node" ? t('studio.staticFallback') : t('studio.staticMode')}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {dev.hasDevServer && dev.status !== "running" && (
              <ActionButton variant="primary" onClick={() => void studio.startDev()} disabled={dev.status === "starting"}
                icon={PLAY_PATH} label={dev.status === "starting" ? t('studio.starting') : t('studio.startDev')} />
            )}
            {dev.status === "running" && (
              <ActionButton onClick={() => void dev.stopDevServer()} icon={STOP_PATH} label={t('studio.stopDev')} />
            )}
            <ActionButton onClick={() => studio.openFolder()} disabled={studio.serving} icon={FOLDER_PATH} label={t('studio.changeFolder')} />
          </div>
          {studio.error && <div style={{ fontSize: 11, color: "var(--danger)" }}>{studio.error}</div>}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 10 }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
            {t('studio.zones')}
          </div>
          <StudioZones
            annotations={annotations}
            onRemove={(id) => vs?.removeAnnotation?.(id)}
            onComment={(id, c) => vs?.setAnnotationComment?.(id, c)}
            onFocusFile={onOpenFile}
          />
        </div>
      </section>

      {/* Centro: canvas */}
      <section style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <StudioCanvas
          url={studio.previewUrl}
          inspectMode={!!vs?.inspectMode}
          inspectTool={vs?.inspectTool === "pod" ? "pod" : "picker"}
          onToggleInspectTool={onToggleInspectTool}
          onPick={handlePick}
          onExitInspect={() => vs?.setInspectMode?.(false)}
          onReload={studio.reload}
          reloadKey={studio.reloadKey}
          onSelectEntry={studio.selectEntry}
          htmlFiles={studio.project.htmlFiles}
          entryPoint={studio.project.entryPoint}
        />
      </section>

      {/* Derecha: agente */}
      <section style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: "1px solid var(--border)", background: "var(--surface)", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", height: 40, flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
          <strong style={{ fontSize: 12.5 }}>{t('studio.agent')}</strong>
          {annotations.length > 0 && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--primary)", background: "var(--primary-soft)", padding: "2px 8px", borderRadius: 999 }}>
              {t('studio.zonesCount', { count: annotations.length })}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {config && session && dirKey(session.directory ?? "") === dirKey(studio.project.directory) ? (
            <SessionChatPanel
              session={session}
              config={config}
              dataMode={dataMode}
              baseProps={baseChatProps}
              active
              connectionState={connectionState}
              panelIndex={0}
              onActivate={() => {}}
              onClose={() => {}}
              onSplitSession={() => {}}
              onSettled={onSettleSession}
              onRefreshSessions={onRefreshSessions}
              onSetCommands={onSetCommands}
              onQueueAction={onQueueAction}
              onShellExecute={(cmd, sid, dir) => onShellExecute(cmd, sid, dir)}
              onChangeAgentGlobal={(id) => onChangeAgent(id)}
              onOpenInThisPanel={(sid) => onOpenInThisPanel(0, sid)}
              onSwapPanels={onSwapPanels}
              onOpenFile={onOpenFile}
              onOpenConnect={onOpenConnect}
              onOpenBrowser={onOpenBrowser}
              busySessionIds={busySessions}
              visualSelection={vs?.selection ?? null}
              visualPromptContext={vs?.promptContext ?? ""}
              onClearVisualSelection={() => { vs?.clear?.(); vs?.clearAnnotations?.() }}
              onFocusVisualFile={onOpenFile}
            />
          ) : (
            <div style={{ padding: 16, fontSize: 12, color: "var(--muted)", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 10 }}>
              {sessionFailed ? (
                <>
                  <span>{t('studio.sessionFailed')}</span>
                  <button type="button" className="btn-secondary compact" style={{ alignSelf: "flex-start" }}
                    onClick={() => setSessionNonce((n) => n + 1)}>{t('studio.retry')}</button>
                </>
              ) : t('studio.creatingSession')}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
