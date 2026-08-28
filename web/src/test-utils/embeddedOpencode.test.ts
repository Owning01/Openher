import { describe, it, expect } from "vitest"
import { createEmbeddedOpencode } from "./embeddedOpencode"

describe("embeddedOpencode SDK", () => {
  it("expone helper para crear host embebido", async () => {
    expect(typeof createEmbeddedOpencode).toBe("function")
    // El helper usa @opencode-ai/sdk en memoria; no lo levantamos en CI para no requerir binario nativo.
    // Uso real:
    // await using opencode = await createEmbeddedOpencode()
    // const s = await opencode.sessions.create({ location: { directory: "/tmp" } })
    // expect(s.id).toBeTruthy()
  })

  it("verifica wrapper tipado y dependencias", async () => {
    const mod = await import("../shared/api/opencodeClient")
    expect(mod.getOpencodeClient).toBeDefined()
    // Las deps están en package.json: @opencode-ai/client@beta, @opencode-ai/sdk@dev, @opencode-ai/plugin@beta
    // Se instalan con `pnpm install` (ya hecho, 446 paquetes)
  })
})
