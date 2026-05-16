# Device frame — Browser

The `browser` device frame wraps content in a themed browser-window
mockup — title bar with traffic lights + a tab label + URL bar +
content area. Visually similar to the `mac` frame but with an URL
bar added between the title bar and the content. The canonical "web
page screenshot" wrapper.

## What it renders

```
┌──────────────────────────┐  ← bezel
│ • • •  Page Title        │  ← title bar (traffic lights + tab label)
│ ┌─ https://example.com ─┐│  ← URL bar (mono font)
│ │                        ││
│ │   <content slot>       ││  ← .isvg-frame-content (overflow: auto)
│ │                        ││
│ └────────────────────────┘│
└──────────────────────────┘
```

Dimensions:

- Bezel: 760 x (~500) px — same as `mac` (1440x900 scaled).
- Screen: 470 tall, rounded 12px corners.
- Title bar: 9px top/bottom padding, traffic lights + tab label.
- URL bar: 7px top/bottom padding, sunken background, with the URL in
  a monospace pill.

## Two authoring paths

### Path A — JS API

```js
var content = '<h1>Welcome</h1><p>...</p>';
var frame = window.amvcpIconSvg.deviceFrame({
  kind: 'browser',
  title: 'Example',
  url: 'https://example.com/products',
  content: content
});
document.body.appendChild(frame);
```

### Path B — direct markup

```html
<div class="isvg-frame isvg-frame--browser wf-frame--browser"
     data-isvg-frame="browser">
  <div class="isvg-frame-screen">
    <div class="isvg-frame-titlebar">
      <span class="isvg-frame-lights" aria-hidden="true">
        <span class="isvg-frame-light isvg-frame-light--close"></span>
        <span class="isvg-frame-light isvg-frame-light--min"></span>
        <span class="isvg-frame-light isvg-frame-light--max"></span>
      </span>
      <span class="isvg-frame-tab">Example</span>
    </div>
    <div class="isvg-frame-urlbar">
      <span class="isvg-frame-url">https://example.com/products</span>
    </div>
    <div class="isvg-frame-content">
      <h1>Welcome</h1>
      <p>...</p>
    </div>
  </div>
</div>
```

## Required parameters (JS path)

| Parameter | Type | Required | Default |
|---|---|---|---|
| `kind` | `"browser"` | YES | — |
| `title` | string | no | `"New Tab"` (default tab label) |
| `url` | string | no | `""` |
| `content` | HTMLElement \| string | no | empty |

`time` is IGNORED for browser.

## The URL bar

A `.isvg-frame-urlbar` block sitting between the title bar and the
content area:

- Sunken-surface background (the same `--vc-color-surface-sunken`
  used for the title bar — visual continuity).
- Hairline `--vc-color-border` bottom (separates from content).
- The URL itself is in a `.isvg-frame-url` pill — surface-colored
  background, small `--vc-radius-sm` corners, monospace font.

The URL is `esc()`-escaped — passing `"javascript:alert(1)"` won't
execute; the URL is purely visual.

## The tab label

A `.isvg-frame-tab` text element to the right of the traffic lights.
The page's title or document name. Defaults to `"New Tab"` (the
classic Chromium-empty-tab placeholder).

## CSS-only path classes

Same dimensions as `mac` (shared CSS):

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

Additional browser-only CSS:

```css
.isvg-frame-urlbar {
  padding: 7px 14px;
  background: var(--vc-color-surface-sunken, #f1ece0);
  border-block-end: 1px solid
    var(--vc-color-border, #e3dcc9);
}
.isvg-frame-url {
  display: block;
  padding: 5px 12px;
  background: var(--vc-color-surface, #ffffff);
  border-radius: var(--vc-radius-sm, 4px);
  font: 400 12px/1.4 var(--vc-font-mono, ui-monospace, monospace);
  color: var(--vc-color-content-muted, #5b5343);
}
```

`.wf-frame--browser` is the wireframe-skill alias.

## DESIGN.md tokens consumed

- Same as `mac`, plus:
- `--vc-color-surface` — URL pill background
- `--vc-color-content-muted` — URL pill text fill
- `--vc-radius-sm` — URL pill corner radius
- `--vc-font-mono` — URL pill font family

## Selection / comment / decision-mini

Not automatic — add `data-ve-id` manually if needed.

## When to use

- A web page screenshot wrapped in a browser window.
- A SaaS dashboard mockup.
- A web-based prototype demo.
- A side-by-side comparison with an iOS mockup (mobile vs web).
- A marketing page showing "your app in a browser".

## When NOT to use

- For a native desktop app — use the `mac` frame (no URL bar).
- For a single browser tab without window chrome — hand-author just
  the URL bar.
- For a browser with extension chrome / multiple tabs / address bar
  buttons — the icon-svg browser preset is a SIMPLIFIED chrome (one
  tab, one URL, no bookmarks); for richer chrome, hand-author.

## What NOT to do

- Do NOT put HTML elements inside `.isvg-frame-url` — it's a single
  text pill, not a layout container.
- Do NOT remove the title bar — the traffic lights + tab label is
  the signature browser chrome.
- Do NOT use the `browser` frame for a native app — the URL bar is
  the visual cue that says "this is a web page".

## Visual verification

In both light AND dark:

- Title bar shows traffic lights + tab label.
- URL bar is visible between title bar and content (the visual
  distinction from `mac`).
- URL text is in monospace (the visual cue for "this is a real URL").
- URL pill has rounded corners (`--vc-radius-sm`).
- Content scrolls inside the 470px screen.

Compare side-by-side with `mac` — the URL bar is the only visual
difference. If you can't see it, the URL bar styling didn't load —
check that `amvcp-icon-svg.js`'s CSS was injected.
