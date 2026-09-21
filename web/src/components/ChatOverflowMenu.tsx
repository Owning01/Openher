import { memo, type ReactNode } from "react"
import { DropdownMenu } from "./DropdownMenu"
import { MenuDotsIcon } from "../Icons"

export type ChatOverflowItem = {
  id: string
  label: string
  icon?: ReactNode
  disabled?: boolean
  onSelect: () => void
}

type Props = {
  title: string
  items: ChatOverflowItem[]
  /** Botones de acción que comparten el contenedor del menú (terminal, historial, etc.). */
  leading?: ReactNode
}

// Menú "más acciones" del header del chat, sobre el DropdownMenu compartido.
export const ChatOverflowMenu = memo(function ChatOverflowMenu({ title, items, leading }: Props) {
  return (
    <DropdownMenu
      align="right"
      width={170}
      className="overflow-dropdown fade-in"
      wrapClassName="overflow-wrap header-overflow"
      wrapStyle={{ position: "relative", flexShrink: 0 }}
      trigger={(open) => (
        <>
          {leading}
          <button className="btn-icon compact" title={title} aria-expanded={open}>
            <MenuDotsIcon size={14} />
          </button>
        </>
      )}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="overflow-item"
          disabled={item.disabled}
          onClick={item.onSelect}
        >
          {item.icon} {item.label}
        </button>
      ))}
    </DropdownMenu>
  )
})
