import { useEffect } from "react"
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

export function useBackButton({
  view, showNewSessionPicker, activeDetailSheet,
  onClosePicker, onCloseSheet, onBackToSessions
}: UseBackButtonOpts) {
  const t = useT()

  useEffect(() => {
    let h: any
    CapacitorApp.addListener("backButton", async () => {
      if (showNewSessionPicker) {
        onClosePicker()
        return
      }
      if (activeDetailSheet) {
        onCloseSheet()
        return
      }
      if (view === "detail") {
        onBackToSessions()
      } else {
        const result = await Dialog.confirm({
          title: t('app.exitTitle'),
          message: t('app.exitMessage'),
          okButtonTitle: t('app.exitOk'),
          cancelButtonTitle: t('app.exitCancel')
        })
        if (result.value) {
          CapacitorApp.exitApp()
        }
      }
    }).then((hnd) => { h = hnd })
    return () => { if (h) h.remove() }
  }, [view, showNewSessionPicker, activeDetailSheet, onClosePicker, onCloseSheet, onBackToSessions, t])
}
