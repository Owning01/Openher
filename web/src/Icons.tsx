import { type ReactNode, type CSSProperties } from "react"

function Svg({ children, label, className, size = 16, viewBox = "0 0 24 24", spin = false, style }: {
  children: ReactNode; label: string; className?: string; size?: number; viewBox?: string; spin?: boolean; style?: CSSProperties
}) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={spin ? `${className || ""} animate-spin` : className || ""}
      style={style}
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
export const CheckIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Check"><polyline points="20 6 9 17 4 12"/></Svg>)
export const ServerIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Server"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></Svg>)
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

export const MenuDotsIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Menu"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></Svg>)
export const DownloadIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Svg>)
export const ChevronIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Chevron"><path d="M6 9l6 6 6-6"/></Svg>)
export const ArchiveIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Archive"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></Svg>)
export const ForkIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Fork"><path d="M6 3v12"/><path d="M18 3v12"/><path d="M6 15c0 3 3 5 6 5s6-2 6-5"/></Svg>)
export const PaintIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Paint"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></Svg>)
export const KeyboardIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Keyboard"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h0"/><path d="M10 8h0"/><path d="M14 8h0"/><path d="M18 8h0"/><path d="M6 12h0"/><path d="M10 12h0"/><path d="M14 12h0"/><path d="M18 12h0"/><path d="M8 16h8"/></Svg>)
export const AttachmentIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Attachment"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></Svg>)
export const BranchIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Branch"><path d="M6 3v12"/><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M18 9a9 9 0 0 1-9 9"/></Svg>)
export const ScrollDownIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Scroll down"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></Svg>)
export const LayersIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Layers"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></Svg>)

export const GraduationCapIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Aprendizaje"><path d="M12 3L2 8l10 5 10-5-10-5z"/><path d="M6 12l6 3 6-3"/><path d="M6 16l6 3 6-3"/><path d="M12 11v6"/></Svg>)

export const PanelLeftIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Panel"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></Svg>)

export const UndoIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Undo"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></Svg>)
export const RedoIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Redo"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></Svg>)
export const CompressIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Compact"><path d="M4 9V5h4"/><path d="M20 15v4h-4"/><path d="M12 4v16"/><path d="M8 8l4-4 4 4"/><path d="M16 16l-4 4-4-4"/></Svg>)

export const EyeIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Show password"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>)

export const EyeOffIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Hide password"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></Svg>)

export const SunIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Light mode" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></Svg>)

export const MoonIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Dark mode" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Svg>)

export const PowerIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Power"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></Svg>)

export const GithubIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="GitHub"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></Svg>)

export const DataIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Data usage"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></Svg>)

export const CameraIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Scan QR"><path d="M23 19a2 2 0 0 1-2 2h-3v-2h3v-3h2v3z"/><path d="M1 5a2 2 0 0 1 2-2h3v2H3v3H1V5z"/><path d="M23 5v3h-2V5h-3V3h3a2 2 0 0 1 2 2z"/><path d="M1 19v-3h2v3h3v2H3a2 2 0 0 1-2-2z"/><rect x="7" y="7" width="10" height="10" rx="1"/></Svg>)

export const CopyIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Svg>)

export const SplitIcon = (p: { className?: string; size?: number; style?: CSSProperties }) => (
  <Svg {...p} label="Split"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></Svg>)

export const MoreHorizontalIcon = (p: { className?: string; size?: number; style?: CSSProperties }) => (
  <Svg {...p} label="More"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></Svg>)

export const MaximizeIcon = (p: { className?: string; size?: number; style?: CSSProperties }) => (
  <Svg {...p} label="Maximize"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></Svg>)

export const MinimizeIcon = (p: { className?: string; size?: number; style?: CSSProperties }) => (
  <Svg {...p} label="Restore"><path d="M4 14h6v6m10-10h-6V4m0 6 7-7M3 21l7-7"/></Svg>)

export const ChevronDownIcon = (p: { className?: string; size?: number; style?: CSSProperties }) => (
  <Svg {...p} label="Chevron down"><polyline points="6 9 12 15 18 9"/></Svg>)
export const ChevronRightIcon = (p: { className?: string; size?: number; style?: CSSProperties }) => (
  <Svg {...p} label="Chevron right"><polyline points="9 6 15 12 9 18"/></Svg>)

export const NewFileIcon = (p: { className?: string; size?: number; style?: CSSProperties }) => (
  <Svg {...p} label="New file"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></Svg>)

export const NewFolderIcon = (p: { className?: string; size?: number; style?: CSSProperties }) => (
  <Svg {...p} label="New folder"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></Svg>)

export const CollapseAllIcon = (p: { className?: string; size?: number; style?: CSSProperties }) => (
  <Svg {...p} label="Collapse all"><path d="M4 4h16"/><path d="M4 20h16"/><polyline points="16 8 12 11 8 8"/><polyline points="16 16 12 13 8 16"/></Svg>)

export const DiskIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Disk"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></Svg>)
export const LinkIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Link"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></Svg>)
export const MonitorIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Monitor"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></Svg>)
export const PipIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Picture in picture"><rect x="2" y="4" width="20" height="14" rx="2"/><rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" stroke="none"/></Svg>)
export const LogoIcon = ({ className = "", size = 32 }: { className?: string; size?: number }) => {
  return (
    <img src="./img/openher-mark-180.png" alt="OpenHer"
      width={size} height={size} className={className}
      style={{ objectFit: "contain", display: "inline-block", verticalAlign: "middle" }} />
  )
}

