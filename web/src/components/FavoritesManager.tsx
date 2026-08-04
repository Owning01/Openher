import { memo, useState, useCallback } from "react"
import { ModalHeader } from "./ModalHeader"
import { useT } from "../i18n-context"
import type { SessionView } from "../types"

type Props = {
  favorites: SessionView[]
  onReorder: (ids: string[]) => void
  onClose: () => void
}

export const FavoritesManager = memo(function FavoritesManager({ favorites, onReorder, onClose }: Props) {
  const t = useT()
  const [items, setItems] = useState(favorites)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const moveUp = useCallback((idx: number) => {
    if (idx <= 0) return
    const next = [...items]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setItems(next)
  }, [items])

  const moveDown = useCallback((idx: number) => {
    if (idx >= items.length - 1) return
    const next = [...items]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setItems(next)
  }, [items])

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const next = [...items]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(idx, 0, moved)
    setItems(next)
    setDragIdx(idx)
  }, [dragIdx, items])

  const handleDragEnd = useCallback(() => {
    setDragIdx(null)
  }, [])

  const handleSave = useCallback(() => {
    onReorder(items.map((i) => i.id))
    onClose()
  }, [items, onReorder, onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content favorites-manager" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('favorites.manage')}>
        <ModalHeader title={t('favorites.manage')} onClose={onClose} />
        <div className="modal-body">
          {items.length === 0 ? (
            <p className="subtle">{t('favorites.empty')}</p>
          ) : (
            <div className="favorites-list">
              {items.map((s, i) => (
                <div
                  key={s.id}
                  className={`favorite-item${dragIdx === i ? " dragging" : ""}`}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="favorite-drag-handle">⠿</span>
                  <div className="favorite-item-info">
                    <strong>{s.title}</strong>
                    <span className="subtle">{s.directory}</span>
                  </div>
                  <div className="favorite-item-arrows">
                    <button className="btn-icon compact" onClick={() => moveUp(i)} disabled={i === 0}>↑</button>
                    <button className="btn-icon compact" onClick={() => moveDown(i)} disabled={i === items.length - 1}>↓</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="modal-actions">
            <button className="btn-primary compact" onClick={handleSave} disabled={items.length === 0}>{t('favorites.saveOrder')}</button>
            <button className="btn-secondary compact" onClick={onClose}>{t('settings.cancel')}</button>
          </div>
        </div>
      </div>
    </div>
  )
})
