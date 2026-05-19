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
  > The "prototype + rationale + open questions" three-panel shape · Inline design notes (the eyebrow panel) · Before/after comparison (two states side-by-side) · Decision-card pattern (option A vs B vs C) · Pros / cons table per option · Tradeoff matrix (cost × benefit per choice) · Open-questions panel — formal review questions · Risk register (per-screen risks + mitigations) · Source / inspiration provenance · Reviewer worksheet
6. **Make every block selectable** — `data-ve-id` + `data-ve-type` per block. See [`selection-and-comments.md`](references/selection-and-comments.md).
7. **Verify a11y** — focus order, ARIA, contrast, keyboard map. See [`accessibility-and-keyboard.md`](references/accessibility-and-keyboard.md).
8. **Screenshot** every screen in BOTH themes. See [`visual-verification.md`](references/visual-verification.md) for the 8-image matrix.
9. **For clickable prototypes** — hub-and-spoke, linear, branching, modal-over, wizard, stateful mocks. See [`clickable-prototype.md`](references/clickable-prototype.md).
  > The clickable contract — what makes it "feel real" · Pattern 1 — Hub-and-spoke (one home, many sub-flows) · Pattern 2 — Linear flow (cart → payment → confirm) · Pattern 3 — Branching flow (a yes/no decision splits paths) · Pattern 4 — Modal-over-screen (overlay pattern) · Pattern 5 — Multi-step wizard with back-stop · Pattern 6 — Stateful mocks (toggle, expand, filter) · The "happy path + 1 error" rule · Annotated callouts — show design rationale · Open-questions panel — collect feedback inline · Screen inventory — name every screen up front
10. **When stuck** — symptom → fix index in [`troubleshooting-and-debugging.md`](references/troubleshooting-and-debugging.md).
  > Symptom: brand color leaks at fidelity=wireframe · Symptom: the fidelity slider does nothing · Symptom: the wireframe looks broken on dark theme · Symptom: an inner scrollbar appears in a device frame · Symptom: clicking a wireframe block does nothing (no selection) · Symptom: nested wireframes paint wrong (undefined behavior) · Symptom: amvcpWireframe.init() throws · Symptom: layout collapses unexpectedly on mobile · Symptom: a chip / button paints in the wrong color · Symptom: ramp's last column looks identical to the third · Symptom: anchor click does nothing in paged mode · Symptom: theme flip doesn't update the wireframe · Visual verification — the screenshot-test rule · Sanity checks before shipping a wireframe

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
  > The clickable contract — what makes it "feel real" · Pattern 1 — Hub-and-spoke (one home, many sub-flows) · Pattern 2 — Linear flow (cart → payment → confirm) · Pattern 3 — Branching flow (a yes/no decision splits paths) · Pattern 4 — Modal-over-screen (overlay pattern) · Pattern 5 — Multi-step wizard with back-stop · Pattern 6 — Stateful mocks (toggle, expand, filter) · The "happy path + 1 error" rule · Annotated callouts — show design rationale · Open-questions panel — collect feedback inline · Screen inventory — name every screen up front
- [wireframe-from-spec.md](references/wireframe-from-spec.md) — 5-step spec → wireframe translation.
- [mobile-screens.md](references/mobile-screens.md) — feed / detail / search / profile / compose / empty.
  > Pattern 1 — Feed (vertical scroll list) · Pattern 2 — Detail (header + body + actions) · Pattern 3 — Search (input + filter chips + result list) · Pattern 4 — Profile (avatar header + stats grid + sections) · Pattern 5 — Compose (form + send action) · Pattern 6 — Empty state (illustration + CTA) · Bottom-tab convention · Floating-action-button (FAB) convention · Pull-to-refresh affordance · Modal sheets — the half-screen drawer
- [landing-page-patterns.md](references/landing-page-patterns.md) — hero / features / social proof / testimonials / pricing / FAQ / CTA / footer.
  > Hero (image + headline + CTA) · Feature trio (3 cards in a row) · Feature-with-image (alternating left-right rows) · Social proof (logo grid) · Testimonial card (quote + avatar + attribution) · Pricing table (3 tiers, comparison rows) · FAQ accordion (collapsed by default) · Bottom CTA (full-width band) · Footer (multi-column links + brand) · Newsletter signup (inline form) · Newsletter HTML skeletons (email-safe variants) · Full-bleed sections — escaping the 72ch cap
- [ecommerce-screens.md](references/ecommerce-screens.md) — catalog / PDP / cart / checkout / confirmation / orders.
  > Pattern 1 — Catalog (filter sidebar + product grid) · Pattern 2 — Product detail (gallery + info + add-to-cart) · Pattern 3 — Cart (line items + subtotal + checkout button) · Pattern 4 — Checkout (address + payment + review) · Pattern 5 — Order confirmation (success + summary + next steps) · Pattern 6 — Account orders (table + status chips) · The price block — current + compare-at + sale chip · Quantity stepper (− input +) · Variant picker (color swatches, size buttons) · Stock status badge · Promo / discount bar
- [auth-and-onboarding.md](references/auth-and-onboarding.md) — login / signup / forgot / reset / verify / welcome.
  > Pattern 1 — Login (email + password) · Pattern 2 — Signup (account creation) · Pattern 3 — Forgot password (request reset link) · Pattern 4 — Password reset (new password form) · Pattern 5 — Email verification (check inbox) · Pattern 6 — Welcome / first-run tour (carousel) · SSO buttons (Google, GitHub, Apple) · Two-factor / OTP input · Magic-link signin pattern · The "you're logged in elsewhere" disambiguation
- [email-and-messaging-screens.md](references/email-and-messaging-screens.md) — inbox / conversation / compose / threads / picker / digest.
  > Pattern 1 — Inbox (3-pane: sidebar / list / preview) · Pattern 2 — Conversation view (header + message stack + composer) · Pattern 3 — Compose modal (overlay form) · Pattern 4 — Thread tree (nested replies) · Pattern 5 — Contact picker (search + result list + chip selection) · Pattern 6 — Unread digest (grouped by sender) · The chat bubble — author + text + time + reply link · The mail row — sender + subject + preview + time · Unread vs read — the bold-weight signal · The reply composer — inline at the bottom
- [content-and-cms-screens.md](references/content-and-cms-screens.md) — article / editor / media library / list / preview / publish.
  > Pattern 1 — Article reader (long-form prose) · Pattern 2 — Post editor (WYSIWYG body + meta sidebar) · Pattern 3 — Media library (thumbnail grid + filter) · Pattern 4 — Content list (sortable table of posts) · Pattern 5 — Draft preview (mobile + desktop side-by-side) · Pattern 6 — Publish-flow modal (visibility + schedule) · Toolbar — bold, italic, link, list, image · Inline embed (image, video, code block) · Author byline · Comment thread (article-attached)
- [onboarding-flows.md](references/onboarding-flows.md) — wizard / tour / empty / progressive disclosure / skeletons / success.
  > Pattern 1 — Multi-step wizard (3-7 steps) · Pattern 2 — In-product tour (coachmarks) · Pattern 3 — Empty state with CTA · Pattern 4 — Progressive disclosure (expandable sections) · Pattern 5 — Skeleton loaders (placeholder while fetching) · Pattern 6 — Success celebration ("you're all set") · Progress indicators — bar, dots, stepper, checklist · The skip-this-step affordance · Conditional fields (show field B only if A is checked) · Save-and-continue-later anchor
- [rationale-and-design-notes.md](references/rationale-and-design-notes.md) — three-panel shape (prototype + rationale + open-questions), decision cards.
  > The "prototype + rationale + open questions" three-panel shape · Inline design notes (the eyebrow panel) · Before/after comparison (two states side-by-side) · Decision-card pattern (option A vs B vs C) · Pros / cons table per option · Tradeoff matrix (cost × benefit per choice) · Open-questions panel — formal review questions · Risk register (per-screen risks + mitigations) · Source / inspiration provenance · Reviewer worksheet
- [selection-and-comments.md](references/selection-and-comments.md) — selection contract, auto-stamp, 4 visual states, group-handle pattern.
- [accessibility-and-keyboard.md](references/accessibility-and-keyboard.md) — semantic HTML, focus order, ARIA, keyboard map.
- [visual-verification.md](references/visual-verification.md) — 8-image matrix, screenshot test workflow, visual diff.
- [troubleshooting-and-debugging.md](references/troubleshooting-and-debugging.md) — common bugs by symptom + fixes + sanity checklist.
  > Symptom: brand color leaks at fidelity=wireframe · Symptom: the fidelity slider does nothing · Symptom: the wireframe looks broken on dark theme · Symptom: an inner scrollbar appears in a device frame · Symptom: clicking a wireframe block does nothing (no selection) · Symptom: nested wireframes paint wrong (undefined behavior) · Symptom: amvcpWireframe.init() throws · Symptom: layout collapses unexpectedly on mobile · Symptom: a chip / button paints in the wrong color · Symptom: ramp's last column looks identical to the third · Symptom: anchor click does nothing in paged mode · Symptom: theme flip doesn't update the wireframe · Visual verification — the screenshot-test rule · Sanity checks before shipping a wireframe
- [integration-with-other-skills.md](references/integration-with-other-skills.md) — composition with engine, runtime, layout, charts, diagrams, slides.
