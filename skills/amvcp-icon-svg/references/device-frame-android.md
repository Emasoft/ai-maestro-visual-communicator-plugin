# Device frame — Android

## Table of Contents

- [What it renders](#what-it-renders)
- [Two authoring paths](#two-authoring-paths)
  - [Path A — JS API](#path-a--js-api)
  - [Path B — direct markup](#path-b--direct-markup)
- [Required parameters (JS path)](#required-parameters-js-path)
- [The punch-hole camera](#the-punch-hole-camera)
- [The gesture bar](#the-gesture-bar)
- [CSS-only path classes](#css-only-path-classes)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini](#selection--comment--decision-mini)
- [When to use](#when-to-use)
- [When NOT to use](#when-not-to-use)
- [What NOT to do](#what-not-to-do)
- [Visual verification](#visual-verification)

The `android` device frame wraps content in a themed Android phone
mockup — bezel + screen + punch-hole camera + status bar + gesture
bar. Visually distinguished from the iOS frame by:

- **Punch-hole camera** (small ink-colored dot) instead of the
  Dynamic Island pill.
- **Gesture bar** (muted thin pill) instead of the iOS ink home
  indicator.
- **Slightly wider** (412 vs 390) and **slightly taller** (915 vs
  844) — matches typical Android flagship dimensions.

## What it renders

```
┌──────────────────────────┐  ← bezel
│ ┌──────────────────────┐ │
│ │       (•)            │ │  ← punch-hole camera (small ink dot)
│ │ 9:41    📶 📶 🔋     │ │  ← status bar
│ │                      │ │
│ │   <content slot>     │ │  ← .isvg-frame-content (overflow: auto)
│ │                      │ │
│ │ ─── (gesture bar) ── │ │  ← gesture bar (muted thin pill)
│ └──────────────────────┘ │
└──────────────────────────┘
```

Dimensions:

- Bezel: 412 x (915 + 10px padding x 2) px.
- Screen: 895 tall, rounded 34px corners.
- Punch-hole camera: 14 x 14 ink-colored dot at
  `inset-block-start: 14px`, centered horizontally.
- Status bar: same layout as iOS.
- Gesture bar: 108 x 4 px MUTED pill at the bottom (vs iOS's 134 x 5
  INK pill).

## Two authoring paths

### Path A — JS API

```js
var content = '<h1>App home</h1><p>...</p>';
var frame = window.amvcpIconSvg.deviceFrame({
  kind: 'android',
  time: '9:41',
  content: content
});
document.body.appendChild(frame);
```

### Path B — direct markup

```html
<div class="isvg-frame isvg-frame--android wf-frame--android"
     data-isvg-frame="android">
  <div class="isvg-frame-screen">
    <div class="isvg-frame-punchhole" aria-hidden="true"></div>
    <div class="isvg-frame-statusbar">
      <span class="isvg-frame-time">9:41</span>
      <span class="isvg-frame-statusicons">
        <!-- signal / wifi / battery glyphs -->
      </span>
    </div>
    <div class="isvg-frame-content">
      <h1>App home</h1>
      <p>...</p>
    </div>
  </div>
</div>
```

## Required parameters (JS path)

| Parameter | Type | Required | Default |
|---|---|---|---|
| `kind` | `"android"` | YES | — |
| `content` | HTMLElement \| string | no | empty |
| `time` | string | no | `"9:41"` |

`title` and `url` are IGNORED for Android.

## The punch-hole camera

A 14 x 14 ink-colored dot at `inset-block-start: 14px`, centered. The
modern Android flagship camera placement (Samsung Galaxy S-series,
Pixel 6/7/8/9, etc.). Distinguishes Android from iOS at a glance.

## The gesture bar

108 x 4 px MUTED-colored pill at `inset-block-end: 8px`. Symbolizes
the Android gesture navigation bar (the muted color is the visual
distinction from iOS's ink home indicator — Android's bar is more
discreet). Always present, always muted, always centered.

## CSS-only path classes

```css
.isvg-frame--android {
  inline-size: 412px;
  border-radius: 44px;
  padding: 10px;
}
.isvg-frame--android .isvg-frame-screen {
  block-size: 895px;
  border-radius: 34px;
}
```

The `.wf-frame--android` alias is the shared class with `wireframe`.

## DESIGN.md tokens consumed

- `--vc-color-content` — bezel + punch-hole camera + status bar text
- `--vc-color-content-muted` — gesture bar (THE distinction from iOS)
- `--vc-color-surface` — screen background
- `--vc-shadow-3` — bezel shadow
- `--vc-font-body` — status bar font

## Selection / comment / decision-mini

Same as iOS — not a scene-graph primitive, so add `data-ve-id`
manually if needed.

## When to use

- Android-specific UI mockup.
- Side-by-side with an iOS frame to compare cross-platform designs.
- "This works on Android too" affordance in a marketing doc.
- Material Design prototype.
- A page promoting an Android app's UX.

## When NOT to use

- For an Android tablet — there's no tablet preset; hand-author or
  use the `mac` frame (1440x900) and rename.
- For a generic "phone" — pick iOS or Android explicitly.

## What NOT to do

- Do NOT make the gesture bar INK-colored — the MUTED color is what
  distinguishes Android from iOS.
- Do NOT remove the punch-hole camera — symbolic, even if it looks
  "extra".

## Visual verification

In both light AND dark:

- Bezel is ink.
- Punch-hole is ink dot at top center.
- Gesture bar is MUTED (a noticeably softer color than the bezel).
- Status bar text reads cleanly.
- Content scrolls inside the 895px screen.

Compare side-by-side with iOS — the visual difference between the
two frames should be IMMEDIATELY APPARENT (Dynamic Island vs
punch-hole; ink home indicator vs muted gesture bar).
