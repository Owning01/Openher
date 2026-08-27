import { memo, type ReactNode } from "react"

export interface DetailPageProps {
  children: ReactNode
}

export const DetailPage = memo(function DetailPage({ children }: DetailPageProps) {
  return (
    <main className="app-main detail-main" style={{ height: "100%", overflow: "hidden" }}>
      {children}
    </main>
  )
})
