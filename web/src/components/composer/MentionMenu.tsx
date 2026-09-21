import { memo } from "react"
import type { MentionItem } from "./types"

type MentionMenuProps = {
  items: MentionItem[]
  loading: boolean
  activeIndex: number
  onSelect: (item: MentionItem) => void
  onHover: (index: number) => void
}

export const MentionMenu = memo(function MentionMenu({ items, loading, activeIndex, onSelect, onHover }: MentionMenuProps) {
  return (
    <div className="slash-menu at-menu">
      {items.length === 0 && loading && <div className="slash-menu-item"><span className="slash-menu-desc">Searching...</span></div>}
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`slash-menu-item${i === activeIndex ? " active" : ""}`}
          onPointerDown={(e) => { e.preventDefault(); onSelect(item) }}
          onMouseEnter={() => onHover(i)}
        >
          <span className="slash-menu-name">@{item.name}</span>
          {item.description && <span className="slash-menu-desc">{item.description}</span>}
          <span className={`slash-menu-source source-${item.source}`}>{item.source}</span>
        </div>
      ))}
    </div>
  )
})
