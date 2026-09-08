import { memo } from "react"

export type WindowResizeHandlesProps = {
  isMax?: boolean
}

export const WindowResizeHandles = memo(function WindowResizeHandles({ isMax: _isMax }: WindowResizeHandlesProps) {
  // En Desktop el resize se maneja nativamente por la ventana Win32 perimetral (undecorated_resizing).
  return null
})
