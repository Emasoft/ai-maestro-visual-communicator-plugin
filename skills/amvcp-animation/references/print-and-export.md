# Print and export — animations under `@media print` and PDF export

## Table of Contents

- [The default print behavior](#the-default-print-behavior)
- [The print stylesheet (proposed)](#the-print-stylesheet-proposed)
- [Print-safe authoring](#print-safe-authoring)
- [The `prefers-reduced-motion` interaction](#the-prefers-reduced-motion-interaction)
- [PDF export](#pdf-export)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [When the skill's elements appear on paper](#when-the-skills-elements-appear-on-paper)
- [Counter readability on print](#counter-readability-on-print)
- [Reduced-motion substitute (for the print medium)](#reduced-motion-substitute-for-the-print-medium)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Page-break control](#page-break-control)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [When NOT to add the print stylesheet](#when-not-to-add-the-print-stylesheet)
- [Future runtime addition](#future-runtime-addition)

Reports printed to paper or exported as PDFs need to render
correctly without animations. The animation skill's behavior
under `@media print` is: every animated element appears at its
FINAL state (the end of its keyframe / transition). No motion;
no flashing-but-visible mid-frames.

## The default print behavior

Most modern browsers' print rendering already disables CSS
animations and transitions. The animated elements freeze at
whatever state they happen to be in when the print snapshot is
taken.

This produces a problem for the skill: a `.va-stagger-item` with
`opacity: 0` (held by `animation-fill-mode: both` before the
delay) would print as INVISIBLE. The user sees their cascade
items missing from the printout.

The fix: an explicit `@media print` block that overrides the
animation rules to skip directly to the final state.

## The print stylesheet (proposed)

```css
@media print {
  /* Stagger items: appear at full opacity, no transform */
  .va-stagger-item {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
  }

  /* Scroll-reveal targets: appear at full opacity */
  [data-va-reveal] {
    opacity: 1 !important;
    transform: none !important;
    clip-path: none !important;
    transition: none !important;
  }

  /* Decorative loops: sit at rest */
  .va-float-y, .va-breathe, .va-orbit, .va-rotate {
    animation: none !important;
  }

  /* Loading states: skip (replaced by actual content before print) */
  .va-skeleton, .va-pulse {
    display: none !important;
  }

  /* Parallax: no transform */
  .va-parallax-1, .va-parallax-2, .va-parallax-3,
  .va-parallax-4, .va-parallax-5, .va-parallax-6 {
    transform: none !important;
  }

  /* Progress bar: hide entirely (page progress is meaningless on paper) */
  .va-progress-bar {
    display: none !important;
  }

  /* Pulse ring (loading indicator): hide entirely */
  .va-pulse {
    display: none !important;
  }
}
```

The skill does NOT currently ship this `@media print` block — it
should be added in a future runtime CSS pass. Documented here as
the intended behavior.

## Print-safe authoring

When authoring for print compatibility, the safe choices:

1. **Don't use loading indicators in printable content.**
   `.va-skeleton` and `.va-pulse` are for streaming/loading UX;
   the printed output has all content already loaded.

2. **Make sure the FINAL state of every keyframe is the
   "correct" state.** If a `.va-stagger-item`'s end state
   (`opacity: 1; transform: none`) IS the desired printed state,
   the print stylesheet just needs to skip the animation —
   nothing else.

3. **Avoid decorative loops in printable headers/footers.**
   `.va-rotate` on a logo is fine on-screen but unusual on
   paper. Use the static logo for print.

## The `prefers-reduced-motion` interaction

`@media print` is a STRONGER signal than `prefers-reduced-motion:
reduce` — for the print medium, motion is meaningless. Even a
`reduce`-respecting page should print with FULL OPACITY content
(not the 200ms fade substitute).

The print stylesheet's `!important` rules override BOTH the
no-preference and reduce branches.

## PDF export

PDF export typically uses the browser's print pipeline. The
`@media print` rules apply. The PDF will have:
- All cascade items at full opacity (no flash of invisibility).
- All revealed sections visible.
- Counters at their final values.
- No floating loops.
- No parallax displacement.
- No progress bar.
- No loading indicators.

## DESIGN.md tokens consumed

Under `@media print`, the runtime might want to swap to a
specific PRINT theme (high-contrast B&W, no color animations).
The DESIGN.md engine could expose a `theme.print` variant:

```yaml
theme:
  light: { ... }
  dark: { ... }
  print: { ... }
```

The animation skill doesn't currently consume theme.print —
authors who need print-specific theming wire it in their own
DESIGN.md configuration.

## When the skill's elements appear on paper

| element | print appearance | notes |
|---|---|---|
| `.va-stagger-item` | full opacity, no transform | per print stylesheet override |
| `[data-va-reveal]` | full opacity | per print stylesheet override |
| `.va-counter` | final value | if reveal observer never fired (off-screen), the placeholder text shows; ensure the page is fully rendered before print |
| `.va-pulse` | hidden | per print stylesheet override |
| `.va-skeleton` | hidden | per print stylesheet override |
| `.va-float-y` etc. | static at frame 0 | per print stylesheet override |
| `.va-parallax-N` | no transform | per print stylesheet override |
| `.va-link` | static underline color | the `:hover` rule doesn't fire on print |
| `.va-tilt` | flat | the JS doesn't run on print; no tilt applied |
| `.va-snap-item` | normal section | snap is layout, irrelevant on paper |
| `.va-progress-bar` | hidden | per print stylesheet override |

## Counter readability on print

A counter that has NOT YET fired (e.g. below-the-fold and the
reveal observer hasn't seen it because the page rendered for
print before scroll) shows its PLACEHOLDER TEXT (the `0` or
whatever was between the tags) on paper. Wrong.

Workarounds:
1. **Pre-render all counters before print.** Before exporting,
   call `amvcpAnimation.revealNow(counter)` for every counter on
   the page. The instant-final-value path fires (under the
   `REDUCED` early-exit, which would apply if print was treated
   as reduce equivalent).
2. **Author the placeholder to be the final value.** Replace `<span class="va-counter" data-va-stat="45200">0</span>`
   with `<span class="va-counter" data-va-stat="45200">45,200</span>`. The counter
   animation overwrites the placeholder; print shows the
   placeholder (which IS the final value).

Option 2 is more robust — no JS required to pre-render.

## Reduced-motion substitute (for the print medium)

`@media print` doesn't natively check `prefers-reduced-motion` —
print is its own medium. The print stylesheet above explicitly
disables motion regardless of the user's reduce preference.

This is the correct behavior: print HAS no motion, so the reduce
preference is moot for print. A user who prefers reduced motion
on-screen doesn't need a special print path; print is already
motion-free.

## Selection + comment + decision integration

`[data-ve-id]` and decision pills should NOT appear in print
output. The pills are interactive UI; on paper they would be
meaningless markers.

The runtime's CSS should include:

```css
@media print {
  [data-ve-decision-pill] {
    display: none !important;
  }
}
```

Pill hiding is the runtime's job (the pill is mounted by the
runtime). The animation skill's atom-stamping doesn't add visible
markers — the `data-ve-id` attribute is invisible — so no print-
specific handling needed at the skill level.

## Page-break control

For long reports printing across multiple pages, control page
breaks with `page-break-inside` or its modern alias `break-inside`:

```css
@media print {
  .ve-card {
    break-inside: avoid;   /* don't split a card across pages */
  }
  .ve-card[data-va-reveal] {
    /* same as above; the data-va-reveal attribute doesn't affect break behavior */
    break-inside: avoid;
  }
}
```

The skill does NOT add break-inside rules — page-break control
is a layout concern. The layout skill (or the author's own CSS)
handles it.

## Diagnostics

- **Print output shows invisible cards** → the `@media print`
  override for `.va-stagger-item` isn't present. Add the
  stylesheet.
- **Print output shows loading skeletons** → the `display: none`
  rule for `.va-skeleton` isn't present. Add it.
- **Counter shows placeholder text in print** → the counter
  hasn't fired. Either pre-render with `revealNow`, or set the
  placeholder text to the final value.
- **Print output has weird empty space at the top** → a fixed-
  position element (progress bar?) is taking space; ensure it's
  `display: none` for print.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with animated content.
2. Open browser print preview (Cmd+P on Mac).
3. Confirm all stagger items / reveal sections / counters appear
   at their final states.
4. Confirm no loops, no progress bar, no skeletons in the
   preview.
5. Export to PDF. Open the PDF.
6. Confirm the PDF matches the print preview.

## When NOT to add the print stylesheet

If the report is purely on-screen (e.g. a shared HTML page
viewed in the browser, never printed), the `@media print` block
adds bytes for no benefit.

Most reports MIGHT be printed though — exporting to PDF is
common for archival, sharing with non-technical stakeholders,
etc. The cost of including the print stylesheet is small
(~500 bytes); benefit is large (correct print rendering).
Recommendation: ship the print stylesheet by default.

## Future runtime addition

The print stylesheet is a clear gap in the current animation
skill — every other category has its print substitute (or
sensibly degrades), but the skill's CSS doesn't include a
`@media print` block. A future runtime pass should add it.

Until then, authors using the skill in printable contexts should
add their own `@media print` rules per the recipe at the top of
this file.
