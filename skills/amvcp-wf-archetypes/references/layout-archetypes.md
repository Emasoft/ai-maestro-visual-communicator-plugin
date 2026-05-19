# Layout archetypes — 4 copy-paste page skeletons

The kit gives you 19 blocks; the archetypes tell you how to ARRANGE
them into the most common page shapes. Pick one archetype per
`.wf-screen`; mix archetypes across screens in the same `.wf-root`.

## Table of contents

- [The 4 archetypes — when to choose which](#the-4-archetypes--when-to-choose-which)
- [Archetype 1 — `wf-archetype--app` (desktop app chrome)](#archetype-1--wf-archetype--app-desktop-app-chrome)
- [Archetype 2 — `wf-archetype--web` (standard web page)](#archetype-2--wf-archetype--web-standard-web-page)
- [Archetype 3 — `wf-archetype--mobile` (narrow mobile screen)](#archetype-3--wf-archetype--mobile-narrow-mobile-screen)
- [Archetype 4 — `wf-archetype--modal` (overlay dialog)](#archetype-4--wf-archetype--modal-overlay-dialog)
- [Composing archetypes — modal-over-anything pattern](#composing-archetypes--modal-over-anything-pattern)
- [Grid debugging — visualising the template areas](#grid-debugging--visualising-the-template-areas)

---

## The 4 archetypes — when to choose which

| Archetype | Shape | When |
|---|---|---|
| `wf-archetype--app` | titlebar / sidebar / main / statusbar | Desktop application (mail, IDE, terminal, productivity) |
| `wf-archetype--web` | header / nav / main / footer | Marketing site, blog, docs, product page |
| `wf-archetype--mobile` | status / main / tab bar | Mobile app, mobile-first web |
| `wf-archetype--modal` | overlay + centered dialog | Confirmation, settings, quick form |

The archetypes are thin wrappers — each sets a `grid` or `flex`
template + a `gap`. They are self-contained (no hard dependency on
the sibling `layout` skill). All set `overflow: visible` so a long
screen extends the page; never an inner scrollbox.

---

## Archetype 1 — `wf-archetype--app` (desktop app chrome)

A classic four-region desktop app: titlebar across the top, sidebar
on the left, main content filling the remaining cell, statusbar
across the bottom.

```html
<section class="wf-screen" id="screen-app" data-ve-id="screen-app"
         data-ve-type="wireframe-screen">
  <div class="wf-archetype--app">
    <header class="wf-titlebar" data-ve-id="tb-app" data-ve-type="wireframe-block">
      <span class="wf-traffic-lights">
        <span></span><span></span><span></span>
      </span>
      <span class="wf-text" data-wf-lines="1">Mailbox</span>
    </header>

    <aside class="wf-sidebar" data-ve-id="side-app" data-ve-type="wireframe-block">
      <a class="wf-nav-item is-active" href="#screen-inbox">Inbox</a>
      <a class="wf-nav-item" href="#screen-sent">Sent</a>
      <a class="wf-nav-item" href="#screen-drafts">Drafts</a>
      <hr class="wf-divider">
      <a class="wf-nav-item" href="#screen-settings">Settings</a>
    </aside>

    <main class="wf-main" data-ve-id="main-app" data-ve-type="wireframe-block">
      <article class="wf-card">
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Today</span>
        </header>
        <p class="wf-text" data-wf-lines="4"></p>
      </article>
    </main>

    <footer class="wf-statusbar" data-ve-id="sb-app" data-ve-type="wireframe-block">
      <span>Synced</span>
      <span>120 messages</span>
    </footer>
  </div>
</section>
```

### Grid template

```css
.wf-archetype--app {
  display: grid;
  grid-template-columns: var(--wf-sidebar-w) 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "titlebar titlebar"
    "sidebar  main"
    "statusbar statusbar";
  gap: 0;
}
```

- Sidebar width is `--wf-sidebar-w` (~240px). Override at `.wf-root`
  for a denser nav: `style="--wf-sidebar-w: 200px;"`.
- Titlebar and statusbar span both columns.
- `gap: 0` because the kit blocks have 1px borders that look right
  flush against each other (no double-border seam).

### When to choose

- A native app mockup (mail, calendar, IDE, terminal, file manager).
- A web app that mimics native chrome (Linear, Notion, Discord style).
- ANY screen that needs persistent left navigation plus a status
  strip.

### Variants

- **No statusbar** — omit `<footer class="wf-statusbar">` and
  change `grid-template-rows` to `auto 1fr` via inline style.
- **Right sidebar** — author a second `wf-sidebar` and re-template
  the columns: `grid-template-columns: 1fr var(--wf-sidebar-w);`
  with `"titlebar titlebar" / "main sidebar" / …`.
- **Split main** — nest two `wf-card` blocks side-by-side inside
  `wf-main` using `display: flex; gap`.

---

## Archetype 2 — `wf-archetype--web` (standard web page)

A vertical column: header, optional nav, main (capped at 72ch wide
and centered), optional footer.

```html
<section class="wf-screen" id="screen-landing" data-ve-id="screen-landing"
         data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">
    <header class="wf-header" data-ve-id="hdr-landing" data-ve-type="wireframe-block">
      <span class="wf-text" data-wf-lines="1">brand</span>
      <nav class="wf-nav">
        <a class="wf-nav-item is-active" href="#screen-landing">Home</a>
        <a class="wf-nav-item" href="#screen-pricing">Pricing</a>
        <a class="wf-nav-item" href="#screen-contact">Contact</a>
      </nav>
    </header>

    <main class="wf-main" data-ve-id="main-landing" data-ve-type="wireframe-block">
      <figure class="wf-image" data-ve-id="hero-img" data-ve-type="wireframe-block"></figure>
      <h1 class="wf-text" data-wf-lines="1">Hero title</h1>
      <p class="wf-text" data-wf-lines="3"></p>
      <button class="wf-button">Get started</button>
    </main>

    <footer class="wf-header" data-ve-id="ftr-landing" data-ve-type="wireframe-block">
      <span class="wf-text" data-wf-lines="1">© 2026</span>
      <span class="wf-text" data-wf-lines="1">brand inc</span>
    </footer>
  </div>
</section>
```

### Flex template

```css
.wf-archetype--web {
  display: flex;
  flex-direction: column;
  gap: var(--vc-space-3, 16px);
}
.wf-archetype--web > .wf-main {
  max-inline-size: var(--wf-measure);   /* 72ch */
  margin-inline: auto;
  width: 100%;
}
```

- Main is centered and capped at `--wf-measure` (72ch) for
  readability. Override to widen (`--wf-measure: 100ch`) or remove
  the cap (`max-inline-size: none`).
- Header and footer go edge-to-edge (no `max-inline-size`).

### When to choose

- Landing page, product page, pricing page, blog post.
- Documentation page, marketing site, contact form.
- ANY screen the user enters via a URL (not via an app dock).

### Variants

- **Hero + content** — the hero `wf-image` plus a one-line `wf-text`
  title plus a paragraph plus a CTA `wf-button`. The most common
  landing pattern.
- **3-column features** — replace the hero with a `display: grid;
  grid-template-columns: repeat(3, 1fr); gap: --vc-space-4` of three
  `wf-card` blocks.
- **Long-scroll documentation** — multiple `wf-card` sections
  stacked, each with a `wf-card__title` + a `wf-text` body.

---

## Archetype 3 — `wf-archetype--mobile` (narrow mobile screen)

A narrow column (390px = iPhone Pro) with a status strip at top, a
content region in the middle, and a horizontal `wf-nav` at the
bottom (the tab bar, with `justify-content: space-around`).

```html
<section class="wf-screen" id="screen-mobile" data-ve-id="screen-mobile"
         data-ve-type="wireframe-screen">
  <div class="wf-archetype--mobile">
    <header class="wf-statusbar" data-ve-id="sb-mobile" data-ve-type="wireframe-block">
      <span>9:41</span>
      <span>·•·</span>
    </header>

    <main class="wf-main" data-ve-id="main-mobile" data-ve-type="wireframe-block">
      <article class="wf-card">
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Feed</span>
        </header>
        <p class="wf-text" data-wf-lines="3"></p>
      </article>
      <article class="wf-card">
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Update</span>
        </header>
        <p class="wf-text" data-wf-lines="2"></p>
      </article>
    </main>

    <nav class="wf-nav" data-ve-id="tab-mobile" data-ve-type="wireframe-block">
      <a class="wf-nav-item is-active" href="#screen-mobile">Feed</a>
      <a class="wf-nav-item" href="#screen-search">Search</a>
      <a class="wf-nav-item" href="#screen-profile">Profile</a>
    </nav>
  </div>
</section>
```

### Flex template

```css
.wf-archetype--mobile {
  display: flex;
  flex-direction: column;
  inline-size: var(--wf-mobile-w);    /* 390px */
  max-inline-size: 100%;
  margin-inline: auto;
}
.wf-archetype--mobile > .wf-nav {
  justify-content: space-around;       /* bottom tab bar pattern */
}
```

- Width is `--wf-mobile-w` (390px). Override for tablet:
  `style="--wf-mobile-w: 768px"`.
- The bottom `wf-nav`'s items distribute evenly across the width
  (not the default `gap`-based layout).
- `margin-inline: auto` centers the column in a wider page.

### When to choose

- Any mobile app screen.
- A mobile-first web design where the desktop is a later concern.
- Pair with a device frame (`wf-frame--ios` or `wf-frame--android`)
  to render the app on hardware bezels — see
  [`device-frames.md`](device-frames.md).

### Variants

- **No status bar** — omit the status `<header>`; the device frame's
  own `wf-frame__statusbar` takes over.
- **No tab bar** — omit the bottom `<nav>`; suitable for full-screen
  flows like onboarding or a modal-overlay screen.
- **Floating action button** — author a `wf-button` with
  `position: absolute; bottom: 80px; right: 16px` inside
  `wf-main` as the canonical FAB pattern.

---

## Archetype 4 — `wf-archetype--modal` (overlay dialog)

A wrapper that hosts a `wf-overlay` + `wf-modal` pair. Usually
overlaid ON TOP of another archetype's screen — the underlying
screen stays visible behind the scrim.

```html
<div class="wf-archetype--modal">
  <div class="wf-overlay" data-ve-id="ovl-delete" data-ve-type="wireframe-block">
    <div class="wf-modal" data-ve-id="mdl-delete" data-ve-type="wireframe-block">
      <h2 class="wf-text" data-wf-lines="1">Delete this draft?</h2>
      <p class="wf-text" data-wf-lines="2"></p>
      <div class="wf-modal__actions">
        <button class="wf-button wf-button--ghost">Cancel</button>
        <button class="wf-button">Delete</button>
      </div>
    </div>
  </div>
</div>
```

### Positioning

```css
.wf-archetype--modal {
  position: relative;
}
.wf-overlay {
  /* dimming background — themed off --vc-color-content */
  background: color-mix(in srgb,
    var(--vc-color-content, #1f1a14) 45%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block: var(--vc-space-6, 48px);
}
.wf-modal {
  width: min(440px, 90vw);
  margin-inline: auto;
}
```

- The overlay is `display: flex; align-items: center` — the modal is
  vertically centered in the overlay's height (`padding-block` keeps
  a comfortable top/bottom margin).
- The scrim color is `color-mix` of `--vc-color-content` 45% over
  transparent — themes off the FOREGROUND content color, so a light
  theme gets a soft-black scrim and a dark theme gets a soft-white
  scrim. No raw `rgba()` (which would be a hardcoded color).

### When to choose

- A confirmation dialog (delete, sign out, discard changes).
- A short form that should NOT push the rest of the page down (an
  invite-by-email, a profile edit, a password change).
- An onboarding step that needs to interrupt the main flow.

### What NOT to put in a modal

- Long forms — they should be a full screen, not a modal (mobile
  modals especially become unusable past about three fields).
- Anything the user might want to read for >30 seconds — that's a
  detail screen, not a modal.
- A confirmation for an action the user can easily undo — that's
  noise; just do the action and offer Undo on a toast.

---

## Composing archetypes — modal-over-anything pattern

A modal is rarely a screen on its own. The pattern is: render the
underlying screen normally, then APPEND a `wf-archetype--modal`
section AFTER it inside the same `wf-screen`, OR render the modal in
a separate screen and link to it with an anchor `#screen-modal-x`.

```html
<section class="wf-screen" id="screen-inbox" data-ve-id="screen-inbox"
         data-ve-type="wireframe-screen">
  <!-- the app chrome — visible behind the scrim -->
  <div class="wf-archetype--app">…</div>

  <!-- the modal — overlaid on top -->
  <div class="wf-archetype--modal" style="position: absolute; inset: 0;">
    <div class="wf-overlay">…</div>
  </div>
</section>
```

The `position: absolute; inset: 0` on the modal archetype paints the
overlay across the full screen on top of the underlying archetype.
The parent `wf-screen` becomes the positioning context (relative).

For a wireframe-level mockup, the absolute positioning is usually
overkill — just stack the modal BENEATH the app chrome in document
flow, with a `wf-divider` separating them. The reader understands
"this modal opens FROM that app" by reading the title.

---

## Grid debugging — visualising the template areas

When an `wf-archetype--app` looks wrong (sidebar in the wrong column,
titlebar swallowed by the main area), add a temporary debug
stylesheet:

```css
.wf-archetype--app > * {
  outline: 2px solid magenta;
}
.wf-archetype--app > .wf-titlebar  { outline-color: red; }
.wf-archetype--app > .wf-sidebar   { outline-color: green; }
.wf-archetype--app > .wf-main      { outline-color: blue; }
.wf-archetype--app > .wf-statusbar { outline-color: purple; }
```

If a child does NOT show its colored outline, it's not a direct child
of `.wf-archetype--app` and the `grid-area` rule (which targets
`> .wf-titlebar`, `> .wf-sidebar`, …) is not matching. Move it up a
level in the markup.

Remove the debug stylesheet before publishing — magenta outlines are
not subtle.
