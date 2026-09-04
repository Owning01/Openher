---
name: frontend-pro
description: "Full-stack frontend engineering skill covering the entire UI/UX lifecycle: distinctive design direction, data-driven design systems (161 palettes, 57 font pairings, 50+ styles, 16 stacks), WCAG 2.2 accessibility, Core Web Vitals performance, security best practices, and Lighthouse-style quality audits. Use this skill EVERY time the user asks to design, build, create, implement, review, audit, improve, fix, optimize, refactor, or check ANY frontend/UI work — landing pages, dashboards, admin panels, SaaS apps, components, buttons, modals, forms, tables, charts, navigation, dark mode, responsive layouts, typography, color systems, accessibility/WCAG/a11y, screen reader support, keyboard navigation, performance/Core Web Vitals/LCP/INP/CLS, security headers/CSP, or code quality — even if they don't explicitly mention 'design' or 'quality'. Also triggers on 'audit my site', 'review web quality', 'check page quality', 'optimize my website', 'make it look professional', or 'this UI looks generic'. Skip only for pure backend/API/DevOps work with no UI surface."
license: MIT
compatibility: opencode
---

# frontend-pro

The complete frontend engineering playbook: distinctive design + design intelligence + quality engineering. One skill, four intents, one quality bar.

## How this skill is organized

The SKILL.md is a router. Detailed knowledge lives in `references/` — read only what the intent needs (progressive disclosure keeps context lean):

| Reference | Load when | Contents |
|---|---|---|
| `references/design-direction.md` | designing NEW UI or reshaping existing | Distinctive aesthetic direction, anti-templated principles, 2-pass process, writing for design |
| `references/design-intelligence.md` | any design/component/style/color/typography decision | 10 priority rule categories, quick reference checks, BM25 search engine usage, dials, persistence |
| `references/a11y-wcag.md` | accessibility work | WCAG 2.2 POUR, code patterns, testing checklist |
| `references/audit-playbook.md` | auditing/reviewing quality | Lighthouse categories, severities, report template |
| `references/best-practices.md` | security/quality/compat work | CSP, Trusted Types, SRI, headers, deprecated APIs, code quality |
| `references/A11Y-PATTERNS.md` + `references/WCAG.md` | deeper a11y needs | Full code patterns and WCAG criteria (on-demand) |

The engine: `scripts/search.py` is a BM25 search over the CSV knowledge base in `data/` (161 palettes, 57 pairings, 50+ styles, 16 stacks). Python 3 required (`python` on Windows, `python3` on macOS/Linux).

## Intent routing

Identify the user's intent FIRST, then load the matching references and follow the flow. When intent is mixed (e.g. "fix this dashboard and make it prettier"), handle audit/fix first, then design.

### Intent A: Design / Create (new UI or major redesign)

Load `references/design-direction.md` AND `references/design-intelligence.md`.

1. **Pin the subject.** If the brief doesn't define it, name the concrete subject, audience, and the page's single job — and state your choice.
2. **Pass 1 — brainstorm** (per design-direction): color (4-6 hex), type roles (display/body/utility), layout concept + ASCII wireframe, signature element. Do this thinking in your head first.
3. **Generate the design system with the engine:**
   ```bash
   python scripts/search.py "<product_type> <industry> <keywords>" --design-system -p "Project Name"
   ```
   Add dials when they help: `--variance 1-10 --motion 1-10 --density 1-10`. For multi-page apps, persist with `--persist` (creates `design-system/MASTER.md` + page overrides).
4. **Pass 2 — critique against the brief.** If any choice reads like the generic default (cream+serif+terracotta, near-black+acid accent, broadsheet hairline), revise it and say what you changed and why. Check your signature element is the ONE memorable thing; keep the rest quiet.
5. **Implement**, deriving every color/type/spacing decision from the plan. Watch CSS specificity — don't let classes cancel each other out.
6. **Validate** against Quick Reference priorities 1-3 (a11y, touch, performance) from design-intelligence, plus the pre-delivery checklist below.

### Intent B: Audit / Review (quality assessment)

Load `references/audit-playbook.md`, `references/a11y-wcag.md`, `references/best-practices.md`.

1. Gather the surface (code, files, or live site).
2. Run the checks by category: Performance (Core Web Vitals), Accessibility (POUR), SEO, Best Practices (security/compat/quality).
3. Categorize findings by severity (Critical / High / Medium / Low) with file:line references.
4. Output the report using the EXACT template in audit-playbook (Critical → High → Summary → Recommended priority), each finding with Impact + Fix.
5. If a live URL is available, run `npx lighthouse <url>` and `axe <url>` to ground the audit in real measurements.

### Intent C: Fix / Improve (concrete problems)

Load the reference matching the problem category: a11y → `a11y-wcag.md`; performance → `design-intelligence.md` §3 (or audit-playbook CWV); security/compat → `best-practices.md`; visual → `design-direction.md` + `design-intelligence.md`.

1. Reproduce/confirm the issue first.
2. Fix it with the specific pattern from the reference (they include ready-to-use code).
3. Explain the why in one line (why the fix works, not just what changed).
4. Re-check the fix doesn't break adjacent rules (e.g. a contrast fix shouldn't introduce color-only signaling).

### Intent D: Component / Style decision (single element or choice)

Load `references/design-intelligence.md` only.

1. Query the engine for the specific need:
   ```bash
   python scripts/search.py "<keyword>" --domain <style|color|typography|chart|ux|landing|product|react|web> 
   python scripts/search.py "<keyword>" --stack <react|nextjs|shadcn|tailwind|...>
   ```
2. Apply the Quick Reference checks for that category (e.g. modal → §7 animation + §9 nav; pricing card → §4 style + §8 forms).
3. Respect platform idioms (iOS HIG vs Material) — don't import web patterns into native, or vice versa.

## Pre-delivery checklist (apply to ANY UI deliverable)

- [ ] **a11y:** contrast ≥4.5:1 (≥3:1 large), alt text, keyboard operable, focus visible, no color-only signaling, `prefers-reduced-motion` respected
- [ ] **touch:** targets ≥44px (≥24px minimum), 8px+ spacing, press feedback, no hover-only interactions
- [ ] **performance:** no CLS (dimensions/aspect-ratio on media), lazy below-fold, `font-display: swap`, no layout thrashing
- [ ] **style:** no emoji icons (SVG), semantic color tokens (no raw hex in components), consistent icon family, one primary CTA
- [ ] **responsive:** mobile-first, no horizontal scroll, 16px body min, systematic breakpoints
- [ ] **security (production):** no mixed content, no exposed source maps, no vulnerable deps
- [ ] **quality:** valid HTML (no duplicate IDs), semantic elements, no console errors, error boundaries where relevant

## Windows notes

- Use `python` (not `python3`) for the engine.
- The engine forces UTF-8 output; if colors look like escape codes in a non-TTY, redirect output to a file and read it.
