#![deny(clippy::all)]

//! Compiled Rust backend for the OpenDesign content registries.
//!
//! This crate mirrors the `RegistryBackend` contract from
//! `packages/native-bridge/src/index.ts`:
//!
//! - `listSkills(roots, options) -> SkillSummary[]`
//! - `listDesignSystems(roots, options) -> DesignSystemSummary[]`
//! - `listTemplates(roots, options) -> TemplateSummary[]`
//! - `invalidate()`
//!
//! The functions below are stubs that return empty results. The migration plan:
//!
//! 1. Implement the on-disk scan + frontmatter normalization in this crate
//!    (reusing the same rules the daemon applies in `apps/daemon/src/skills.ts`
//!    and the design-systems / design-templates loaders).
//! 2. Build the `.node` artifact (`napi build --platform --release`).
//! 3. In `apps/daemon`, load the backend behind `RegistryBackend` and select it
//!    at startup when the compiled module is present; otherwise fall back to the
//!    existing JS implementation. Call sites already depend on `RegistryBackend`,
//!    so no consumer changes are needed.

use napi_derive::napi;

#[napi(object)]
pub struct SkillSummary {
  pub id: String,
  pub name: String,
  pub description: String,
  pub mode: String,
  pub surface: String,
  pub source: String,
  pub category: Option<String>,
  pub craft_requires: Vec<String>,
  pub upstream: Option<String>,
}

#[napi(object)]
pub struct DesignSystemSummary {
  pub id: String,
  pub name: String,
  pub description: String,
  pub source: String,
  pub token_file: Option<String>,
}

#[napi(object)]
pub struct TemplateSummary {
  pub id: String,
  pub name: String,
  pub description: String,
  pub source: String,
}

#[napi(object)]
pub struct RegistryListOptions {
  pub workspace_id: Option<String>,
  pub workspace_member_id: Option<String>,
}

#[napi]
pub async fn list_skills(_roots: Vec<String>, _options: Option<RegistryListOptions>) -> napi::Result<Vec<SkillSummary>> {
  // TODO(registry-core): port apps/daemon/src/skills.ts scan + normalize.
  Ok(Vec::new())
}

#[napi]
pub async fn list_design_systems(
  _roots: Vec<String>,
  _options: Option<RegistryListOptions>,
) -> napi::Result<Vec<DesignSystemSummary>> {
  // TODO(registry-core): port apps/daemon/src/design-systems scan + normalize.
  Ok(Vec::new())
}

#[napi]
pub async fn list_templates(
  _roots: Vec<String>,
  _options: Option<RegistryListOptions>,
) -> napi::Result<Vec<TemplateSummary>> {
  // TODO(registry-core): port design-templates loader scan + normalize.
  Ok(Vec::new())
}

#[napi]
pub fn invalidate() {
  // TODO(registry-core): drop the in-memory scan cache.
}
