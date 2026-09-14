import type { VisualAnnotation } from "../../hooks/useVisualSelection"
import { useT } from "../../i18n-context"

const ZONE_ICONS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"]

export function zoneIcon(idx: number): string {
  return ZONE_ICONS[idx] ?? `${idx + 1}`
}

type Props = {
  annotations: VisualAnnotation[]
  onRemove: (id: string) => void
  onComment: (id: string, comment: string) => void
  onFocusFile?: (file: string) => void
}

/** Lista compacta de zonas marcadas, atadas a `archivo:línea` cuando el build es dev. */
export function StudioZones({ annotations, onRemove, onComment, onFocusFile }: Props) {
  const t = useT()
  if (annotations.length === 0) {
    return <div style={{ fontSize: 11.5, color: "var(--muted)", padding: "8px 2px", lineHeight: 1.5 }}>{t('studio.noZones')}</div>
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {annotations.map((a, i) => {
        const loc = a.source?.file
          ? `${a.source.file}${a.source.line != null ? `:${a.source.line}` : ""}`
          : a.selector || a.tag
        const short = a.source?.file ? a.source.file.split(/[\\/]/).pop() : (a.tag || "elemento")
        return (
          <div key={a.id} style={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface-subtle)", padding: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{
                width: 17, height: 17, borderRadius: "50%", flexShrink: 0, fontSize: 10, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--primary)", color: "var(--on-primary)",
              }}>{zoneIcon(i)}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={loc}>
                {short}{a.source?.line != null ? `:${a.source.line}` : ""}
              </span>
              {a.members && a.members.length > 0 && (
                <span style={{ fontSize: 10, color: "var(--muted)" }}>{a.members.length} el.</span>
              )}
              <button type="button" className="btn-icon compact" style={{ marginLeft: "auto", flexShrink: 0 }}
                onClick={() => onRemove(a.id)} title={t('studio.removeZone')} aria-label={t('studio.removeZone')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {onFocusFile && a.source?.file && (
              <button type="button" className="btn-link" style={{ fontSize: 10.5, marginBottom: 5 }}
                onClick={() => onFocusFile(a.source!.file)}>{t('studio.openSource')}</button>
            )}
            <textarea
              value={a.comment}
              onChange={(e) => onComment(a.id, e.target.value)}
              placeholder={t('studio.zoneNotePlaceholder')}
              aria-label={t('studio.zoneNotePlaceholder')}
              rows={2}
              style={{
                width: "100%", resize: "vertical", background: "var(--surface)", color: "var(--text)",
                border: "1px solid var(--border)", borderRadius: 6, fontSize: 11.5, padding: "5px 7px", fontFamily: "inherit",
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
