import { memo, useState } from "react"
import { useT } from "../i18n-context"
import { getDataUsage, resetDataUsage, formatBytes } from "../utils/dataUsage"
import { Modal } from "./Modal"

type Props = {
  onClose: () => void
}

const PERIODS = ["day", "week", "month"] as const

export const DataUsageModal = memo(function DataUsageModal({ onClose }: Props) {
  const t = useT()
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("day")
  const [usage, setUsage] = useState(() => getDataUsage())

  const current = usage[period]

  const handleReset = () => {
    resetDataUsage()
    setUsage(getDataUsage())
  }

  return (
    <Modal onClose={onClose} aria-labelledby="datausage-title">
      <h2 id="datausage-title">{t('dataUsage.title')}</h2>
      <div className="toggle-row" role="tablist" aria-label={t('dataUsage.title')}>
        {PERIODS.map((p) => (
          <button key={p} type="button" role="tab"
            className={`toggle-btn${period === p ? " active" : ""}`}
            aria-selected={period === p}
            onClick={() => setPeriod(p)}>
            {t(`dataUsage.${p}`)}
          </button>
        ))}
      </div>
      <div className="stats-grid" style={{ marginTop: "var(--space-3)" }}>
        <div className="stat-item">
          <span className="stat-value">{formatBytes(current.up)}</span>
          <span className="stat-label">{t('dataUsage.up')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{formatBytes(current.down)}</span>
          <span className="stat-label">{t('dataUsage.down')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{formatBytes(current.total)}</span>
          <span className="stat-label">{t('dataUsage.total')}</span>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={handleReset}>
          {t('dataUsage.reset')}
        </button>
        <button className="btn-primary" onClick={onClose}>
          {t('error.close')}
        </button>
      </div>
    </Modal>
  )
})

