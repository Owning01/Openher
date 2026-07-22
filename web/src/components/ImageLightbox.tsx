import { memo, useCallback, useEffect, useState } from "react"
import { CloseIcon } from "../Icons"

type Props = {
  src: string
  alt: string
  onClose: () => void
}

export const ImageLightbox = memo(function ImageLightbox({ src, alt, onClose }: Props) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setScale((s) => Math.max(0.5, Math.min(5, s - e.deltaY * 0.01)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }, [dragging, dragStart])

  const handleMouseUp = useCallback(() => setDragging(false), [])

  const handleDoubleClick = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  return (
    <div className="modal-overlay image-lightbox-overlay" onClick={onClose} onWheel={handleWheel}
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <button className="btn-icon btn-secondary lightbox-close" onClick={onClose}><CloseIcon size={20} /></button>
      <div className="image-lightbox-container" onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick}
        style={{ cursor: dragging ? "grabbing" : "grab" }}>
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            maxWidth: "90vw",
            maxHeight: "90vh",
            objectFit: "contain",
            transition: dragging ? "none" : "transform 0.1s ease",
          }}
        />
      </div>
    </div>
  )
})
