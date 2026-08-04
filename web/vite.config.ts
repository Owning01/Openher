import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined
          if (id.includes("@capacitor")) return "capacitor"
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
