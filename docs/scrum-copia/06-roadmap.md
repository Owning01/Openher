# Roadmap — horizontes de release

Metas por trimestre. El backlog (`02-product-backlog.md`) alimenta estos releases;
el roadmap NO cambia dentro de un trimestre salvo decisión consciente en retro.

## R1.1 — Estabilidad + QuickChat GA · fin agosto 2026

**Tema:** "El chat es confiable todos los días en mi teléfono."

- Composer fluido en APK (PB-001) — *fix del eco stale ya commiteado `124e8ab8`*
- QuickChat streaming verificado end-to-end + indicador de caché (PB-005, PB-006)
- Terminal desktop estable multi-tab (PB-010)
- i18n completo de features nuevas (PB-011)

**Criterio de salida:** 1 semana de uso diario sin bugs bloqueantes reportados por uno mismo.

## R1.2 — Arquitectura completa · octubre 2026

**Tema:** "El código lo puede mantener otra persona (u otra IA) sin contexto previo."

- `App.tsx` ≤ 150 líneas: grid → `pages/desktop-workspace`, nav → `widgets/nav-shell` (PB-002)
- `shellPanels.tsx` dividido (PB-003)
- Routers reales Rust: fs/pty/kanban/doc (PB-004 y sucesores)
- Tests de integración del flujo chat (PB-008)

**Criterio de salida:** ningún archivo > 400 líneas en hot paths; suite > 1200 tests.

## R2.0 — Distribución · Q4 2026

**Tema:** "Otros usuarios pueden instalarlo sin hablar conmigo."

- Pipeline release firmado (no solo debug APK via tmpfiles)
- Play Store listing + screenshots (E)
- Onboarding primera vez (conexión al server guiada)
- Docs de usuario separadas de docs de desarrollo

## Fuera del radar explícito (por ahora)

iOS build, sync multi-dispositivo, plugins de terceros.
