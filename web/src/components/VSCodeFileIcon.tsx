import { memo } from "react"

export type VSCodeFileIconProps = {
  name: string
  isDir?: boolean
  isOpen?: boolean
  size?: number
  className?: string
}

export function getFileCategory(name: string, isDir = false): string {
  if (isDir) return "folder"
  const lower = name.toLowerCase()

  // Exact file names
  if (lower === ".gitignore" || lower === ".gitattributes" || lower === ".gitmodules") return "git"
  if (lower.startsWith(".env")) return "env"
  if (lower === "cargo.toml") return "cargo"
  if (lower === "cargo.lock" || lower.endsWith(".lock") || lower.includes("lock.")) return "lock"
  if (lower === "license" || lower.startsWith("license.") || lower === "copying") return "license"
  if (lower === "dockerfile" || lower.startsWith("dockerfile.")) return "docker"
  if (lower === "makefile" || lower === "cmakelists.txt") return "config"

  // Extension based
  const parts = lower.split(".")
  const ext = parts.length > 1 ? parts[parts.length - 1] : ""

  if (ext === "md" || ext === "mdx" || ext === "markdown") return "markdown"
  if (ext === "bat" || ext === "cmd" || ext === "ps1" || ext === "sh" || ext === "bash" || ext === "zsh") return "terminal"
  if (ext === "json" || ext === "jsonc" || ext === "json5") return "json"
  if (ext === "yaml" || ext === "yml") return "yaml"
  if (ext === "toml") return "toml"
  if (ext === "ts" || ext === "mts" || ext === "cts") return "typescript"
  if (ext === "tsx") return "react_ts"
  if (ext === "js" || ext === "mjs" || ext === "cjs") return "javascript"
  if (ext === "jsx") return "react_js"
  if (ext === "rs") return "rust"
  if (ext === "py" || ext === "pyw" || ext === "ipynb") return "python"
  if (ext === "go") return "go"
  if (ext === "c" || ext === "h") return "c"
  if (ext === "cpp" || ext === "cc" || ext === "cxx" || ext === "hpp") return "cpp"
  if (ext === "cs") return "csharp"
  if (ext === "java" || ext === "jar") return "java"
  if (ext === "kt" || ext === "kts") return "kotlin"
  if (ext === "swift") return "swift"
  if (ext === "php") return "php"
  if (ext === "rb") return "ruby"
  if (ext === "html" || ext === "htm") return "html"
  if (ext === "css") return "css"
  if (ext === "scss" || ext === "sass" || ext === "less") return "sass"
  if (ext === "sql" || ext === "db" || ext === "sqlite") return "database"
  if (ext === "exe" || ext === "dll" || ext === "so" || ext === "dylib" || ext === "bin") return "exe"
  if (ext === "svg") return "svg"
  if (["png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "avif"].includes(ext)) return "image"
  if (ext === "pdf") return "pdf"
  if (["zip", "tar", "gz", "7z", "rar", "tgz"].includes(ext)) return "archive"
  if (ext === "txt" || ext === "log") return "text"

  return "file"
}

export const VSCodeFileIcon = memo(function VSCodeFileIcon({
  name,
  isDir = false,
  isOpen = false,
  size = 16,
  className = "",
}: VSCodeFileIconProps) {
  const cat = getFileCategory(name, isDir)

  if (isDir) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        {isOpen ? (
          <path
            d="M1.5 3A1.5 1.5 0 0 0 0 4.5v7A1.5 1.5 0 0 0 1.5 13H14a1.5 1.5 0 0 0 1.5-1.5V6.5A1.5 1.5 0 0 0 14 5H7.707L6.354 3.646A1.5 1.5 0 0 0 5.293 3.207H1.5z"
            fill="#7fa2ba"
            fillOpacity="0.8"
          />
        ) : (
          <path
            d="M1.5 3A1.5 1.5 0 0 0 0 4.5v7A1.5 1.5 0 0 0 1.5 13H14a1.5 1.5 0 0 0 1.5-1.5V6.5A1.5 1.5 0 0 0 14 5H7.707L6.354 3.646A1.5 1.5 0 0 0 5.293 3.207H1.5z"
            fill="#90a4ae"
            fillOpacity="0.75"
          />
        )}
      </svg>
    )
  }

  switch (cat) {
    case "git":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <path d="M14.85 6.75l-5.6-5.6a1.2 1.2 0 0 0-1.7 0l-1.3 1.3 2.1 2.1a1.4 1.4 0 0 1 1.8 1.8l2 2a1.4 1.4 0 1 1-.85.85l-1.9-1.9v2.5a1.4 1.4 0 1 1-1.2 0V6.6a1.4 1.4 0 0 1-.75-1.8L5.35 2.7 1.15 6.9a1.2 1.2 0 0 0 0 1.7l5.6 5.6a1.2 1.2 0 0 0 1.7 0l6.4-6.4a1.2 1.2 0 0 0 0-1.75z" fill="#f05032" />
        </svg>
      )

    case "markdown":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <rect x="0.5" y="2.5" width="15" height="11" rx="1.5" stroke="#4aa3df" strokeWidth="1.2" />
          <path d="M2.5 10.5V5.5l2.2 2.5 2.2-2.5v5" stroke="#4aa3df" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11.5 5.5v5M9.5 8.5l2 2 2-2" stroke="#4aa3df" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )

    case "terminal":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <path d="M2 4.5l4 3.5-4 3.5" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 12h6.5" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )

    case "env":
    case "config":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#94a3b8" />
          <path d="M13.5 8.7a5.7 5.7 0 0 0 0-1.4l1.3-1a.5.5 0 0 0 .1-.6l-1.2-2.1a.5.5 0 0 0-.6-.2l-1.5.6a5.5 5.5 0 0 0-1.2-.7L10.2 1.8a.5.5 0 0 0-.5-.4H7.3a.5.5 0 0 0-.5.4l-.2 1.5a5.5 5.5 0 0 0-1.2.7l-1.5-.6a.5.5 0 0 0-.6.2L2.1 5.7a.5.5 0 0 0 .1.6l1.3 1a5.7 5.7 0 0 0 0 1.4l-1.3 1a.5.5 0 0 0-.1.6l1.2 2.1a.5.5 0 0 0 .6.2l1.5-.6c.4.3.8.5 1.2.7l.2 1.5a.5.5 0 0 0 .5.4h2.4a.5.5 0 0 0 .5-.4l.2-1.5c.4-.2.8-.4 1.2-.7l1.5.6a.5.5 0 0 0 .6-.2l1.2-2.1a.5.5 0 0 0-.1-.6l-1.3-1zM8 11.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4z" fill="#94a3b8" />
        </svg>
      )

    case "lock":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <rect x="3" y="6.5" width="10" height="7.5" rx="1.5" fill="#94a3b8" />
          <path d="M5 6.5V4.5a3 3 0 0 1 6 0v2" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="10" r="1" fill="#18181c" />
        </svg>
      )

    case "cargo":
    case "toml":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" rx="2" fill="#dea584" fillOpacity="0.2" stroke="#dea584" strokeWidth="1.2" />
          <path d="M5 5.5h6M8 5.5v6" stroke="#dea584" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )

    case "yaml":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <text x="8" y="11.5" textAnchor="middle" fill="#c084fc" fontFamily="var(--font-mono), monospace" fontSize="11" fontWeight="800">Y</text>
        </svg>
      )

    case "json":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <text x="8" y="11.5" textAnchor="middle" fill="#eab308" fontFamily="var(--font-mono), monospace" fontSize="11" fontWeight="800">{"{}"}</text>
        </svg>
      )

    case "license":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <circle cx="8" cy="8" r="6" stroke="#94a3b8" strokeWidth="1.2" />
          <path d="M9.5 6.2a2.4 2.4 0 1 0 0 3.6" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )

    case "exe":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="#4ade80" strokeWidth="1.2" fill="#4ade80" fillOpacity="0.1" />
          <path d="M4.5 6l2.5 2-2.5 2M8.5 10h3" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )

    case "typescript":
    case "react_ts":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <rect x="1" y="1" width="14" height="14" rx="2" fill="#3178c6" />
          <text x="8" y="11.5" textAnchor="middle" fill="#ffffff" fontFamily="var(--font-mono), monospace" fontSize="8" fontWeight="800">TS</text>
        </svg>
      )

    case "javascript":
    case "react_js":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <rect x="1" y="1" width="14" height="14" rx="2" fill="#f1e05a" />
          <text x="8" y="11.5" textAnchor="middle" fill="#323330" fontFamily="var(--font-mono), monospace" fontSize="8" fontWeight="800">JS</text>
        </svg>
      )

    case "rust":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <circle cx="8" cy="8" r="6" stroke="#dea584" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <text x="8" y="11" textAnchor="middle" fill="#dea584" fontFamily="var(--font-mono), monospace" fontSize="8" fontWeight="800">R</text>
        </svg>
      )

    case "python":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <path d="M7.8 1.5C5 1.5 5.2 2.7 5.2 2.7l.01 1.2h2.7v.4H4.1S2.7 4.1 2.7 6.9c0 2.8 1.2 2.7 1.2 2.7h.7v-1s-.04-1.2 1.2-1.2h2.7s1.1.02 1.1-1.1V3.7s.17-2.2-1.8-2.2z" fill="#3572a5" />
          <path d="M8.2 14.5c2.8 0 2.6-1.2 2.6-1.2l-.01-1.2H8.09v-.4h3.81s1.4.15 1.4-2.6c0-2.8-1.2-2.7-1.2-2.7h-.7v1s.04 1.2-1.2 1.2H7.5s-1.1-.02-1.1 1.1v3.6s-.17 2.2 1.8 2.2z" fill="#ffd845" />
        </svg>
      )

    case "html":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <path d="M2.5 1.5l1 12 4.5 1.5 4.5-1.5 1-12h-11z" fill="#e34c26" />
          <path d="M8 3v10.7l3.6-1.2.8-9.5H8z" fill="#f06529" />
          <text x="8" y="10" textAnchor="middle" fill="#ffffff" fontFamily="var(--font-mono), monospace" fontSize="6" fontWeight="800">H</text>
        </svg>
      )

    case "css":
    case "sass":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <rect x="1" y="1" width="14" height="14" rx="2" fill="#6366f1" />
          <text x="8" y="11.5" textAnchor="middle" fill="#ffffff" fontFamily="var(--font-mono), monospace" fontSize="8" fontWeight="800">#</text>
        </svg>
      )

    case "image":
    case "svg":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="#a78bfa" strokeWidth="1.2" />
          <circle cx="5" cy="6" r="1.2" fill="#a78bfa" />
          <path d="M2.5 12l3.5-3.5 2.5 2.5 3-3 2 2" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0 }} aria-hidden="true">
          <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V6L9.5 2h-6z" fill="#94a3b8" fillOpacity="0.3" stroke="#94a3b8" strokeWidth="1.2" />
          <path d="M9.5 2v4h4" stroke="#94a3b8" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )
  }
})
