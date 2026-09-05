import React, { memo, useCallback } from "react"

export type WindowResizeHandlesProps = {
  isMax?: boolean
}

export const WindowResizeHandles = memo(function WindowResizeHandles({ isMax }: WindowResizeHandlesProps) {
  const handleResizeStart = useCallback((edge: string) => (e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    fetch(`/shell/window/resize?edge=${edge}`, { method: "POST" }).catch((err) => {
      console.warn(`[WindowResize] failed to resize ${edge}:`, err)
    })
  }, [])

  if (isMax) {
    return null
  }

  return (
    <div className="win-resize-container" aria-hidden="true">
      {/* 4 Bordes principales */}
      <div className="win-resize-handle win-resize-top" onMouseDown={handleResizeStart("top")} title="" />
      <div className="win-resize-handle win-resize-bottom" onMouseDown={handleResizeStart("bottom")} title="" />
      <div className="win-resize-handle win-resize-left" onMouseDown={handleResizeStart("left")} title="" />
      <div className="win-resize-handle win-resize-right" onMouseDown={handleResizeStart("right")} title="" />

      {/* 4 Esquinas diagonales */}
      <div className="win-resize-handle win-resize-top-left" onMouseDown={handleResizeStart("top-left")} title="" />
      <div className="win-resize-handle win-resize-top-right" onMouseDown={handleResizeStart("top-right")} title="" />
      <div className="win-resize-handle win-resize-bottom-left" onMouseDown={handleResizeStart("bottom-left")} title="" />
      <div className="win-resize-handle win-resize-bottom-right" onMouseDown={handleResizeStart("bottom-right")} title="" />
    </div>
  )
})
