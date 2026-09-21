export type ImageAttachment = { id: string; base64: string; mime: string; name: string }

export type MentionItem = { id: string; name: string; description?: string; source: "agent" | "file" | "mcp" | "skill" }
