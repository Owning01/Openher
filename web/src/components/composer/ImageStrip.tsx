import { memo } from "react"
import { CloseIcon, PencilIcon } from "../../Icons"
import { useT } from "../../i18n-context"
import type { ImageAttachment } from "./types"

type ImageStripProps = {
  images: ImageAttachment[]
  onEdit: (img: ImageAttachment) => void
  onRemove: (id: string) => void
}

/** Tira de adjuntos del composer: previews de imagen y placeholders por tipo. */
export const ImageStrip = memo(function ImageStrip({ images, onEdit, onRemove }: ImageStripProps) {
  const t = useT()
  return (
    <div className="image-strip">
      {images.map((img) => {
        const isImage = img.mime.startsWith("image/")
        const ext = img.name.split(".").pop()?.toLowerCase() || ""
        const iconClass = isImage ? "" :
          ["ts","tsx","js","jsx","rs","go","py","java","c","cpp","h","hpp"].includes(ext) ? "attach-icon-code" :
          ["md","txt","json","yaml","yml","toml","xml","csv","env","gitignore"].includes(ext) ? "attach-icon-text" :
          "attach-icon-other"
        return (
          <div key={img.id} className="image-preview" title={img.name}>
            {isImage ? (
              <>
                <img src={img.base64} alt={img.name} />
                <button className="image-preview-edit" onClick={() => onEdit(img)}
                  aria-label={t('image.editorTitle')} title={t('image.editorTitle')}>
                  <PencilIcon size={13} />
                </button>
              </>
            ) : (
              <div className={`image-preview-placeholder ${iconClass}`}>
                <span>.{ext}</span>
              </div>
            )}
            <span className="file-info">{img.name}</span>
            <button className="image-preview-remove" onClick={() => onRemove(img.id)}
              aria-label={t('session.removeImage')}><CloseIcon size={12} /></button>
          </div>
        )
      })}
    </div>
  )
})
