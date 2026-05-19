---
name: amvcp-wf-fidelity
description: "Wireframe fidelity ramp — wireframe→low→mid→hi grayscale desaturation engine, the 19-class fidelity-locked kit (grayscale + radius-zero contract), theme-relative lightness preservation, and the audience×phase decision matrix. Use when picking a fidelity stage, building a ramp/slider, or authoring kit blocks. Trigger with 'fidelity', 'fidelity ramp', 'grayscale wireframe', 'wireframe kit', 'lo-fi', 'hi-fi', 'desaturate'."
license: MIT
compatibility: "Browser (CSS + vanilla JS desaturation engine in amvcp-wireframe.js). Python 3.12+ renderer ships amvcp-wireframe.js + amvcp-wireframe.css + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Wireframe Fidelity

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Router:** [`skills/amvcp-wireframe/SKILL.md`](../amvcp-wireframe/SKILL.md). **Sibling wireframe skills:** [amvcp-wf-devices](../amvcp-wf-devices/SKILL.md) · [amvcp-wf-screens](../amvcp-wf-screens/SKILL.md) · [amvcp-wf-archetypes](../amvcp-wf-archetypes/SKILL.md).

## Overview

The fidelity engine. Four ordinal stages — `wireframe` / `low` / `mid` / `hi` — drive an HSL-based desaturation that scales chroma toward zero while preserving lightness, so a light DESIGN.md theme stays light-grey at fidelity=wireframe and a dark theme stays dark-grey. The 19-class kit (`wf-card`, `wf-button`, `wf-input`, `wf-nav`, …) supplies labelled grey placeholder blocks; every block reads `var(--vc-color-*)` so the desaturated set published on `.wf-root` paints everything correctly. At fidelity=wireframe the engine also forces `border-radius: 0` on every kit block (radius-zero contract). A fidelity RAMP renders the same screen at all four stages side-by-side; a fidelity SLIDER lets the reviewer sweep through them.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded — supplies the `--vc-color-*` tokens the desaturation engine consumes.
- `scripts/amvcp-wireframe.js` + `scripts/amvcp-wireframe.css` beside the HTML.
- A static wireframe at a fixed fidelity needs ZERO JS — the kit + grayscale CSS are pure CSS.
- The slider requires `<input type="range">` (degrades to fidelity=wireframe with JS off).

## Instructions

1. **Pick a fidelity stage** via the audience × phase matrix in [`fidelity-decision-guide.md`](references/fidelity-decision-guide.md).
2. **Set `data-wf-fidelity`** on the `.wf-root` to one of `wireframe` / `low` / `mid` / `hi`. Invalid values throw (fail-fast).
3. **Author kit blocks** per [`wireframe-kit.md`](references/wireframe-kit.md) — never hardcode a hex; every color reads `var(--vc-color-*)` so desaturation works.
  > The 19 classes — at a glance · Authoring a `.wf-root` · Per-class HTML contract · The `--vc-*` token contract — what the wireframe consumes · The `--wf-*` geometry tokens · The grayscale rule — why no class hardcodes a hex · The fidelity-lock attribute mechanics · Avatar exception — why `.wf-avatar` stays round at every fidelity · Selection contract — every block is a `data-ve-id` atom
4. **For a ramp** — wrap four `.wf-root` copies in a `.wf-ramp`, one per stage. See [`fidelity-ramp.md`](references/fidelity-ramp.md).
5. **For a slider** — add a `.wf-fidelity-slider` that drives `applyFidelity(rootEl, fidelity)` on its target.
6. **Verify theme correctness** — flip the theme; chroma must stay zero at fidelity=wireframe in BOTH themes. See [`theme-and-dark-mode.md`](references/theme-and-dark-mode.md).
7. **Write realistic placeholder copy** — never lorem ipsum. See [`copy-conventions.md`](references/copy-conventions.md).
8. **Respect the spacing/type scale** — every gap is a `--vc-space-*`, every text size a `--vc-text-*`. See [`spacing-and-typography.md`](references/spacing-and-typography.md).
  > The `--vc-space-*` scale · The `--vc-text-*` scale · Spacing application rules · Vertical rhythm — the consistent gap pattern · Heading hierarchy · Text utility classes (wf-text + custom) · Font family contract — serif / sans / mono · Line length (measure) — 65-75 characters · Letter spacing for tracked uppercase · Numerals — tabular vs proportional · Common spacing + type bugs

Checklist:

- [ ] `data-wf-fidelity` set to a valid stage
- [ ] Every color reads `var(--vc-color-*)` (no raw hex)
- [ ] Both themes verified at fidelity=wireframe
- [ ] No lorem ipsum in placeholders

## Output

A fidelity-locked wireframe (single stage or ramp/slider) that paints grey at `wireframe`, faint chroma at `low`, real accent at `mid`, full DESIGN.md at `hi`. Both light and dark themes are correct by construction. Every block is selectable as a `data-ve-id` atom.

## Error Handling

| Symptom | Fix |
|---|---|
| Brand color leaks at fidelity=wireframe | A raw hex bypassed the engine — replace with `var(--vc-color-*)`. |
| Slider does nothing with JS off | Expected — degrades to fidelity=wireframe. |
| `amvcpWireframe.init()` throws | Invalid `data-wf-fidelity` — use exactly `wireframe`/`low`/`mid`/`hi`. |
| Radius leaks at fidelity=wireframe | A kit class set `border-radius` outside the `--wf-radius` token — fix the class. |
| Light theme paints dark grey | `desaturateToken` lightness was overridden — re-check the per-stage `k` factors. |

## Examples

**Input:** "ramp this screen wireframe → hi."

**Output:** a `.wf-ramp` containing the same `.wf-root` four times with `data-wf-fidelity` set to `wireframe`, `low`, `mid`, `hi`. The engine desaturates each `.wf-root` in place.

**Input:** "lo-fi mockup, dark theme."

**Output:** `<div class="wf-root" data-wf-fidelity="wireframe" data-vc-theme="dark">` — kit blocks paint dark-grey on dark canvas.

## Visual verification

Every fidelity change MUST be screenshotted in BOTH themes at ALL 4 stages — the 8-image matrix per `skills/amvcp-self-debug-rules/SKILL.md` (R41: dev-browser visible mode, never headless).

## Modes

Supports `data-ve-mode="readonly"` (default — fidelity review) and `data-ve-mode="choice"`/`single`/`multi`/`max-N` — every kit block carries the 3-state decision pill so reviewers can approve/deny per block (R20/R23).

## Composability

Composes with every sibling wireframe skill (devices, screens, archetypes) and every other amvcp-* skill on the same page (R22). The only exclusive skill is the overlay-runtime (R24).

## Resources

- [fidelity-ramp.md](references/fidelity-ramp.md) — 4-stage desaturation, `k`-factor table, ramp + slider authoring.
- [fidelity-decision-guide.md](references/fidelity-decision-guide.md) — audience × phase → fidelity matrix.
- [wireframe-kit.md](references/wireframe-kit.md) — 19 fidelity-locked classes, per-class HTML contract, token table.
  > The 19 classes — at a glance · Authoring a `.wf-root` · Per-class HTML contract · The `--vc-*` token contract — what the wireframe consumes · The `--wf-*` geometry tokens · The grayscale rule — why no class hardcodes a hex · The fidelity-lock attribute mechanics · Avatar exception — why `.wf-avatar` stays round at every fidelity · Selection contract — every block is a `data-ve-id` atom
- [theme-and-dark-mode.md](references/theme-and-dark-mode.md) — two-theme guarantee, lightness preservation, theme-flip event.
- [spacing-and-typography.md](references/spacing-and-typography.md) — `--vc-space-*` + `--vc-text-*` scales, vertical rhythm.
  > The `--vc-space-*` scale · The `--vc-text-*` scale · Spacing application rules · Vertical rhythm — the consistent gap pattern · Heading hierarchy · Text utility classes (wf-text + custom) · Font family contract — serif / sans / mono · Line length (measure) — 65-75 characters · Letter spacing for tracked uppercase · Numerals — tabular vs proportional · Common spacing + type bugs
- [copy-conventions.md](references/copy-conventions.md) — no-lorem rule, realistic placeholders, microcopy budgets.
