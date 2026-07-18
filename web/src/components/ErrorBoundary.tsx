import { Component, type ReactNode, type ErrorInfo } from "react"

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-shell" style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Something went wrong</h2>
          <pre style={{ fontSize: "0.85rem", color: "var(--muted)", maxWidth: "100%", overflow: "auto" }}>
            {this.state.error.message}
          </pre>
          <button className="btn-primary" style={{ marginTop: "1rem" }}
            onClick={() => this.setState({ error: null })}>
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
