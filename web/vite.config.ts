import { defineConfig } from "vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  base: "./",
  server: {
    port: 5173,
    proxy: {
      "/shell": {
        target: "http://127.0.0.1:4848",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    // React Compiler: memoización automática.
    babel({ presets: [reactCompilerPreset({ target: "19" })] }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined
          if (id.includes("@capacitor")) return "capacitor"
          // html-to-image: solo se importa via import() al exportar PNG del Canvas.
          // Fuera del catch-all => chunk async bajo demanda en vez de ~100KB eager en vendor.
          if (id.includes("html-to-image")) return undefined
          // @xterm y pdf.js: solo los alcanzan chunks async (TerminalView/paneles desktop,
          // visor de PDF). Sacarlos del catch-all evita ~385KB + ~1MB eager.
          if (id.includes("@xterm") || id.includes("pdfjs-dist")) return undefined
          // Lenguajes CodeMirror (+ merge): solo se importan vía import() dinámico
          // por extensión de archivo. Fuera del catch-all => un chunk async por
          // lenguaje en vez de ~500KB eager en vendor.
          if (id.includes("@codemirror/lang-") || id.includes("@codemirror/legacy-modes") ||
              id.includes("@codemirror/merge")) return undefined
          // Tablas de parsers Lezer (solo las gramáticas; common/lr/highlight
          // quedan eager en vendor porque el núcleo las importa estático).
          if (id.includes("@lezer/javascript") || id.includes("@lezer/python") ||
              id.includes("@lezer/json") || id.includes("@lezer/css") ||
              id.includes("@lezer/html") || id.includes("@lezer/xml") ||
              id.includes("@lezer/go") || id.includes("@lezer/rust") ||
              id.includes("@lezer/yaml") || id.includes("@lezer/markdown")) return undefined
          if (id.includes("react-markdown") || id.includes("remark-") || id.includes("rehype-") ||
              id.includes("highlight.js") || id.includes("hast-") || id.includes("micromark") ||
              id.includes("mdast-") || id.includes("unist-") || id.includes("unified")) return "markdown"
          if (id.includes("react") || id.includes("scheduler")) return "react"
          return "vendor"
        },
      },
    },
  },
})
