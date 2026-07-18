import { memo } from "react"
import { HelpIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { HelpPage as HelpPageType, CommandInfo } from "../types"

type HelpPageProps = {
  helpPage: HelpPageType
  onHelpPageChange: (page: HelpPageType) => void
  commands: CommandInfo[]
  commandFilter: "all" | "skill"
  onCommandFilterChange: (filter: "all" | "skill") => void
  runtimeError: string | null
}

const helpTabs: HelpPageType[] = ["overview", "server", "network", "troubleshooting", "commands"]

function helpContent(t: ReturnType<typeof useT>, key: string): JSX.Element[] {
  const raw = t(key)
  return raw.split("|").map((line, i) => {
    if (!line.trim()) return <br key={i} />
    if (line.startsWith("<b>") && line.includes("</b>")) {
      const boldEnd = line.indexOf("</b>")
      const bold = line.slice(3, boldEnd)
      const rest = line.slice(boldEnd + 4)
      return <p key={i}><strong>{bold}</strong>{rest}</p>
    }
    if (line.startsWith("<code>") && line.endsWith("</code>")) {
      return <pre key={i}>{line.slice(6, -7)}</pre>
    }
    return <p key={i}>{line}</p>
  })
}

export const HelpPage = memo(function HelpPage({
  helpPage, onHelpPageChange, commands, commandFilter, onCommandFilterChange, runtimeError
}: HelpPageProps) {
  const t = useT()
  const displayedCommands = commandFilter === "skill" ? commands.filter((c) => c.source === "skill") : commands

  return (
    <section className="panel help fade-in">
      <h2>
        <HelpIcon size={24} className="icon-inline-heading" />
        {t('help.title')}
      </h2>
      <div className="help-tabs" role="tablist">
        {helpTabs.map((page) => (
          <button key={page} className={helpPage === page ? "active" : ""}
            onClick={() => onHelpPageChange(page)} role="tab" aria-selected={helpPage === page}>
            {t(`help.${page}` as any)}
          </button>
        ))}
      </div>

      {helpPage === "overview" && (
        <div className="help-content fade-in">
          <h3>{t('help.overview')}</h3>
          {helpContent(t, 'help.overview.content')}
        </div>
      )}

      {helpPage === "server" && (
        <div className="help-content fade-in">
          {helpContent(t, 'help.server.content')}
        </div>
      )}

      {helpPage === "network" && (
        <div className="help-content fade-in">
          {helpContent(t, 'help.network.content')}
        </div>
      )}

      {helpPage === "troubleshooting" && (
        <div className="help-content fade-in">
          {helpContent(t, 'help.troubleshooting.content')}
        </div>
      )}

      {helpPage === "commands" && (
        <div className="help-content fade-in">
          <h3>{t('help.commands')}</h3>
          <p>{t('help.commands.content')}</p>
          <div className="help-tabs compact" role="tablist">
            <button className={commandFilter === "all" ? "active" : ""}
              onClick={() => onCommandFilterChange("all")} role="tab" aria-selected={commandFilter === "all"}>
              {t('help.commands.serverTab')}
            </button>
            <button className={commandFilter === "skill" ? "active" : ""}
              onClick={() => onCommandFilterChange("skill")} role="tab" aria-selected={commandFilter === "skill"}>
              {t('help.commands.skillsTab')}
            </button>
          </div>
          {displayedCommands.length === 0 ? (
            <div>
              <p className="subtle">{t('help.commands.empty', { type: commandFilter === "skill" ? "skills" : "server commands" })}</p>
              <p className="subtle">{t('help.commands.emptyConnected')}</p>
            </div>
          ) : (
            <div className="commands-grid">
              {displayedCommands.map((cmd) => (
                <div key={cmd.name} className="command-card">
                  <code className="command-name">/{cmd.name}</code>
                  {cmd.description && <p className="command-description">{cmd.description}</p>}
                  {cmd.source && <p className="subtle">{cmd.source}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {runtimeError && <p className="error">{runtimeError}</p>}
    </section>
  )
})
