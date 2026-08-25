import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useT } from "../i18n-context"
import { CloseIcon } from "../Icons"

type Props = {
  src: string
  mime?: string
  onApply: (base64: string) => void
  onClose: () => void
}

const MAX_CANVAS_SIZE = 1600
const MAX_UNDO = 20

type Tool = "crop" | "draw" | null

export const ImageEditor = memo(function ImageEditor({ src, mime, onApply, onClose }: Props) {
  const t = useT()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const undoStackRef = useRef<ImageData[]>([])
  const toolRef = useRef<Tool>(null)
  const drawingRef = useRef(false)
  const cropStartRef = useRef<{ x: number; y: number } | null>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [tool, setTool] = useState<Tool>(null)
  const [color, setColor] = useState("var(--primary)")
  const [brushSize, setBrushSize] = useState(4)
  const [canUndo, setCanUndo] = useState(false)

  toolRef.current = tool

  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    if (undoStackRef.current.length > MAX_UNDO) undoStackRef.current.shift()
    setCanUndo(true)
  }, [])

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const prev = undoStackRef.current.pop()
    if (!canvas || !ctx || !prev) return
    ctx.putImageData(prev, 0, 0)
    setCanUndo(undoStackRef.current.length > 0)
  }, [])

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const scale = img.naturalWidth > MAX_CANVAS_SIZE ? MAX_CANVAS_SIZE / img.naturalWidth : 1
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      imgRef.current = img
    }
    img.src = src
  }, [src])

  const toCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    canvas.setPointerCapture(e.pointerId)
    const p = toCanvasCoords(e)
    if (toolRef.current === "crop") {
      cropStartRef.current = p
    } else if (toolRef.current === "draw") {
      drawingRef.current = true
      lastPointRef.current = p
      pushUndo()
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
    }
  }, [toCanvasCoords, color, brushSize, pushUndo])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const p = toCanvasCoords(e)
    if (toolRef.current === "crop" && cropStartRef.current) {
      const start = cropStartRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (imgRef.current) ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height)
      const x = Math.min(start.x, p.x)
      const y = Math.min(start.y, p.y)
      const w = Math.abs(p.x - start.x)
      const h = Math.abs(p.y - start.y)
      ctx.fillStyle = "rgba(0,0,0,0.45)"
      ctx.fillRect(0, 0, canvas.width, y)
      ctx.fillRect(0, y + h, canvas.width, canvas.height - y - h)
      ctx.fillRect(0, y, x, h)
      ctx.fillRect(x + w, y, canvas.width - x - w, h)
      ctx.strokeStyle = "var(--primary)"
      ctx.lineWidth = 1.5
      ctx.strokeRect(x, y, w, h)
      cropStartRef.current = { ...start, x, y, w, h } as never
    } else if (toolRef.current === "draw" && drawingRef.current && lastPointRef.current) {
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
      lastPointRef.current = p
    }
  }, [toCanvasCoords, color, brushSize])

  const handlePointerUp = useCallback(() => {
    if (toolRef.current === "crop" && cropStartRef.current) {
      const c = cropStartRef.current as unknown as { x: number; y: number; w: number; h: number }
      cropStartRef.current = null
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!canvas || !ctx || c.w < 8 || c.h < 8) {
        ctx?.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0)
        if (imgRef.current && canvas) ctx?.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height)
        return
      }
      pushUndo()
      const cropped = ctx.getImageData(Math.round(c.x), Math.round(c.y), Math.round(c.w), Math.round(c.h))
      canvas.width = Math.round(c.w)
      canvas.height = Math.round(c.h)
      ctx.putImageData(cropped, 0, 0)
    }
    drawingRef.current = false
    lastPointRef.current = null
  }, [pushUndo])

  const handleApply = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    onApply(canvas.toDataURL(mime?.startsWith("image/") ? mime : "image/png"))
  }, [mime, onApply])

  return (
    <div className="image-editor-backdrop" onClick={onClose}>
      <div className="image-editor" onClick={(e) => e.stopPropagation()}>
        <div className="image-editor-header">
          <strong>{t('image.editorTitle')}</strong>
          <button type="button" className="btn-icon btn-ghost compact" onClick={onClose}
            aria-label={t('image.close')} title={t('image.close')}>
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="image-editor-toolbar">
          <button type="button" className={`toggle-btn${tool === "crop" ? " active" : ""}`}
            onClick={() => setTool((v) => (v === "crop" ? null : "crop"))}
            aria-pressed={tool === "crop"}>
            {t('image.crop')}
          </button>
          <button type="button" className={`toggle-btn${tool === "draw" ? " active" : ""}`}
            onClick={() => setTool((v) => (v === "draw" ? null : "draw"))}
            aria-pressed={tool === "draw"}>
            {t('image.draw')}
          </button>
          <button type="button" className="toggle-btn" onClick={handleUndo} disabled={!canUndo}>
            {t('image.undo')}
          </button>
          {tool === "draw" && (
            <>
              <input type="color" className="chat-color-input" value={color}
                onChange={(e) => setColor(e.target.value)} aria-label={t('image.brushColor')} />
              <input type="range" min={1} max={16} value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                style={{ width: 80 }} aria-label={t('image.brushSize')} />
            </>
          )}
        </div>
        <canvas
          ref={canvasRef}
          className="image-editor-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        <div className="image-editor-actions">
          <button type="button" className="btn-secondary compact" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn-primary compact" onClick={handleApply}>
            {t('image.apply')}
          </button>
        </div>
      </div>
    </div>
  )
})
