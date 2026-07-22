import { useEffect, useRef } from "react"
import { Capacitor } from "@capacitor/core"
import { App as CapacitorApp } from "@capacitor/app"
import { Dialog } from "@capacitor/dialog"
import { useT } from "../i18n-context"

type UseBackButtonOpts = {
  view: string
  showNewSessionPicker: boolean
  activeDetailSheet: string | null
  onClosePicker: () => void
  onCloseSheet: () => void
  onBackToSessions: () => void
}

export function useBackButton(opts: UseBackButtonOpts) {
  const t = useT()

  const viewRef = useRef(opts.view)
  viewRef.current = opts.view
  const pickerRef = useRef(opts.showNewSessionPicker)
  pickerRef.current = opts.showNewSessionPicker
  const sheetRef = useRef(opts.activeDetailSheet)
  sheetRef.current = opts.activeDetailSheet
  const onClosePickerRef = useRef(opts.onClosePicker)
  onClosePickerRef.current = opts.onClosePicker
  const onCloseSheetRef = useRef(opts.onCloseSheet)
  onCloseSheetRef.current = opts.onCloseSheet
  const onBackRef = useRef(opts.onBackToSessions)
  onBackRef.current = opts.onBackToSessions
  const tRef = useRef(t)
  tRef.current = t

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let cancelled = false
    let handle: any = null

    CapacitorApp.addListener("backButton", async () => {
      if (pickerRef.current) {
        onClosePickerRef.current()
        return
      }
      if (sheetRef.current) {
        onCloseSheetRef.current()
        return
      }
      if (viewRef.current === "detail") {
        onBackRef.current()
      } else {
        const result = await Dialog.confirm({
          title: tRef.current('app.exitTitle'),
          message: tRef.current('app.exitMessage'),
          okButtonTitle: tRef.current('app.exitOk'),
          cancelButtonTitle: tRef.current('app.exitCancel')
        })
        if (result.value) {
          CapacitorApp.exitApp()
        }
      }
    }).then((hnd) => {
      if (cancelled) { hnd.remove(); return }
      handle = hnd
    })

    return () => {
      cancelled = true
      if (handle) handle.remove()
    }
  }, [])
}
