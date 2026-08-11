import { memo, useCallback, useEffect } from "react"
import { CloseIcon } from "../Icons"
import { useT } from "../i18n-context"

type Props = {
  src: string
  onClose: () => void
}

export const ImageLightbox = memo(function ImageLightbox({ src, onClose }: Props) {
  const t = useT()

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }, [onClose])

  useEffect(() => {
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleKey])

  return (
    <div className="image-lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className="btn-icon btn-ghost image-lightbox-close"
        onClick={onClose} aria-label={t('image.close')} title={t('image.close')}>
        <CloseIcon size={20} />
      </button>
      <img src={src} alt="" onClick={(e) => e.stopPropagation()} />
    </div>
  )
})
