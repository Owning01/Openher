import { type ReactNode } from "react"

function Svg({ children, label, className, size = 20, viewBox = "0 0 24 24", spin = false }: {
  children: ReactNode; label: string; className?: string; size?: number; viewBox?: string; spin?: boolean
}) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={spin ? `${className || ""} animate-spin` : className || ""}
      role="img" aria-label={label}>{children}</svg>
  )
}

export const SettingsIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></Svg>)
export const FolderIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Sessions"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></Svg>)
export const ChatIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Detail"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></Svg>)
export const HelpIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Help"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></Svg>)
export const PlusIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Add"><path d="M5 12h14"/><path d="M12 5v14"/></Svg>)
export const PlayIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Open"><polygon points="5 3 19 12 5 21 5 3"/></Svg>)
export const TrashIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Delete"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Svg>)
export const StopCircleIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Stop task"><circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6" rx="1"/></Svg>)
export const SendIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Send"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></Svg>)
export const SaveIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></Svg>)
export const TestIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Test"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></Svg>)
export const LoadingIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Loading" spin><path d="M21 12a9 9 0 11-6.219-8.56"/></Svg>)
export const RefreshIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Refresh"><path d="M21 12a9 9 0 0 1-15.36 6.36L3 15"/><path d="M3 21v-6h6"/><path d="M3 12a9 9 0 0 1 15.36-6.36L21 9"/><path d="M21 3v6h-6"/></Svg>)
export const PencilIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Edit"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></Svg>)
export const CloseIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Close"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></Svg>)
export const StarIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>)
export const MicIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Voice input"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></Svg>)
export const ShareIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Share"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></Svg>)
export const BrainIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Thinking"><path d="M12 2a4 4 0 0 1 4 4c0 1.1-.4 2.1-1.1 2.8A4 4 0 0 1 16 12a4 4 0 0 1-3 3.9V18h-2v-2.1a4 4 0 0 1-3-3.9 4 4 0 0 1 1.1-2.8A4 4 0 0 1 8 6a4 4 0 0 1 4-4z"/><path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/><path d="M9 22h6"/><path d="M10 18h4"/></Svg>)
export const CodeIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Code"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></Svg>)
export const FileIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="File"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Svg>)
export const TerminalIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Terminal"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></Svg>)
export const SearchIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Search"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>)
export const GlobeIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Web"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>)
export const ToolIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Tool"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></Svg>)
export const StatsIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Stats"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Svg>)
export const ArrowLeftIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Back"><path d="M19 12H5M12 19l-7-7 7-7"/></Svg>)

export const UndoIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Undo"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></Svg>)
export const RedoIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Redo"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></Svg>)
export const CompressIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Compact"><path d="M4 9V5h4"/><path d="M20 15v4h-4"/><path d="M12 4v16"/><path d="M8 8l4-4 4 4"/><path d="M16 16l-4 4-4-4"/></Svg>)

export const LogoIcon = ({ className = "", size = 32 }: { className?: string; size?: number }) => {
  return (
    <img src="./img/opencode-logo-dark.jpg" alt="OpenCode"
      width={size} height={size} className={className}
      style={{ objectFit: "contain", display: "inline-block", verticalAlign: "middle" }} />
  )
}
