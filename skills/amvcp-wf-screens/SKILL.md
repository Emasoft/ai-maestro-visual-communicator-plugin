---
name: amvcp-wf-screens
description: "Multi-screen wireframe authoring — anchor nav (paged vs scroll), `.wf-screen` blocks, screen-to-screen routing, clickable prototypes (hub-spoke / linear / branching), domain screens (mobile, ecommerce, auth, email, CMS, onboarding), selection, a11y. Use when wiring N screens into one page or translating a spec to screens. Trigger with 'multi-screen', 'screen navigation', 'paged wireframe', 'clickable prototype', 'screen flow', 'wireframe from spec'."
license: MIT
compatibility: "Browser (CSS + plain HTML anchors; pure CSS paged mode via :target). Companion: amvcp-wireframe.css + amvcp-wireframe.js."
metadata:
  author: Emasoft
---

# Wireframe Screens

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Router:** [`skills/amvcp-wireframe/SKILL.md`](../amvcp-wireframe/SKILL.md). **Sibling wireframe skills:** [amvcp-wf-fidelity](../amvcp-wf-fidelity/SKILL.md) · [amvcp-wf-devices](../amvcp-wf-devices/SKILL.md) · [amvcp-wf-archetypes](../amvcp-wf-archetypes/SKILL.md).

## Overview

The multi-screen story layer. One `.wf-root` holds N `.wf-screen` blocks; plain `<a href="#screen-id">` anchors jump between them. Two navigation modes — `scroll` (default; every screen stacked, fragment scrolls to it) and `paged` (pure CSS `:target`; only the targeted screen is visible). Domain screen libraries supply patterns INSIDE one screen — mobile (feed, detail, profile, compose), ecommerce (catalog, PDP, cart, checkout), auth (login, signup, reset), email (inbox, conversation, compose), content/CMS (article, editor, media library), onboarding (wizard, tour, skeleton, success). The wireframe-from-spec workflow translates a written spec to a screen inventory in 5 steps. Selection + comments stamp every block as a `data-ve-id` atom so reviewers can approve/deny per screen.

## Prerequisites

- `scripts/amvcp-wireframe.css` + `scripts/amvcp-wireframe.js` loaded.
- The DESIGN.md engine.
- Kit blocks from [amvcp-wf-fidelity](../amvcp-wf-fidelity/SKILL.md) and archetype shapes from [amvcp-wf-archetypes](../amvcp-wf-archetypes/SKILL.md).

## Instructions

1. **Inventory screens** — every distinct page or modal state is one `.wf-screen` with `id="screen-<purpose>"`. See [`wireframe-from-spec.md`](references/wireframe-from-spec.md).
2. **Pick navigation mode** on the `.wf-root` — `data-wf-nav="scroll"` (stacked, default) or `data-wf-nav="paged"` (one at a time via `:target`). See [`multi-screen-navigation.md`](references/multi-screen-navigation.md).
3. **Wire anchors** — `<a href="#screen-payment">Continue</a>` advances; `<a href="#screen-cart">Back</a>` retreats.
4. **Drop domain patterns** inside each screen — pick from `mobile-screens.md`, `ecommerce-screens.md`, `auth-and-onboarding.md`, `email-and-messaging-screens.md`, `content-and-cms-screens.md`, `landing-page-patterns.md`, `onboarding-flows.md`.
5. **Add rationale panels** when the prototype needs design notes / open questions / decision cards. See [`rationale-and-design-notes.md`](references/rationale-and-design-notes.md).
6. **Make every block selectable** — `data-ve-id` + `data-ve-type` per block. See [`selection-and-comments.md`](references/selection-and-comments.md).
7. **Verify a11y** — focus order, ARIA, contrast, keyboard map. See [`accessibility-and-keyboard.md`](references/accessibility-and-keyboard.md).
8. **Screenshot** every screen in BOTH themes. See [`visual-verification.md`](references/visual-verification.md) for the 8-image matrix.
9. **For clickable prototypes** — hub-and-spoke, linear, branching, modal-over, wizard, stateful mocks. See [`clickable-prototype.md`](references/clickable-prototype.md).
10. **When stuck** — symptom → fix index in [`troubleshooting-and-debugging.md`](references/troubleshooting-and-debugging.md).

Checklist:

- [ ] Every distinct UI state is a `.wf-screen` with a unique `id`
- [ ] Navigation mode chosen (`scroll` or `paged`)
- [ ] Anchor links wire the user flow
- [ ] Every block carries `data-ve-id` + `data-ve-type`
- [ ] Both themes screenshotted
- [ ] A11y walkthrough done (tab order, focus rings, ARIA)

## Output

A multi-screen wireframe page where the reviewer can click between screens, approve/deny per block, and read inline rationale notes. The page is self-contained (single HTML file, no iframes, no nested scrollbars).

## Error Handling

| Symptom | Fix |
|---|---|
| Anchor click does nothing in paged mode | Missing `:target` rule — set `data-wf-nav="paged"` on the `.wf-root`. |
| First screen blank when no fragment | Add the `:has(...)` no-fragment fallback (auto-shows first screen). |
| Clicking a block does nothing | Missing `data-ve-id` or `data-ve-type` — auto-stamp via `selection-and-comments` contract. |
| Focus ring missing on a block | Not focusable — every kit block gets `tabindex="0"` auto-stamped; check the runtime is loaded. |
| Long screen creates inner scrollbar | An ancestor set `overflow:auto` — must be `visible` (no nested scrollbars). |

## Examples

**Input:** "wireframe a 3-screen checkout flow."

**Output:** one `.wf-root` with `data-wf-nav="paged"` containing three `.wf-screen` blocks (`screen-cart`, `screen-payment`, `screen-confirm`); Continue/Back anchors wire forward/back. See `ecommerce-screens.md` for the per-screen patterns and `clickable-prototype.md` for the linear-flow shape.

**Input:** "translate this spec into a wireframe."

**Output:** the 5-step `wireframe-from-spec.md` workflow — identify screens → map archetypes → pick blocks → wire navigation → add states.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` (R41 — dev-browser visible mode). Screenshot every screen in BOTH themes. The 8-image matrix in `visual-verification.md` is the minimum bar.

## Modes

Supports `data-ve-mode="readonly"` (review-only) and `data-ve-mode="choice"`/`single`/`multi`/`max-N` (per-block 3-state decision pill so reviewers can approve/deny each block) (R20/R23).

## Composability

Composes with every sibling wireframe skill (fidelity, devices, archetypes) and every other amvcp-* skill on the page (R22). The only exclusive skill is the overlay-runtime (R24).

## Resources

- [multi-screen-navigation.md](references/multi-screen-navigation.md) — scroll vs paged, anchor patterns, no-fragment fallback, deep-linking.
- [clickable-prototype.md](references/clickable-prototype.md) — hub-and-spoke / linear / branching / modal-over / wizard / stateful mocks.
- [wireframe-from-spec.md](references/wireframe-from-spec.md) — 5-step spec → wireframe translation.
- [mobile-screens.md](references/mobile-screens.md) — feed / detail / search / profile / compose / empty.
- [landing-page-patterns.md](references/landing-page-patterns.md) — hero / features / social proof / testimonials / pricing / FAQ / CTA / footer.
- [ecommerce-screens.md](references/ecommerce-screens.md) — catalog / PDP / cart / checkout / confirmation / orders.
- [auth-and-onboarding.md](references/auth-and-onboarding.md) — login / signup / forgot / reset / verify / welcome.
- [email-and-messaging-screens.md](references/email-and-messaging-screens.md) — inbox / conversation / compose / threads / picker / digest.
- [content-and-cms-screens.md](references/content-and-cms-screens.md) — article / editor / media library / list / preview / publish.
- [onboarding-flows.md](references/onboarding-flows.md) — wizard / tour / empty / progressive disclosure / skeletons / success.
- [rationale-and-design-notes.md](references/rationale-and-design-notes.md) — three-panel shape (prototype + rationale + open-questions), decision cards.
- [selection-and-comments.md](references/selection-and-comments.md) — selection contract, auto-stamp, 4 visual states, group-handle pattern.
- [accessibility-and-keyboard.md](references/accessibility-and-keyboard.md) — semantic HTML, focus order, ARIA, keyboard map.
- [visual-verification.md](references/visual-verification.md) — 8-image matrix, screenshot test workflow, visual diff.
- [troubleshooting-and-debugging.md](references/troubleshooting-and-debugging.md) — common bugs by symptom + fixes + sanity checklist.
- [integration-with-other-skills.md](references/integration-with-other-skills.md) — composition with engine, runtime, layout, charts, diagrams, slides.
