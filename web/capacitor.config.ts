import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.gbro.opencode",
  appName: "OpenHer",
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
