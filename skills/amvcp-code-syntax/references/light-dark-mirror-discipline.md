# Sub-technique H4 — Light + dark mirror discipline (the verification ritual)

## Table of Contents

- [The rule and the canonical CSS shape](#the-rule-and-the-canonical-css-shape)
- [Per-token defaults — hue family, contrast, diff tints](#per-token-defaults--hue-family-contrast-diff-tints)
- [Verification ritual and screenshot tests](#verification-ritual-and-screenshot-tests)
- [Fail-soft fallback and "single-theme defect" examples](#fail-soft-fallback-and-single-theme-defect-examples)
- [Authoring workflow — adding tokens and the DESIGN.md override](#authoring-workflow--adding-tokens-and-the-designmd-override)
- [Tokens consumed and cross-references](#tokens-consumed-and-cross-references)

Every `--ve-code-*` MUST have both a `:root` (dark theme default) AND
a `:root[data-ve-theme="light"]` mirror declaration. A single-theme
visual is a CORRECTNESS DEFECT, not a polish concern. This reference
codifies the discipline and the verification ritual.

From the project memory rule: *"Always design light + dark themes —
every visual must ship BOTH themes; single-theme = correctness
defect."*

## The rule and the canonical CSS shape

> For every CSS variable the code-highlight skill defines or
> consumes, BOTH the dark default AND the light mirror MUST be
> declared. The fixture verification loop MUST screenshot both themes
> and verify visual correctness in each.

This is a HARD invariant for this skill, the runtime, and every
composition reference.

The standard CSS shape:

```css
:root {
  --ve-code-keyword:     var(--vc-code-keyword,     #c98ec0);
  /* … 11 more --ve-code-* tokens … */
  --ve-code-diff-add-bg: var(--vc-code-diff-add-bg, color-mix(…));
  /* … 3 more diff vars … */
}

:root[data-ve-theme="light"] {
  --ve-code-keyword:     var(--vc-code-keyword,     #9a3e74);
  /* … 11 more --ve-code-* tokens with LIGHT-THEME defaults … */
  --ve-code-diff-add-bg: var(--vc-code-diff-add-bg, color-mix(…lower percent…));
  /* … 3 more diff vars … */
}
```

The two blocks define the SAME variables, with DIFFERENT defaults. The
DESIGN.md engine's `--vc-code-*` overrides BOTH (if present); the
fallback values are the per-theme defaults.

## Per-token defaults — hue family, contrast, diff tints

### Hue-family preservation

When picking the dark-theme + light-theme values for a token, the two
MUST share the same hue family. The light value is the dark value with
LIGHTNESS inverted (or otherwise tuned for readability on the bright
surface).

| Token | Dark default | Light default | Family |
|---|---|---|---|
| `--ve-code-keyword` | `#c98ec0` (purple, light lightness) | `#9a3e74` (purple, dark lightness) | purple |
| `--ve-code-string` | `#9ece9e` (green, light) | `#3f7d4e` (green, dark) | green |
| `--ve-code-number` | `#d8b46a` (warm gold, light) | `#9a6a1f` (warm gold, dark) | warm gold |
| `--ve-code-comment` | `#8d8576` (warm gray) | `#8a8170` (warm gray) | warm gray (similar in both — comment is intentionally subordinate) |
| `--ve-code-type` | `#6ab0cf` (blue, light) | `#2c6f8f` (blue, dark) | blue |
| `--ve-code-function` | `#d8c98a` (warm yellow, light) | `#7a5a14` (warm yellow, dark) | warm yellow |
| `--ve-code-constant` | `#c98ec0` (purple, same as keyword) | `#9a3e74` (purple, same as keyword) | purple — constants share keyword color |
| `--ve-code-operator` | `#b9b1a3` (warm gray, light) | `#5b5343` (warm gray, dark) | warm gray |
| `--ve-code-punctuation` | `#948c7e` (warm gray, light) | `#7a7363` (warm gray, dark) | warm gray |
| `--ve-code-tag` | `#c98ec0` (purple) | `#9a3e74` (purple) | purple — tags ARE structural like keywords |
| `--ve-code-attribute` | `#6ab0cf` (blue, same as type) | `#2c6f8f` (blue, same as type) | blue — attributes ARE "kind of thing" like types |

The "what is what colour" mental model TRANSFERS across themes — a
reader who learns "purple = keyword" on dark sees the same purple
family on light, just darker.

### Contrast requirement

Both dark and light defaults MUST pass AA contrast against their
expected background:

- Dark theme: bg is `#14110b` (deep parchment-on-dark) or slate panel
  `#141413`. Token colour must have ≥ 4.5:1 contrast.
- Light theme: bg is `#faf6ee` (parchment) or `#ffffff` (paper). Token
  colour must have ≥ 4.5:1 contrast.

The defaults in `scripts/amvcp-code-highlight.css` are calibrated to
pass both. A custom DESIGN.md `colors.code-keyword` override MUST be
similarly calibrated; the design-tokens skill's DT-12 contrast checker
flags violations.

### Diff-tint mirror

Diff tints use percent values that DIFFER between themes:

| Tint | Dark | Light |
|---|---|---|
| `--ve-code-diff-add-bg` | 22% mix | 16% mix |
| `--ve-code-diff-del-bg` | 22% mix | 16% mix |
| `--ve-code-diff-add-gutter` | 60% mix | 70% mix |
| `--ve-code-diff-del-gutter` | 60% mix | 70% mix |

Why: on dark, 22% tint reads as "softly tinted dark"; on light, 22% would
read as "saturated tint" (because the surface is brighter). 16% on
light reads softer, matching dark's softness.

Gutter tints go the OPPOSITE way: 60% on dark, 70% on light. The
gutter cell is SMALL — needs more saturation to read at a glance;
light theme's bright bg requires more saturation to maintain contrast.

These are NOT arbitrary; they're calibrated for perceptual equivalence.

## Verification ritual and screenshot tests

Every fixture with code-highlight content MUST be verified in BOTH
themes:

1. **Dark first:** load the fixture with `data-ve-theme` absent (or
   `dark`). Open in dev-browser. Screenshot at 1200×800.
2. **Toggle to light:** set `data-ve-theme="light"` on `<html>`.
   Verify nothing rendered wrong (no invisible tokens, no contrast
   violations). Screenshot at 1200×800.
3. **Compare side-by-side.** Both screenshots should show the SAME
   semantic content (same tokens visible, same structure). The only
   difference should be COLOUR.
4. **Test the toggle behaviour:** flip theme back and forth via
   keyboard (the runtime's theme-toggle key). Ensure NO token "loses"
   colour during the transition.
5. **Test on a real device viewport (≤ 480px).** Both themes should
   still render correctly.

For composed pages (PR review, postmortem, explainer), repeat the
above for EACH composition section — the prose readable, the
sidebar readable, the code blocks readable, the diff tints readable.

The standard verification skill is
[../amvcp-self-debug-rules/SKILL.md](../../amvcp-self-debug-rules/SKILL.md)
— which codifies the dev-browser-driven screenshot loop. Every
fixture in this skill's verification pipeline MUST run through that
loop, twice (once per theme).

The pipeline:
```
fixture.html → dev-browser open
              → dark theme screenshot → JPEG-97 → reports/screenshots/
              → light theme screenshot → JPEG-97 → reports/screenshots/
              → side-by-side diff → flag any single-theme regression
```

## Fail-soft fallback and "single-theme defect" examples

Even with NO DESIGN.md loaded, NO `--vc-code-*` tokens emitted, the
fallback chain renders correctly:

```
--ve-code-keyword                   → unresolved, use fallback
  → var(--vc-code-keyword, #c98ec0) → unresolved, use literal
    → #c98ec0                       ← rendered
```

Plus the theme-toggle still works because BOTH `:root` and
`:root[data-ve-theme="light"]` blocks declare the SAME variable with
DIFFERENT fallback values. The theme toggle changes which block
applies, the fallbacks differ, the visual changes.

When the discipline is violated, these are the production bugs you
get:

| What it would look like | Why it's a defect |
|---|---|
| Dark tokens defined; light theme renders all tokens invisible | Reader on light theme can't read the code |
| Diff tints defined for dark; light renders no tints | Reader on light theme can't tell adds from dels |
| Comment colour same as bg in light theme | All comments invisible on light theme |
| Selection accent invisible on light | Selection state can't be seen on light theme |
| Wrap-marker stripe invisible on light | No wrap visual feedback on light theme |

Each of these would be a PRODUCTION BUG — the code-highlight category
is unusable on the affected theme.

## Authoring workflow — adding tokens and the DESIGN.md override

When the runtime / a future code-highlight reference adds a new
variable:

1. Define it in `:root` with a dark-theme default.
2. Define it in `:root[data-ve-theme="light"]` with a light-theme
   default — SAME HUE FAMILY, INVERTED LIGHTNESS.
3. Pass contrast verification on both themes.
4. Document the new var in this skill's relevant references.

NEVER add a token to only one block. If a reviewer sees a PR that adds
a `:root { --ve-code-foo: ...; }` without a matching
`:root[data-ve-theme="light"] { --ve-code-foo: ...; }`, the PR is
rejected on this rule alone.

A page's DESIGN.md might emit:

```yaml
code:
  keyword: "#ff4488"   # custom keyword color
```

The engine writes:

```css
:root { --vc-code-keyword: #ff4488; }
```

This OVERRIDES the bridge's fallback chain BOTH for dark and light
themes — the SAME hex for both. Authors who want per-theme override
must emit BOTH (the engine supports this via a `theme` sub-key, but
that's an `amvcp-design-tokens` topic).

For 99% of pages, ONE hex per token (used by both themes) is the
right answer — the bridge's per-theme defaults already provide the
theme-specific lightness inversion when the design DOESN'T override.
Authors only override the HUE; the engine + bridge handle the
lightness automatically.

## Tokens consumed and cross-references

All `--ve-code-*` and `--vc-code-*` tokens are consumed — this
discipline applies to every variable the skill defines or consumes.

- [token-roles-palette.md](./token-roles-palette.md) — the 12-token
  palette + the canonical light/dark default pairs
- [diff-tints-from-semantic-tokens.md](../../amvcp-code-diff/references/diff-tints-from-semantic-tokens.md)
  — the diff tint percent calibrations
- [../../amvcp-self-debug-rules/SKILL.md](../../amvcp-self-debug-rules/SKILL.md)
  — the screenshot verification loop
- `amvcp-design-tokens` DT-12 — the AA contrast checker that runs
  over both theme variants
