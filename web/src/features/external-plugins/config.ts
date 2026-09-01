export type ExternalProject = {
  name: string
  title: string
  description: string
  icon: string
  port: number | null
  url: string
  dir: string
  isWidget?: boolean
}

export const EXTERNAL_PROJECTS: ExternalProject[] = [
  {
    name: "opendesign",
    title: "Open Design",
    description: "OpenDesign — nexu-io/open-design",
    icon: "◈",
    port: 3000,
    url: "http://127.0.0.1:3000",
    dir: "G:\\Proyectos\\open-design",
  },
  {
    name: "vioeditor",
    title: "VioEditor",
    description: "Editor de video — Vite + Tauri",
    icon: "🎬",
    port: 1420,
    url: "http://127.0.0.1:1420",
    dir: "G:\\Proyectos\\17-vioeditor\\aplicacion",
  },
  {
    name: "screenshots",
    title: "Screenshots",
    description: "App Store Screenshots — Next.js",
    icon: "📸",
    port: 3002,
    url: "http://127.0.0.1:3002",
    dir: "G:\\Proyectos\\0 screenshots",
  },
]
