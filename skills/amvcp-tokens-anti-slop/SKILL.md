---
name: amvcp-tokens-anti-slop
description: "Consolidated anti-AI-slop gate for visual-communicator tokens — banned colors (AI purple/violet, pure black/white), banned primary fonts (Inter, Roboto, Open Sans), banned patterns (gradient backgrounds, double drop-shadows), `lintTokenSet` / `lintHtml` / `lintLiveDocument` APIs with live `data-vc-slop-alert` stamping. Use when auditing a palette, preset, or HTML report. Trigger with 'anti-slop check', 'slop audit', 'banned colors', 'banned fonts', 'lint design tokens'."
license: MIT
metadata:
  author: Emasoft
---

# Anti-Slop Token Gate

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling token skills:** [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md) (router) · [amvcp-tokens-color](../amvcp-tokens-color/SKILL.md) · [amvcp-tokens-scales](../amvcp-tokens-scales/SKILL.md) · [amvcp-tokens-presets](../amvcp-tokens-presets/SKILL.md) · [amvcp-tokens-contact-sheet](../amvcp-tokens-contact-sheet/SKILL.md).

## Overview

The ONE consolidated lint that runs over (a) a generated/authored token set, (b) emitted HTML, and (c) a live DOM tree, flagging banned colors, banned primary fonts, and banned visual patterns. It is the immune system that keeps the plugin's emitted artifacts from looking AI-generated. A non-`ok` result is a hard error — fix the source, never weaken the gate. The banned-color set is split into a near-match family (the AI purple/violet/indigo cluster) and an exact-match family (pure `#000000` / `#ffffff`). The banned font set is enforced only as the FIRST family of a font stack — these fonts are fine as a fallback. Banned visual patterns include CSS gradient backgrounds and double drop-shadows.

## Prerequisites

- `amvcp-tokens.js` colocated with the HTML — defines `amvcpTokens.lintTokenSet` / `lintHtml` / `lintLiveDocument`, `amvcpTokens.BANNED_COLORS`, `amvcpTokens.BANNED_FONTS`, `amvcpTokens.BANNED_PATTERNS`.
- `amvcp-tokens.css` (for the `[data-vc-slop-alert]` outline rule).
- For the live variant, a browser DOM root.

## Instructions

1. **Lint a token set / DESIGN.md** — `amvcpTokens.lintTokenSet(designmdOrTokenMap)`. Accepts a parsed designmd, a flat `{ '--vc-*': value }` map, or a raw DESIGN.md text string. For a parsed designmd it resolves BOTH themes and lints them merged, so a slop color hiding only in dark theme is still caught. See [anti-slop-rules](./references/anti-slop-rules.md#api).
2. **Lint emitted HTML** — `amvcpTokens.lintHtml(htmlString)` BEFORE shipping any artifact. Static scan of style attributes, `<style>` blocks, and font-stack declarations.
3. **Live in-browser audit** — `amvcpTokens.lintLiveDocument(rootEl)` walks `rootEl.querySelectorAll('*')`, reads `getComputedStyle`, and stamps `data-vc-slop-alert="<reason>"` on each offender. The CSS rule adds a dashed outline so a reviewer sees offenders without the page restyling. See [lint-live-document](./references/lint-live-document.md).
4. **Treat a non-`ok` result as a hard error** — fix the source. A preset / token set / HTML page that fails the gate is a contradiction with the plugin's promise. Never weaken the gate to make the test pass.
5. **Always end** — `lintHtml` runs on every artifact before delivery. The gate is the last step of every other recipe in the token family.

## Output

- A `{ ok, violations: [{ kind, token, value, reason }] }` shape for the static APIs.
- For `lintLiveDocument`, the same shape PLUS `data-vc-slop-alert="<reason>"` attributes stamped on offender elements (visible dashed outline via the `amvcp-tokens.css` rule).

## Error Handling

| Symptom | Fix |
|---|---|
| `lintTokenSet` flags a near-match color | Shift the seed hex away from the AI purple/violet/indigo cluster. Validate with OKLCh hue/chroma. |
| `lintTokenSet` flags pure `#000000` / `#ffffff` | Replace with an off-black / off-white. Pure black/white never appear in well-designed UI. |
| `lintTokenSet` flags Inter / Roboto / Open Sans / Lato / Nunito | Move that font to position 2+ of the stack. Pick a different first family. These are fine as fallbacks. |
| `lintHtml` flags a gradient background | Replace with a flat token color. Gradients on backgrounds are an AI-slop signal. |
| `lintHtml` flags a double drop-shadow | Use the MD3 elevation token (a single offset shadow). |
| `lintLiveDocument` stamps an element but the source is clean | The hex came in via a third-party CSS or computed style merge — track it in DevTools and fix at source. |

## Examples

```
Input:  "Check this report for AI-slop colors."
Output: step 2 → amvcpTokens.lintHtml(html)
        Returns { ok: false, violations: [...] }; fix raw hexes /
        gradient backgrounds at source, re-run until ok: true.

Input:  "Audit my new preset."
Output: step 1 → amvcpTokens.lintTokenSet(presetText)
        If ok === false, shift the offending color/font in the
        preset's frontmatter, re-run, ship only when ok: true.

Input:  "Show me which elements are slop on this live page."
Output: step 3 → amvcpTokens.lintLiveDocument(document.body)
        Stamps data-vc-slop-alert="<reason>" on offender elements.
        Open DevTools, locate alerts, fix source CSS / HTML.
```

## Modes

This skill supports `data-ve-mode="readonly"` only. Anti-slop violations are stamped as `data-vc-slop-alert` attributes for the in-browser variant; they are diagnostics, NOT decision atoms. The per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply to slop alerts.

## Composability

This skill is the FINAL step of every other amvcp-tokens-* recipe (color generation, preset application, contact-sheet emission). It composes with any other amvcp-* skill that emits HTML or CSS — `lintHtml` runs on the final artifact before delivery. The gate itself emits no markup.

## Resources

- [anti-slop-rules.md](./references/anti-slop-rules.md) — the banned colors / fonts / patterns reference, the `lintTokenSet` / `lintHtml` API surface, and the fail-fast/report-only output discipline.
  > API · Banned colors · Banned primary fonts · Banned patterns · Output discipline — fail-fast, report-only · Where it runs
- [lint-live-document.md](./references/lint-live-document.md) — the in-browser DOM-walking variant with `data-vc-slop-alert` stamping.
  > What it does · Why a live walk vs. linting source · When to run · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
