/**
 * Helper para tests E2E sin levantar `opencode serve` externo.
 * Usa @opencode-ai/sdk (dev) en memoria — mismo contrato que @opencode-ai/client pero sin HTTP.
 *
 * Ejemplo en vitest:
 *   import { createEmbeddedOpencode } from "../test-utils/embeddedOpencode"
 *   test("prompt", async () => {
 *     await using opencode = await createEmbeddedOpencode()
 *     const s = await opencode.sessions.create({ location: { directory: "/tmp" } })
 *     await opencode.sessions.prompt({ sessionID: s.id, text: "hola" })
 *     for await (const e of opencode.events.subscribe()) { ... }
 *   })
 *
 * Requiere: bun add @opencode-ai/sdk@dev (ya en package.json)
 */
// No import top-level de @opencode-ai/sdk — su entry requiere binario nativo `opencode` que no está en CI jsdom.
// Usamos dynamic import solo cuando se llama la función, así `vitest` puede importar este helper sin levantar el host.
export async function createEmbeddedOpencode() {
  const { OpenCode } = await import("@opencode-ai/sdk")
  const { Plugin } = await import("@opencode-ai/plugin")
  const acmeShellTestPlugin = Plugin.define({
    id: "acme-shell-test",
    async setup(ctx: any) {
      await ctx.storage.set("acme-shell:test-loaded", Date.now())
    },
  })
  // `await using` en el caller liberará router + fibers + plugins
  const opencode = await (OpenCode as any).create({
    plugins: [acmeShellTestPlugin as any],
  })
  return opencode
}

// Alias para compatibilidad con docs: opencode.sessions / opencode.events
export type EmbeddedOpencode = Awaited<ReturnType<typeof createEmbeddedOpencode>>
