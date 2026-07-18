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
          <h3>Getting Started</h3>
          <ul>
            <li><strong>Configure Server:</strong> Use Settings to enter host, port, username and password</li>
            <li><strong>Test Connection:</strong> Press Test to validate server connectivity</li>
            <li><strong>Save Settings:</strong> Press Save to apply configuration and start polling</li>
            <li><strong>Browse Sessions:</strong> View and manage sessions from the Sessions tab</li>
            <li><strong>Interact:</strong> Open a session and chat in the Detail view</li>
            <li><strong>Quick Input:</strong> Press Enter to send, Shift+Enter for new lines</li>
            <li><strong>Slash Commands:</strong> Text starting with <code>/</code> is sent as a command</li>
          </ul>
        </div>
      )}

      {helpPage === "server" && (
        <div className="help-content fade-in">
          <h3>Starting the OpenCode Server</h3>
          <p>Start OpenCode server with Basic Authentication enabled:</p>
          <div className="code-blocks">
            <h4>macOS / Linux (bash/zsh)</h4>
            <pre>OPENCODE_SERVER_USERNAME=opencode \
OPENCODE_SERVER_PASSWORD=your-password \
npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</pre>
            <h4>Windows PowerShell</h4>
            <pre>$env:OPENCODE_SERVER_USERNAME="opencode"
$env:OPENCODE_SERVER_PASSWORD="your-password"
npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</pre>
            <h4>Windows Command Prompt</h4>
            <pre>set OPENCODE_SERVER_USERNAME=opencode
set OPENCODE_SERVER_PASSWORD=your-password
npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</pre>
          </div>
        </div>
      )}

      {helpPage === "network" && (
        <div className="help-content fade-in">
          <h3>Network Configuration</h3>
          <h4>LAN Mode (Recommended)</h4>
          <p>Use your PC's local IP address for devices on the same network:</p>
          <pre>Example: 192.168.1.61</pre>
          <h4>WAN Mode (Advanced)</h4>
          <ul>
            <li>Configure NAT/port forwarding on your router</li>
            <li>Set up a VPN for secure remote access</li>
            <li>Use a reverse proxy with TLS/HTTPS</li>
          </ul>
          <h4>Security Requirements</h4>
          <ul>
            <li>Open TCP port 4096 in OS firewall</li>
            <li>Configure router/NAT port forwarding</li>
            <li>Use strong authentication passwords</li>
            <li>Prefer TLS/HTTPS for external access</li>
            <li>Restrict source IPs when possible</li>
            <li>Never expose without authentication</li>
          </ul>
        </div>
      )}

      {helpPage === "troubleshooting" && (
        <div className="help-content fade-in">
          <h3>Troubleshooting Guide</h3>
          <h4>Connection Diagnostics</h4>
          <ol>
            <li><strong>Verify Server:</strong> Check if OpenCode is listening on port 4096</li>
            <li><strong>Test Locally:</strong> Check health endpoint from the same machine</li>
            <li><strong>Test Network:</strong> Check health endpoint from your phone browser</li>
            <li><strong>Check Firewall:</strong> Ensure port 4096 is open in OS firewall</li>
          </ol>
          <h4>Health Check Commands</h4>
          <pre>curl -u opencode:your-password http://127.0.0.1:4096/global/health</pre>
          <pre>curl -u opencode:your-password http://YOUR_PC_IP:4096/global/health</pre>
          <h4>Common Issues</h4>
          <ul>
            <li><strong>CORS Errors:</strong> Add --cors flags to server</li>
            <li><strong>Connection Timeout:</strong> Check firewall settings</li>
            <li><strong>Auth Failures:</strong> Verify username/password</li>
          </ul>
        </div>
      )}

      {helpPage === "commands" && (
        <div className="help-content fade-in">
          <h3>Slash Commands</h3>
          <p>Local mobile commands are handled by the app. Server commands are loaded from OpenCode.</p>
          <div className="help-tabs compact" role="tablist">
            <button className={commandFilter === "all" ? "active" : ""}
              onClick={() => onCommandFilterChange("all")} role="tab" aria-selected={commandFilter === "all"}>
              Server Commands
            </button>
            <button className={commandFilter === "skill" ? "active" : ""}
              onClick={() => onCommandFilterChange("skill")} role="tab" aria-selected={commandFilter === "skill"}>
              Skills
            </button>
          </div>
          {displayedCommands.length === 0 ? (
            <div>
              <p className="subtle">No {commandFilter === "skill" ? "skills" : "server commands"} available</p>
              <p className="subtle">Connect to a server to see available commands and skills</p>
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
