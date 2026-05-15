---
name: amvcp-typography
description: "Typography foundation for visual-communicator pages — a fluid clamp() type scale, a semantic element-to-token hierarchy, a variable-font (wght/opsz/feature-settings) layer with a fail-soft static fallback, and five banned-font-free font pairings with offline-safe loading. Themes purely off the DESIGN.md engine's --vc-* tokens so a theme swap restyles every type size, weight and font live. Use when scaffolding or restyling the type system of an amvcp page, deck, report or dashboard. Trigger with 'set up typography', 'fluid type scale', 'pick a font pairing', 'type specimen page', 'fix the heading sizes'."
license: MIT
compatibility: "Any modern browser. Requires the DESIGN.md engine (scripts/amvcp-designmd.js). No npm runtime dependency."
metadata:
  author: Emasoft
---

# Typography

## Overview

The typography skill is the **foundation recipe** (Tier 1) that gives a
visual-communicator page a coherent type system: a fluid `clamp()` type
scale, a semantic role-to-token hierarchy, a variable-font axis layer,
and curated font pairings. It is **authoring guidance + a CSS layer + a
small JS helper** — not a per-element renderer.

It consumes the DESIGN.md engine's `--vc-*` typography tokens
(`--vc-text-<i>`, `--vc-font-*`, `--vc-weight-*`, `--vc-line-height`)
and maps them onto semantic element selectors. Because the CSS layer
sets only size / weight / font / leading / tracking — never `color` —
it is automatically correct in **both light and dark** themes, and a
DESIGN.md hot-swap restyles every type size live with zero markup change.

`report-doc`, `slide`, `table` and `chart` build on this skill's public
API — the 11-row semantic hierarchy contract (see
[semantic-hierarchy.md](./references/semantic-hierarchy.md)).

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded on the page —
  it emits the `--vc-*` tokens this skill themes off.
- A modern browser. No npm dependency. Google Fonts is an optional
  `<link>`; every pairing also ships a system fallback so a page works
  offline.

## Instructions

1. **Pick a scale system.** Default **Perfect Fourth** (ratio 1.333) —
   strong UI/dashboard hierarchy. Alternatives: Minor Third (1.200),
   Major Third (1.250), Golden (1.618). See
   [type-scale-engine.md](./references/type-scale-engine.md).
2. **Pick a font pairing** from the five banned-font-free presets, or
   the offline **System** pairing. See
   [font-loading-pairings.md](./references/font-loading-pairings.md).
   NEVER recommend Inter / Roboto / Open Sans / Lato / Nunito as a
   *primary* font (the `design-tokens` DT-09 anti-slop gate).
3. **Embed the DESIGN.md `typography` block.** Put the chosen fonts and
   the generated `scale` array (the reference doc gives pre-computed
   arrays for base 16px) into the page's
   `<script type="text/design-md">` frontmatter. Optionally add
   `scale-hero` + the four semantic `weight-*` keys + `font-features` —
   all optional, all fall back cleanly when the engine does not emit
   them (see [variable-font-tokens.md](./references/variable-font-tokens.md)).
4. **Embed `amvcp-typography.css` inline** in the page `<head>` (a
   `<style>` block), exactly as the slide/prose skills emit their CSS
   inline. It is ~6 KB, additive and idempotent.
5. **Write plain semantic HTML.** `<h1>`…`<h6>`, `<p>`, `<small>` are
   correct with **no class** — the CSS layer's element defaults bind
   each to the right token. Use `.vc-type-hero` / `.vc-type-lead` /
   `.vc-type-label` for the three roles HTML has no native element for.
6. **For live scale switching** add `data-ve-type-scale="<system>"` on
   `<html>` and load `skills/amvcp-typography/scripts/amvcp-typography.js`.
   Its calculator recomputes the px anchor array and feeds it through
   the engine round-trip — it never sets `--vc-text-<i>` directly (one
   source of truth). For a static pre-generated scale **no JS is needed**.

## Output

A DESIGN.md-themed page whose every type size, weight and font is
token-driven. The skill's concrete artifact is the **type-specimen
page** ([type-scale-engine.md](./references/type-scale-engine.md) §
specimen) — a self-contained HTML page visualising the whole scale,
which doubles as the dev-browser test fixture
(`tests/fixtures/typography-specimen.html`).

## Error Handling

| Symptom | Fix |
|---|---|
| `unknown type-scale system "…"` from the JS calculator | `data-ve-type-scale` must be one of the 4 named systems — the calculator fails fast, it never guesses a ratio. |
| A heading uses a raw `px` size | Wrong — write a bare `<h1>`…`<h6>` or a `.vc-type-*` class; never a literal size. |
| `--vc-text-*` resolves empty | The DESIGN.md engine is not loaded / its `typography` group is malformed. The CSS layer's `var()` fallbacks keep the page coherent, but fix the engine. |
| Banned font flagged by an audit | Swap to a pairing from this skill's list — all five are banned-font-free. |
| Text appears in the wrong (static) weight on a variable font | Confirm `font-variation-settings` is not being overridden; the JS `supportsVariableFonts()` detect (`data-ve-vfont`) tells you which path is live. |

## Resources

- [type-scale-engine.md](./references/type-scale-engine.md) — fluid
  `clamp()` scale, the four modular-scale systems + pre-computed arrays,
  display-tier optical correction, the type-specimen page.
- [semantic-hierarchy.md](./references/semantic-hierarchy.md) — the
  11-row role-to-token contract (the public API for consumer skills),
  the runtime hard-coded-`font-size` migration map.
- [variable-font-tokens.md](./references/variable-font-tokens.md) — the
  `wght`/`opsz` token system, semantic weights, the static-font
  fallback, `font-feature-settings` stylistic alternates.
- [font-loading-pairings.md](./references/font-loading-pairings.md) —
  the five font pairings, Google Fonts loading discipline, the offline
  System fallback, the CJK cross-reference to `design-tokens` DT-25.

> **Out of scope for the skill build:** migrating the runtime's 25
> hard-coded `font-size` literals is a separate refactor task — this
> skill defines the destination tokens (see semantic-hierarchy.md), it
> does not perform the migration. CJK typography is owned by the
> `design-tokens` skill (DT-25); this skill only cross-references it.
