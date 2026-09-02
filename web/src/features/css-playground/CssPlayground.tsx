import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import "./CssPlayground.css"
import { PlusIcon, TrashIcon, CopyIcon, CodeIcon, LayersIcon, RefreshIcon, CloseIcon, FileIcon } from "../../Icons"

export type BoxData = {
 id: string
 x: number
 y: number
 width: number
 height: number
 bgColor: string
 borderRadius: number
 opacity: number
 rotation: number
 zIndex: number
 label: string
}
export type Preset = { name: string; boxes: Omit<BoxData, "id">[] }

export const COLORS = [
 "#6366f1", "#818cf8", "#22d3ee", "#10b981", "#34d399", "#2dd4bf",
 "#f59e0b", "#fbbf24", "#ef4444", "#f43f5e", "#a78bfa",
 "#64748b", "#94a3b8", "#475569", "#0ea5e9", "#e11d48", "#16a34a",
 "#1e293b", "#334155", "#e4e4e7",
]

export const PRESETS: Preset[] = [
 {
  name: "Navbar",
  boxes: [
   { x: 30, y: 30, width: 1140, height: 90, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Navbar" },
   { x: 45, y: 45, width: 150, height: 60, bgColor: "#6366f1", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Logo" },
   { x: 645, y: 52, width: 120, height: 45, bgColor: "#334155", borderRadius: 6, opacity: 1, rotation: 0, zIndex: 2, label: "Link 1" },
   { x: 780, y: 52, width: 120, height: 45, bgColor: "#334155", borderRadius: 6, opacity: 1, rotation: 0, zIndex: 2, label: "Link 2" },
   { x: 915, y: 52, width: 120, height: 45, bgColor: "#334155", borderRadius: 6, opacity: 1, rotation: 0, zIndex: 2, label: "Link 3" },
   { x: 1050, y: 52, width: 105, height: 45, bgColor: "#818cf8", borderRadius: 6, opacity: 1, rotation: 0, zIndex: 2, label: "CTA" },
  ],
 },
 {
  name: "Grilla de Tarjetas",
  boxes: [
   { x: 30, y: 30, width: 345, height: 420, bgColor: "#1e293b", borderRadius: 16, opacity: 1, rotation: 0, zIndex: 1, label: "Card 1" },
   { x: 60, y: 60, width: 285, height: 180, bgColor: "#334155", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 2, label: "Imagen" },
   { x: 420, y: 30, width: 345, height: 420, bgColor: "#1e293b", borderRadius: 16, opacity: 1, rotation: 0, zIndex: 1, label: "Card 2" },
   { x: 450, y: 60, width: 285, height: 180, bgColor: "#334155", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 2, label: "Imagen" },
   { x: 810, y: 30, width: 345, height: 420, bgColor: "#1e293b", borderRadius: 16, opacity: 1, rotation: 0, zIndex: 1, label: "Card 3" },
   { x: 840, y: 60, width: 285, height: 180, bgColor: "#334155", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 2, label: "Imagen" },
  ],
 },
 {
  name: "Santo Grial",
  boxes: [
   { x: 30, y: 15, width: 1140, height: 75, bgColor: "#6366f1", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 1, label: "Header" },
   { x: 30, y: 105, width: 225, height: 480, bgColor: "#818cf8", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 1, label: "Sidebar" },
   { x: 270, y: 105, width: 660, height: 480, bgColor: "#1e293b", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 1, label: "Main Content" },
   { x: 945, y: 105, width: 225, height: 480, bgColor: "#a78bfa", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 1, label: "Aside" },
   { x: 30, y: 600, width: 1140, height: 75, bgColor: "#334155", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 1, label: "Footer" },
  ],
 },
 {
  name: "Hero",
  boxes: [
   { x: 30, y: 30, width: 1140, height: 600, bgColor: "#0f172a", borderRadius: 20, opacity: 1, rotation: 0, zIndex: 1, label: "Hero BG" },
   { x: 90, y: 150, width: 525, height: 75, bgColor: "transparent", borderRadius: 0, opacity: 1, rotation: 0, zIndex: 2, label: "Título H1" },
   { x: 90, y: 255, width: 450, height: 45, bgColor: "transparent", borderRadius: 0, opacity: 1, rotation: 0, zIndex: 2, label: "Subtítulo" },
   { x: 90, y: 345, width: 210, height: 72, bgColor: "#6366f1", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 2, label: "CTA Button" },
   { x: 330, y: 345, width: 210, height: 72, bgColor: "#334155", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 2, label: "Secondary" },
   { x: 720, y: 90, width: 420, height: 510, bgColor: "#1e293b", borderRadius: 16, opacity: 0.8, rotation: 0, zIndex: 2, label: "Ilustración" },
  ],
 },
 {
  name: "Dashboard",
  boxes: [
   { x: 30, y: 15, width: 225, height: 660, bgColor: "#0f172a", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Sidebar" },
   { x: 277, y: 15, width: 892, height: 90, bgColor: "#1e293b", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 1, label: "Topbar" },
   { x: 277, y: 120, width: 285, height: 150, bgColor: "#6366f1", borderRadius: 12, opacity: 0.9, rotation: 0, zIndex: 1, label: "Stat 1" },
   { x: 577, y: 120, width: 285, height: 150, bgColor: "#818cf8", borderRadius: 12, opacity: 0.9, rotation: 0, zIndex: 1, label: "Stat 2" },
   { x: 877, y: 120, width: 292, height: 150, bgColor: "#34d399", borderRadius: 12, opacity: 0.9, rotation: 0, zIndex: 1, label: "Stat 3" },
   { x: 277, y: 292, width: 592, height: 382, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Chart" },
   { x: 885, y: 292, width: 285, height: 382, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Activity" },
  ],
 },
 {
  name: "Login",
  boxes: [
   { x: 300, y: 60, width: 600, height: 570, bgColor: "#1e293b", borderRadius: 20, opacity: 1, rotation: 0, zIndex: 1, label: "Card" },
   { x: 390, y: 105, width: 420, height: 75, bgColor: "transparent", borderRadius: 0, opacity: 1, rotation: 0, zIndex: 2, label: "Título" },
   { x: 390, y: 210, width: 420, height: 66, bgColor: "#334155", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Input Email" },
   { x: 390, y: 300, width: 420, height: 66, bgColor: "#334155", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Input Pass" },
   { x: 390, y: 405, width: 420, height: 72, bgColor: "#6366f1", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 2, label: "Iniciar Sesión" },
   { x: 390, y: 510, width: 420, height: 45, bgColor: "transparent", borderRadius: 0, opacity: 0.6, rotation: 0, zIndex: 2, label: "No tenés cuenta" },
  ],
 },
 {
  name: "Precios",
  boxes: [
   { x: 30, y: 30, width: 345, height: 630, bgColor: "#1e293b", borderRadius: 16, opacity: 1, rotation: 0, zIndex: 1, label: "Plan Free" },
   { x: 60, y: 60, width: 285, height: 45, bgColor: "transparent", borderRadius: 0, opacity: 0.7, rotation: 0, zIndex: 2, label: "Free Title" },
   { x: 60, y: 120, width: 285, height: 75, bgColor: "transparent", borderRadius: 0, opacity: 1, rotation: 0, zIndex: 2, label: "Price 0" },
   { x: 60, y: 525, width: 285, height: 66, bgColor: "#334155", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 2, label: "Select Free" },
   { x: 420, y: 15, width: 360, height: 660, bgColor: "#6366f1", borderRadius: 16, opacity: 1, rotation: 0, zIndex: 1, label: "Plan Pro" },
   { x: 450, y: 45, width: 300, height: 45, bgColor: "transparent", borderRadius: 0, opacity: 0.9, rotation: 0, zIndex: 2, label: "Pro Title" },
   { x: 450, y: 105, width: 300, height: 75, bgColor: "transparent", borderRadius: 0, opacity: 1, rotation: 0, zIndex: 2, label: "Price 29" },
   { x: 450, y: 540, width: 300, height: 66, bgColor: "#0c4a6e", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 2, label: "Select Pro" },
   { x: 825, y: 30, width: 345, height: 630, bgColor: "#1e293b", borderRadius: 16, opacity: 1, rotation: 0, zIndex: 1, label: "Plan Enterprise" },
   { x: 855, y: 60, width: 285, height: 45, bgColor: "transparent", borderRadius: 0, opacity: 0.7, rotation: 0, zIndex: 2, label: "Enterprise Title" },
   { x: 855, y: 120, width: 285, height: 75, bgColor: "transparent", borderRadius: 0, opacity: 1, rotation: 0, zIndex: 2, label: "Price Custom" },
   { x: 855, y: 525, width: 285, height: 66, bgColor: "#334155", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 2, label: "Contact Sales" },
  ],
 },
 {
  name: "Kanban",
  boxes: [
   { x: 15, y: 15, width: 1170, height: 60, bgColor: "#1e293b", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 1, label: "Board Header" },
   { x: 15, y: 90, width: 375, height: 600, bgColor: "#111827", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Col Todo" },
   { x: 30, y: 105, width: 345, height: 37, bgColor: "#ef4444", borderRadius: 6, opacity: 0.3, rotation: 0, zIndex: 2, label: "Todo Header" },
   { x: 30, y: 157, width: 345, height: 90, bgColor: "#1e293b", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Task 1" },
   { x: 30, y: 262, width: 345, height: 90, bgColor: "#1e293b", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Task 2" },
   { x: 30, y: 367, width: 345, height: 90, bgColor: "#1e293b", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Task 3" },
   { x: 405, y: 90, width: 375, height: 600, bgColor: "#111827", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Col En Proceso" },
   { x: 420, y: 105, width: 345, height: 37, bgColor: "#f59e0b", borderRadius: 6, opacity: 0.3, rotation: 0, zIndex: 2, label: "Progress Header" },
   { x: 420, y: 157, width: 345, height: 90, bgColor: "#1e293b", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Task 4" },
   { x: 420, y: 262, width: 345, height: 90, bgColor: "#1e293b", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Task 5" },
   { x: 795, y: 90, width: 375, height: 600, bgColor: "#111827", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Col Hecho" },
   { x: 810, y: 105, width: 345, height: 37, bgColor: "#34d399", borderRadius: 6, opacity: 0.3, rotation: 0, zIndex: 2, label: "Done Header" },
   { x: 810, y: 157, width: 345, height: 90, bgColor: "#1e293b", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Task 6" },
  ],
 },
 {
  name: "Pie de Página",
  boxes: [
   { x: 30, y: 30, width: 1140, height: 390, bgColor: "#0f172a", borderRadius: 14, opacity: 1, rotation: 0, zIndex: 1, label: "Footer BG" },
   { x: 60, y: 60, width: 210, height: 45, bgColor: "#6366f1", borderRadius: 6, opacity: 1, rotation: 0, zIndex: 2, label: "Logo" },
   { x: 60, y: 135, width: 210, height: 180, bgColor: "transparent", borderRadius: 0, opacity: 0.6, rotation: 0, zIndex: 2, label: "Descripción" },
   { x: 360, y: 60, width: 180, height: 30, bgColor: "transparent", borderRadius: 0, opacity: 0.8, rotation: 0, zIndex: 2, label: "Producto" },
   { x: 360, y: 105, width: 150, height: 22, bgColor: "transparent", borderRadius: 0, opacity: 0.5, rotation: 0, zIndex: 2, label: "Features" },
   { x: 360, y: 142, width: 150, height: 22, bgColor: "transparent", borderRadius: 0, opacity: 0.5, rotation: 0, zIndex: 2, label: "Pricing" },
   { x: 600, y: 60, width: 180, height: 30, bgColor: "transparent", borderRadius: 0, opacity: 0.8, rotation: 0, zIndex: 2, label: "Compañía" },
   { x: 600, y: 105, width: 150, height: 22, bgColor: "transparent", borderRadius: 0, opacity: 0.5, rotation: 0, zIndex: 2, label: "About" },
   { x: 600, y: 142, width: 150, height: 22, bgColor: "transparent", borderRadius: 0, opacity: 0.5, rotation: 0, zIndex: 2, label: "Contact" },
   { x: 870, y: 60, width: 180, height: 30, bgColor: "transparent", borderRadius: 0, opacity: 0.8, rotation: 0, zIndex: 2, label: "Redes" },
   { x: 870, y: 105, width: 45, height: 45, bgColor: "#334155", borderRadius: 50, opacity: 1, rotation: 0, zIndex: 2, label: "TW" },
   { x: 930, y: 105, width: 45, height: 45, bgColor: "#334155", borderRadius: 50, opacity: 1, rotation: 0, zIndex: 2, label: "GH" },
   { x: 990, y: 105, width: 45, height: 45, bgColor: "#334155", borderRadius: 50, opacity: 1, rotation: 0, zIndex: 2, label: "LI" },
   { x: 60, y: 360, width: 1080, height: 2, bgColor: "#334155", borderRadius: 0, opacity: 0.5, rotation: 0, zIndex: 2, label: "Divider" },
   { x: 60, y: 378, width: 300, height: 22, bgColor: "transparent", borderRadius: 0, opacity: 0.4, rotation: 0, zIndex: 2, label: "Copyright" },
  ],
 },
 {
  name: "E-Commerce",
  boxes: [
   { x: 30, y: 15, width: 1140, height: 75, bgColor: "#0f172a", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 1, label: "Navbar" },
   { x: 30, y: 105, width: 270, height: 570, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Filters" },
   { x: 315, y: 105, width: 270, height: 360, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Product 1" },
   { x: 330, y: 120, width: 240, height: 195, bgColor: "#334155", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Img 1" },
   { x: 600, y: 105, width: 270, height: 360, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Product 2" },
   { x: 615, y: 120, width: 240, height: 195, bgColor: "#334155", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Img 2" },
   { x: 885, y: 105, width: 270, height: 360, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Product 3" },
   { x: 900, y: 120, width: 240, height: 195, bgColor: "#334155", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Img 3" },
   { x: 315, y: 480, width: 270, height: 195, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Product 4" },
   { x: 600, y: 480, width: 270, height: 195, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Product 5" },
   { x: 885, y: 480, width: 270, height: 195, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Product 6" },
  ],
 },
 {
  name: "Artículo de Blog",
  boxes: [
   { x: 150, y: 15, width: 900, height: 300, bgColor: "#334155", borderRadius: 16, opacity: 1, rotation: 0, zIndex: 1, label: "Cover Image" },
   { x: 150, y: 337, width: 900, height: 60, bgColor: "transparent", borderRadius: 0, opacity: 1, rotation: 0, zIndex: 1, label: "Blog Title" },
   { x: 150, y: 412, width: 450, height: 30, bgColor: "transparent", borderRadius: 0, opacity: 0.5, rotation: 0, zIndex: 1, label: "Author Date" },
   { x: 150, y: 465, width: 900, height: 22, bgColor: "transparent", borderRadius: 0, opacity: 0.6, rotation: 0, zIndex: 1, label: "Text Line 1" },
   { x: 150, y: 502, width: 870, height: 22, bgColor: "transparent", borderRadius: 0, opacity: 0.6, rotation: 0, zIndex: 1, label: "Text Line 2" },
   { x: 150, y: 540, width: 885, height: 22, bgColor: "transparent", borderRadius: 0, opacity: 0.6, rotation: 0, zIndex: 1, label: "Text Line 3" },
   { x: 150, y: 592, width: 600, height: 22, bgColor: "transparent", borderRadius: 0, opacity: 0.6, rotation: 0, zIndex: 1, label: "Text Line 4" },
   { x: 150, y: 645, width: 180, height: 45, bgColor: "#6366f1", borderRadius: 6, opacity: 1, rotation: 0, zIndex: 1, label: "Read More" },
  ],
 },
 {
  name: "App de Chat",
  boxes: [
   { x: 30, y: 15, width: 330, height: 660, bgColor: "#0f172a", borderRadius: 14, opacity: 1, rotation: 0, zIndex: 1, label: "Contacts Panel" },
   { x: 45, y: 30, width: 300, height: 66, bgColor: "#1e293b", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Search" },
   { x: 45, y: 111, width: 300, height: 75, bgColor: "#6366f1", borderRadius: 8, opacity: 0.2, rotation: 0, zIndex: 2, label: "Contact Active" },
   { x: 45, y: 195, width: 300, height: 75, bgColor: "#1e293b", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Contact 2" },
   { x: 45, y: 279, width: 300, height: 75, bgColor: "#1e293b", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Contact 3" },
   { x: 375, y: 15, width: 795, height: 75, bgColor: "#1e293b", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 1, label: "Chat Header" },
   { x: 390, y: 112, width: 300, height: 60, bgColor: "#334155", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 2, label: "Msg Received" },
   { x: 780, y: 195, width: 375, height: 60, bgColor: "#6366f1", borderRadius: 12, opacity: 0.8, rotation: 0, zIndex: 2, label: "Msg Sent" },
   { x: 390, y: 277, width: 420, height: 60, bgColor: "#334155", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 2, label: "Msg Received 2" },
   { x: 825, y: 360, width: 330, height: 60, bgColor: "#6366f1", borderRadius: 12, opacity: 0.8, rotation: 0, zIndex: 2, label: "Msg Sent 2" },
   { x: 375, y: 600, width: 795, height: 75, bgColor: "#1e293b", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 1, label: "Input Bar" },
   { x: 390, y: 615, width: 660, height: 48, bgColor: "#334155", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Type Message" },
   { x: 1065, y: 615, width: 90, height: 48, bgColor: "#6366f1", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Send" },
  ],
 },
 {
  name: "Página de Perfil",
  boxes: [
   { x: 225, y: 15, width: 750, height: 240, bgColor: "#1e293b", borderRadius: 16, opacity: 1, rotation: 0, zIndex: 1, label: "Cover" },
   { x: 510, y: 150, width: 180, height: 180, bgColor: "#6366f1", borderRadius: 100, opacity: 1, rotation: 0, zIndex: 2, label: "Avatar" },
   { x: 450, y: 352, width: 300, height: 45, bgColor: "transparent", borderRadius: 0, opacity: 1, rotation: 0, zIndex: 1, label: "Username" },
   { x: 465, y: 405, width: 270, height: 22, bgColor: "transparent", borderRadius: 0, opacity: 0.5, rotation: 0, zIndex: 1, label: "Bio Line" },
   { x: 375, y: 465, width: 150, height: 54, bgColor: "#6366f1", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 1, label: "Follow" },
   { x: 540, y: 465, width: 150, height: 54, bgColor: "#334155", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 1, label: "Message" },
   { x: 705, y: 465, width: 120, height: 54, bgColor: "#334155", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 1, label: "More" },
   { x: 225, y: 555, width: 240, height: 150, bgColor: "#1e293b", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 1, label: "Post 1" },
   { x: 480, y: 555, width: 240, height: 150, bgColor: "#1e293b", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 1, label: "Post 2" },
   { x: 735, y: 555, width: 240, height: 150, bgColor: "#1e293b", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 1, label: "Post 3" },
  ],
 },
 {
  name: "App Móvil",
  boxes: [
   { x: 390, y: 15, width: 420, height: 690, bgColor: "#0f172a", borderRadius: 30, opacity: 1, rotation: 0, zIndex: 1, label: "Phone Frame" },
   { x: 405, y: 30, width: 390, height: 45, bgColor: "#1e293b", borderRadius: 0, opacity: 1, rotation: 0, zIndex: 2, label: "Status Bar" },
   { x: 405, y: 82, width: 390, height: 75, bgColor: "#1e293b", borderRadius: 0, opacity: 1, rotation: 0, zIndex: 2, label: "App Bar" },
   { x: 420, y: 172, width: 360, height: 180, bgColor: "#6366f1", borderRadius: 14, opacity: 0.8, rotation: 0, zIndex: 2, label: "Banner" },
   { x: 420, y: 367, width: 172, height: 120, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 2, label: "Widget 1" },
   { x: 607, y: 367, width: 172, height: 120, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 2, label: "Widget 2" },
   { x: 420, y: 502, width: 360, height: 75, bgColor: "#1e293b", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 2, label: "List Item 1" },
   { x: 420, y: 585, width: 360, height: 75, bgColor: "#1e293b", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 2, label: "List Item 2" },
   { x: 405, y: 667, width: 390, height: 45, bgColor: "#1e293b", borderRadius: 0, opacity: 1, rotation: 0, zIndex: 2, label: "Bottom Nav" },
  ],
 },
 {
  name: "Landing",
  boxes: [
   { x: 30, y: 7, width: 1140, height: 67, bgColor: "#0f172a", borderRadius: 10, opacity: 1, rotation: 0, zIndex: 3, label: "Top Nav" },
   { x: 30, y: 82, width: 1140, height: 270, bgColor: "#1e293b", borderRadius: 16, opacity: 1, rotation: 0, zIndex: 1, label: "Hero Banner" },
   { x: 75, y: 135, width: 450, height: 52, bgColor: "transparent", borderRadius: 0, opacity: 1, rotation: 0, zIndex: 2, label: "Headline" },
   { x: 75, y: 202, width: 375, height: 30, bgColor: "transparent", borderRadius: 0, opacity: 0.5, rotation: 0, zIndex: 2, label: "Subheadline" },
   { x: 75, y: 262, width: 180, height: 57, bgColor: "#6366f1", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Get Started" },
   { x: 900, y: 105, width: 240, height: 225, bgColor: "#334155", borderRadius: 12, opacity: 0.7, rotation: 0, zIndex: 2, label: "Hero Image" },
   { x: 30, y: 375, width: 360, height: 180, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Feature 1" },
   { x: 420, y: 375, width: 360, height: 180, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Feature 2" },
   { x: 810, y: 375, width: 360, height: 180, bgColor: "#1e293b", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Feature 3" },
   { x: 300, y: 585, width: 600, height: 90, bgColor: "#0f172a", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "CTA Section" },
   { x: 450, y: 607, width: 300, height: 48, bgColor: "#818cf8", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Sign Up Free" },
  ],
 },
]

export const CANVAS_W = 1200
export const CANVAS_H = 1200
let boxCounter = 0
export const genId = () => `box-${++boxCounter}-${Date.now()}`
export const toPct = (px: number, total: number) => Math.round((px / total) * 10000) / 100
export const fromPct = (pct: number, total: number) => Math.round((pct / 100) * total)

const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "box"
const snapRot = (v: number, shift: boolean) => shift ? Math.round(v / 45) * 45 : v

export default function CssPlayground() {
 const [boxes, setBoxes] = useState<BoxData[]>(() => [
  { id: genId(), x: 60, y: 60, width: 200, height: 150, bgColor: "#6366f1", borderRadius: 12, opacity: 1, rotation: 0, zIndex: 1, label: "Box 1" },
  { id: genId(), x: 300, y: 100, width: 160, height: 120, bgColor: "#818cf8", borderRadius: 8, opacity: 1, rotation: 0, zIndex: 2, label: "Box 2" },
 ])
 const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
 const [dragging, setDragging] = useState<{ id: string; offX: number; offY: number; snaps: Map<string, { x: number; y: number }> } | null>(null)
 const [resizing, setResizing] = useState<{ id: string; sx: number; sy: number; snaps: Map<string, { x: number; y: number; w: number; h: number }> } | null>(null)
 const [cssOutput, setCssOutput] = useState("")
 const [copied, setCopied] = useState(false)
 const [showPresets, setShowPresets] = useState(false)
 const [showCode, setShowCode] = useState(false)
 const [usePercent, setUsePercent] = useState(false)
 const [proportionalScale, setProportionalScale] = useState(false)
 const [showLayoutInfo, setShowLayoutInfo] = useState(false)
 const [isFlex, setIsFlex] = useState(false)
 const [flexDirection, setFlexDirection] = useState<"row" | "row-reverse" | "column" | "column-reverse">("row")
 const [flexWrap, setFlexWrap] = useState<"nowrap" | "wrap" | "wrap-reverse">("nowrap")
 const [justifyContent, setJustifyContent] = useState("flex-start")
 const [alignItems, setAlignItems] = useState("flex-start")
 const [alignContent, setAlignContent] = useState("flex-start")
 const [gap, setGap] = useState(10)

 const [editX, setEditX] = useState("")
 const [editY, setEditY] = useState("")
 const [editW, setEditW] = useState("")
 const [editH, setEditH] = useState("")
 const [editGap, setEditGap] = useState("10")

 const canvasRef = useRef<HTMLDivElement>(null)
 const debounceRef = useRef<number | null>(null)

 const primaryId = selectedIds.size > 0 ? Array.from(selectedIds)[selectedIds.size - 1]! : null
 const selected = useMemo(() => (primaryId ? boxes.find((b) => b.id === primaryId) ?? null : null), [boxes, primaryId])

 useEffect(() => {
  if (selected) {
   setEditX((usePercent ? toPct(selected.x, CANVAS_W) : selected.x).toString())
   setEditY((usePercent ? toPct(selected.y, CANVAS_H) : selected.y).toString())
   setEditW((usePercent ? toPct(selected.width, CANVAS_W) : selected.width).toString())
   setEditH((usePercent ? toPct(selected.height, CANVAS_H) : selected.height).toString())
  }
 }, [selected, usePercent])

 useEffect(() => { setEditGap(String(gap)) }, [gap])

 const toggleSelect = useCallback((id: string, multi: boolean) => {
  setSelectedIds((prev) => {
   const next = new Set(multi ? prev : [])
   if (next.has(id) && multi) next.delete(id)
   else next.add(id)
   return next
  })
 }, [])

 const onPointerDownBox = (e: React.PointerEvent, box: BoxData) => {
  if ((e.target as HTMLElement).classList.contains("csspg-handle")) return
  e.stopPropagation()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  const multi = e.ctrlKey || e.shiftKey || e.metaKey
  const has = selectedIds.has(box.id)
  if (!multi && !has) setSelectedIds(new Set([box.id]))
  else if (multi) toggleSelect(box.id, true)
  else if (!has) toggleSelect(box.id, false)
  const rect = canvasRef.current?.getBoundingClientRect()
  if (!rect) return
  const active = has ? selectedIds : new Set([...selectedIds, box.id])
  if (!active.has(box.id)) active.add(box.id)
  const snaps = new Map<string, { x: number; y: number }>()
  boxes.forEach((b) => { if (active.has(b.id)) snaps.set(b.id, { x: b.x, y: b.y }) })
  setDragging({ id: box.id, offX: e.clientX - rect.left - box.x, offY: e.clientY - rect.top - box.y, snaps })
 }

 const onPointerDownResize = (e: React.PointerEvent, box: BoxData) => {
  e.stopPropagation(); e.preventDefault()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  if (!selectedIds.has(box.id)) setSelectedIds(new Set([box.id]))
  const active = selectedIds.has(box.id) ? selectedIds : new Set([...selectedIds, box.id])
  if (!active.has(box.id)) active.add(box.id)
  const snaps = new Map<string, { x: number; y: number; w: number; h: number }>()
  boxes.forEach((b) => { if (active.has(b.id)) snaps.set(b.id, { x: b.x, y: b.y, w: b.width, h: b.height }) })
  setResizing({ id: box.id, sx: e.clientX, sy: e.clientY, snaps })
 }

 const onPointerMove = useCallback((e: PointerEvent) => {
  if (dragging) {
   const rect = canvasRef.current?.getBoundingClientRect()
   if (!rect) return
   const anchor = dragging.snaps.get(dragging.id)
   if (!anchor) return
   const nx = e.clientX - rect.left - dragging.offX
   const ny = e.clientY - rect.top - dragging.offY
   const dx = nx - anchor.x
   const dy = ny - anchor.y
   setBoxes((prev) => prev.map((b) => {
    const s = dragging.snaps.get(b.id); if (!s) return b
    return { ...b, x: Math.max(0, Math.round(s.x + dx)), y: Math.max(0, Math.round(s.y + dy)) }
   }))
  }
  if (resizing) {
   const dx = e.clientX - resizing.sx
   const dy = e.clientY - resizing.sy
   const anchor = resizing.snaps.get(resizing.id)
   if (!anchor) return
   const scX = anchor.w > 0 ? (anchor.w + dx) / anchor.w : 1
   const scY = anchor.h > 0 ? (anchor.h + dy) / anchor.h : 1
   setBoxes((prev) => prev.map((b) => {
    const s = resizing.snaps.get(b.id); if (!s) return b
    const relX = s.x - anchor.x
    const relY = s.y - anchor.y
    return {
     ...b,
     x: Math.max(0, Math.round(anchor.x + relX * scX)),
     y: Math.max(0, Math.round(anchor.y + relY * scY)),
     width: Math.max(30, Math.round(s.w * scX)),
     height: Math.max(30, Math.round(s.h * scY)),
    }
   }))
  }
 }, [dragging, resizing])

 const onPointerUp = useCallback(() => { setDragging(null); setResizing(null) }, [])

 useEffect(() => {
  window.addEventListener("pointermove", onPointerMove)
  window.addEventListener("pointerup", onPointerUp)
  return () => { window.removeEventListener("pointermove", onPointerMove); window.removeEventListener("pointerup", onPointerUp) }
 }, [onPointerMove, onPointerUp])

 useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
   const ae = document.activeElement as HTMLElement | null
   if (ae && (ae.tagName === "INPUT" || ae.tagName === "SELECT" || ae.tagName === "TEXTAREA" || ae.isContentEditable)) return
   if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size) {
    e.preventDefault()
    setBoxes((p) => p.filter((b) => !selectedIds.has(b.id)))
    setSelectedIds(new Set())
   }
   if (e.key === "Escape") setSelectedIds(new Set())
   if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && selectedIds.size) {
    e.preventDefault()
    const step = e.shiftKey ? 10 : 1
    const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0
    const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0
    setBoxes((p) => p.map((b) => selectedIds.has(b.id) ? { ...b, x: Math.max(0, b.x + dx), y: Math.max(0, b.y + dy) } : b))
   }
  }
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)
 }, [selectedIds])

 const addBox = () => {
  const nb: BoxData = {
   id: genId(),
   x: 40 + Math.round(Math.random() * 200),
   y: 40 + Math.round(Math.random() * 200),
   width: 120 + Math.round(Math.random() * 80),
   height: 80 + Math.round(Math.random() * 60),
   bgColor: COLORS[Math.floor(Math.random() * COLORS.length)]!,
   borderRadius: 8, opacity: 1, rotation: 0, zIndex: boxes.length + 1, label: `Box ${boxes.length + 1}`,
  }
  setBoxes((p) => [...p, nb]); setSelectedIds(new Set([nb.id]))
 }
 const removeBox = (id: string) => { setBoxes((p) => p.filter((b) => b.id !== id)); setSelectedIds((s) => { const n = new Set(s); n.delete(id); return n }) }
 const duplicateBox = (id: string) => {
  const src = boxes.find((b) => b.id === id); if (!src) return
  const dup: BoxData = { ...src, id: genId(), x: src.x + 20, y: src.y + 20, label: `${src.label} copia` }
  setBoxes((p) => [...p, dup]); setSelectedIds(new Set([dup.id]))
 }
 const updateBox = (id: string, ch: Partial<BoxData>) => setBoxes((p) => p.map((b) => b.id === id ? { ...b, ...ch } : b))
 const updateSelected = (ch: Partial<BoxData>) => setBoxes((p) => p.map((b) => selectedIds.has(b.id) ? { ...b, ...ch } : b))
 const scaleProportional = (refId: string, nw: number, nh: number) => {
  const ref = boxes.find((b) => b.id === refId); if (!ref || (ref.width === 0 && ref.height === 0)) return
  const sx = nw / ref.width; const sy = nh / ref.height
  setBoxes((prev) => prev.map((b) => {
   if (b.id === refId) return { ...b, width: Math.round(nw), height: Math.round(nh) }
   return { ...b, x: Math.round(b.x * sx), y: Math.round(b.y * sy), width: Math.max(30, Math.round(b.width * sx)), height: Math.max(30, Math.round(b.height * sy)) }
  }))
 }
 const clearAll = () => { setBoxes([]); setSelectedIds(new Set()) }
 const loadPreset = (preset: Preset) => {
  const nb: BoxData[] = preset.boxes.map((b) => ({ ...b, id: genId() }))
  setBoxes(nb); setSelectedIds(new Set())
 }

 const buildCSS = useCallback(() => {
  let html = '<div class="container">\n'
  const cw = usePercent ? "100%" : `${CANVAS_W}px`
  const ch = usePercent ? "100%" : `${CANVAS_H}px`
  let css = `.container {\n width: ${cw};\n height: ${ch};\n background: var(--bg);\n border-radius: 12px;\n overflow: hidden;\n`
  if (isFlex) {
   css += ` display: flex;\n flex-direction: ${flexDirection};\n flex-wrap: ${flexWrap};\n justify-content: ${justifyContent};\n align-items: ${alignItems};\n`
   if (flexWrap !== "nowrap") css += ` align-content: ${alignContent};\n`
   css += ` gap: ${gap}px;\n padding: 20px;\n`
  } else css += ` position: relative;\n`
  css += `}\n\n`
  const used = new Map<string, number>()
  boxes.forEach((b) => {
   const base = sanitize(b.label)
   const n = used.get(base) ?? 0
   used.set(base, n + 1)
   const cls = n === 0 ? base : `${base}-${n + 1}`
   html += ` <div class="${cls}"></div>\n`
   css += `.${cls} {\n`
   if (!isFlex) {
    if (usePercent) { css += ` left: ${toPct(b.x, CANVAS_W)}%;\n top: ${toPct(b.y, CANVAS_H)}%;\n` }
    else { css += ` left: ${b.x}px;\n top: ${b.y}px;\n` }
    css += ` position: absolute;\n`
   }
   if (usePercent) { css += ` width: ${toPct(b.width, CANVAS_W)}%;\n height: ${toPct(b.height, CANVAS_H)}%;\n` }
   else { css += ` width: ${b.width}px;\n height: ${b.height}px;\n` }
   css += ` background-color: ${b.bgColor};\n`
   if (b.borderRadius) css += ` border-radius: ${b.borderRadius}px;\n`
   if (b.opacity < 1) css += ` opacity: ${b.opacity};\n`
   if (b.rotation) css += ` transform: rotate(${b.rotation}deg);\n`
   css += ` z-index: ${b.zIndex};\n flex-shrink: 0;\n}\n\n`
  })
  html += "</div>"
  return `/* HTML */\n${html}\n\n/* CSS */\n${css}`
 }, [boxes, usePercent, isFlex, flexDirection, flexWrap, justifyContent, alignItems, alignContent, gap])

 useEffect(() => {
  if (debounceRef.current) window.clearTimeout(debounceRef.current)
  debounceRef.current = window.setTimeout(() => setCssOutput(buildCSS()), 160)
  return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
 }, [buildCSS])

 const copy = async () => {
  const fallback = () => {
   const ta = document.createElement("textarea")
   ta.value = cssOutput; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"
   document.body.appendChild(ta); ta.select()
   try { document.execCommand("copy") } catch {}
   document.body.removeChild(ta)
  }
  try {
   if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(cssOutput)
   else fallback()
   setCopied(true); setTimeout(() => setCopied(false), 1800)
  } catch { fallback(); setCopied(true); setTimeout(() => setCopied(false), 1800) }
 }

 return (
  <div className="csspg-root">
   <header className="csspg-header">
    <h1 className="csspg-title">
     <span className="csspg-tag">{"<div>"}</span>
     <span className="csspg-subtitle">CSS Visual Playground</span>
     <span className="csspg-muted" style={{ fontWeight: 500 }}>· 8-Progavio optimizado</span>
    </h1>
    <div className="csspg-header-actions">
     <button type="button" className={`btn-secondary compact${proportionalScale ? " active" : ""}`} onClick={() => setProportionalScale((v) => !v)} aria-pressed={proportionalScale} title="Escalar todas proporcionalmente">
      {proportionalScale ? "Proporcional" : "Libre"}
     </button>
     <button type="button" className="btn-ghost compact" onClick={clearAll}><TrashIcon size={14} /> Limpiar</button>
    </div>
   </header>

   {showPresets && (
    <div className="csspg-presets" role="listbox" aria-label="Plantillas">
     {PRESETS.map((p) => (
      <button key={p.name} type="button" role="option" aria-selected={false} className="csspg-preset-chip" onClick={() => loadPreset(p)}>{p.name}</button>
     ))}
    </div>
   )}

   <div className="csspg-workspace">
    <div className="csspg-editor">
     <div className="csspg-section">
      <div className="csspg-row" style={{ marginBottom: 8 }}>
       <button type="button" className="btn-primary compact csspg-flex1" onClick={addBox} style={{ justifyContent: "center", display: "flex", alignItems: "center", gap: 6 }}>
        <PlusIcon size={14} /> Nueva caja
       </button>
       <button type="button" className={`btn-secondary compact csspg-flex1${showPresets ? " active" : ""}`} aria-pressed={showPresets} onClick={() => setShowPresets((v) => !v)} style={{ justifyContent: "center", display: "flex", alignItems: "center", gap: 6 }}>
        {showPresets ? <><CloseIcon size={14} /> Cerrar</> : <><LayersIcon size={14} /> Plantillas</>}
       </button>
      </div>
     </div>

     <div className="csspg-section" style={{ borderLeft: `1px solid ${isFlex ? "var(--primary-border)" : "var(--border)"}`, boxShadow: isFlex ? "inset 3px 0 0 var(--primary)" : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
       <h3 className="csspg-section-title" style={{ margin: 0 }}>Layout del canvas</h3>
       <button type="button" className="btn-icon compact" onClick={() => setShowLayoutInfo((v) => !v)} title="Info layout" aria-label="Info layout" aria-pressed={showLayoutInfo} style={{ width: 22, height: 22 }}>
        <FileIcon size={12} />
       </button>
      </div>
      {showLayoutInfo && (
       <div className="csspg-info" style={{ marginBottom: 10 }}>
        <p style={{ margin: 0 }}><strong>Absolute:</strong> Control total X/Y. Las cajas pueden encimarse. Ideal para composiciones.</p>
        <p style={{ margin: "6px 0 0 0" }}><strong>Flexbox:</strong> Recomendado. Alineación automática, responsivo.</p>
       </div>
      )}
      <div className="csspg-props">
       <button type="button" className={`btn-secondary compact${isFlex ? " active" : ""}`} aria-pressed={isFlex} onClick={() => setIsFlex((v) => !v)} style={{ gridColumn: "1/-1", justifyContent: "center" }}>
        {isFlex ? <><LayersIcon size={12} /> Flexbox</> : <>Absolute</>}
       </button>
       {isFlex && (
        <>
         <label>Dirección</label>
         <select className="csspg-select" value={flexDirection} onChange={(e) => setFlexDirection(e.target.value as never)}>
          <option value="row">Horizontal (row)</option>
          <option value="row-reverse">Horizontal inv.</option>
          <option value="column">Vertical (column)</option>
          <option value="column-reverse">Vertical inv.</option>
         </select>
         <label>Wrap</label>
         <select className="csspg-select" value={flexWrap} onChange={(e) => setFlexWrap(e.target.value as never)}>
          <option value="nowrap">No wrap</option>
          <option value="wrap">Wrap</option>
          <option value="wrap-reverse">Wrap reverse</option>
         </select>
         <label>Justificar</label>
         <select className="csspg-select" value={justifyContent} onChange={(e) => setJustifyContent(e.target.value)}>
          <option value="flex-start">Inicio</option><option value="center">Centro</option><option value="flex-end">Fin</option>
          <option value="space-between">Space between</option><option value="space-around">Around</option><option value="space-evenly">Evenly</option>
         </select>
         <label>Alinear</label>
         <select className="csspg-select" value={alignItems} onChange={(e) => setAlignItems(e.target.value)}>
          <option value="flex-start">Inicio</option><option value="center">Centro</option><option value="flex-end">Fin</option>
          <option value="stretch">Stretch</option><option value="baseline">Baseline</option>
         </select>
         {flexWrap !== "nowrap" && (
          <>
           <label>Alinear cont.</label>
           <select className="csspg-select" value={alignContent} onChange={(e) => setAlignContent(e.target.value)}>
            <option value="flex-start">Inicio</option><option value="center">Centro</option><option value="flex-end">Fin</option>
            <option value="space-between">Between</option><option value="space-around">Around</option><option value="stretch">Stretch</option>
           </select>
          </>
         )}
         <label>Gap</label>
         <input type="number" value={editGap} onChange={(e) => { setEditGap(e.target.value); if (e.target.value !== "") setGap(Number(e.target.value)) }} />
        </>
       )}
      </div>
     </div>

     <div className="csspg-section">
      <h3 className="csspg-section-title">Capas {selectedIds.size > 1 && <span className="csspg-unit">{selectedIds.size} sel.</span>}</h3>
      <div className="csspg-layers" role="listbox" aria-label="Capas" aria-multiselectable>
       {boxes.length === 0 && <div className="csspg-muted" style={{ padding: 6 }}>Sin cajas. Crea una o elige plantilla.</div>}
       {boxes.map((b) => (
        <div key={b.id} role="option" aria-selected={selectedIds.has(b.id)} className={`csspg-layer${selectedIds.has(b.id) ? " active" : ""}`} onClick={(e) => toggleSelect(b.id, e.ctrlKey || e.shiftKey || e.metaKey)}>
         <span className="csspg-layer-color" style={{ background: b.bgColor }} />
         <span className="csspg-layer-name">{b.label}</span>
         <span className="csspg-layer-actions">
          <button type="button" onClick={(e) => { e.stopPropagation(); duplicateBox(b.id) }} title="Duplicar" aria-label="Duplicar"><CopyIcon size={12} /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); removeBox(b.id) }} title="Eliminar" aria-label="Eliminar"><TrashIcon size={12} /></button>
         </span>
        </div>
       ))}
      </div>
     </div>

     {selected && (
      <div className="csspg-section">
       <h3 className="csspg-section-title">
        Propiedades {selectedIds.size > 1 && <span className="csspg-unit">{selectedIds.size} cajas</span>} {usePercent && <span className="csspg-unit">%</span>}
       </h3>
       <div className="csspg-props">
        <label>Label</label>
        <input type="text" value={selected.label} onChange={(e) => updateBox(selected.id, { label: e.target.value })} />
        <label>X {usePercent ? "%" : "px"}</label>
        <input type="number" step={usePercent ? 0.5 : 1} value={editX} onChange={(e) => { setEditX(e.target.value); if (e.target.value !== "") updateBox(selected.id, { x: usePercent ? fromPct(Number(e.target.value), CANVAS_W) : Number(e.target.value) }) }} />
        <label>Y {usePercent ? "%" : "px"}</label>
        <input type="number" step={usePercent ? 0.5 : 1} value={editY} onChange={(e) => { setEditY(e.target.value); if (e.target.value !== "") updateBox(selected.id, { y: usePercent ? fromPct(Number(e.target.value), CANVAS_H) : Number(e.target.value) }) }} />
        <label>Ancho</label>
        <div className="csspg-row" style={{ gap: 6 }}>
         <input className="csspg-flex1" type="number" step={usePercent ? 0.5 : 1} value={editW} onChange={(e) => {
          setEditW(e.target.value); if (e.target.value !== "") {
           const nw = usePercent ? fromPct(Number(e.target.value), CANVAS_W) : Number(e.target.value)
           if (proportionalScale) scaleProportional(selected.id, nw, selected.height)
           else if (selectedIds.size > 1) updateSelected({ width: nw }); else updateBox(selected.id, { width: nw })
          }
         }} />
         <button type="button" className={`btn-secondary compact${usePercent ? " active" : ""}`} aria-pressed={usePercent} onClick={() => setUsePercent((v) => !v)} title="Porcentaje" style={{ minWidth: 32 }}>%</button>
        </div>
        <label>Alto</label>
        <div className="csspg-row" style={{ gap: 6 }}>
         <input className="csspg-flex1" type="number" step={usePercent ? 0.5 : 1} value={editH} onChange={(e) => {
          setEditH(e.target.value); if (e.target.value !== "") {
           const nh = usePercent ? fromPct(Number(e.target.value), CANVAS_H) : Number(e.target.value)
           if (proportionalScale) scaleProportional(selected.id, selected.width, nh)
           else if (selectedIds.size > 1) updateSelected({ height: nh }); else updateBox(selected.id, { height: nh })
          }
         }} />
         <button type="button" className={`btn-secondary compact${usePercent ? " active" : ""}`} aria-pressed={usePercent} onClick={() => setUsePercent((v) => !v)} title="Porcentaje" style={{ minWidth: 32 }}>%</button>
        </div>
        <label>Color</label>
        <div className="csspg-color-row">
         <input type="color" value={selected.bgColor === "transparent" ? "#000000" : selected.bgColor} onChange={(e) => { if (selectedIds.size > 1) updateSelected({ bgColor: e.target.value }); else updateBox(selected.id, { bgColor: e.target.value }) }} title="Color" />
         <input className="csspg-hex-input" type="text" value={selected.bgColor} placeholder="#hex" onChange={(e) => { const v = e.target.value; if (selectedIds.size > 1) updateSelected({ bgColor: v }); else updateBox(selected.id, { bgColor: v }) }} />
         <div className="csspg-swatches">
          {COLORS.map((c) => (
           <button key={c} type="button" className="csspg-swatch" style={{ background: c }} aria-pressed={selected.bgColor === c} aria-label={c} onClick={() => { if (selectedIds.size > 1) updateSelected({ bgColor: c }); else updateBox(selected.id, { bgColor: c }) }} />
          ))}
         </div>
        </div>
        <label>Radius</label>
        <div className="csspg-range-wrap">
         <input type="range" min={0} max={100} value={selected.borderRadius} onChange={(e) => { const v = Number(e.target.value); if (selectedIds.size > 1) updateSelected({ borderRadius: v }); else updateBox(selected.id, { borderRadius: v }) }} />
         <span className="csspg-range-badge">{selected.borderRadius}px</span>
        </div>
        <label>Opacidad</label>
        <div className="csspg-range-wrap">
         <input type="range" min={0} max={100} value={Math.round(selected.opacity * 100)} onChange={(e) => { const v = Number(e.target.value) / 100; if (selectedIds.size > 1) updateSelected({ opacity: v }); else updateBox(selected.id, { opacity: v }) }} />
         <span className="csspg-range-badge">{Math.round(selected.opacity * 100)}%</span>
        </div>
        <label>Rotación</label>
        <div className="csspg-range-wrap">
         <input type="range" min={-180} max={180} value={selected.rotation} onChange={(e) => {
          const raw = Number(e.target.value)
          const v = snapRot(raw, (e.nativeEvent as PointerEvent & { shiftKey: boolean }).shiftKey ?? false)
          if (selectedIds.size > 1) updateSelected({ rotation: v }); else updateBox(selected.id, { rotation: v })
         }} onPointerUp={(e) => {
          if (e.shiftKey) {
           const v = snapRot(selected.rotation, true)
           if (v !== selected.rotation) { if (selectedIds.size > 1) updateSelected({ rotation: v }); else updateBox(selected.id, { rotation: v }) }
          }
         }} />
         <span className="csspg-range-badge">{selected.rotation}°</span>
        </div>
        <label>Z-Index</label>
        <input type="number" value={selected.zIndex} onChange={(e) => { const v = Number(e.target.value); if (selectedIds.size > 1) updateSelected({ zIndex: v }); else updateBox(selected.id, { zIndex: v }) }} />
        <div style={{ gridColumn: "1/-1", marginTop: 4 }}>
         <button type="button" className="btn-ghost compact" style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, fontSize: 11 }} onClick={() => { const r = { opacity: 1, rotation: 0, borderRadius: 0 } as Partial<BoxData>; if (selectedIds.size > 1) updateSelected(r); else updateBox(selected.id, r) }}>
          <RefreshIcon size={12} /> Normalizar
         </button>
        </div>
       </div>
      </div>
     )}

     <div className="csspg-section">
      {!showCode ? (
       <button type="button" className="btn-primary compact" style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, padding: "10px 12px" }} onClick={() => { copy(); setShowCode(true) }}>
        <CodeIcon size={14} /> Copiar código
       </button>
      ) : (
       <>
        <div className="csspg-code-head">
         <h3 className="csspg-section-title" style={{ margin: 0 }}>Código CSS</h3>
         <button type="button" className={`btn-secondary compact${copied ? " active" : ""}`} aria-live="polite" onClick={copy}>{copied ? "Copiado OK" : "Re-copiar"}</button>
        </div>
        <pre className="csspg-code">{cssOutput}</pre>
        <button type="button" className="btn-ghost compact" style={{ width: "100%", marginTop: 8, justifyContent: "center", fontSize: 11 }} onClick={() => setShowCode(false)}>Ocultar código</button>
       </>
      )}
      {copied && <div role="status" aria-live="polite" style={{ position: "fixed", bottom: 16, right: 16, background: "var(--surface)", border: "1px solid var(--primary-border)", color: "var(--text)", padding: "8px 12px", borderRadius: 8, fontSize: 12, boxShadow: "var(--shadow-sm)", zIndex: 99 }}>Copiado al portapapeles OK</div>}
     </div>
    </div>

    <div className="csspg-canvas-wrap">
     <div
      ref={canvasRef}
      className={`csspg-canvas${isFlex ? " is-flex" : ""}`}
      onPointerDown={() => setSelectedIds(new Set())}
      style={isFlex ? { display: "flex", flexDirection, flexWrap, justifyContent, alignItems, alignContent, gap: `${gap}px`, padding: 20, touchAction: "none" } : { touchAction: "none" }}
     >
      {boxes.map((box) => (
       <div
        key={box.id}
        className={`csspg-box${selectedIds.has(box.id) ? " selected" : ""}`}
        style={{
         position: isFlex ? "relative" : "absolute",
         left: isFlex ? undefined : box.x,
         top: isFlex ? undefined : box.y,
         width: box.width, height: box.height,
         backgroundColor: box.bgColor, borderRadius: box.borderRadius,
         opacity: box.opacity, transform: box.rotation ? `rotate(${box.rotation}deg)` : undefined,
         zIndex: box.zIndex,
         border: box.bgColor === "transparent" ? "1px dashed var(--border-strong)" : "1px solid color-mix(in srgb, #fff 15%, transparent)",
         flexShrink: 0,
         touchAction: "none",
        }}
        onPointerDown={(e) => onPointerDownBox(e, box)}
        onClick={(e) => e.stopPropagation()}
       >
        <span className="csspg-box-label">{box.label}</span>
        <span className="csspg-box-dims">{usePercent ? `${toPct(box.width, CANVAS_W)}% X ${toPct(box.height, CANVAS_H)}%` : `${box.width}X${box.height}`}</span>
        <div className="csspg-handle" onPointerDown={(e) => onPointerDownResize(e, box)} style={{ touchAction: "none" }} />
       </div>
      ))}
     </div>
    </div>
   </div>
  </div>
 )
}
