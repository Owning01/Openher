import { useCallback, useState } from "react"
import { isAbsoluteFsPath } from "../../../components/shellPanels"
import { parseDragPayload } from "../../../utils/drag"

export type DropZone = "left" | "right" | "top" | "bottom" | "center"

export type UsePanelDropParams = {
  panelIndex: number
  onOpenFile?: (path: string, panelIndex?: number, zone?: DropZone) => void
  onSplitSession: (index: number, dir: DropZone, specificId?: string) => void
  onSwapPanels: (from: number, to: number) => void
}

/**
 * C3: el drop de ~65 LOC con 6 ramas que vivia en el JSX de SessionChatPanel.
 * Decide zona (split/swap) y destino (editor vs composer) sin cambiar conducta:
 * - archivo del SO con ruta absoluta y zona != bottom -> abre editor a la par;
 * - resto de archivos/textos/rutas -> `plugin:insert-text` al composer;
 * - panel -> swap en centro, split fuera del centro;
 * - session/kind -> split; tab suelto -> se ignora.
 */
export function usePanelDrop({ panelIndex, onOpenFile, onSplitSession, onSwapPanels }: UsePanelDropParams) {
  const [dropZone, setDropZone] = useState<DropZone | null>(null)

  const calcDropZone = useCallback((e: React.DragEvent<HTMLDivElement>): DropZone => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const w = rect.width
    const h = rect.height
    if (x < w * 0.25) return "left"
    if (x > w * 0.75) return "right"
    if (y < h * 0.25) return "top"
    if (y > h * 0.75) return "bottom"
    return x >= w / 2 ? "right" : "left"
  }, [])

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const zone = calcDropZone(e)
    // Guard anti-tormenta (igual que DesktopGrid): dragover dispara por
    // cada mousemove; solo re-render si la zona realmente cambio.
    setDropZone((prev) => (prev === zone ? prev : zone))
  }, [calcDropZone])

  const onDragLeave = useCallback(() => setDropZone(null), [])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    // El panel gestiona el drop (split/swap/insert) y frena el bubbling:
    // sin esto el grid lo procesa dos veces (doble split + tab browser basura).
    e.stopPropagation()
    const zone = calcDropZone(e)
    setDropZone(null)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const f = e.dataTransfer.files[0]
      const filePath = (f as unknown as { path?: string }).path || f.name
      if (filePath) {
        // En el webview el File del SO no trae path real (solo el nombre):
        // abrir el editor con un nombre pelado crea tabs basura que 404ean
        // en /shell/fs/read en cada carga. Solo abrir si es absoluta; si
        // no, la ruta cae al composer como texto (igual que payload file).
        // Zona baja -> al chat; resto -> a la par (split con editor).
        if (isAbsoluteFsPath(filePath) && zone !== "bottom" && onOpenFile) {
          onOpenFile(filePath, panelIndex, zone)
        } else {
          window.dispatchEvent(new CustomEvent("plugin:insert-text", { detail: filePath }))
        }
        return
      }
    }
    const raw = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain")
    if (!raw) return
    const payload = parseDragPayload(raw)
    if (payload.kind === "panel") {
      if (zone === "center") {
        if (payload.idx !== panelIndex) onSwapPanels(payload.idx, panelIndex)
      } else {
        // Split con un tab del propio panel tambien vale (saca el tab
        // a un panel nuevo); handleDockSession reubica el origen.
        onSplitSession(panelIndex, zone, raw)
      }
    } else if (payload.kind === "session") {
      onSplitSession(panelIndex, zone, payload.id)
    } else if (payload.kind === "kind") {
      onSplitSession(panelIndex, zone, raw)
    } else if (payload.kind === "tab") {
      // Ignorar tab suelto
    } else if (payload.kind === "file") {
      // Drop de archivo sobre el chat: solo los archivos usan zonas.
      // Zona baja -> la ruta va al chat (agente); resto de zonas ->
      // el archivo se abre a la par (split con editor en esa zona).
      if (zone === "bottom" || !onOpenFile) {
        window.dispatchEvent(new CustomEvent("plugin:insert-text", { detail: payload.path }))
      } else {
        onOpenFile(payload.path, panelIndex, zone)
      }
    } else if (payload.kind === "unknown" && raw) {
      // Texto plano sin forma de payload (p. ej. desde el explorador
      // externo): tambien va al agente en vez de perderse.
      window.dispatchEvent(new CustomEvent("plugin:insert-text", { detail: raw }))
    }
  }, [calcDropZone, panelIndex, onOpenFile, onSplitSession, onSwapPanels])

  return { dropZone, onDragOver, onDragLeave, onDrop }
}
