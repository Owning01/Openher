import { defineConfig } from "vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import babel from "@rolldown/plugin-babel"

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    // React Compiler: memoización automática. target "18" → usa
    // react-compiler-runtime (React 18 no trae react/compiler-runtime).
    babel({ presets: [reactCompilerPreset({ target: "18" })] }),
  ],
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
