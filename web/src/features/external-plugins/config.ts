export type ExternalProject = {
  name: string
  title: string
  description: string
  icon: string
  iconKind?: "paint" | "play" | "camera" | "code" | "layers"
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
    icon: "OD",
    iconKind: "paint",
    port: 3000,
    url: "http://127.0.0.1:3000",
    dir: "G:\\Proyectos\\open-design",
  },
  {
    name: "vioeditor",
    title: "VioEditor",
    description: "Editor de video — Vite + Tauri",
    icon: "V",
    iconKind: "play",
    port: 1420,
    url: "http://127.0.0.1:1420",
    dir: "G:\\Proyectos\\17-vioeditor\\aplicacion",
  },
  {
    name: "screenshots",
    title: "Screenshots",
    description: "App Store Screenshots — Next.js",
    icon: "S",
    iconKind: "camera",
    port: 3002,
    url: "http://127.0.0.1:3002",
    dir: "G:\\Proyectos\\0 screenshots",
  },
]

export type BuiltinPlugin = {
  key: string
  title: string
  description: string
  iconKind: "code" | "paint" | "play" | "camera" | "layers"
  group: "herramientas" | "externos"
}

export const BUILTIN_PLUGINS: BuiltinPlugin[] = [
  {
    key: "openher:canvas",
    title: "Canvas M3E",
    description: "Boceta pantallas Material 3 y genera el prompt para el agente",
    iconKind: "paint",
    group: "herramientas",
  },
  {
    key: "openher:css-playground",
    title: "CSS Visual Playground",
    description: "Playground visual 8-Progavio — flex/absolute, exporta CSS",
    iconKind: "code",
    group: "herramientas",
  },
]
