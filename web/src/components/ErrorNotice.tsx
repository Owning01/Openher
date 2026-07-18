export function ErrorNotice({ message }: { message: string | null }) {
  if (!message) return null
  return <div className="error fade-in">✗ {message}</div>
}
