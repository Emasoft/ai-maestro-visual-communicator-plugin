# Device frame — Mac (macOS window)

The `mac` device frame wraps content in a themed macOS desktop window
mockup — title bar with traffic-light buttons + title text +
content area. No URL bar (that's the `browser` frame). The classic
macOS app window archetype.

## What it renders

```
┌──────────────────────────┐  ← bezel (slim, sunken-surface)
│ • • •      Title         │  ← title bar
│ ┌──────────────────────┐ │
│ │                      │ │
│ │   <content slot>     │ │  ← .isvg-frame-content (overflow: auto)
│ │                      │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

Dimensions:

- Bezel: 760 x ~500 px (1440x900 scaled to fit nicely beside other
  frames).
- Screen: 470 tall, rounded 12px corners.
- Title bar: 9px top/bottom padding, 14px left/right, sunken-surface
  background with hairline bottom border.
- Traffic lights: 3 dots (12 x 12 px each, 8px gap).
- Title text: muted, 13px medium body font.

## Two authoring paths

### Path A — JS API

```js
var content = '<h1>Window content</h1><p>...</p>';
var frame = window.amvcpIconSvg.deviceFrame({
  kind: 'mac',
  title: 'My App',
  content: content
});
document.body.appendChild(frame);
```

### Path B — direct markup

```html
<div class="isvg-frame isvg-frame--mac wf-frame--mac"
     data-isvg-frame="mac">
  <div class="isvg-frame-screen">
    <div class="isvg-frame-titlebar">
      <span class="isvg-frame-lights" aria-hidden="true">
        <span class="isvg-frame-light isvg-frame-light--close"></span>
        <span class="isvg-frame-light isvg-frame-light--min"></span>
        <span class="isvg-frame-light isvg-frame-light--max"></span>
      </span>
      <span class="isvg-frame-title">My App</span>
    </div>
    <div class="isvg-frame-content">
      <h1>Window content</h1>
      <p>...</p>
    </div>
  </div>
</div>
```

## Required parameters (JS path)

| Parameter | Type | Required | Default |
|---|---|---|---|
| `kind` | `"mac"` | YES | — |
| `title` | string | no | `""` |
| `content` | HTMLElement \| string | no | empty |

`time` and `url` are IGNORED for Mac.

## The traffic lights

Three colored dots at the top-left of the title bar:

- **Close** (`--close`) → `var(--vc-color-danger)` (red).
- **Minimize** (`--min`) → `var(--vc-color-warning)` (amber).
- **Maximize** (`--max`) → `var(--vc-color-success)` (green).

The dots map 1:1 to the SEMANTIC ROLES — danger/warning/success.
This is INTENTIONAL: a theme change re-tints the traffic lights too,
which matches the rest of the page. An author who wants the literal
macOS Apple-red/amber/green can override those 3 tokens locally:

```css
.my-mac-frame {
  --vc-color-danger:  #ff5f56;  /* macOS classic red */
  --vc-color-warning: #ffbd2e;  /* macOS classic amber */
  --vc-color-success: #27c93f;  /* macOS classic green */
}
```

## CSS-only path classes

```css
.isvg-frame--mac, .isvg-frame--browser {
  inline-size: 760px;
  border-radius: 12px;
  padding: 0;
}
.isvg-frame--mac .isvg-frame-screen,
.isvg-frame--browser .isvg-frame-screen {
  block-size: 470px;
  border-radius: 12px;
}
```

`.wf-frame--mac` is the wireframe-skill alias.

## DESIGN.md tokens consumed

- `--vc-color-content` — bezel (a thin ink frame is the screen's outer
  shell)
- `--vc-color-surface` — screen background
- `--vc-color-surface-sunken` — title bar background (a slightly
  darker tint, differentiates from the content area)
- `--vc-color-border` — title bar's bottom hairline border
- `--vc-color-content-muted` — title text fill
- `--vc-color-danger` / `--vc-color-warning` / `--vc-color-success` —
  traffic lights (red / amber / green)
- `--vc-shadow-3` — bezel drop shadow
- `--vc-font-body` — title font

## Selection / comment / decision-mini

Not automatic — add `data-ve-id` manually if needed.

## When to use

- A native macOS app UI mockup.
- A development tool screenshot wrapped in a window.
- A side-by-side comparison with a browser frame.
- A desktop UI mockup for a marketing doc.

## When NOT to use

- For a web page screenshot — use the `browser` frame (it has the URL
  bar).
- For a Windows app — there's no Windows preset; hand-author or
  override the title-bar colors.
- For a Linux app — same as Windows; no preset, override colors.

## What NOT to do

- Do NOT add an URL bar — that's the `browser` frame.
- Do NOT make the title text bold or accent-colored — the muted ink
  is the macOS convention.
- Do NOT remove the traffic lights — the 3 colored dots are the
  signature macOS chrome.

## Visual verification

In both light AND dark:

- Title bar is visibly DIFFERENT from the content area background
  (the `--vc-color-surface-sunken` is a tint difference).
- Traffic lights are red / amber / green (or the theme-mapped
  versions).
- Title text is muted (lighter than primary ink).
- Hairline border between title bar and content area is visible.
- Content scrolls inside the 470px screen.
