import { memo } from "react"

type Props = {
  query: string
  onQueryChange: (value: string) => void
  matchCount: number
  index: number
  onPrev: () => void
  onNext: () => void
  placeholder: string
}

// Buscador de mensajes: navegación entre coincidencias (no filtra la lista).
export const MessageSearchBar = memo(function MessageSearchBar({
  query, onQueryChange, matchCount, index, onPrev, onNext, placeholder
}: Props) {
  return (
    <div className="message-search-bar">
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            if (e.shiftKey) onPrev()
            else onNext()
          }
        }}
        placeholder={placeholder}
      />
      {query && (
        <>
          <span className="message-search-count">
            {matchCount > 0 ? `${index + 1}/${matchCount}` : "0/0"}
          </span>
          <button className="btn-icon btn-ghost compact" onClick={onPrev} aria-label="Anterior" title="Anterior (Shift+Enter)">
            ↑
          </button>
          <button className="btn-icon btn-ghost compact" onClick={onNext} aria-label="Siguiente" title="Siguiente (Enter)">
            ↓
          </button>
        </>
      )}
    </div>
  )
})
