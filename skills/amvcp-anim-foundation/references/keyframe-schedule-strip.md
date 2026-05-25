# Keyframe-schedule strip

## Table of Contents

- [What it is](#what-it-is)
- [When to add one](#when-to-add-one)
- [The markup](#the-markup)
- [The CSS](#the-css)
- [Positioning the beats](#positioning-the-beats)
- [The beat vocabulary](#the-beat-vocabulary)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Reduced-motion](#reduced-motion)
- [Selection / decision integration](#selection--decision-integration)
- [Composition](#composition)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)
- [Mined source attribution](#mined-source-attribution)

## What it is

A static horizontal track that plots an animation's **named beats at
their millisecond offsets** — a "here's what plays when" diagram for a
sequence you authored. It is the inspection facet of the animation
element: the delay ladder you wrote in CSS (`transition-delay`, staggered
keyframe starts) rendered as a readable timeline so a reviewer can see
the choreography without reading the stylesheet. Mined from
`07-prototype-animation.html` (html-effectiveness catalog #7), whose
task-complete micro-interaction shipped a strip labelling fill → check →
strike → confetti → collapse at their ms offsets.

This is a static diagram — no motion of its own. It documents motion; it
does not perform it.

## When to add one

| Add a schedule strip | Skip it |
|---|---|
| A multi-beat sequence (≥3 named phases) the reader must understand | A single fade — nothing to schedule |
| You are documenting / reviewing an animation's timing | Production UI where the strip would be chrome |
| `animation-plan-template.md` §1 "Timing overview" needs a visual | The plan's prose timing line is enough |
| Teaching how a celebratory / staged interaction is composed | A loop with no discrete beats |

It pairs with the planning template: §1 currently describes the timing
in prose; this strip is the picture of that prose.

## The markup

A track holding one positioned dot+label per beat, plus an axis with a
couple of ms ticks:

```html
<figure class="va-schedule" style="--va-sched-total: 720;">
  <figcaption class="va-schedule__caption">Task-complete sequence — 720ms</figcaption>
  <div class="va-schedule__track" role="img"
       aria-label="Animation beats: fill 0ms, check 80ms, strike 120ms, confetti 200ms, collapse 600ms">
    <span class="va-schedule__beat" style="--va-at: 0;">
      <span class="va-schedule__dot"></span>
      <span class="va-schedule__label">fill</span>
      <span class="va-schedule__ms">0ms</span>
    </span>
    <span class="va-schedule__beat" style="--va-at: 80;">
      <span class="va-schedule__dot"></span>
      <span class="va-schedule__label">check</span>
      <span class="va-schedule__ms">80ms</span>
    </span>
    <span class="va-schedule__beat" style="--va-at: 120;">
      <span class="va-schedule__dot"></span>
      <span class="va-schedule__label">strike</span>
      <span class="va-schedule__ms">120ms</span>
    </span>
    <span class="va-schedule__beat" style="--va-at: 200;">
      <span class="va-schedule__dot"></span>
      <span class="va-schedule__label">confetti</span>
      <span class="va-schedule__ms">200ms</span>
    </span>
    <span class="va-schedule__beat va-schedule__beat--last" style="--va-at: 600;">
      <span class="va-schedule__dot"></span>
      <span class="va-schedule__label">collapse</span>
      <span class="va-schedule__ms">600ms</span>
    </span>
  </div>
</figure>
```

The `--va-sched-total` (total sequence ms) and each beat's `--va-at` (its
ms offset) are the only two numbers the author supplies; the CSS turns
them into positions.

## The CSS

```css
.va-schedule {
  margin-block: var(--vc-space-5, 32px);
  padding: var(--vc-space-4, 16px);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  background: var(--vc-color-surface, #faf6ee);
}
.va-schedule__caption {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vc-color-content-muted, #5b5343);
  margin-block-end: var(--vc-space-4, 16px);
}
.va-schedule__track {
  position: relative;
  height: 56px;
  border-top: 2px solid var(--vc-color-border, #e3dcc9);
  margin-block-start: var(--vc-space-5, 32px);
}
.va-schedule__beat {
  position: absolute;
  top: -5px;
  /* offset / total → percentage across the track */
  left: calc(var(--va-at) / var(--va-sched-total) * 100%);
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.va-schedule__dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--vc-color-accent, #b8861f);
}
.va-schedule__label {
  font-size: var(--vc-text-1, 13px);
  color: var(--vc-color-content, #1f1a14);
}
.va-schedule__ms {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  color: var(--vc-color-content-muted, #5b5343);
}
/* the final beat sits at 100% — pull its label in so it doesn't clip */
.va-schedule__beat--last { transform: translateX(-90%); }
```

## Positioning the beats

The position is pure arithmetic — `left = offset / total * 100%` — so the
strip is faithful to the real timing: a beat at 600ms of a 720ms sequence
sits at 83% across, exactly where it fires. Editing one `--va-at` moves
its dot; no hand-placed coordinates. Keep `--va-sched-total` equal to the
LAST beat's offset plus its own duration so the track ends where the
animation ends.

For sequences driven by `--vc-duration-*` tokens, label the beats with
the token character (e.g. "check · fast", "collapse · slow") so the strip
documents which duration token each beat consumes — tying the picture
back to the DESIGN.md motion group.

## The beat vocabulary

Each beat is one named phase of the sequence — the same names you use in
the keyframe / transition that produces it (`fill`, `check`, `strike`,
`confetti`, `collapse` for the mined example). The label MUST match the
phase name in the code, so the strip and the stylesheet stay in sync. Use
the accent role for ordinary beats; if one beat is the "payoff" (the
confetti pop, the success check) you may tint its dot with
`--vc-color-success` to mark it — but at most one.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | `--vc-color-accent` (beat dots), `--vc-color-success` (optional payoff dot), `--vc-color-content` (labels), `--vc-color-content-muted` (ms / caption), `--vc-color-border` (frame + axis), `--vc-color-surface` (panel) |
| typography | `--vc-font-mono` (caption + ms), `--vc-text-0` / `--vc-text-1` (sizes) |
| radius | `--vc-radius-md` (panel) |
| spacing | `--vc-space-4` / `--vc-space-5` (padding / margins) |

No duration or easing tokens are consumed — the strip is static; it
*documents* the durations rather than animating with them.

## Reduced-motion

The strip itself never animates, so it is inherently reduced-motion
safe — no substitute needed. It is, in fact, a useful companion to a
reduced-motion build: when motion is suppressed the reader can still see,
from the strip, what the full sequence would have done. Do NOT add an
entrance animation to the strip "to make it lively" — that would make a
timing *diagram* require the very motion it documents.

## Selection / decision integration

The strip is selectable as a unit and each beat individually, via the
skill's stamper (`atom-selection-stamping.md`):

```html
<span class="va-schedule__beat" data-ve-id="va-beat-confetti"
      data-ve-type="schedule-beat"
      data-ve-data='{"name":"confetti","atMs":200}'
      style="--va-at: 200;"> … </span>
```

A reviewer can select the `confetti` beat and comment "200ms is too
early — it overlaps the check draw", and the agent receives the beat
name + ms offset to act on. The `data-ve-mode="readonly"` decision
mini-pill (R20-R23) applies as with every anim atom.

## Composition

- Cross-linked from [animation-plan-template](animation-plan-template.md)
  §1 "Timing overview" — the strip is the visual of that section's prose.
- Pairs with [keyframe-catalog](keyframe-catalog.md): each beat usually
  corresponds to one catalog keyframe starting at its offset.
- Lives in a doc page (an animation spec / design note), not in the
  production component the animation ships in.

## Anti-patterns

- **Hand-placed `left` pixel values** — always
  `calc(var(--va-at) / var(--va-sched-total) * 100%)`, or the strip lies
  about the timing.
- **Beat labels that don't match the code phase names** — the strip's
  whole value is being a faithful index of the stylesheet; renaming
  breaks that.
- **Animating the strip** — it documents motion, it must not perform it
  (and it would then need a reduced-motion substitute for no reason).
- **More than one payoff-tinted dot** — if everything is highlighted,
  nothing is; at most one success-tinted beat.
- **Hardcoded hex for the dots / axis** — `--vc-*` tokens only, or the
  strip won't mirror light / dark.
- **A strip for a single-beat animation** — there is no schedule to
  show; drop it.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser screenshot
light + dark. Confirm each dot sits at its true fractional position
(a 600/720 beat at ~83% across), labels don't clip at the right edge
(the `--last` pull-in works), and the axis + dots + ms text all read on
both themes.

## Mined source attribution

Catalog quote from the "media" group, source `07-prototype-animation.html`:

> *"Keyframe-schedule STRIP — a static track with positioned dots
> labelling each beat at its ms offset … the animation siblings document
> *authoring* the motion but ship no visual that *documents an
> animation's named beats on a time axis* … a 'here's what plays when'
> diagram."*

Adopted as the inspection/edit facet of the animation element — the
visual companion to `animation-plan-template.md` §1 "Timing overview".
