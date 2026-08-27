import { memo } from "react"
import { DesktopLayoutView } from "./DesktopLayoutView"

export type DesktopLayoutContainerProps = Parameters<typeof DesktopLayoutView>[0]

export const DesktopLayoutContainer = memo(function DesktopLayoutContainer(
  props: DesktopLayoutContainerProps
) {
  return <DesktopLayoutView {...props} />
})
