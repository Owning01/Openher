// Barrel — re-exports domain types from entities/* (Fase 2).
// Backward-compat: existing `import type { X } from "./types.ts"` / `"../types"` sigue funcionando.
// No añadas tipos aquí — añádelos en entities/<domain>/model.ts.

export * from "./entities/message/model.ts"
export * from "./entities/session/model.ts"
export * from "./entities/agent/model.ts"
export * from "./entities/file/model.ts"
export * from "./entities/config/model.ts"
export * from "./entities/ui/model.ts"
