// Native migration seam for the daemon's content registries.
//
// The skills / design-systems / design-templates listings are the daemon's
// hottest steady-state paths (a full re-scan of ~430 on-disk entries on every
// GET /api/* listing). They are now cached in JS, but the *scan + normalize*
// work is the natural candidate to move into a compiled Rust core (napi) for
// lower latency and a smaller per-request heap.
//
// This module defines the stable contract only. Call sites should depend on
// `RegistryBackend`, not on the concrete JS implementation, so the Rust core
// under `native/registry-core` can be wired in behind the same interface
// (see `native/README.md`) without changing consumers.

export interface RegistrySkillSummary {
  id: string;
  name: string;
  description: string;
  mode: string;
  surface: string;
  source: "user" | "built-in";
  category: string | null;
  craftRequires: string[];
  upstream: string | null;
}

export interface RegistryDesignSystemSummary {
  id: string;
  name: string;
  description: string;
  source: "user" | "built-in";
  tokenFile: string | null;
}

export interface RegistryTemplateSummary {
  id: string;
  name: string;
  description: string;
  source: "user" | "built-in";
}

export interface RegistryListOptions {
  /** When set, only entries visible from this workspace scope are returned. */
  workspaceId?: string | null;
  workspaceMemberId?: string | null;
}

/**
 * Stable backend contract for the content registries. The current daemon uses
 * the JS implementation living in `apps/daemon/src/skills.ts`,
 * `apps/daemon/src/design-systems/`, and the design-templates loader. A future
 * Rust/napi module under `native/registry-core` implements the same surface and
 * is selected at startup when the compiled backend is present.
 */
export interface RegistryBackend {
  listSkills(roots: readonly string[], options?: RegistryListOptions): Promise<RegistrySkillSummary[]>;
  listDesignSystems(roots: readonly string[], options?: RegistryListOptions): Promise<RegistryDesignSystemSummary[]>;
  listTemplates(roots: readonly string[], options?: RegistryListOptions): Promise<RegistryTemplateSummary[]>;
  /** Drop any in-memory caches (called after import/update/delete). */
  invalidate(): void;
}

/**
 * Placeholder for the JS-backed implementation. The daemon currently calls its
 * own `listSkills` directly; this class exists so the migration seam is
 * concrete and testable. Wire it in by having the daemon's registry modules
 * return `JsRegistryBackend` (or the Rust backend) through a single factory.
 */
export class JsRegistryBackend implements RegistryBackend {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listSkills(_roots: readonly string[], _options?: RegistryListOptions): Promise<RegistrySkillSummary[]> {
    throw new Error("JsRegistryBackend is a migration seam; the daemon still owns the JS listing directly.");
  }
  async listDesignSystems(_roots: readonly string[], _options?: RegistryListOptions): Promise<RegistryDesignSystemSummary[]> {
    throw new Error("JsRegistryBackend is a migration seam; the daemon still owns the JS listing directly.");
  }
  async listTemplates(_roots: readonly string[], _options?: RegistryListOptions): Promise<RegistryTemplateSummary[]> {
    throw new Error("JsRegistryBackend is a migration seam; the daemon still owns the JS listing directly.");
  }
  invalidate(): void {
    // No-op until the daemon routes cache ownership through this backend.
  }
}

export type RegistryBackendKind = "js" | "rust";
