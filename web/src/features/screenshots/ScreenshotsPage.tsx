import { memo, Suspense, lazy, useState } from "react"

const ScreenshotsEditor = lazy(() => import("./ScreenshotsEditor").then(m => ({ default: m.ScreenshotsEditor })))

export default memo(function ScreenshotsPage() {
  const [loaded, setLoaded] = useState(false)
  if (!loaded) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 24, textAlign: "center" }}>
        <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Screenshots — Editor ADCC</h2>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
          Editor integrado (antes proyecto aparte <code>0 screenshots</code> en :3002). Se carga bajo demanda, sin proceso Node hasta que lo abras — 0 RAM en reposo.
        </p>
        <button onClick={() => setLoaded(true)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--primary)", color: "white", cursor: "pointer" }}>
          Abrir editor
        </button>
        <div style={{ marginTop: 16, fontSize: 12, color: "var(--muted)" }}>
          Próximo: migrar <code>src/lib/*</code> + <code>components/editor/*</code> de Next a Vite compartido (dnd-kit, html-to-image, jszip ya en web).
        </div>
      </div>
    )
  }
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Cargando editor…</div>}>
      <ScreenshotsEditor />
    </Suspense>
  )
})
