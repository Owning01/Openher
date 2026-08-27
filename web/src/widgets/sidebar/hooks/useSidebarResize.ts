import { useCallback, type RefObject, type PointerEvent as ReactPointerEvent } from "react"
import { buildGridTemplate, type BuildGridTemplateOptions } from "../../desktop-grid/model"

export interface UseSidebarResizeOptions {
  shellRef: RefObject<HTMLDivElement | null>
  sidebarWidth: number
  setSidebarWidth: (w: number) => void
  rightSidebarWidth: number
  setRightSidebarWidth: (w: number) => void
  gridOptions: Omit<BuildGridTemplateOptions, "overrides">
}

export function useSidebarResize({
  shellRef,
  sidebarWidth,
  setSidebarWidth,
  rightSidebarWidth,
  setRightSidebarWidth,
  gridOptions,
}: UseSidebarResizeOptions) {
  const startSidebarResize = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const sidebarEl = (e.currentTarget as HTMLElement).closest(".app-desktop-sidebar") as HTMLElement | null
      const scrollEl = (sidebarEl?.querySelector(".desktop-sidebar-body") ??
        sidebarEl?.querySelector(".panel.sessions")) as HTMLElement | null
      if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight) {
        const r = scrollEl.getBoundingClientRect()
        if (e.clientX >= r.right - 14 && e.clientX < r.right - 4 && e.clientY >= r.top && e.clientY <= r.bottom) return
      }
      e.preventDefault()
      const startX = e.clientX
      const startWidth = sidebarWidth
      let lastW = sidebarWidth
      document.body.style.userSelect = "none"
      document.body.style.cursor = "col-resize"
      const apply = (w: number) => {
        if (shellRef.current) {
          Object.assign(shellRef.current.style, buildGridTemplate({ ...gridOptions, overrides: { sidebarW: w } }))
        }
      }
      const onMove = (ev: PointerEvent) => {
        lastW = Math.max(200, Math.min(480, startWidth + (ev.clientX - startX)))
        apply(lastW)
      }
      let committed = false
      const onUp = () => {
        if (committed) return
        committed = true
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        setSidebarWidth(lastW)
      }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [sidebarWidth, setSidebarWidth, shellRef, gridOptions]
  )

  const startRightSidebarResize = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const sidebarEl = (e.currentTarget as HTMLElement).closest(
        ".app-desktop-sidebar--right"
      ) as HTMLElement | null
      const scrollEl = (sidebarEl?.querySelector(".desktop-sidebar-body") ??
        sidebarEl?.querySelector(".panel.sessions")) as HTMLElement | null
      if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight) {
        const r = scrollEl.getBoundingClientRect()
        if (e.clientX >= r.left + 4 && e.clientX < r.left + 14 && e.clientY >= r.top && e.clientY <= r.bottom) return
      }
      e.preventDefault()
      const startX = e.clientX
      const startWidth = rightSidebarWidth
      let lastW = rightSidebarWidth
      document.body.style.userSelect = "none"
      document.body.style.cursor = "col-resize"
      const apply = (w: number) => {
        if (shellRef.current) {
          Object.assign(shellRef.current.style, buildGridTemplate({ ...gridOptions, overrides: { rightW: w } }))
        }
      }
      const onMove = (ev: PointerEvent) => {
        lastW = Math.max(250, Math.min(480, startWidth - (ev.clientX - startX)))
        apply(lastW)
      }
      let committed = false
      const onUp = () => {
        if (committed) return
        committed = true
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        setRightSidebarWidth(lastW)
      }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [rightSidebarWidth, setRightSidebarWidth, shellRef, gridOptions]
  )

  return { startSidebarResize, startRightSidebarResize }
}
