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
export const ShareIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Share"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></Svg>)
export const StatsIcon = (p: { className?: string; size?: number }) => (
  <Svg {...p} label="Stats"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Svg>)

let logoId = 0
export const LogoIcon = ({ className = "", size = 32 }: { className?: string; size?: number }) => {
  const id = `logoGradient-${++logoId}`
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}
      role="img" aria-label="OpenCode Mobile Logo">
      <defs><linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#0284c7"/>
      </linearGradient></defs>
      <circle cx="16" cy="16" r="15" fill={`url(#${id})`} opacity="0.1"/>
      <circle cx="16" cy="16" r="12" fill="none" stroke={`url(#${id})`} strokeWidth="2"/>
      <path d="M16 8c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7z" fill={`url(#${id})`}/>
      <circle cx="16" cy="16" r="3" fill="white"/>
      <path d="M16 3v6m0 8v6M3 16h6m8 0h6" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
