import { memo } from "react"

type FileTypeIconProps = {
  name: string
  size?: number
}

const EXT_COLORS: Record<string, { bg: string; fg: string }> = {
  ts: { bg: "#3178c6", fg: "#ffffff" },
  tsx: { bg: "#3178c6", fg: "#ffffff" },
  mts: { bg: "#3178c6", fg: "#ffffff" },
  js: { bg: "#f1e05a", fg: "#323330" },
  jsx: { bg: "#f1e05a", fg: "#323330" },
  mjs: { bg: "#f1e05a", fg: "#323330" },
  cjs: { bg: "#f1e05a", fg: "#323330" },
  json: { bg: "#cbcb41", fg: "#323330" },
  md: { bg: "#519aba", fg: "#ffffff" },
  mdx: { bg: "#519aba", fg: "#ffffff" },
  css: { bg: "#563d7c", fg: "#ffffff" },
  scss: { bg: "#c6538c", fg: "#ffffff" },
  sass: { bg: "#c6538c", fg: "#ffffff" },
  less: { bg: "#1d365d", fg: "#ffffff" },
  html: { bg: "#e34c26", fg: "#ffffff" },
  htm: { bg: "#e34c26", fg: "#ffffff" },
  py: { bg: "#3572a5", fg: "#ffd845" },
  pyc: { bg: "#3572a5", fg: "#ffd845" },
  rs: { bg: "#dea584", fg: "#1f1f1f" },
  go: { bg: "#00add8", fg: "#ffffff" },
  java: { bg: "#b07219", fg: "#ffffff" },
  jar: { bg: "#b07219", fg: "#ffffff" },
  c: { bg: "#555555", fg: "#ffffff" },
  h: { bg: "#555555", fg: "#ffffff" },
  cpp: { bg: "#f34b7d", fg: "#ffffff" },
  cc: { bg: "#f34b7d", fg: "#ffffff" },
  hpp: { bg: "#f34b7d", fg: "#ffffff" },
  cs: { bg: "#178600", fg: "#ffffff" },
  php: { bg: "#4f5d95", fg: "#ffffff" },
  rb: { bg: "#701516", fg: "#ffffff" },
  swift: { bg: "#f05138", fg: "#ffffff" },
  kt: { bg: "#a97bff", fg: "#ffffff" },
  kts: { bg: "#a97bff", fg: "#ffffff" },
  sh: { bg: "#89e051", fg: "#1f1f1f" },
  bash: { bg: "#89e051", fg: "#1f1f1f" },
  zsh: { bg: "#89e051", fg: "#1f1f1f" },
  ps1: { bg: "#012456", fg: "#ffffff" },
  bat: { bg: "#c1f12e", fg: "#1f1f1f" },
  yaml: { bg: "#cb171e", fg: "#ffffff" },
  yml: { bg: "#cb171e", fg: "#ffffff" },
  toml: { bg: "#8f5c36", fg: "#ffffff" },
  xml: { bg: "#0060ac", fg: "#ffffff" },
  svg: { bg: "#ff9800", fg: "#ffffff" },
  png: { bg: "#4caf50", fg: "#ffffff" },
  jpg: { bg: "#4caf50", fg: "#ffffff" },
  jpeg: { bg: "#4caf50", fg: "#ffffff" },
  gif: { bg: "#4caf50", fg: "#ffffff" },
  webp: { bg: "#4caf50", fg: "#ffffff" },
  ico: { bg: "#4caf50", fg: "#ffffff" },
  avif: { bg: "#4caf50", fg: "#ffffff" },
  sql: { bg: "#e38c00", fg: "#ffffff" },
  db: { bg: "#e38c00", fg: "#ffffff" },
  lock: { bg: "#e38c00", fg: "#ffffff" },
  txt: { bg: "#808080", fg: "#ffffff" },
  log: { bg: "#808080", fg: "#ffffff" },
  env: { bg: "#f1e05a", fg: "#323330" },
  gitignore: { bg: "#f05033", fg: "#ffffff" },
  gitattributes: { bg: "#f05033", fg: "#ffffff" },
  dockerfile: { bg: "#0db7ed", fg: "#ffffff" },
  conf: { bg: "#6c5ce7", fg: "#ffffff" },
  ini: { bg: "#6c5ce7", fg: "#ffffff" },
  cfg: { bg: "#6c5ce7", fg: "#ffffff" },
  pdf: { bg: "#e74c3c", fg: "#ffffff" },
  zip: { bg: "#8e44ad", fg: "#ffffff" },
  gz: { bg: "#8e44ad", fg: "#ffffff" },
  tar: { bg: "#8e44ad", fg: "#ffffff" },
  exe: { bg: "#4a4a4a", fg: "#ffffff" },
}

function extOf(name: string): string {
  const base = name.toLowerCase()
  if (base === "dockerfile") return "dockerfile"
  if (base.startsWith(".")) return base.slice(1)
  const parts = base.split(".")
  if (parts.length < 2) return ""
  return parts[parts.length - 1]
}

export const FileTypeIcon = memo(function FileTypeIcon({ name, size = 16 }: FileTypeIconProps) {
  const ext = extOf(name)
  const colors = EXT_COLORS[ext] ?? { bg: "#808080", fg: "#ffffff" }
  const label = ext ? ext.slice(0, 4) : ""

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
        fill={colors.bg}
      />
      <path d="M14 2v5h5z" fill="rgba(255,255,255,0.35)" />
      {label && (
        <text
          x="12"
          y="16.5"
          textAnchor="middle"
          fontFamily="var(--font-mono), monospace"
          fontSize="6.5"
          fontWeight="700"
          fill={colors.fg}
        >
          {label}
        </text>
      )}
    </svg>
  )
})
