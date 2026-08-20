// Barrel — re-exports domain types from entities/* (Fase 2).
// Backward-compat: existing `import type { X } from "./types"` / `"../types"` sigue funcionando.
// No añadas tipos aquí — añádelos en entities/<domain>/model.ts.

export * from "./entities/message/model"
export * from "./entities/session/model"
export * from "./entities/agent/model"
export * from "./entities/file/model"
export * from "./entities/config/model"
export * from "./entities/ui/model"
