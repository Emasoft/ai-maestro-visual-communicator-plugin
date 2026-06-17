# Visible error placeholder — fail-soft at the page boundary

## Table of Contents

- [What it renders](#what-it-renders)
- [When it appears](#when-it-appears)
- [What triggers the placeholder](#what-triggers-the-placeholder)
- [Why the placeholder uses the danger token](#why-the-placeholder-uses-the-danger-token)
- [Font choice — monospace](#font-choice--monospace)
- [What the placeholder does NOT do](#what-the-placeholder-does-not-do)
- [How to recover from a placeholder](#how-to-recover-from-a-placeholder)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini](#selection--comment--decision-mini)
- [Visual verification](#visual-verification)
- [What if the placeholder ITSELF throws?](#what-if-the-placeholder-itself-throws)

The icon-svg module is FAIL-FAST at the API level (`buildSceneSvg()`
throws on invalid input) AND FAIL-SOFT at the page level (`init()`
replaces a bad fenced block with a visible red error SVG instead of
silently dropping it). The error placeholder is a DASHED RED rounded
rect carrying the exact throw message as readable text.

## What it renders

```html
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1000 1000"
     class="isvg-scene"
     role="img"
     aria-label="icon-svg compile error">
  <rect x="20" y="20" width="960" height="960"
        rx="16"
        fill="none"
        stroke="var(--vc-color-danger, #a84a32)"
        stroke-width="2"
        stroke-dasharray="16 12"/>
  <text x="500" y="500"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="var(--vc-font-mono, ui-monospace, monospace)"
        font-size="34"
        fill="var(--vc-color-danger, #a84a32)">
    icon-svg: &lt;exact throw message here&gt;
  </text>
</svg>
```

The placeholder uses the same SVG structure as a normal scene SVG —
so it benefits from the same `.isvg-scene` sizing CSS (`inline-size:
100%; max-inline-size: 480px; margin-inline: auto`). The reader sees
a clearly-marked red error in the same slot the valid SVG would have
occupied.

## When it appears

A compile error on ONE block is caught at the per-block boundary
inside `compileFencedBlocks()`:

```js
for (i = 0; i < blocks.length; i++) {
  var block = blocks[i];
  var rendered;
  try {
    rendered = buildSceneSvg(block.text);   // FAIL-FAST throw here
  } catch (e) {
    rendered = errorPlaceholder(e);          // catch + replace
  }
  replaceBlock(block.node, rendered);
}
```

This is the DELIBERATE BOUNDARY between fail-fast (the API
`buildSceneSvg` always throws on bad input) and fail-soft (the page
loader catches and shows the throw). One bad block must NEVER abort
init() and leave the rest of the page unprocessed.

## What triggers the placeholder

Any throw from `buildSceneSvg`:

- Malformed JSON (`JSON.parse` failed).
- viewBox not `[0, 0, 1000, 1000]`.
- Missing or non-finite `x` / `y` / `w` / `h`.
- Non-positive `w` / `h` after snap.
- Unknown `type` / `kind` / `variant`.
- Duplicate `id`.
- C1 / C4 / C5 / C6 / C7 lint violation in the COMPILED output (the
  compiler self-lints before emitting; a violation throws).

The placeholder's text shows the EXACT throw message — the author
sees `"unknown variant 'critical'. Valid: default, success, ..."`
inline in the page, not just "error".

## Why the placeholder uses the danger token

Per DESIGN.md's semantic-role contract, `--vc-color-danger` is the
universal "error" color. The placeholder is themed: in light theme
it's the light's danger color (typically a warm red), in dark theme
it's the dark's danger color (typically a softer red). Stays
visible in both themes.

The dashed stroke (`stroke-dasharray="16 12"`) reinforces "this is
abnormal" — the same dashed style `external` nodes use for "out of
bounds".

## Font choice — monospace

The error message font is `var(--vc-font-mono)` — the same font used
for code. This signals "this is a literal error message, not designed
copy" and matches the convention in code editors / build logs /
browser devtools.

## What the placeholder does NOT do

- Does NOT log to console (the dev-lint pass handles that for
  authored SVG; the error placeholder is the visible reader-side
  signal).
- Does NOT throw further (the catch + replace IS the recovery).
- Does NOT retry compilation.
- Does NOT degrade silently — that would HIDE the error from the
  reader.
- Does NOT modify the original fenced block (the block is REPLACED
  in the DOM with a `<figure>` containing the placeholder; the
  original `<script>` is gone).

## How to recover from a placeholder

The author sees the inline error message. The fix:

1. Read the message — it names the rule and the violating attribute
   ("unknown variant 'critical'", "C6: raw color '#fff' on fill",
   etc.).
2. Edit the scene-graph JSON to fix the violation.
3. Reload the page — `init()` re-runs and compiles the now-valid
   scene.

No tool dispatch needed; the error message is self-describing.

## DESIGN.md tokens consumed

- `--vc-color-danger` — stroke + text fill
- `--vc-font-mono` — text font family

## Selection / comment / decision-mini

The placeholder SVG carries `role="img"` and an `aria-label`, but
does NOT have `data-ve-id` on the outer SVG — it is NOT a selection
atom (it's an error indicator, not a normal scene). The runtime's
selection scaffold therefore skips it.

## Visual verification

Force an error by authoring a scene with `viewBox: [0,0,100,100]`
(wrong viewBox). Confirm:

- The page renders normally (other scenes compile).
- The bad block's slot shows a red dashed rounded rect with the
  message "icon-svg: viewBox must be exactly [0,0,1000,1000] ...".
- In both light AND dark, the placeholder is readable.
- The error message font is monospace.

A common authoring mistake: a typo in the JSON drops the figure
silently. With the error placeholder, that becomes "the figure
shows a red error explaining the typo" — much faster diagnosis.

## What if the placeholder ITSELF throws?

It can't — the placeholder uses ONLY explicit `var(--vc-color-
danger, #a84a32)` and `var(--vc-font-mono, …)` tokens with baked
fallbacks. There's no parsing, no math, no I/O. The placeholder is
DESIGNED to render even when EVERYTHING else has gone wrong.
