# 28 — Generalised device-mockup frame (`.la-device` + `--dev-*` CSS props)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Why `box-sizing: border-box`](#why-box-sizing-border-box)
- [The `transform: translateX(-50%)` exception](#the-transform-translatex-50-exception)
- [The screen `overflow: hidden`](#the-screen-overflow-hidden)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [Why the frame colour is `--vc-color-content`, not `#000`](#why-the-frame-colour-is---vc-color-content-not-000)
- [Visual verification](#visual-verification)

A parameterised CSS frame for screenshots, demos, and feature
illustrations. Driven by 5 inline custom properties
(`--dev-w`, `--dev-h`, `--dev-radius`, `--dev-notch-w`,
`--dev-notch-h`), so any device (iPhone, iPad, Android, desktop
browser frame) is expressible in one inline style. The frame
colour is the engine's darkest content token (`--vc-color-content`),
never `#000`, so it adapts to BOTH themes.

## What this is

A typical "device mockup" is a phone-shaped border around a
screenshot. Older approaches hard-coded one specific device
(`width: 393px; height: 852px` for the iPhone 16 Pro), which
forces a new CSS rule per device.

The layout's `.la-device` generalises: the dimensions are CUSTOM
PROPERTIES set on the element, so any device is a single inline
style:

```html
<!-- iPhone 16 Pro -->
<div class="la-device" style="--dev-w:393px; --dev-h:852px; --dev-radius:47px; --dev-notch-w:126px; --dev-notch-h:37px;">
  <div class="la-device__screen">…</div>
</div>

<!-- iPad mini -->
<div class="la-device" style="--dev-w:744px; --dev-h:1133px; --dev-radius:18px;">
  <div class="la-device__screen">…</div>
</div>

<!-- Pixel 8 -->
<div class="la-device" style="--dev-w:412px; --dev-h:915px; --dev-radius:24px; --dev-notch-w:80px; --dev-notch-h:24px;">
  <div class="la-device__screen">…</div>
</div>
```

For a desktop browser frame (no notch), add `.la-device--no-notch`:

```html
<div class="la-device la-device--no-notch" style="--dev-w:1280px; --dev-h:800px; --dev-radius:12px;">
  <div class="la-device__screen">…</div>
</div>
```

## Scaffold to emit

```html
<figure class="la-device-frame" data-ve-id="device-iphone-screenshot" data-ve-type="card">
  <div class="la-device"
       style="--dev-w:393px;
              --dev-h:852px;
              --dev-radius:47px;
              --dev-notch-w:126px;
              --dev-notch-h:37px;">
    <div class="la-device__screen">
      <img src="screenshot.png" alt="App home screen">
    </div>
  </div>
  <figcaption>The home screen on iPhone 16 Pro (393 × 852).</figcaption>
</figure>
```

The CSS ships in `amvcp-layout.css`:

```css
.la-device {
  /* border-box so --dev-w/--dev-h are the FULL frame size —
     an author setting --dev-w:393px (an iPhone width) expects the
     bezel padding to be INSIDE that figure, not added on top. */
  box-sizing: border-box;
  inline-size: var(--dev-w, 393px);
  block-size: var(--dev-h, 852px);
  border-radius: var(--dev-radius, 47px);
  position: relative;
  background: var(--vc-color-content);    /* darkest token, NOT #000 */
  box-shadow: var(--vc-shadow-4);
  padding: var(--vc-space-1, 8px);
}
.la-device::before {
  content: "";
  position: absolute;
  inset-block-start: var(--vc-space-2, 12px);
  inset-inline-start: 50%;
  transform: translateX(-50%);             /* symmetric self-centre — OK */
  inline-size: var(--dev-notch-w, 126px);
  block-size: var(--dev-notch-h, 37px);
  border-radius: var(--vc-radius-full, 9999px);
  background: var(--vc-color-content);
  z-index: 2;
}
.la-device--no-notch::before { display: none; }
.la-device__screen {
  position: absolute;
  inset: var(--vc-space-1, 8px);
  border-radius: calc(var(--dev-radius, 47px) - var(--vc-space-1, 8px));
  overflow: hidden;                        /* frame clip — NOT a scroller */
  background: var(--vc-color-canvas);
}
```

## Why `box-sizing: border-box`

This is a subtle but important choice. With `border-box`:
- `--dev-w: 393px` means "the FRAME is 393px wide, including bezel
  padding".
- The screen INSIDE is `393px - 16px (8px padding on each side) =
  377px wide`.

With the default `content-box`:
- `--dev-w: 393px` would mean "the SCREEN is 393px wide".
- The full frame would be `393 + 16 = 409px wide`.

The author setting `--dev-w: 393px` (the iPhone's actual width)
expects the FULL frame to be that size — not 409. `border-box` makes
the inline math match the author's mental model.

## The `transform: translateX(-50%)` exception

Per ref 31 (RTL logical properties), the layout technique forbids
physical directional properties — except for `transform:
translateX(-50%)` used for symmetric self-centring (the notch).
Since the notch is symmetric around the device's vertical axis,
mirroring it under RTL produces an identical result. The transform
is direction-NEUTRAL and therefore allowed.

`inset-inline-start: 50%` + `transform: translateX(-50%)` is the
canonical centring trick for an absolutely-positioned element.

## The screen `overflow: hidden`

`.la-device__screen` has `overflow: hidden`. This is a FRAME CLIP
(clipping the screenshot to the rounded screen rect), NOT a
content scroller — see `amvcp-layout.css` line 326. The mockup is
fixed-size; the screenshot inside is sized to fit. The clipping
ensures the screenshot's corners are rounded to match the screen
shape, even if the screenshot was exported as a square.

## Lib functions called

- `markLayoutAtoms()` stamps `data-ve-id` / `data-ve-type="device-mockup"`
  on every `.la-device` (the SHAPES list in `amvcp-layout.js`
  includes it). Each mockup is a selectable atom.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--vc-color-content` | (theme — dark) | frame colour + notch fill |
| `--vc-color-canvas` | (theme — light) | screen background (fallback for missing screenshot) |
| `--vc-shadow-4` | (theme) | frame drop shadow |
| `--vc-radius-full` | 9999px | notch corner radius |
| `--vc-space-1` | 8px | bezel padding around screen |
| `--vc-space-2` | 12px | notch top inset |

The `--dev-*` properties are PER-ELEMENT (set inline), not global
tokens. They are instance parameters, not design-system primitives.

## Selection / comment / decision-mini contract notes

Each `.la-device` is a selectable atom (`device-mockup` type). A
reviewer can comment ("use a Pixel 8 instead", "remove the notch",
"add a caption underneath").

The screenshot inside the device is NOT independently selectable
unless the author wraps it in something with its own `data-ve-id`
(e.g. a `<figure>` around it). Typically the device frame and its
screenshot are treated as one selectable unit.

## Why the frame colour is `--vc-color-content`, not `#000`

The frame should adapt to the active theme:
- Light theme: `--vc-color-content` is typically a dark brown or
  near-black — the frame looks like a real device.
- Dark theme: `--vc-color-content` is typically a near-white — the
  frame looks like a white-bezel device, which integrates with the
  dark background. A pure `#000` frame in dark theme would
  disappear into the background.

The engine's content token is the right choice because it's the
"opposite-of-canvas" token by design — whatever colour produces
maximum contrast with the page background.

## Visual verification

Run the universal self-debug checklist before claiming the device
mockup is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For device-mockup correctness specifically:

- Open dev-browser. Verify the dimensions:
  ```js
  const device = document.querySelector('.la-device');
  console.log(device.getBoundingClientRect().width);   // matches --dev-w
  console.log(device.getBoundingClientRect().height);  // matches --dev-h
  ```
- Verify the notch is centred:
  ```js
  const notch = ... // pseudo-element, can't query directly
  // Visual check: take a screenshot, verify the notch is at x = w/2
  ```
- Verify the screen clip:
  - The screenshot inside should be clipped to the rounded
    screen rect (no square corners poking out).
- **R1 — Light + dark themes**: switch themes; the frame colour
  must change (light theme = dark frame; dark theme = light
  frame). If the frame is the same colour in both themes,
  `--vc-color-content` was overridden somewhere.
- **R2 — No nested scrollbars**: the `overflow: hidden` on the
  screen is a frame clip, not a content scroller. The
  screenshot inside is fixed-size (sized to fit the device), so
  no scrolling is expected.
- The "different device" check: change the `--dev-*` props to a
  different device (Pixel 8, iPad); verify the frame visually
  matches the device.
- The `.la-device--no-notch` check: add the modifier; verify
  the notch is hidden.
