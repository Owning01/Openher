import { memo, type ReactNode } from "react"

export interface SessionsPageProps {
  children: ReactNode
}

export const SessionsPage = memo(function SessionsPage({ children }: SessionsPageProps) {
  return (
    <main className="app-main sessions-main" style={{ height: "100%", overflow: "hidden" }}>
      {children}
    </main>
  )
})
