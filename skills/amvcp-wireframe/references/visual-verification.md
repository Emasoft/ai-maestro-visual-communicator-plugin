# Visual verification — screenshot-test every wireframe change

Per the user MEMORY rule, every visual change MUST be verified with
a screenshot. For wireframes that means: render the page, capture
in BOTH themes, capture at MULTIPLE fidelities, diff against the
expected appearance. This file documents the workflow.

## Table of contents

- [The screenshot-test rule](#the-screenshot-test-rule)
- [The 8-image matrix per wireframe](#the-8-image-matrix-per-wireframe)
- [Using the dev-browser plugin](#using-the-dev-browser-plugin)
- [Capturing programmatically with `applyFidelity`](#capturing-programmatically-with-applyfidelity)
- [Visual diff — comparing before / after](#visual-diff--comparing-before--after)
- [What to look for in each screenshot](#what-to-look-for-in-each-screenshot)
- [Common visual bugs caught by the screenshot test](#common-visual-bugs-caught-by-the-screenshot-test)
- [When to skip the screenshot test (rarely)](#when-to-skip-the-screenshot-test-rarely)
- [Storing screenshots for review](#storing-screenshots-for-review)
- [Self-debug rules cross-reference](#self-debug-rules-cross-reference)

---

## The screenshot-test rule

The user's memory rule (`feedback_visual_screenshot_testing.md`):

> Always screenshot-test changes — verify every visual change with
> a dev-browser screenshot, light + dark.

For wireframes:

1. Render the wireframe in light theme. Screenshot.
2. Flip to dark theme. Screenshot.
3. Compare side-by-side.

For PRODUCTION-quality verification, additionally:

4. Apply each fidelity stage (wireframe / low / mid / hi).
5. Screenshot at EACH fidelity, EACH theme.
6. 8 total screenshots per wireframe.

This is the "8-image matrix" — the canonical wireframe
verification artifact.

---

## The 8-image matrix per wireframe

For every wireframe you ship, capture 8 screenshots:

| Theme | Fidelity | Filename |
|---|---|---|
| Light | wireframe | `<name>-light-wireframe.png` |
| Light | low | `<name>-light-low.png` |
| Light | mid | `<name>-light-mid.png` |
| Light | hi | `<name>-light-hi.png` |
| Dark | wireframe | `<name>-dark-wireframe.png` |
| Dark | low | `<name>-dark-low.png` |
| Dark | mid | `<name>-dark-mid.png` |
| Dark | hi | `<name>-dark-hi.png` |

Arrange in a 2x4 grid for visual review:

```
                wireframe    low       mid       hi
Light theme    [img]        [img]    [img]    [img]
Dark theme     [img]        [img]    [img]    [img]
```

The eye reads ROWS: "is the LIGHT theme consistent across fidelities?"
And COLUMNS: "does the same fidelity LOOK RIGHT in both themes?"

Bugs that show up:

- A row that looks wrong = theme bug.
- A column that looks wrong = fidelity bug.
- A cell that looks wrong = isolated bug at that combination.

---

## Using the dev-browser plugin

The dev-browser plugin (`Skill: dev-browser`) opens Chrome,
navigates, takes screenshots — all from a single skill call.

### Setup

```python
# pseudocode — actual API differs slightly
browser = dev_browser.open()
browser.navigate('file:///path/to/wireframe.html')

# Optional: set viewport
browser.set_viewport(width=1440, height=900)
```

### Basic capture (current theme/fidelity)

```python
browser.screenshot('/tmp/screenshot.png')
```

### Capturing the 8-image matrix

```python
for theme in ['light', 'dark']:
    browser.evaluate(f"document.documentElement.dataset.veTheme = '{theme}'")

    for fid in ['wireframe', 'low', 'mid', 'hi']:
        browser.evaluate(
            "amvcpWireframe.applyFidelity("
            "document.querySelector('.wf-root'), "
            f"'{fid}')"
        )
        # give the engine a moment to re-paint
        browser.wait(100)
        browser.screenshot(f'/tmp/{theme}-{fid}.png')
```

Run, then visually inspect all 8 files.

---

## Capturing programmatically with `applyFidelity`

The wireframe engine exposes `applyFidelity(rootEl, fidelity)` for
exactly this purpose:

```js
// in browser console
amvcpWireframe.applyFidelity(
  document.querySelector('.wf-root'),
  'mid'
);
```

The call:
1. Validates the fidelity value (throws on invalid).
2. Writes `data-wf-fidelity` on the root.
3. Re-publishes the scoped `--vc-color-*` set with the new
   desaturation factor.

Theme flip is even simpler:

```js
document.documentElement.dataset.veTheme = 'dark';
amvcpWireframe.refresh(document);
```

The `refresh()` call re-runs desaturation on the new theme.

For pages with MULTIPLE wireframes (a ramp), `applyFidelity` only
affects ONE root. To apply to all:

```js
document.querySelectorAll('.wf-root').forEach(root => {
  amvcpWireframe.applyFidelity(root, 'mid');
});
```

---

## Visual diff — comparing before / after

When you make a change to a wireframe, you should know WHAT
CHANGED. Visual diff tools:

### Manual eye-diff

The simplest approach. Open both screenshots side-by-side; spot
differences.

For PIXEL-EXACT comparison:

### macOS Preview

Open both images in Preview; switch back and forth with the arrow
keys. Differences appear as a "flicker" in the same position.

### `compare` from ImageMagick

```bash
compare \
  -metric AE \
  before.png \
  after.png \
  diff.png
```

`diff.png` highlights the changed pixels in red. AE (absolute
error) is the pixel count.

### `pixelmatch` (Node)

```bash
npx pixelmatch before.png after.png diff.png 0.1
```

Tunable threshold (0.1 = 10% diff allowed). Outputs a diff image
with diff pixels highlighted.

### When diffs are expected

Some changes SHOULD produce visual diffs. The screenshot test isn't
"prevent all diffs" — it's "make sure ONLY THE EXPECTED diffs
appear". Review every diff; reject anything unexplained.

---

## What to look for in each screenshot

### Light theme + wireframe fidelity

The "baseline" — all greys. Look for:

- [ ] NO brand color visible anywhere.
- [ ] Borders + dividers all the same grey weight.
- [ ] Button labels are grey (not white-on-color).
- [ ] No shadows (radius-0, no box-shadow).

### Light theme + low fidelity

- [ ] Primary CTA has a hint of accent (faint goldenrod border).
- [ ] Small radius re-appears (`--vc-radius-sm`).
- [ ] Still no shadows.
- [ ] Other colors very muted.

### Light theme + mid fidelity

- [ ] Primary CTA is FILLED with real accent color.
- [ ] Real radii appear (`--vc-radius-md`).
- [ ] Soft shadows appear.
- [ ] Status chips show real semantic colors.

### Light theme + hi fidelity

- [ ] Full production look.
- [ ] All radii at max (`--vc-radius-lg`).
- [ ] All shadows at max.
- [ ] Real accent everywhere accent should be.

### Dark theme + wireframe fidelity

- [ ] Page is dark-grey (not light-grey).
- [ ] Content is light-grey (good contrast vs dark canvas).
- [ ] Borders visible but subtle.

### Dark theme + low / mid / hi fidelity

Same checks as light theme, but verify:

- [ ] Accent color works on dark background (visible, not lost).
- [ ] Contrast ratios still pass AA.
- [ ] Status chips still distinguishable from each other.

---

## Common visual bugs caught by the screenshot test

### Bug 1: brand color leaks at wireframe

Light theme wireframe shows a colored button. Investigate the
hardcoded hex.

### Bug 2: dark theme has invisible text

Dark theme + dark text = unreadable. A hardcoded `color: #1f1a14`
(meant for light theme) was used.

### Bug 3: modal overlay invisible on dark theme

Dark theme shows the modal without a backdrop. The overlay used
`rgba(0,0,0,0.5)` instead of `color-mix` with the theme content
color.

### Bug 4: ramp's mid and hi look identical

The wireframe has no `wf-card` / `wf-image` / `wf-table` — there's
nothing to show the radius/shadow difference between mid and hi.

### Bug 5: device frame doesn't render the screen

The `wf-frame__content` is empty. Check the markup — likely a
wrong nesting level.

### Bug 6: text overflows the wireframe block

A long label that fits one viewport overflows on a narrower one.
The screenshot at 390px width reveals it.

### Bug 7: button is below the touch target threshold

A 28px-tall button on a mobile screenshot. WCAG AAA requires 44 ×
44; bump the padding.

### Bug 8: focus ring is invisible

Tab through the wireframe; the focus indicator should appear. If
not visible in a screenshot, the focus styles are broken.

---

## When to skip the screenshot test (rarely)

The screenshot test is the COSTLY but THOROUGH verification. Skip
it ONLY when:

### 1. Change is non-visual

A code-only refactor of `amvcp-wireframe.js` that doesn't affect
the rendered output. Verify the JS logic with unit tests.

### 2. Change is in a referenced file the wireframe doesn't render

Modifying the runtime's CSS but the wireframe doesn't use that
specific rule. (Verify by reading the rule.)

### 3. Change is documentation-only

Editing a `.md` reference file. The rendered docs aren't a
wireframe.

In every other case — SCREENSHOT IT. The cost of a missed visual
regression is much higher than the 30 seconds to capture an image.

---

## Storing screenshots for review

Per the agent-reports-location rule, screenshots from automated
verification go under:

```
$MAIN_ROOT/reports/wireframe/<timestamp>-<feature-name>/
```

With one screenshot per file:

```
$MAIN_ROOT/reports/wireframe/20260516_143012+0200-checkout-flow/
├── README.md             # what was changed, what to look at
├── light-wireframe.png
├── light-low.png
├── light-mid.png
├── light-hi.png
├── dark-wireframe.png
├── dark-low.png
├── dark-mid.png
└── dark-hi.png
```

The README.md describes what was changed and where to focus
attention (which screenshots to compare against the previous
baseline).

For SHARED review, link the report folder; reviewer clicks
through.

---

## Self-debug rules cross-reference

For deeper guidance on the screenshot-test workflow, see
`skills/amvcp-self-debug-rules/SKILL.md`. That skill covers:

- The full screenshot capture API.
- Theme + fidelity matrix generation.
- Visual diff tooling.
- When to fail-fast on a visual regression.
- The "make a change, screenshot, commit, screenshot again,
  visual-diff" loop.

The wireframe skill DELEGATES the deep verification details to
the self-debug-rules skill — see that file for the full
workflow.
