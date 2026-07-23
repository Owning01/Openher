import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "ai.opencode.remote.web",
  appName: "OpenCode Mobile",
  webDir: "dist",
  server: {
    androidScheme: "http",
    iosScheme: "http",
    cleartext: true
  },
  ios: {
    contentInset: "always",
    preferredContentMode: "mobile"
  }
}

export default config
