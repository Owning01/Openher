import { useT } from "../i18n-context"
import type { ConnectionState } from "../types"

export function ConnectionNotices({ connectionState }: { connectionState: ConnectionState }) {
  const t = useT()
  return (
    <>
      {connectionState === "offline" && (
        <div className="notice error fade-in" style={{ marginBottom: 'var(--space-3)' }}>
          ✗ {t('connection.offline')}
        </div>
      )}
      {connectionState === "reconnecting" && (
        <div className="notice info fade-in" style={{ marginBottom: 'var(--space-3)' }}>
          ℹ {t('connection.reconnecting')}
        </div>
      )}
    </>
  )
}
