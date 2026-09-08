import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
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
    // React Compiler nativo en Rust (Oxc): memoización automática.
    react({ compiler: true }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined
          if (id.includes("@capacitor")) return "capacitor"
          // jsqr: solo lo usa PairModal vía import() dinámico. Fuera del
          // catch-all => chunk async bajo demanda en vez de ~150KB eager.
          if (id.includes("jsqr")) return undefined
          // @xterm: solo lo alcanzan chunks async (TerminalView/paneles desktop).
          // Sacarlo del catch-all evita ~385KB eager.
          if (id.includes("@xterm")) return undefined
          // CodeMirror: TODO el core va bajo demanda con CodeMirrorEditor (lazy
          // en shellPanels/FileEditor). Los lenguajes ya eran async; el core
          // (@codemirror/state/view/language/...) + @lezer/* quedaban en
          // vendor (~400KB eager). Fuera del catch-all => chunks async que
          // solo se descargan al abrir un archivo para editar.
          if (id.includes("@codemirror/") || id.includes("@lezer/")) return undefined
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
