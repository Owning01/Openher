import { memo, useCallback, useEffect, useRef, useState } from "react"
import jsQR from "jsqr"
import { ModalHeader } from "./ModalHeader"
import { CameraIcon, CheckIcon, CloseIcon, ServerIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { ServerConfig } from "../types"
import { parsePairPayload, type PairInfo } from "../utils/pair"

type Props = {
  onSave: (name: string, config: ServerConfig) => void
  onClose: () => void
}

function configFromPair(info: PairInfo): ServerConfig {
  return { host: info.host, port: info.port, username: info.username, password: info.password }
}

export const PairModal = memo(function PairModal({ onSave, onClose }: Props) {
  const t = useT()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)
  const scanRef = useRef(false)
  const [cameraState, setCameraState] = useState<"idle" | "starting" | "scanning" | "error">("idle")
  const [cameraError, setCameraError] = useState("")
  const [pasted, setPasted] = useState("")
  const [parsed, setParsed] = useState<PairInfo | null>(null)
  const [parseError, setParseError] = useState(false)
  const [name, setName] = useState("")
  const [showName, setShowName] = useState(false)

  const stopCamera = useCallback(() => {
    scanRef.current = false
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const handleScan = useCallback((raw: string) => {
    const info = parsePairPayload(raw)
    if (info) {
      stopCamera()
      setParsed(info)
      setParseError(false)
      setName(info.host)
      setShowName(true)
    } else {
      setParseError(true)
    }
  }, [stopCamera])

  useEffect(() => {
    if (cameraState !== "scanning") return
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    scanRef.current = true

    const tick = () => {
      if (!scanRef.current) return
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        try {
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const qr = jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" })
          if (qr?.data) handleScan(qr.data)
        } catch { /* ignore frame errors */ }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { scanRef.current = false; cancelAnimationFrame(rafRef.current) }
  }, [cameraState, handleScan])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("error")
      setCameraError(t('settings.pairCameraUnavailable'))
      return
    }
    setCameraState("starting")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraState("scanning")
    } catch (err) {
      setCameraState("error")
      setCameraError(t('settings.pairCameraUnavailable'))
    }
  }, [t])

  useEffect(() => () => { stopCamera() }, [stopCamera])

  const handlePasteParse = useCallback(() => {
    const info = parsePairPayload(pasted)
    if (info) {
      setParsed(info)
      setParseError(false)
      setName(info.host)
      setShowName(true)
    } else {
      setParseError(true)
    }
  }, [pasted])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pair-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('settings.pairTitle')}>
        <ModalHeader title={t('settings.pairTitle')} onClose={onClose} />
        <div className="modal-body">
          {!showName && (
            <>
              <p className="subtle">{t('settings.pairDesc')}</p>

              <div className="pair-scanner">
                {cameraState === "idle" && (
                  <button type="button" className="btn-secondary pair-scan-btn" onClick={startCamera}>
                    <CameraIcon size={18} />
                    {t('settings.pairScanQr')}
                  </button>
                )}
                {cameraState === "starting" && (
                  <div className="pair-scan-loading">{t('settings.pairScanQr')}…</div>
                )}
                {cameraState === "scanning" && (
                  <div className="pair-scan-live">
                    <video ref={videoRef} playsInline muted />
                    <canvas ref={canvasRef} className="pair-scan-canvas" />
                    <div className="pair-scan-frame" aria-hidden="true" />
                  </div>
                )}
                {cameraState === "error" && (
                  <p className="pair-camera-error">{cameraError}</p>
                )}
              </div>

              <div className="pair-or">
                <span className="subtle">{t('settings.pairPaste')}</span>
              </div>
              <textarea
                className="pair-paste"
                value={pasted}
                onChange={(e) => { setPasted(e.target.value); setParseError(false) }}
                placeholder={t('settings.pairPasteHint')}
                rows={3}
              />
              {parseError && <p className="pair-error">{t('settings.pairParseError')}</p>}
              <div className="modal-actions">
                <button className="btn-primary compact" onClick={handlePasteParse} disabled={!pasted.trim()}>
                  {t('settings.pairParse')}
                </button>
                <button className="btn-secondary compact" onClick={onClose}>{t('settings.cancel')}</button>
              </div>
            </>
          )}

          {showName && parsed && (
            <div className="pair-result">
              <p className="pair-parsed"><CheckIcon size={14} /> {t('settings.pairParsed')}</p>
              <div className="form-grid">
                <label className="form-field">
                  <span>{t('settings.serverName')}</span>
                  <input name="pairName" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder={t('settings.pairNamePlaceholder')} autoFocus />
                </label>
              </div>
              <div className="pair-preview">
                <span className="server-profile-kind pair">{t('settings.pairKind')}</span>
                <code>{parsed.username}@</code>
                <code>{parsed.host}:{parsed.port}</code>
              </div>
              <div className="modal-actions">
                <button className="btn-primary compact" disabled={!name.trim()}
                  onClick={() => onSave(name.trim(), configFromPair(parsed))}>
                  <ServerIcon size={14} /> {t('settings.pairSave')}
                </button>
                <button className="btn-secondary compact" onClick={onClose}>
                  <CloseIcon size={14} /> {t('settings.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default PairModal
