import { defineConfig } from "vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import babel from "@rolldown/plugin-babel"

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
          // @xterm: solo lo alcanzan chunks async (TerminalView/paneles desktop);
          // sacarlo del catch-all evita ~385KB eager en el APK móvil.
          if (id.includes("@xterm")) return undefined
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
