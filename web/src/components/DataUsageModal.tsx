import { memo, useState } from "react"
import { useT } from "../i18n-context"
import { getDataUsage, resetDataUsage, formatBytes } from "../utils/dataUsage"
import type { DataPeriod, NetworkKind } from "../utils/dataUsage"
import { Modal } from "./Modal"

type Props = {
  onClose: () => void
}

const PERIODS: DataPeriod[] = ["day", "week", "month"]
const NETS: Array<NetworkKind | "all"> = ["all", "mobile", "wifi"]

export const DataUsageModal = memo(function DataUsageModal({ onClose }: Props) {
  const t = useT()
  const [period, setPeriod] = useState<DataPeriod>("day")
  const [net, setNet] = useState<NetworkKind | "all">("all")
  const [usage, setUsage] = useState(() => getDataUsage())

  const periodUsage = usage[period]
  const current = net === "all" ? periodUsage : periodUsage.byNet[net]

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
      <div className="toggle-row" role="tablist" aria-label="Network" style={{ marginTop: "var(--space-2)" }}>
        {NETS.map((n) => (
          <button key={n} type="button" role="tab"
            className={`toggle-btn${net === n ? " active" : ""}`}
            aria-selected={net === n}
            onClick={() => setNet(n)}>
            {n === "all" ? t('dataUsage.total') : t(`dataUsage.${n}`)}
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
      {net === "all" && (
        <p className="subtle" style={{ marginTop: "var(--space-2)", textAlign: "center" }}>
          {t('dataUsage.mobile')}: {formatBytes(periodUsage.byNet.mobile.total)} · {t('dataUsage.wifi')}: {formatBytes(periodUsage.byNet.wifi.total)}
        </p>
      )}
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
