# Zoom image lightbox — click thumbnail → full view

A click-to-zoom image overlay using the `popover` attribute (or
`:target` for the JS-off baseline). Thumbnail clicks reveal the
full-resolution image centered with backdrop scrim. Click outside
or press ESC to close.

## What it is

Reports embed screenshots, diagrams, photos. A thumbnail in flow
is the right resting state — full-size every image and the page
becomes a magazine spread. But the reader needs to be able to
**inspect** an image; a lightbox is the cheapest, most familiar
overlay UX.

Two parallel implementations: `popover` for modern audiences,
`:target` for everyone (includes mobile Safari < 17). The
`popover` path is preferred.

## Scaffold — `popover` version

```html
<figure class="ic-zimg">
  <button type="button" class="ic-zimg-trig"
          popovertarget="zoom-1" aria-label="Open full size">
    <img src="screenshot.png" alt="Dashboard screenshot"
         class="ic-zimg-thumb">
  </button>
  <figcaption>Dashboard, week of May 12.</figcaption>
</figure>
<div id="zoom-1" popover="auto" class="ic-zimg-lightbox">
  <button type="button" class="ic-zimg-close"
          popovertarget="zoom-1" popovertargetaction="hide"
          aria-label="Close">×</button>
  <img src="screenshot.png" alt="Dashboard screenshot, full size">
</div>
```

`popovertargetaction="hide"` is the explicit close binding —
without it, the close button would re-open the popover (toggle is
the default action).

CSS:

```css
.ic-zimg-trig {
  display: inline-block;
  padding: 0;
  border: 0;
  background: none;
  cursor: zoom-in;
}
.ic-zimg-thumb {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  display: block;
}
.ic-zimg-lightbox {
  position: fixed;
  inset: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  border: none;
  background: color-mix(in srgb,
              var(--vc-color-content, #000) 80%, transparent);
  padding: var(--vc-space-5, 32px);
  /* NO inner overflow:auto — the image scales to fit and the
     popover takes the full viewport (no-nested-scrollbars exception
     for owned-viewport surfaces). */
  display: grid;
  place-items: center;
}
.ic-zimg-lightbox img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  border-radius: var(--vc-radius-md, 8px);
  cursor: zoom-out;
  box-shadow: var(--vc-shadow-3, 0 12px 32px rgba(0,0,0,0.4));
}
.ic-zimg-lightbox::backdrop {
  /* popover top-layer auto-applies a backdrop pseudo */
  background: transparent;   /* the popover bg already darkens */
}
.ic-zimg-close {
  position: absolute;
  top: var(--vc-space-3, 16px);
  right: var(--vc-space-3, 16px);
  width: 2.4em;
  height: 2.4em;
  border-radius: var(--vc-radius-full, 9999px);
  border: 0;
  background: color-mix(in srgb,
              var(--vc-color-canvas, #fff) 90%, transparent);
  color: var(--vc-color-content, #000);
  font: var(--vc-weight-bold, 700) 1.4em/1 var(--ve-control-font, inherit);
  cursor: pointer;
}
```

## Scaffold — `:target` fallback

For audiences on older mobile browsers:

```html
<figure class="ic-zimg">
  <a class="ic-zimg-trig" href="#zoom-1" aria-label="Open full size">
    <img src="screenshot.png" alt="Dashboard screenshot" class="ic-zimg-thumb">
  </a>
</figure>
<div id="zoom-1" class="ic-zimg-lightbox-target"
     role="dialog" aria-modal="true" aria-label="Full image">
  <a class="ic-zimg-close" href="#" aria-label="Close">×</a>
  <img src="screenshot.png" alt="Dashboard screenshot, full size">
  <a class="ic-zimg-scrim" href="#" aria-label="Close" tabindex="-1"></a>
</div>
```

CSS:

```css
.ic-zimg-lightbox-target {
  display: none;
}
.ic-zimg-lightbox-target:target {
  display: grid;
  place-items: center;
  position: fixed;
  inset: 0;
  z-index: var(--vc-z-modal, 400);
  padding: var(--vc-space-5, 32px);
}
.ic-zimg-scrim {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: color-mix(in srgb,
              var(--vc-color-content, #000) 80%, transparent);
}
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-content` | scrim color |
| `--vc-color-canvas` | close-button background |
| `--vc-shadow-3` | image lift |
| `--vc-radius-md` | thumb + full image corners |
| `--vc-radius-full` | close button |
| `--ve-control-border` | thumb border |
| `--vc-z-modal` | `:target` z-index |

## Selection / comment / decision-mini

- **The `<figure class="ic-zimg">` IS a selectable atom** — the
  whole "image + caption" unit. Comments attach there.
- **Decision-mini per figure** — Skip / Approve / Deny.
- **The lightbox itself is overlay-only** — no atom.

## JS-off degradation

**`popover` version** — works without JS in modern browsers
(the `popovertarget` attribute is browser-managed).

**`:target` version** — works without JS at all. The browser jumps
to `#zoom-1`, the `:target` CSS rule shows the overlay, the close
link navigates `href="#"` which clears the target.

Both paths give a working lightbox without JS. Mix them: ship
`popover` for the modern path AND `:target` as a true zero-JS
fallback (use `popovertarget` for the button + ALSO a `<noscript>`
block emitting the `:target` version).

## Anti-patterns

- A custom JS click-handler that toggles a `.is-open` class. Loses
  the native top-layer (the image lives in DOM order, so a later
  `position: relative` element overlaps it).
- Forgetting `popovertargetaction="hide"` on the close button. The
  button just re-toggles, opening it again immediately on the next
  click (since the popover was hidden BUT the click was on the
  trigger).
- Using `overflow: auto` on the lightbox to scroll a huge image.
  Violates no-nested-scrollbars. Use `max-width: 100%; max-height:
  100%` to fit; for genuinely huge images, link to the file
  directly (`<a href="screenshot.png" download>Download full size</a>`).
- Triggering the lightbox on hover. Touch users can't hover; users
  scroll past and the overlay opens accidentally.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Click the trigger — popover opens; ESC closes.
document.querySelector('.ic-zimg-trig').click();
const pop = document.getElementById('zoom-1');
console.assert(pop.matches(':popover-open'));
await page.keyboard.press('Escape');
console.assert(!pop.matches(':popover-open'));

// :target fallback — anchor jump opens.
location.hash = '#zoom-1';
// CSS-only: the rule `.ic-zimg-lightbox-target:target { display: grid }`
// fires; verify the element is now visible.
console.assert(getComputedStyle(document.getElementById('zoom-1')).display
               !== 'none');
location.hash = '';
```

Screenshot both: thumbnail in flow + lightbox open. Verify the
backdrop scrim is opaque enough to hide page content in both
themes (the `80%` mix should hold in light AND dark).
