import { useCallback } from "react"
import type { PromptSnippet } from "../types"
import { useLocalStorage } from "./useLocalStorage"

const SNIPPETS_KEY = "opencode.remote.promptSnippets"

let snippetId = 0

export function usePromptSnippets() {
  const [snippets, setSnippets] = useLocalStorage<PromptSnippet[]>(SNIPPETS_KEY, [])

  const addSnippet = useCallback((name: string, text: string) => {
    const trimmedName = name.trim()
    const trimmedText = text.trim()
    if (!trimmedName || !trimmedText) return
    setSnippets((prev) => [...prev, { id: `snip-${++snippetId}-${Date.now()}`, name: trimmedName, text: trimmedText }])
  }, [setSnippets])

  const removeSnippet = useCallback((id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id))
  }, [setSnippets])

  return { snippets, addSnippet, removeSnippet }
}
