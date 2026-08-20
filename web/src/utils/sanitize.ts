export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "")
}

export function sanitizeClassName(cls: string): string {
  return cls.replace(/[^a-zA-Z0-9\-_ ]/g, "")
}
