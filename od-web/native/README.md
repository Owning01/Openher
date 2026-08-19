# Native migration path (Rust)

OpenDesign keeps its content registries (skills, design-systems, design-templates)
in `apps/daemon` as TypeScript modules. The scan + normalize work is the hottest
steady-state path in the daemon. `packages/native-bridge` defines a stable
`RegistryBackend` contract, and this `native/` workspace ships the compiled
Rust drop-in (`registry-core`) that implements the same surface through napi.

## Contract

See `packages/native-bridge/src/index.ts`:

- `listSkills(roots, options) -> RegistrySkillSummary[]`
- `listDesignSystems(roots, options) -> RegistryDesignSystemSummary[]`
- `listTemplates(roots, options) -> RegistryTemplateSummary[]`
- `invalidate()`

## Wiring (when ready to switch)

1. Implement the scan/normalize logic in `registry-core/src/lib.rs` (port the rules
   from `apps/daemon/src/skills.ts`, `apps/daemon/src/design-systems/`, and the
   design-templates loader). Keep the JS behavior identical.
2. Build the addon: `cd native/registry-core && napi build --platform --release`.
3. In `apps/daemon`, load the `.node` backend behind `RegistryBackend` and select it
   at startup when present; otherwise fall back to the JS implementation.
4. Call `invalidate()` from import/update/delete routes (the JS cache already does
   this via `invalidateSkillsCache`).

Call sites depend only on `RegistryBackend`, so no consumer code changes when the
backend switches.
