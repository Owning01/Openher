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
    name: "screenshots",
    title: "Screenshots",
    description: "App Store Screenshots — Next.js",
    icon: "🖼️",
    port: 3002,
    url: "http://127.0.0.1:3002",
    dir: "G:\\Proyectos\\0 screenshots",
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
    name: "informes",
    title: "Plataforma Informes",
    description: "Plataforma de informes — Vite",
    icon: "📊",
    port: 5174,
    url: "http://127.0.0.1:5174",
    dir: "G:\\Proyectos\\53plataforma-informes",
  },
  {
    name: "widgetnotas",
    title: "Widget Notas",
    description: "QuickNotes Widget — Flutter",
    icon: "📝",
    port: null,
    url: "",
    dir: "G:\\Proyectos\\HERRAMIENTAS-VARIAS\\46widgetnotas",
    isWidget: true,
  },
]
