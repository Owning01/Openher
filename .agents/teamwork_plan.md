# Teamwork Plan — OpenHer Móvil: Archivos + Aprendizaje

> Sentinel: orquesta y verifica cierre. Orchestrator: pistas A/B en paralelo.
> Integridad: `development`. Trabajo in-place en `G:\Proyectos\opencode-remote-android`.

## Hitos
- **M1 — Exploración (read-only)**
  - Track A: `explorer` PC Files móvil → plan de implementación accionable.
  - Track B: `explorer` Aprendizaje móvil → causas de overflow + plan CSS.
- **M2 — Implementación (paralelo, archivos disjuntos)**
  - Track A (worker): `web/src/features/pc-files/PCFilesPanel.tsx`, `TreeFolder.tsx`,
    `FileRow.tsx`, `web/src/styles/pc-files.css`, tests `*pc-files*`.
  - Track B (worker): `web/src/styles/learning.css`, `web/src/features/learning/*`
    (excepto tests compartidos), tests de learning.
- **M3 — Barrido móvil (secuencial, post-M2)**: overflow/clipping en Sesiones, Chat,
  Ajustes, Chat Rápido; fixes en `responsive.css` o CSS de la vista.
- **M4 — Puertas adversariales**: critic + challenger + auditor sobre los diffs.
- **M5 — Cierre**: evaluator (DoD) + APK 1.0.7 + hash + link directo.

## Propiedad exclusiva de archivos (sin solapes)
| Worker | Archivos |
| --- | --- |
| A (PC Files) | `web/src/features/pc-files/*`, `web/src/styles/pc-files.css` |
| B (Learning) | `web/src/styles/learning.css`, `web/src/features/learning/*` |
| Sentinel (cierre) | `web/src/styles/responsive.css`, `web/android/app/build.gradle`, APK |
