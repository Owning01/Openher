export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "")
    .replace(/\bstyle\s*=\s*(?:"[^"]*expression[^"]*"|'[^']*expression[^']*'|[^\s>]*expression[^\s>]*)/gi, "")
    .replace(/\bsrcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/data\s*:\s*text\/html[^,]*,/gi, "")
}

export function sanitizeClassName(cls: string): string {
  return cls.replace(/[^a-zA-Z0-9\-_ ]/g, "")
}
