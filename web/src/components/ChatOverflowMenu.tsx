import { memo, useState, type ReactNode } from "react"
import { DropdownMenu } from "./DropdownMenu"
import { ChevronRightIcon, MenuDotsIcon } from "../Icons"
import "../styles/chat-menu.css"

export type ChatOverflowItem = {
  id: string
  label: string
  icon?: ReactNode
  disabled?: boolean
  /** Id del grupo al que pertenece; sin grupo el item va a la raíz. */
  group?: string
  /** Dibuja un separador encima del item (p. ej. antes de Configuración). */
  separatorBefore?: boolean
  /** Etiqueta chica a la derecha (p. ej. "vista" en items que abren una vista). */
  tag?: string
  onSelect: () => void
}

export type ChatOverflowGroup = {
  id: string
  label: string
  icon?: ReactNode
  /** Abierto al montar el menú. Por defecto true: nada queda oculto. */
  defaultOpen?: boolean
}

type Props = {
  title: string
  items: ChatOverflowItem[]
  groups?: ChatOverflowGroup[]
  /** Botones de acción que comparten el contenedor del menú (terminal, notas, etc.). */
  leading?: ReactNode
}

function OverflowButton({ item }: { item: ChatOverflowItem }) {
  return (
    <button
      key={item.id}
      type="button"
      className="overflow-item"
      disabled={item.disabled}
      onClick={item.onSelect}
    >
      {item.icon} <span className="overflow-label">{item.label}</span>
      {item.tag && <span className="overflow-tag">{item.tag}</span>}
    </button>
  )
}

// Menú "más acciones" del header del chat, sobre el DropdownMenu compartido.
// Los items conservan `.overflow-item` dentro de `.dropdown-menu` (contrato
// que usa ChatHeader.test.tsx): los grupos solo agregan filas de cabecera.
export const ChatOverflowMenu = memo(function ChatOverflowMenu({ title, items, groups = [], leading }: Props) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, g.defaultOpen ?? true]))
  )
  const toggleGroup = (id: string) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))

  const rootItems = items.filter((item) => !item.group || !groups.some((g) => g.id === item.group))

  return (
    <DropdownMenu
      align="right"
      width={216}
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
      {groups.map((group) => {
        const children = items.filter((item) => item.group === group.id)
        if (children.length === 0) return null
        const expanded = openGroups[group.id] ?? true
        return (
          <div key={group.id} className="overflow-group">
            <button
              type="button"
              className="overflow-item overflow-group-head"
              aria-expanded={expanded}
              aria-controls={`overflow-group-${group.id}`}
              data-keep-open=""
              onClick={() => toggleGroup(group.id)}
            >
              {group.icon}
              <span className="overflow-label">{group.label}</span>
              <span className="overflow-group-chevron" aria-hidden="true">
                <ChevronRightIcon size={13} />
              </span>
            </button>
            {expanded && (
              <div id={`overflow-group-${group.id}`} className="overflow-group-body" role="group" aria-label={group.label}>
                {children.map((item) => (
                  <OverflowButton key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )
      })}
      {rootItems.map((item) => (
        <div key={item.id}>
          {item.separatorBefore && <div className="overflow-separator" role="separator" />}
          <OverflowButton item={item} />
        </div>
      ))}
    </DropdownMenu>
  )
})
