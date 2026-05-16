# Multi-brand DESIGN.md mixer (DM-23)

Load two DESIGN.md files and BLEND tokens per-token comparison rules,
tagging each decision with source brand. The pattern for "design a
co-branded artifact" where neither brand should fully dominate. A
nice-to-have feature — the personality-delta mechanism handles most
tuning needs without the mixer's complexity.

## What it does

Given two parsed DESIGN.mds (Brand A and Brand B):

1. for each color role, apply a per-role rule (e.g. "keep Brand A
   primary, take Brand B neutral if lower saturation") — produces a
   merged value;
2. for typography: prefer the type scale with more levels;
3. for spacing: prefer the more-complete scale;
4. for radius: average if both defined; sharper for B2B contexts,
   rounder for B2C contexts (a CONTEXT hint must be supplied);
5. output: a merged DESIGN.md with `/* ← BrandA */` or
   `/* ← BrandB */` per value as inline comments — so the merge
   provenance is visible in the artifact;
6. for explicit conflicts, emit a marker:
   `/* CONFLICT: BrandA=#3b82f6, BrandB=#0ea5e9 → chose BrandA */`.

The mixer is INTENTIONALLY a one-shot tool (not part of the live
runtime). The expected workflow: author runs the mixer offline to
produce a merged DESIGN.md, reviews the comments / conflicts, edits
if needed, ships the result.

## When to use

- co-branded marketing landing pages (two companies' brands jointly
  hosted);
- migration artifacts (legacy brand A → new brand B, showing the
  in-flight blend);
- educational comparisons (here's brand A; here's brand B; here's
  what their blend would look like).

DON'T use for:

- ROUTINE theming (the personality deltas + presets cover that);
- when one brand should dominate (just use that brand's preset
  unchanged);
- when the conflict resolution would be visually jarring (the
  per-role rules can produce a Frankenstein — sometimes the right
  answer is "don't blend, pick one").

## The per-role rules (suggested defaults)

| Role | Rule |
|---|---|
| `accent` | take the brand owning the artifact (a CONTEXT hint must be supplied — there's no "neutral" accent) |
| `canvas` | take the lighter of the two if both light, the darker of the two if both dark; conflict in a light/dark split — surface the conflict |
| `success/warning/danger/info` | semantic-state colors are pretty universal — pick brand A's by default; lint either way |
| `content` / `content-muted` / `content-subtle` | take the higher-contrast option against the merged canvas |
| `border` / `border-strong` | average in OKLCh (interpolate using `color-mix(in oklch, ...)`) |
| `font-heading` / `font-body` / `font-mono` | take brand A's; if it's a banned primary font, take brand B's |
| `radius` | per-context (B2B → sharper of the two; B2C → rounder of the two) |
| `elevation` | take the deeper / cinematic-er of the two; or take MD3 by default |
| `motion` | take the slower of the two — slower defaults are safer for accessibility |

## Scaffold to emit

The mixer is NOT currently implemented in the lib (it's a P3 idea in
the build backlog). A reference implementation sketch:

```js
function mixBrands(brandAText, brandBText, opts) {
  var a = amvcpDesignMd.parseDesignMd(brandAText);
  var b = amvcpDesignMd.parseDesignMd(brandBText);
  if (!a.ok || !b.ok) {
    throw new Error('mixBrands: one or both brands failed to parse');
  }
  var owner = (opts && opts.owner) || 'A';   // 'A' | 'B'
  var context = (opts && opts.context) || 'B2C';   // 'B2B' | 'B2C'

  var merged = JSON.parse(JSON.stringify(a.designmd));   // start from A

  // accent — owner wins
  merged.tokens.colors.light.accent = owner === 'A'
    ? a.designmd.tokens.colors.light.accent
    : b.designmd.tokens.colors.light.accent;
  // (… and so on for every role per the rules table …)

  // Lint the result — must pass.
  var report = amvcpTokens.lintTokenSet(merged);
  if (!report.ok) {
    throw new Error('mixBrands: result fails slop gate: ' +
      report.violations[0].reason);
  }

  return amvcpDesignMd.serializeDesignMd(merged);
}
```

The serialized output would include comments (added by a custom
serializer) tagging each value with its source.

## Lib functions used

- (not currently implemented — this is a P3 idea)
- when implemented, would call:
  - `amvcpDesignMd.parseDesignMd(text)`, `serializeDesignMd(designmd)`
  - `amvcpTokens.lintTokenSet(designmd)`
  - `amvcpTokens.contrastRatio` to pick higher-contrast content roles
  - (optional) `amvcpTokens.applyPersonalityDelta` to nudge the
    result toward a brand-specific tone after the merge

## DESIGN.md tokens used

- reads: BOTH brands' full token surfaces
- writes: a merged DESIGN.md text — typically a NEW file, not
  hot-swapped into a running page (since the merge process is
  offline and reviewable)

## Anti-slop interaction

The mixer MUST run `lintTokenSet` on the merged result and fail if
it produces a banned hex (e.g. two non-banned accents that
averaged into a banned indigo). The same `every_preset_passes_gate`
contract — a mixer that ships slop is a contradiction.

## Selection / comment / decision-mini contract

The merged DESIGN.md is just another DESIGN.md — selection, comment,
decision-mini all work normally with the resolved tokens.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — render the merged
DESIGN.md as an artifact and review:

1. each color visible in the artifact came from ONE of the two
   brands (or is a documented average);
2. typography is recognisably from ONE brand (probably the type-rich
   one);
3. the artifact passes the standard dual-theme contract (R1) — both
   light and dark themes resolve and read correctly.

The artifact's source comments are the audit trail — every value
tagged with its source brand.
