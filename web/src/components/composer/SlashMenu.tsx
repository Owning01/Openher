import { memo } from "react"
import type { CommandInfo } from "../../types"

type SlashMenuProps = {
  commands: CommandInfo[]
  activeIndex: number
  onSelect: (cmd: CommandInfo) => void
  onHover: (index: number) => void
}

export const SlashMenu = memo(function SlashMenu({ commands, activeIndex, onSelect, onHover }: SlashMenuProps) {
  return (
    <div className="slash-menu">
      {commands.map((cmd, i) => (
        <div
          key={cmd.name}
          className={`slash-menu-item${i === activeIndex ? " active" : ""}`}
          onPointerDown={(e) => { e.preventDefault(); onSelect(cmd) }}
          onMouseEnter={() => onHover(i)}
        >
          <span className="slash-menu-name">/{cmd.name}</span>
          {cmd.description && <span className="slash-menu-desc">{cmd.description}</span>}
          {cmd.source && cmd.source !== "command" && <span className="slash-menu-source">{cmd.source}</span>}
        </div>
      ))}
    </div>
  )
})
