import { HelpIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { ConnectionState } from "../types"

export function ConnectionNotices({ connectionState }: { connectionState: ConnectionState }) {
  const t = useT()
  return (
    <>
      {connectionState === "offline" && (
        <div className="notice error fade-in" style={{ marginBottom: 'var(--space-3)' }}>
           {t('connection.offline')}
        </div>
      )}
      {connectionState === "reconnecting" && (
        <div className="notice info fade-in" style={{ marginBottom: 'var(--space-3)' }}>
          <span style={{ display: "inline-flex", verticalAlign: "middle" }}><HelpIcon size={14} /></span> {t('connection.reconnecting')}
        </div>
      )}
    </>
  )
}
