---
name: amvcp-wireframe
description: "Render navigable grayscale UI wireframes — fidelity-locked placeholder blocks, multi-screen anchor navigation, device-frame bezels (iOS/Android/MacBook/browser), and a wireframe→low→mid→hi fidelity ramp. Grayscale is derived by desaturating the DESIGN.md theme; rising fidelity re-introduces the real accent. Use when the user says 'wireframe', 'mockup', 'prototype', 'low-fidelity', 'lo-fi screen', 'UX layout', 'sketch the UI', or wants to plan a screen before visual design. Trigger with 'wireframe', 'mockup', 'prototype', 'lo-fi', 'low-fidelity', 'clickable prototype', 'app chrome', 'device frame', 'fidelity ramp'."
license: MIT
compatibility: "Browser (CSS + plain anchors; the optional fidelity engine is vanilla JS). Python 3.12+ renderer ships amvcp-wireframe.js + amvcp-wireframe.css + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Wireframe

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

Loads on requests to wireframe, mock up, prototype, or sketch a UI at low fidelity. Renders a **navigable grayscale wireframe** through four cohesive layers — all dependency-free CSS + plain HTML, with one small vanilla-JS module for the fidelity engine.

1. **Semantic kit** — 19 fidelity-locked classes (`wf-card`, `wf-button`, `wf-nav`, `wf-image`…), each a labelled grey placeholder block.
2. **Anchor navigation** — N named screens in one file; plain `<a href="#screen-id">` jumps between them. Zero JS.
3. **Layout archetypes** — four ready page skeletons: desktop app chrome, web page, mobile screen, modal.
4. **Device frames** — pure-CSS iOS / Android / MacBook / browser hardware bezels.
5. **Fidelity ramp** — the same screen at four fidelities side-by-side, or one screen plus a slider.

**The differentiator is fidelity-lock.** A wireframe physically cannot leak brand color: at fidelity `wireframe` the engine desaturates every `--vc-color-*` token to pure grayscale (chroma 0, lightness preserved). As the fidelity attribute rises (`wireframe → low → mid → hi`) the real accent is progressively re-introduced. One DESIGN.md theme, one fidelity dial, four rendered fidelities.

## When to choose this category (decision matrix)

The skill covers **fidelity-locked greyscale UI mockups**. If you want full-color visuals from the start, this is the wrong skill — see `amvcp-icon-svg` (icons), `amvcp-charts-and-dashboards` (charts), or `amvcp-diagram` (flowcharts).

| You want… | Use this skill at fidelity… | Reference |
|---|---|---|
| "Sketch the layout before we commit to colors" | `wireframe` | [`wireframe-kit.md`](references/wireframe-kit.md) |
| "Lo-fi prototype for stakeholder review" | `wireframe` or `low` | [`fidelity-decision-guide.md`](references/fidelity-decision-guide.md) |
| "Show where the primary CTA goes, color-free elsewhere" | `low` | [`fidelity-ramp.md`](references/fidelity-ramp.md) |
| "Real design but not pixel-perfect" | `mid` | [`fidelity-decision-guide.md`](references/fidelity-decision-guide.md) |
| "Production-ready for engineering handoff" | `hi` | [`fidelity-decision-guide.md`](references/fidelity-decision-guide.md) |
| "Show the same screen at all 4 fidelities side-by-side" | ramp | [`fidelity-ramp.md`](references/fidelity-ramp.md) |
| "Let the reviewer drag through fidelity stages" | slider | [`fidelity-ramp.md`](references/fidelity-ramp.md) |
| "Mobile app screen" | any | [`mobile-screens.md`](references/mobile-screens.md) |
| "Dashboard / admin / SaaS" | any | [`dashboard-screens.md`](references/dashboard-screens.md) |
| "Marketing landing page" | any | [`landing-page-patterns.md`](references/landing-page-patterns.md) |
| "E-commerce flow" | any | [`ecommerce-screens.md`](references/ecommerce-screens.md) |
| "Auth / signup / onboarding" | any | [`auth-and-onboarding.md`](references/auth-and-onboarding.md) |
| "Settings / preferences" | any | [`settings-screens.md`](references/settings-screens.md) |
| "Email / messaging / chat" | any | [`email-and-messaging-screens.md`](references/email-and-messaging-screens.md) |
| "CMS / editor / publishing" | any | [`content-and-cms-screens.md`](references/content-and-cms-screens.md) |
| "Form with many fields" | any | [`form-patterns.md`](references/form-patterns.md) |
| "Sortable data table" | any | [`data-tables-and-lists.md`](references/data-tables-and-lists.md) |
| "Modal / dialog / drawer / toast" | any | [`modal-and-overlay-patterns.md`](references/modal-and-overlay-patterns.md) |
| "Navigation: nav bar, sidebar, tabs, breadcrumb" | any | [`navigation-patterns.md`](references/navigation-patterns.md) |
| "Loading / error / empty / success states" | any | [`state-and-feedback-patterns.md`](references/state-and-feedback-patterns.md) |
| "Multi-step wizard / onboarding flow" | any | [`onboarding-flows.md`](references/onboarding-flows.md) |
| "Clickable prototype with multiple screens" | any | [`clickable-prototype.md`](references/clickable-prototype.md) |
| "Frame on iPhone / Android / MacBook / browser" | any | [`device-frames.md`](references/device-frames.md) |
| "Translate a written spec to a wireframe" | any | [`wireframe-from-spec.md`](references/wireframe-from-spec.md) |

## Prerequisites

- The DESIGN.md engine (`amvcp-designmd.js`) present — supplies the `--vc-color-*` tokens the desaturation engine reads. Without it the wireframe still renders (canonical fallback hexes), but the grayscale is fixed rather than theme-derived.
- `amvcp-wireframe.css` + `amvcp-wireframe.js` ship beside the output HTML.
- A static wireframe at a fixed fidelity with no slider needs **zero JS** — layers 1, 2, 3 are pure CSS + plain anchors.
- Chromium browser (the optional fidelity slider needs `<input type="range">` support — degrades to the `wireframe`-fidelity screen with JS off).

## Instructions

1. **Pick archetype(s)** — `wf-archetype--app` / `--web` / `--mobile` / `--modal` (see [`layout-archetypes.md`](references/layout-archetypes.md)).
2. **Build each screen** — a `<section class="wf-screen" id="screen-x" data-ve-id="…">`, filled with kit classes ([`wireframe-kit.md`](references/wireframe-kit.md)).
3. **Wire navigation** — `<a href="#screen-id">` between screens; set `data-wf-nav="scroll"` (default, stacked) or `"paged"` (one screen at a time, pure CSS `:target`) — see [`multi-screen-navigation.md`](references/multi-screen-navigation.md).
4. **Set fidelity** — `data-wf-fidelity` on the `.wf-root` (`wireframe` default). For a comparison, use a `.wf-ramp` (four stages) or the `.wf-fidelity-slider` ([`fidelity-ramp.md`](references/fidelity-ramp.md)).
5. **Optionally frame it** — wrap a `wf-archetype--mobile` in a `wf-frame--ios` / `--android`, or a page in `wf-frame--macbook` / `--browser` ([`device-frames.md`](references/device-frames.md)).
6. **Link** `amvcp-wireframe.css` + `amvcp-wireframe.js` + the runtime + the DESIGN.md engine. Never hand-author the desaturation — the JS owns it.

## The `--vc-*` token contract

The skill is a pure **consumer** — it emits no `--vc-*` of its own and never extends the engine. Every wireframe color reads `var(--vc-color-*, <fallback>)`; every size is a `--wf-*` custom property `calc()`'d off `--vc-space-*`. At fidelity `wireframe` the JS publishes a desaturated `--vc-color-*` set onto the wireframe root, so every kit block — and any nested component — paints grey. See [`wireframe-kit.md`](references/wireframe-kit.md) for the full token table and [`fidelity-ramp.md`](references/fidelity-ramp.md) for the desaturation algorithm.

## Output

Self-contained HTML: one file, no external assets, no iframes. The CSS is a colocated `<link>`; the fidelity engine is the colocated `amvcp-wireframe.js`. Every `.wf-screen` and kit block carries `data-ve-id` + `data-ve-type="wireframe-screen"|"wireframe-block"`, so a click sends the selection to the agent like any other selectable atom. Both light and dark themes are correct by construction — the grayscale ramp is theme-relative (lightness preserved, chroma zeroed). See [`theme-and-dark-mode.md`](references/theme-and-dark-mode.md) and [`selection-and-comments.md`](references/selection-and-comments.md).

## Verifying your output

**Visual verification** is mandatory — every wireframe change needs a screenshot in BOTH themes and AT LEAST 4 fidelities. See [`visual-verification.md`](references/visual-verification.md) for the workflow, and the sibling `skills/amvcp-self-debug-rules/SKILL.md` for the deeper screenshot-and-diff procedure.

## Error Handling

- **Invalid `data-wf-fidelity`** → `amvcpWireframe.init()` throws naming the bad value — fail-fast, no silent coercion. Use exactly `wireframe` / `low` / `mid` / `hi`. See [`troubleshooting-and-debugging.md`](references/troubleshooting-and-debugging.md).
- **Wireframe leaks brand color** → a hardcoded hex was used instead of a `--vc-color-*` token; the desaturation only rewrites `--vc-color-*` custom properties, so a raw hex bypasses the fidelity-lock. Always use tokens.
- **Inner scrollbar on a device frame** → `overflow` was set on `.wf-frame__content`; it must stay `visible` (a long screen extends the page, never an inner viewport).
- **Nested `.wf-root` inside another `.wf-root`** → undefined behaviour, forbidden — one wireframe root per subtree.
- **Slider does nothing with JS off** → expected; it degrades to the `wireframe`-fidelity screen (the safe default).

## Examples

**Input:** "wireframe the checkout flow."

**Output:** three `.wf-screen`s (cart / payment / confirm) in one file under a `wf-archetype--web`, `data-wf-nav="paged"`, `data-wf-fidelity="wireframe"`. `<a href="#screen-payment">` advances; pure CSS `:target` shows one screen at a time. See [`ecommerce-screens.md`](references/ecommerce-screens.md) and [`clickable-prototype.md`](references/clickable-prototype.md).

**Input:** "mobile onboarding mockup, lo-fi."

**Output:** a `wf-archetype--mobile` screen wrapped in `wf-frame--ios`, `data-wf-fidelity="wireframe"` — a grayscale app running on an iPhone bezel. See [`mobile-screens.md`](references/mobile-screens.md) and [`onboarding-flows.md`](references/onboarding-flows.md).

**Input:** "show this dashboard at increasing fidelity."

**Output:** a `.wf-ramp` with the same screen duplicated four times at `wireframe` / `low` / `mid` / `hi` — or one screen plus a `.wf-fidelity-slider`. See [`fidelity-ramp.md`](references/fidelity-ramp.md).

## Resources

The `references/` folder contains 32 deep-dive files. Browse by category:

### Foundations
- [`wireframe-kit.md`](references/wireframe-kit.md) — the 19-class table, per-class HTML contract, grayscale rule, fidelity-lock mechanics, token table.
- [`layout-archetypes.md`](references/layout-archetypes.md) — the 4 copy-paste archetype skeletons (app / web / mobile / modal).
- [`device-frames.md`](references/device-frames.md) — the 4 bezels, geometry table, documented fixed-dark-bezel exception.
- [`fidelity-ramp.md`](references/fidelity-ramp.md) — the 4-stage fidelity model, desaturation `k`-factor table, ramp + slider authoring.
- [`fidelity-decision-guide.md`](references/fidelity-decision-guide.md) — audience × phase → fidelity decision matrix.
- [`multi-screen-navigation.md`](references/multi-screen-navigation.md) — anchor links, scroll vs paged mode, no-fragment fallback.
- [`spacing-and-typography.md`](references/spacing-and-typography.md) — `--vc-space-*` and `--vc-text-*` scales, vertical rhythm, font stacks.
- [`responsive-and-breakpoints.md`](references/responsive-and-breakpoints.md) — breakpoints, grid patterns, touch targets, fluid type.

### Screen patterns by domain
- [`mobile-screens.md`](references/mobile-screens.md) — feed / detail / search / profile / compose / empty.
- [`dashboard-screens.md`](references/dashboard-screens.md) — KPI overview / data table / single record / settings / wizard / kanban.
- [`landing-page-patterns.md`](references/landing-page-patterns.md) — hero / features / social proof / testimonials / pricing / FAQ / CTA / footer.
- [`ecommerce-screens.md`](references/ecommerce-screens.md) — catalog / PDP / cart / checkout / confirmation / orders.
- [`auth-and-onboarding.md`](references/auth-and-onboarding.md) — login / signup / forgot / reset / verify / welcome.
- [`settings-screens.md`](references/settings-screens.md) — settings hub / single section / preferences / security / billing / notifications.
- [`email-and-messaging-screens.md`](references/email-and-messaging-screens.md) — inbox / conversation / compose / threads / picker / digest.
- [`content-and-cms-screens.md`](references/content-and-cms-screens.md) — article / editor / media library / list / preview / publish.
- [`onboarding-flows.md`](references/onboarding-flows.md) — wizard / tour / empty / progressive disclosure / skeletons / success.

### Cross-cutting patterns
- [`form-patterns.md`](references/form-patterns.md) — single / two-column / field groups / inputs / errors / wizards / login pair / search.
- [`data-tables-and-lists.md`](references/data-tables-and-lists.md) — sortable / compact / expandable / editable / drag / virtualized / selection.
- [`navigation-patterns.md`](references/navigation-patterns.md) — top nav / side nav / bottom tabs / breadcrumb / section TOC / command palette.
- [`modal-and-overlay-patterns.md`](references/modal-and-overlay-patterns.md) — confirm / form / drawer / popover / toast / tooltip.
- [`state-and-feedback-patterns.md`](references/state-and-feedback-patterns.md) — loading / spinner / error / offline / empty / success / progress.
- [`copy-conventions.md`](references/copy-conventions.md) — no-lorem rule, realistic placeholders, button verbs, microcopy budgets.

### Clickable prototypes + review workflow
- [`clickable-prototype.md`](references/clickable-prototype.md) — hub-and-spoke / linear / branching / modal-over / wizard / stateful mocks.
- [`rationale-and-design-notes.md`](references/rationale-and-design-notes.md) — prototype + rationale + open-questions three-panel shape, decision cards.
- [`wireframe-from-spec.md`](references/wireframe-from-spec.md) — translate written spec to wireframe in 5 steps.

### Theme, accessibility, selection
- [`theme-and-dark-mode.md`](references/theme-and-dark-mode.md) — two-theme guarantee, lightness preservation, theme-flip event.
- [`accessibility-and-keyboard.md`](references/accessibility-and-keyboard.md) — semantic HTML, focus order, ARIA, keyboard map per pattern.
- [`selection-and-comments.md`](references/selection-and-comments.md) — selection contract, auto-stamp, 4 visual states, group-handle pattern.

### Production hygiene
- [`troubleshooting-and-debugging.md`](references/troubleshooting-and-debugging.md) — common bugs by symptom + fixes + sanity checklist.
- [`visual-verification.md`](references/visual-verification.md) — 8-image matrix, screenshot test workflow, visual diff tooling.
- [`integration-with-other-skills.md`](references/integration-with-other-skills.md) — DESIGN.md engine, runtime, layout, charts, diagrams, slides.

## Modes

This skill supports `data-ve-mode="readonly"` (design walkthrough — just for visual review) and `data-ve-mode="choice"` / `single` / `multi` / `max-N` (each wireframe atom carries a 3-state pill so the user can approve/deny each block of the design). The default (missing mode) is `readonly` (R20/R23 of `amvcp-self-debug-rules`).

## Composability

Composes with every other amvcp-* skill on the same page (R22). Common composition: wireframe + form-inputs + tables, where the wireframe shows the layout, the form-inputs configure design choices, and the tables enumerate the design decisions. The only exclusive skill is the overlay-runtime (R24).
