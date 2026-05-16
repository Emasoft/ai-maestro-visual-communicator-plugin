# Device frame — iOS

The `ios` device frame wraps content in a themed iPhone mockup —
bezel + screen + Dynamic Island + status bar + home indicator. Built
as plain DOM + CSS (no React, no JSX, no toolchain) so it composes
into any HTML page. The content can be any HTML — a real UI, a
screenshot `<img>`, an inline `<svg>`, or a wireframe placeholder.

## What it renders

```
┌──────────────────────────┐  ← bezel (ink-colored)
│ ┌──────────────────────┐ │
│ │ ╶─── (island) ────╴  │ │  ← Dynamic Island (centered)
│ │ 9:41    📶 📶 🔋     │ │  ← status bar
│ │                      │ │
│ │   <content slot>     │ │  ← .isvg-frame-content (overflow: auto)
│ │                      │ │
│ │ ───── (home bar) ─── │ │  ← home indicator (bottom)
│ └──────────────────────┘ │
└──────────────────────────┘
```

Dimensions:

- Bezel (`.isvg-frame--ios`): 390 x 844 (the canonical iPhone width
  + auto height for the screen).
- Screen (`.isvg-frame-screen`): 820 tall (after the 12px bezel
  inset), rounded 45px corners.
- Dynamic Island: 122 x 34, centered, ink-colored, rounded
  `--vc-radius-full`.
- Status bar: 14px top padding, 32px side padding, displays time +
  signal/wifi/battery glyphs.
- Home indicator: 134 x 5 px pill at the bottom, 8px from the bottom
  edge, ink-colored.

## Two authoring paths

### Path A — JS API

```js
var content = document.createElement('div');
content.innerHTML = '<h1>Profile</h1><p>...</p>';

var frame = window.amvcpIconSvg.deviceFrame({
  kind: 'ios',
  time: '9:41',
  content: content       // HTMLElement OR string OR omitted
});

document.body.appendChild(frame);
```

### Path B — direct markup (uses the injected CSS)

```html
<div class="isvg-frame isvg-frame--ios wf-frame--ios"
     data-isvg-frame="ios">
  <div class="isvg-frame-screen">
    <div class="isvg-frame-island" aria-hidden="true"></div>
    <div class="isvg-frame-statusbar">
      <span class="isvg-frame-time">9:41</span>
      <span class="isvg-frame-statusicons">
        <!-- signal / wifi / battery glyphs (inline SVGs) -->
      </span>
    </div>
    <div class="isvg-frame-content">
      <h1>Profile</h1>
      <p>...</p>
    </div>
  </div>
</div>
```

The CSS-only path requires no JS but you have to hand-author the
status icons (the JS path injects them automatically). For most
cases the JS path is cleaner.

## Required parameters (JS path)

| Parameter | Type | Required | Default |
|---|---|---|---|
| `kind` | `"ios"` | YES | — |
| `content` | HTMLElement \| string | no | empty |
| `time` | string | no | `"9:41"` (the canonical iPhone marketing time) |

`title` and `url` are IGNORED for iOS — those are mac/browser fields.

## Status bar glyphs

The status bar contains 3 small inline SVGs, all `currentColor`-filled
so they inherit `--vc-color-content`:

- **Signal** — 4 ascending bars (rect heights 4 / 7 / 10 / 12).
- **WiFi** — a path with an arc-down + a fan shape.
- **Battery** — a rounded rect outline + a filled inner rect + a tip.

The glyphs are NOT parameterized — they're a fixed visual chrome.
Don't customize.

## The home indicator

A 134 x 5 px ink-colored pill at `inset-block-end: 8px`. Always
present, always ink-colored, always centered. Symbolizes the iOS
home-bar gesture affordance. Distinguishes the iOS frame from the
Android frame (which has a 108 x 4 muted-color gesture bar).

## Dynamic Island

122 x 34 ink-colored rounded pill at `inset-block-start: 12px`,
centered. Symbolizes the iPhone 14 Pro+ Dynamic Island feature.
Always present on iOS frames (the older notch is NOT a separate
variant).

## CSS-only path classes

The injected `amvcp-icon-svg.js` CSS defines:

```css
.isvg-frame--ios {
  inline-size: 390px;
  border-radius: 55px;
  padding: 12px;
}
.isvg-frame--ios .isvg-frame-screen {
  block-size: 820px;
  border-radius: 45px;
}
```

The `.wf-frame--ios` alias is the shared class with the `wireframe`
skill — both skills consume the SAME CSS, so a wireframe page can
place an iOS mockup without importing icon-svg's JS API.

## DESIGN.md tokens consumed

- `--vc-color-content` — bezel + Dynamic Island + home indicator
- `--vc-color-surface` — screen background
- `--vc-color-content` — content text + status bar text
- `--vc-shadow-3` — the bezel's drop shadow
- `--vc-font-body` — status bar font

## The `.isvg-frame-content` overflow: auto carve-out

The `.isvg-frame-content` element has `overflow: auto` — the ONE
sanctioned inner scroller in the entire icon-svg module. A phone
screen is a FIXED-VIEWPORT application surface (the explicit
carve-out in the no-nested-scrollbars rule); content exceeding the
820px screen height legitimately scrolls INSIDE the mockup. Every
OTHER `.isvg-*` element stays `overflow: visible`.

## Selection / comment / decision-mini

iOS frames are NOT scene-graph primitives, so they do NOT get
automatic `data-ve-id` injection. To make the frame selectable, add
`data-ve-id="<frame-id>" data-ve-type="device-frame"` to the
`.isvg-frame` element manually, then call the runtime's
`enhanceFocus()` if you need tabindex too.

## When to use

- iPhone mockup wrapping a real UI screenshot.
- iPhone mockup wrapping a wireframe placeholder UI.
- iPhone mockup wrapping a designed-for-mobile prototype.
- Hero figure in a mobile design doc.
- Side-by-side comparison with an Android frame.

## When NOT to use

- For an iPad — there's no iPad preset; hand-author with `mac`
  dimensions OR add to the FRAME_KINDS table.
- For an older iPhone with a notch (instead of Dynamic Island) — not
  a separate preset; the Dynamic Island is the standardized icon-svg
  iOS frame.
- For a generic "phone" wrapper — pick iOS or Android; there's no
  neutral phone preset.

## What NOT to do

- Do NOT pass an unknown `kind` — throws.
- Do NOT modify the screen dimensions inline — the 390x844 is
  authoritative; modifying breaks the proportions.
- Do NOT add `overflow: auto` to elements other than
  `.isvg-frame-content` — violates the no-nested-scrollbars rule.

## Visual verification

In both light AND dark:

- Bezel is INK (dark in light theme, dark in dark theme — ink is the
  device's color, not a theme accent).
- Dynamic Island is INK (matches bezel).
- Home indicator is INK at the bottom.
- Status bar text is readable (ink color against surface
  background).
- Content area scrolls when content exceeds 820px (the ONE
  sanctioned inner scroller).

Compare side-by-side with an Android frame to confirm visual
distinction: iOS has the Dynamic Island + ink home indicator;
Android has the punch-hole camera + muted gesture bar.
