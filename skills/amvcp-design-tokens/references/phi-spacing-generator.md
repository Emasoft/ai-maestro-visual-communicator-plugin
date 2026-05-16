# Phi spacing-scale generator (DT-01)

A 9-step ascending pixel scale where every successive step multiplies the
previous one by the golden ratio φ ≈ 1.618. The resulting rhythm is
visually harmonious without arbitrary values; every gap, padding, and
margin sits on a perceptually proportional rung.

## What it does

`amvcpTokens.generatePhiSpacing(basePx, steps)` returns an ascending
array of integer pixel values:

```
value[n] = round(basePx * PHI^n)   for n = 0 … steps-1
```

Defaults: `basePx = 4`, `steps = 9` → `[4, 6, 10, 16, 26, 42, 68, 110, 178]`.
The function **asserts strict ascending** — a pathological `basePx < 3`
that would collapse two steps throws fail-fast, never silently emits a
broken scale.

## When to choose

Pick φ spacing when the artifact has many vertical / horizontal rhythms
(reports with many sections, dashboards with stacked cards, slides with
inter-block spacing). The compounding growth gives breathing room at the
top of the scale without leaving micro-spacing options at the bottom.

Use `[4, 8, 12, 16, 24, 32, 48, 64]` (the engine's linear default) when
the artifact has uniform spacing needs (a wireframe, a strict 8-pt grid
mock).

## Scaffold to emit

Two equivalent shapes — both are valid in a `<script type="text/design-md">`:

```yaml
spacing:
  scale: [4, 6, 10, 16, 26, 42, 68, 110, 178]
```

Or, programmatically before serializing:

```js
var scale = amvcpTokens.generatePhiSpacing(4, 9);
// → [4, 6, 10, 16, 26, 42, 68, 110, 178]
var parsed = amvcpDesignMd.parseDesignMd(designmdText);
parsed.designmd.tokens.spacing.scale = scale;
var rewritten = amvcpDesignMd.serializeDesignMd(parsed.designmd);
```

The engine then derives `--vc-space-0` … `--vc-space-8` from the
serialized scale array.

## Lib functions used

- `amvcpTokens.generatePhiSpacing(basePx, steps)` → `number[]`
- `amvcpDesignMd.parseDesignMd(text)` / `serializeDesignMd(designmd)` —
  to round-trip and embed the generated array
- (downstream) the engine's `applyTokens` mints `--vc-space-N`

## DESIGN.md tokens used

- writes: `spacing.scale: number[]`
- emits: `--vc-space-0` … `--vc-space-N` (one CSS custom property per
  index, in stable position order)

## Anti-slop interaction

The φ scale never triggers the slop gate (it has no colors / fonts). But
the *combination* of φ spacing with one of the warm-tone palette presets
(`heritage`, `parchment`, `ivory-slate`) reads as deliberate and
print-heritage — exactly the opposite of generic AI-default 8px-grid
sameness.

## Selection / comment / decision-mini contract

Spacing tokens carry **no selection state** — they are pure layout. They
appear in the contact-sheet's `spacing` panel as labelled bars whose
**true pixel width** equals the token value (not %), so a reader can
literally measure them with a screen ruler. Each bar is click-to-copy
(copies `var(--vc-space-N)`).

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact sheet
under `dev-browser`, screenshot the spacing panel in **both light and
dark themes** (R1 — light + dark themes), and verify with `page.evaluate`
that every bar's `getBoundingClientRect().width` matches its `var(--vc-space-N)`
resolved value. Failures usually mean the engine's `applyTokens` lost a
step (a non-ascending input would have already thrown at generation
time).
