# Personality deltas — playful / corporate / minimal / warmer / cooler

`amvcpTokens.applyPersonalityDelta(designmdText, deltaName)` parses a
DESIGN.md, mutates its token tree by a NAMED delta, and re-serializes.
The deltas are small, composable, brand-coherent — a 5-axis tuner over
radius, accent chroma, accent hue, and motion timing.

## What it does

Five built-in deltas in `amvcpTokens.PERSONALITY_DELTAS`:

| Delta | Effect |
|---|---|
| `playful` | radius → larger (×1.5); accent chroma → +20%; motion → 0.8× (faster) |
| `corporate` | radius → smaller (×0.6); accent chroma → −10%; motion → 1.0× (unchanged) |
| `minimal` | radius → 0 (all radii pinned to 0 except `full`); accent chroma → −30%; motion → 1.3× (slower) |
| `warmer` | accent hue rotated −25° (toward orange) |
| `cooler` | accent hue rotated +25° (toward blue) |

The delta is applied to the PARSED token tree — one source of truth —
then re-serialized to a DESIGN.md text. The mutation:

1. **Radius bias** — depending on `delta.radius`:
   - `0` → pins `none/sm/md/lg/xl` to 0; leaves `full` at 9999 (a pill
     stays a pill even in a minimal theme).
   - `'sm'` → multiplies `sm/md/lg/xl` by 0.6 (tighter corners).
   - `'xl'` → multiplies `sm/md/lg/xl` by 1.5 (softer corners).
   - `null` → leave radius alone (the `warmer`/`cooler` deltas).
2. **Accent chroma + hue** — for BOTH themes, multiplies the OKLCh
   chroma by `delta.chroma` and rotates the OKLCh hue by `delta.hue`
   degrees, then re-emits hex. The dual-theme contract holds because
   the same shift is applied to both `colors.light.accent` and
   `colors.dark.accent`.
3. **Motion scalar** — multiplies every `duration-*` token by
   `delta.motion` (rounded to integer ms). Easings unchanged.

## When to use which delta

- `playful` — onboarding, marketing, consumer apps, gaming-adjacent UI.
- `corporate` — B2B SaaS, enterprise dashboards, financial / legal /
  medical contexts where a softer / rounder look would feel
  unprofessional.
- `minimal` — wireframes, archival reading interfaces, brutalist /
  Swiss design references, paper-mode views.
- `warmer` — a candidate that started in cool tech-blue territory but
  needs to feel "human", "editorial", "heritage".
- `cooler` — a candidate that started in warm honey/orange territory
  but needs to feel "calm", "tech-credible", "fintech".

## Composing deltas

The function applies ONE delta per call. To compose (e.g. `playful` +
`warmer`), call twice:

```js
var step1 = amvcpTokens.applyPersonalityDelta(designmdText, 'playful');
var step2 = amvcpTokens.applyPersonalityDelta(step1, 'warmer');
```

Order matters: applying `warmer` first rotates the hue; applying
`playful` then multiplies chroma at the new hue. The composition is
correct because both operate on the parsed tree, never on the textual
representation.

## Scaffold to emit

```js
var basePresetText = amvcpTokens.PRESETS['heritage'];
var warmerHeritage = amvcpTokens.applyPersonalityDelta(basePresetText, 'warmer');

// `warmerHeritage` is a valid DESIGN.md text — embed it in the page:
document.getElementById('design-md-script').textContent = warmerHeritage;

// OR hot-swap an already-loaded page:
window.__veDesignMd.hotSwap(warmerHeritage);
```

The hot-swap mechanism (`window.__veDesignMd.hotSwap`) is the runtime
companion — the agent picks a preset, applies a delta, and feeds the
result to `hotSwap` for live re-theming.

## Lib functions used

- `amvcpTokens.applyPersonalityDelta(designmdText, deltaName)` →
  `string` (the re-serialized DESIGN.md)
- `amvcpTokens.PERSONALITY_DELTAS` — the five deltas as a data table
- `amvcpDesignMd.parseDesignMd` / `serializeDesignMd` — used
  internally; the function loads the engine lazily
- `amvcpTokens.PRESETS` — typical input is a preset text + a delta

## DESIGN.md tokens used

- mutates: `radius.{none, sm, md, lg, xl}` (depending on the delta —
  `full` is intentionally untouched)
- mutates: `colors.{light, dark}.accent` (both themes; hue/chroma
  shift in OKLCh)
- mutates: `motion.duration-*` (eight integer ms values scaled by
  delta.motion)

## Anti-slop interaction

A delta that shifts the accent toward the banned indigo family
(`#6366F1` / `#8B5CF6`) WILL flag the resulting preset via
`lintTokenSet`. Run the lint AFTER applying a delta to catch this:

```js
var shifted = amvcpTokens.applyPersonalityDelta(presetText, 'cooler');
var report = amvcpTokens.lintTokenSet(shifted);
if (!report.ok) {
  throw new Error('delta produced a banned accent: ' +
    report.violations[0].reason);
}
```

The `cooler` delta on a base that already sits near royal blue can
push the accent into the banned region — the structural fix is to
choose a different base preset, NOT to weaken the delta or the gate.

## Selection / comment / decision-mini contract

Personality deltas affect the accent — which IS the seed for the
`--vc-selection-bg`, `--vc-focus-ring`, and every role-map's
categorical ramp. So a `warmer` delta automatically warms the
selection mark, focus ring, and graph-node ramp. One delta call, the
entire visual surface shifts coherently.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — apply a delta via
`hotSwap` under `dev-browser`, screenshot **both themes** (R1) before
and after, and visually verify:

1. radius changes are visible on every card / button / chip;
2. accent shifts on the active accent swatch AND on selection / focus
   ring / role-map categorical ramps;
3. motion changes are perceptible by clicking an easing chip (an 0.8×
   `playful` makes the demo dot reach the right edge faster).

A delta that leaves the page looking IDENTICAL means the engine
re-application failed — check `window.__veDesignMd.hotSwap` returned
without error.
