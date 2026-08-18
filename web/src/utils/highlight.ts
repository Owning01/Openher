import { createLowlight } from "lowlight"
import hljsJavascript from "highlight.js/lib/languages/javascript"
import hljsTypescript from "highlight.js/lib/languages/typescript"
import hljsJson from "highlight.js/lib/languages/json"
import hljsBash from "highlight.js/lib/languages/bash"
import hljsPython from "highlight.js/lib/languages/python"
import hljsCss from "highlight.js/lib/languages/css"
import hljsXml from "highlight.js/lib/languages/xml"
import hljsGo from "highlight.js/lib/languages/go"
import hljsRust from "highlight.js/lib/languages/rust"
import hljsSql from "highlight.js/lib/languages/sql"
import hljsYaml from "highlight.js/lib/languages/yaml"
import hljsIni from "highlight.js/lib/languages/ini"
import hljsMarkdown from "highlight.js/lib/languages/markdown"
import hljsDiff from "highlight.js/lib/languages/diff"
import hljsGraphql from "highlight.js/lib/languages/graphql"
import hljsPlaintext from "highlight.js/lib/languages/plaintext"

export const lowlight = createLowlight()
lowlight.register("js", hljsJavascript)
lowlight.register("javascript", hljsJavascript)
lowlight.register("ts", hljsTypescript)
lowlight.register("typescript", hljsTypescript)
lowlight.register("json", hljsJson)
lowlight.register("jsonc", hljsJson)
lowlight.register("bash", hljsBash)
lowlight.register("sh", hljsBash)
lowlight.register("shell", hljsBash)
lowlight.register("python", hljsPython)
lowlight.register("py", hljsPython)
lowlight.register("css", hljsCss)
lowlight.register("html", hljsXml)
lowlight.register("xml", hljsXml)
lowlight.register("go", hljsGo)
lowlight.register("rust", hljsRust)
lowlight.register("rs", hljsRust)
lowlight.register("sql", hljsSql)
lowlight.register("yaml", hljsYaml)
lowlight.register("yml", hljsYaml)
lowlight.register("toml", hljsIni)
lowlight.register("ini", hljsIni)
lowlight.register("markdown", hljsMarkdown)
lowlight.register("md", hljsMarkdown)
lowlight.register("diff", hljsDiff)
lowlight.register("graphql", hljsGraphql)
lowlight.register("plaintext", hljsPlaintext)
lowlight.register("text", hljsPlaintext)

const EXT_MAP: Record<string, string> = {
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", tsx: "typescript", mts: "typescript",
  py: "python", pyw: "python",
  json: "json", jsonc: "json",
  sh: "bash", bash: "bash", zsh: "bash",
  css: "css", scss: "css", less: "css",
  html: "html", htm: "html", xml: "html", svg: "html",
  go: "go",
  rs: "rust", rust: "rust",
  sql: "sql",
  yml: "yaml", yaml: "yaml",
  toml: "toml", ini: "toml", cfg: "toml",
  md: "markdown", markdown: "markdown",
  diff: "diff", patch: "diff",
  graphql: "graphql", gql: "graphql",
  c: "c", h: "c", cpp: "cpp", cxx: "cpp", cc: "cpp", hpp: "cpp",
  java: "java", kt: "kotlin", kts: "kotlin",
  rb: "ruby", php: "php", swift: "swift", dart: "dart",
}

export function langFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  return EXT_MAP[ext] ?? "plaintext"
}
