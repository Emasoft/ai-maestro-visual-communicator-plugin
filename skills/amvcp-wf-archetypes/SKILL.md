---
name: amvcp-wf-archetypes
description: "Wireframe archetypes — 4 base skeletons (app, web, mobile, modal) plus pattern families: app-grid (dashboard, tables), settings, modal, blank-state (loading/error/empty/success), nav bars, forms. Use when picking a page-skeleton shape or composing dashboards, settings, modals, forms, blank states. Trigger with 'archetype', 'app-grid', 'IDE archetype', 'dashboard layout', 'modal pattern', 'blank state', 'empty state', 'form layout', 'data table'."
license: MIT
compatibility: "Browser (CSS grid/flex). Companion: amvcp-wireframe.css (archetype + pattern classes)."
metadata:
  author: Emasoft
---

# Wireframe Archetypes

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Router:** [`skills/amvcp-wireframe/SKILL.md`](../amvcp-wireframe/SKILL.md). **Sibling wireframe skills:** [amvcp-wf-fidelity](../amvcp-wf-fidelity/SKILL.md) · [amvcp-wf-devices](../amvcp-wf-devices/SKILL.md) · [amvcp-wf-screens](../amvcp-wf-screens/SKILL.md).

## Overview

The page-skeleton shapes that organise the kit's 19 blocks into the most common layouts. Four base archetypes ship — `wf-archetype--app` (titlebar / sidebar / main / statusbar — IDE, mail, terminal), `wf-archetype--web` (header / nav / main / footer), `wf-archetype--mobile` (status / main / tab bar), and `wf-archetype--modal` (overlay + centered dialog). On top of these, pattern families ship for the recurring sub-archetypes: **app-grid** (dashboards with KPI bands, data tables), **settings archetype** (sidebar + content with section forms), **modal archetype** (confirmation, form, drawer, popover, toast, tooltip), **blank-state archetype** (loading skeleton, error, offline, empty, success). Navigation bars (top, side, bottom tabs, breadcrumb) and form patterns (single/two-column, wizards, login pair) compose into every archetype.

## Prerequisites

- `scripts/amvcp-wireframe.css` loaded — supplies archetype + pattern classes.
- The 19-class kit from [`amvcp-wf-fidelity`](../amvcp-wf-fidelity/SKILL.md) — archetypes are pure shape, blocks are pure content.
- The DESIGN.md engine.

## Instructions

1. **Pick an archetype** for each `.wf-screen` — see [`layout-archetypes.md`](references/layout-archetypes.md).
2. **Drop the right pattern family inside** — dashboard ([dashboard-screens.md](references/dashboard-screens.md)), settings ([settings-screens.md](references/settings-screens.md)), modal ([modal-and-overlay-patterns.md](references/modal-and-overlay-patterns.md)), state/empty ([state-and-feedback-patterns.md](references/state-and-feedback-patterns.md)).
  > Pattern 1 — KPI overview (stat band + chart + recent activity) · Pattern 2 — Data table (sortable list with filters + pagination) · Pattern 3 — Single record (header + tabs + detail panel) · Pattern 4 — Settings (sectioned forms + save bar) · Pattern 5 — Empty admin (onboarding wizard step) · Pattern 6 — Multi-column board (kanban / columns) · The stat-band recipe — 4 KPI cards in a row · The chart placeholder — `wf-image` substitute · Sidebar grouping with `wf-divider` · Dense data — when to break the 16px gap rule
3. **Add navigation** — top nav, side nav, bottom tabs, breadcrumb, command palette. See [`navigation-patterns.md`](references/navigation-patterns.md).
  > Pattern 1 — Top nav bar (web app header) · Pattern 2 — Side nav (collapsible) · Pattern 3 — Bottom tabs (mobile only) · Pattern 4 — Breadcrumb (path-based hierarchy) · Pattern 5 — Section nav (anchor scroll, in-page TOC) · Pattern 6 — Command palette (Ctrl-K search) · Account menu (avatar dropdown) · Notification badge convention · Mobile drawer (hamburger menu) · Tabbed pages (header tabs within a screen)
4. **For forms** — pick single-column / two-column / wizard / field-group. See [`form-patterns.md`](references/form-patterns.md).
  > Single-column form (the default) · Two-column form (wide screens) · Field group — related inputs share a section · Input variants — textarea, select, file, multi-line · Inline help — `wf-label` + small text · Error state — invalid input + error message · Success state — saved confirmation · Required-field marker · Optional-field marker (inverted convention) · Multi-step wizard (progress bar + per-step forms) · Login + signup pair (the auth duo) · Search form (single input + filter row) · Action bar — sticky save / cancel at the bottom · Overview
5. **For data tables** — pick standard / compact / expandable / editable / drag / virtualized. See [`data-tables-and-lists.md`](references/data-tables-and-lists.md).
  > Pattern 1 — Standard sortable table · Pattern 2 — Compact list (denser than table) · Pattern 3 — Expandable rows (master-detail in one view) · Pattern 4 — Inline editable cells · Pattern 5 — Drag-to-reorder (sortable list) · Pattern 6 — Virtualized big-data (10k+ rows) · Row selection — checkbox column + bulk action bar · Empty table state · Sticky header + sticky first column · Cell type conventions (text, number, date, status, action)
6. **Compose archetypes** — modal-over-anything (a `wf-archetype--modal` overlays any other archetype on the same screen).

Checklist:

- [ ] Each `.wf-screen` picks exactly one archetype
- [ ] Navigation pattern matches the archetype (top nav for web, side nav for app, bottom tabs for mobile)
- [ ] Forms use the right column count for the viewport
- [ ] Data tables respect the cell-type conventions
- [ ] Blank-state variants ship alongside loaded-state for every screen

## Output

A page laid out using one of the four base archetypes, populated with the right pattern family for the domain (dashboard/settings/modal/blank-state), with navigation + forms + tables in their canonical shapes.

## Error Handling

| Symptom | Fix |
|---|---|
| Layout collapses on mobile | `wf-archetype--app` was used on a narrow viewport — switch to `wf-archetype--mobile` or wrap in `amvcp-wf-devices` frame. |
| Modal sits inline instead of overlaying | The `.wf-archetype--modal` must be a sibling of the underlying archetype, not a child of `.wf-main`. |
| Table headers don't stick | Add the sticky-header variant; check that an ancestor isn't creating a new containing block. |
| Form save bar overlaps content | Use the sticky save-bar variant + add bottom padding equal to the bar's height. |

## Examples

**Input:** "wireframe a dashboard."

**Output:** `.wf-archetype--app` containing a sidebar + a `.wf-main` with a KPI stat-band + chart + recent-activity card (dashboard pattern from `dashboard-screens.md`).

**Input:** "settings page with sections."

**Output:** `.wf-archetype--app` with the settings-hub sidebar pattern + per-section forms (from `settings-screens.md`).

**Input:** "show the empty state."

**Output:** the blank-state variant from `state-and-feedback-patterns.md` — empty illustration + CTA.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` (R41 — dev-browser visible mode). Screenshot in BOTH themes. Verify every archetype's grid template areas resolve correctly at common viewport widths.

## Modes

Supports `data-ve-mode="readonly"` (design walkthrough) and `data-ve-mode="choice"`/`single`/`multi`/`max-N` (per-block 3-state decision pill so reviewers can approve/deny pattern choices) (R20/R23).

## Composability

Composes with every sibling wireframe skill (fidelity, devices, screens) and every other amvcp-* skill on the page (R22). The only exclusive skill is the overlay-runtime (R24).

## Resources

- [layout-archetypes.md](references/layout-archetypes.md) — 4 base archetype skeletons + composition rules.
- [dashboard-screens.md](references/dashboard-screens.md) — KPI overview / data table / single record / settings / wizard / kanban (app-grid archetype).
  > Pattern 1 — KPI overview (stat band + chart + recent activity) · Pattern 2 — Data table (sortable list with filters + pagination) · Pattern 3 — Single record (header + tabs + detail panel) · Pattern 4 — Settings (sectioned forms + save bar) · Pattern 5 — Empty admin (onboarding wizard step) · Pattern 6 — Multi-column board (kanban / columns) · The stat-band recipe — 4 KPI cards in a row · The chart placeholder — `wf-image` substitute · Sidebar grouping with `wf-divider` · Dense data — when to break the 16px gap rule
- [settings-screens.md](references/settings-screens.md) — settings hub / single section / preferences / security / billing / notifications (settings archetype).
  > Pattern 1 — Settings hub (sidebar + content) · Pattern 2 — Single section (full-page form) · Pattern 3 — Preferences (toggles + radios) · Pattern 4 — Security (2FA + active sessions) · Pattern 5 — Billing (plan + payment + invoices) · Pattern 6 — Notifications (per-channel matrix) · The toggle switch — CSS-only pattern · Danger-zone section convention · Save-bar convention (sticky vs inline) · Permission row pattern (label + description + toggle)
- [modal-and-overlay-patterns.md](references/modal-and-overlay-patterns.md) — confirm / form / drawer / popover / toast / tooltip (modal archetype).
  > Pattern 1 — Confirmation modal · Pattern 2 — Form modal (short data entry) · Pattern 3 — Side drawer (full-height panel) · Pattern 4 — Popover / dropdown menu · Pattern 5 — Toast notification · Pattern 6 — Tooltip (small hover hint) · Modal stacking — what wins when two open at once · The dismiss patterns — ×, Esc, click-outside · Destructive confirm — typed-name pattern · Toast queue — multiple stacked toasts
- [state-and-feedback-patterns.md](references/state-and-feedback-patterns.md) — loading / spinner / error / offline / empty / success / progress (blank-state archetype).
  > Pattern 1 — Loading skeleton (full-page placeholder) · Pattern 2 — Inline spinner (button + section loaders) · Pattern 3 — Error banner / error page · Pattern 4 — Offline state · Pattern 5 — Empty state variants · Pattern 6 — Success / completion celebration · Progress bar (determinate vs indeterminate) · Optimistic update with revert · Partial-failure state (some succeeded, some failed) · Stale data warning
- [navigation-patterns.md](references/navigation-patterns.md) — top nav / side nav / bottom tabs / breadcrumb / section TOC / command palette.
  > Pattern 1 — Top nav bar (web app header) · Pattern 2 — Side nav (collapsible) · Pattern 3 — Bottom tabs (mobile only) · Pattern 4 — Breadcrumb (path-based hierarchy) · Pattern 5 — Section nav (anchor scroll, in-page TOC) · Pattern 6 — Command palette (Ctrl-K search) · Account menu (avatar dropdown) · Notification badge convention · Mobile drawer (hamburger menu) · Tabbed pages (header tabs within a screen)
- [form-patterns.md](references/form-patterns.md) — single / two-column / field groups / inputs / errors / wizards / login pair / search.
  > Single-column form (the default) · Two-column form (wide screens) · Field group — related inputs share a section · Input variants — textarea, select, file, multi-line · Inline help — `wf-label` + small text · Error state — invalid input + error message · Success state — saved confirmation · Required-field marker · Optional-field marker (inverted convention) · Multi-step wizard (progress bar + per-step forms) · Login + signup pair (the auth duo) · Search form (single input + filter row) · Action bar — sticky save / cancel at the bottom · Overview
- [data-tables-and-lists.md](references/data-tables-and-lists.md) — sortable / compact / expandable / editable / drag / virtualized / selection.
  > Pattern 1 — Standard sortable table · Pattern 2 — Compact list (denser than table) · Pattern 3 — Expandable rows (master-detail in one view) · Pattern 4 — Inline editable cells · Pattern 5 — Drag-to-reorder (sortable list) · Pattern 6 — Virtualized big-data (10k+ rows) · Row selection — checkbox column + bulk action bar · Empty table state · Sticky header + sticky first column · Cell type conventions (text, number, date, status, action)
