import { RefreshIcon, PlusIcon, LoadingIcon } from "../Icons"
import { useT } from "../i18n-context"

type SessionToolbarProps = {
  refreshing: boolean
  creating: boolean
  onRefresh: () => void
  onNewSession: () => void
}

export function SessionToolbar({ refreshing, creating, onRefresh, onNewSession }: SessionToolbarProps) {
  const t = useT()
  return (
    <div className="inline-actions">
      <button onClick={onRefresh} className="btn-secondary" disabled={refreshing}>
        {refreshing ? <LoadingIcon size={18} /> : <RefreshIcon size={18} />}
        {t('sessions.refresh')}
      </button>
      <button onClick={onNewSession} className="btn-primary" disabled={creating}>
        {creating ? <LoadingIcon size={18} /> : <PlusIcon size={18} />}
        {creating ? t('sessions.creating') : t('sessions.new')}
      </button>
    </div>
  )
}
