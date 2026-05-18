# Navigation patterns — global, local, contextual, breadcrumb

## Table of Contents

- [Pattern 1 — Top nav bar (web app header)](#pattern-1--top-nav-bar-web-app-header)
- [Pattern 2 — Side nav (collapsible)](#pattern-2--side-nav-collapsible)
- [Pattern 3 — Bottom tabs (mobile only)](#pattern-3--bottom-tabs-mobile-only)
- [Pattern 4 — Breadcrumb (path-based hierarchy)](#pattern-4--breadcrumb-path-based-hierarchy)
- [Pattern 5 — Section nav (anchor scroll, in-page TOC)](#pattern-5--section-nav-anchor-scroll-in-page-toc)
- [Pattern 6 — Command palette (Ctrl-K search)](#pattern-6--command-palette-ctrl-k-search)
- [Account menu (avatar dropdown)](#account-menu-avatar-dropdown)
- [Notification badge convention](#notification-badge-convention)
- [Mobile drawer (hamburger menu)](#mobile-drawer-hamburger-menu)
- [Tabbed pages (header tabs within a screen)](#tabbed-pages-header-tabs-within-a-screen)

The full vocabulary for "how the user moves around". Six patterns:
top nav bar, side nav (sticky), bottom tabs (mobile), breadcrumb,
section nav (anchor scroll), command palette.

## Table of contents

- [Pattern 1 — Top nav bar (web app header)](#pattern-1--top-nav-bar-web-app-header)
- [Pattern 2 — Side nav (collapsible)](#pattern-2--side-nav-collapsible)
- [Pattern 3 — Bottom tabs (mobile only)](#pattern-3--bottom-tabs-mobile-only)
- [Pattern 4 — Breadcrumb (path-based hierarchy)](#pattern-4--breadcrumb-path-based-hierarchy)
- [Pattern 5 — Section nav (anchor scroll, in-page TOC)](#pattern-5--section-nav-anchor-scroll-in-page-toc)
- [Pattern 6 — Command palette (Ctrl-K search)](#pattern-6--command-palette-ctrl-k-search)
- [Account menu (avatar dropdown)](#account-menu-avatar-dropdown)
- [Notification badge convention](#notification-badge-convention)
- [Mobile drawer (hamburger menu)](#mobile-drawer-hamburger-menu)
- [Tabbed pages (header tabs within a screen)](#tabbed-pages-header-tabs-within-a-screen)

---

## Pattern 1 — Top nav bar (web app header)

The classic — logo on the left, nav links in the middle, account
menu + CTA on the right.

```html
<header class="wf-header" style="
  border-bottom:1px solid var(--vc-color-border);
  padding:12px 24px;
  display:flex;
  align-items:center;
  gap:24px;
">

  <span class="wf-text" data-wf-lines="1" style="font-weight:700;">
    brand
  </span>

  <nav class="wf-nav" style="flex:1;">
    <a class="wf-nav-item is-active" href="#screen-home">Home</a>
    <a class="wf-nav-item" href="#screen-features">Features</a>
    <a class="wf-nav-item" href="#screen-pricing">Pricing</a>
    <a class="wf-nav-item" href="#screen-docs">Docs</a>
  </nav>

  <a class="wf-nav-item" href="#screen-login">Log in</a>
  <a class="wf-button" href="#screen-signup">Sign up</a>

</header>
```

### Notes

- 4 sections from left to right: brand, primary nav, secondary
  actions, primary CTA.
- Brand uses bold weight, no link styling (always returns home —
  but at wireframe, no `href` needed for the brand).
- Nav links use `wf-nav-item`. The active one has `is-active`.
- "Log in" is a text link (de-emphasized); "Sign up" is a primary
  button (emphasized).

### Variants

- **App nav** (post-login): replace Log in/Sign up with an avatar
  dropdown.
- **Marketing nav with sub-menu**: each nav-item has a popover on
  hover with sub-pages.
- **Logo-only**: drop the nav links; minimal pages.

---

## Pattern 2 — Side nav (collapsible)

The desktop app's left sidebar. Already shown in
[`layout-archetypes.md`](layout-archetypes.md); this section adds
the collapsible variant.

### Expanded (full labels)

```html
<aside class="wf-sidebar" style="width:240px;">
  <a class="wf-nav-item is-active" href="#screen-dashboard">
    <span style="margin-right:8px;">📊</span> Dashboard
  </a>
  <a class="wf-nav-item" href="#screen-users">
    <span style="margin-right:8px;">👥</span> Users
  </a>
  <a class="wf-nav-item" href="#screen-billing">
    <span style="margin-right:8px;">💳</span> Billing
  </a>
  <hr class="wf-divider">
  <a class="wf-nav-item" href="#screen-settings">
    <span style="margin-right:8px;">⚙</span> Settings
  </a>
</aside>
```

### Collapsed (icon-only)

```html
<aside class="wf-sidebar" style="width:64px; padding:8px;">
  <a class="wf-nav-item is-active" href="#screen-dashboard"
     style="padding:12px; justify-content:center;
            font-size:20px;"
     title="Dashboard">📊</a>
  <a class="wf-nav-item" href="#screen-users"
     style="padding:12px; justify-content:center;
            font-size:20px;"
     title="Users">👥</a>
  <a class="wf-nav-item" href="#screen-billing"
     style="padding:12px; justify-content:center;
            font-size:20px;"
     title="Billing">💳</a>
  <hr class="wf-divider">
  <a class="wf-nav-item" href="#screen-settings"
     style="padding:12px; justify-content:center;
            font-size:20px;"
     title="Settings">⚙</a>
</aside>
```

### Notes

- Expanded width: 240px. Collapsed width: 64px.
- Icons in expanded mode are inline with text (smaller).
- Icons in collapsed mode are centered + larger.
- `title` attribute provides hover tooltip in collapsed mode.
- The toggle button (typically `←` / `→`) lives at the bottom of
  the sidebar or in the titlebar.

For a wireframe showing the COLLAPSED state on a desktop screen,
make sure the main content area's width adjusts (the grid
`grid-template-columns` changes from `240px 1fr` to `64px 1fr`).

---

## Pattern 3 — Bottom tabs (mobile only)

Already covered in [`mobile-screens.md`](mobile-screens.md). Recap:

```html
<nav class="wf-nav">
  <a class="wf-nav-item is-active" href="#screen-feed">Feed</a>
  <a class="wf-nav-item" href="#screen-search">Search</a>
  <a class="wf-nav-item" href="#screen-profile">Profile</a>
</nav>
```

The mobile archetype's CSS applies `justify-content: space-around`
to the bottom `wf-nav`.

### Icon-plus-label variant

```html
<nav class="wf-nav" style="padding:8px 0;">
  <a class="wf-nav-item is-active" href="#screen-feed"
     style="display:flex; flex-direction:column;
            align-items:center; gap:2px;">
    <span style="font-size:20px;">🏠</span>
    <span style="font-size:11px;">Feed</span>
  </a>
  <a class="wf-nav-item" href="#screen-search"
     style="display:flex; flex-direction:column;
            align-items:center; gap:2px;">
    <span style="font-size:20px;">🔍</span>
    <span style="font-size:11px;">Search</span>
  </a>
  <a class="wf-nav-item" href="#screen-profile"
     style="display:flex; flex-direction:column;
            align-items:center; gap:2px;">
    <span style="font-size:20px;">👤</span>
    <span style="font-size:11px;">Profile</span>
  </a>
</nav>
```

3 tabs is the minimum; 5 is the maximum. 4 is the most common.

---

## Pattern 4 — Breadcrumb (path-based hierarchy)

Show the user where they are in a deep hierarchy. Always above the
page title; never in the middle of the page.

```html
<nav style="display:flex; gap:8px;
            font-size:12px;
            color:var(--vc-color-content-subtle);
            margin-bottom:16px;">
  <a href="#screen-home">Home</a>
  <span>/</span>
  <a href="#screen-users">Users</a>
  <span>/</span>
  <a href="#screen-user-anna">Anna Chen</a>
  <span>/</span>
  <span class="wf-text" data-wf-lines="1"
        style="color:var(--vc-color-content);">Activity</span>
</nav>

<h1 class="wf-text" data-wf-lines="1">Activity</h1>
```

### Notes

- Small font (12px), subtle color.
- Path elements are LINKS (each `<a>`); the CURRENT page is plain
  text (not a link) AND dark content color.
- Separator is `/` (slash with spaces around it). Some products
  use `›` or `→`.

### When to use

- Deep hierarchies (3+ levels: Catalog / Category / Product /
  Reviews).
- Apps where the user might land via search and need orientation.
- Documentation sites.

### When NOT to use

- Flat hierarchies (a settings page with no sub-pages).
- Apps with a strong sidebar nav (the sidebar already shows
  location).

---

## Pattern 5 — Section nav (anchor scroll, in-page TOC)

A sidebar that scrolls with the page content — highlights the
current section. Used in long documentation pages.

```html
<main class="wf-main">
  <div style="display:grid; grid-template-columns:1fr 240px;
              gap:48px;
              align-items:flex-start;">

    <article style="display:flex; flex-direction:column; gap:24px;">

      <h1 class="wf-text" data-wf-lines="1">Long documentation page</h1>

      <section id="intro">
        <h2 class="wf-text" data-wf-lines="1">Introduction</h2>
        <p class="wf-text" data-wf-lines="5"></p>
      </section>

      <section id="install">
        <h2 class="wf-text" data-wf-lines="1">Installation</h2>
        <p class="wf-text" data-wf-lines="7"></p>
      </section>

      <section id="usage">
        <h2 class="wf-text" data-wf-lines="1">Usage</h2>
        <p class="wf-text" data-wf-lines="8"></p>
      </section>

      <section id="api">
        <h2 class="wf-text" data-wf-lines="1">API reference</h2>
        <p class="wf-text" data-wf-lines="12"></p>
      </section>

      <section id="examples">
        <h2 class="wf-text" data-wf-lines="1">Examples</h2>
        <p class="wf-text" data-wf-lines="6"></p>
      </section>

    </article>

    <aside style="position:sticky; top:24px;
                  display:flex; flex-direction:column; gap:4px;
                  border-left:1px solid var(--vc-color-border);
                  padding-left:16px;">

      <span class="wf-label" style="margin-bottom:8px;">ON THIS PAGE</span>

      <a href="#intro" class="wf-nav-item">Introduction</a>
      <a href="#install" class="wf-nav-item">Installation</a>
      <a href="#usage" class="wf-nav-item is-active">Usage</a>
      <a href="#api" class="wf-nav-item">API reference</a>
      <a href="#examples" class="wf-nav-item">Examples</a>

    </aside>

  </div>
</main>
```

### Notes

- 2-column grid: content + TOC sidebar.
- TOC is `position: sticky; top: 24px` — stays in view while
  scrolling.
- TOC has a left border + label header.
- Anchor links jump to the corresponding `<section id="…">`.
- The current section's link has `is-active`.

For a wireframe showing the TOC, the active item is the one
NEAREST the top of the viewport. In production, an IntersectionObserver
keeps the active state in sync with scroll position.

---

## Pattern 6 — Command palette (Ctrl-K search)

A modal search palette — open with Ctrl-K, search ANYTHING in the
app, navigate via keyboard.

```html
<div class="wf-overlay" data-ve-id="ovl-palette"
     data-ve-type="wireframe-block">
  <div class="wf-modal" style="width:min(640px, 90vw);
                                margin-top:96px;">

    <input class="wf-input"
           type="search"
           placeholder="Type a command or search…"
           style="font-size:18px;
                  padding:16px;
                  background:transparent;
                  border:none;
                  border-bottom:1px solid var(--vc-color-border);">

    <div style="display:flex; flex-direction:column; padding:8px;">

      <span class="wf-label" style="padding:8px 12px;">QUICK ACTIONS</span>

      <a href="#" style="display:flex; gap:12px;
                         padding:8px 12px;
                         text-decoration:none;
                         border-radius:6px;
                         background:var(--vc-color-surface-sunken);">
        <span style="font-size:18px;">+</span>
        <div style="flex:1;">
          <span class="wf-text" data-wf-lines="1"
                style="font-weight:600;">Create new post</span>
        </div>
        <span class="wf-chip">N</span>
      </a>

      <a href="#" style="display:flex; gap:12px;
                         padding:8px 12px;
                         text-decoration:none;
                         border-radius:6px;">
        <span style="font-size:18px;">⚙</span>
        <div style="flex:1;">
          <span class="wf-text" data-wf-lines="1">Open settings</span>
        </div>
        <span class="wf-chip">,</span>
      </a>

      <span class="wf-label" style="padding:16px 12px 8px;">PAGES</span>

      <a href="#screen-dashboard" style="display:flex; gap:12px;
                                           padding:8px 12px;
                                           text-decoration:none;
                                           border-radius:6px;">
        <span style="font-size:18px;">📊</span>
        <span class="wf-text" data-wf-lines="1">Dashboard</span>
      </a>

      <a href="#screen-users" style="display:flex; gap:12px;
                                       padding:8px 12px;
                                       text-decoration:none;
                                       border-radius:6px;">
        <span style="font-size:18px;">👥</span>
        <span class="wf-text" data-wf-lines="1">Users</span>
      </a>

    </div>

    <footer style="padding:8px 12px;
                   border-top:1px solid var(--vc-color-border);
                   font-size:12px;
                   color:var(--vc-color-content-subtle);
                   display:flex; gap:16px;">
      <span><kbd>↑↓</kbd> navigate</span>
      <span><kbd>↵</kbd> select</span>
      <span><kbd>esc</kbd> close</span>
    </footer>

  </div>
</div>
```

### Notes

- Top input is large + borderless — looks like a search box.
- Below the input, sections with `wf-label` headers (QUICK ACTIONS,
  PAGES, etc.).
- Each item is a flex row: icon + label + (optional) keyboard
  shortcut chip.
- The HIGHLIGHTED item (keyboard-focused) has a sunken background.
- Footer shows keyboard hints with `<kbd>` elements.

For a wireframe showing the palette, render the OPEN state with
some sample items. The user opens it via Ctrl-K (a JS keybinding
that isn't shown in the wireframe markup).

---

## Account menu (avatar dropdown)

The user-account popover triggered by clicking the avatar in the
top nav.

```html
<div style="position:relative;">

  <button style="display:flex; gap:8px; align-items:center;
                 background:transparent; border:none; cursor:pointer;">
    <span class="wf-avatar"></span>
    <span class="wf-text" data-wf-lines="1">Anna</span>
    <span>▾</span>
  </button>

  <!-- popover (positioned absolutely below) -->
  <div style="position:absolute;
              top:100%; right:0;
              min-width:240px;
              background:var(--vc-color-surface-raised);
              border:1px solid var(--vc-color-border);
              border-radius:6px;
              padding:4px;
              box-shadow:0 4px 24px rgba(0,0,0,0.15);
              z-index:10;">

    <div style="padding:8px 12px;">
      <span class="wf-text" data-wf-lines="1" style="font-weight:600;">Anna Chen</span>
      <span class="wf-text" data-wf-lines="1"
            style="font-size:12px;
                   color:var(--vc-color-content-subtle);">
        anna@example.com
      </span>
    </div>

    <hr class="wf-divider" style="margin:4px 0;">

    <a href="#screen-profile" style="display:block;
                                       padding:8px 12px;
                                       text-decoration:none;">Profile</a>
    <a href="#screen-settings" style="display:block;
                                        padding:8px 12px;
                                        text-decoration:none;">Settings</a>
    <a href="#screen-billing" style="display:block;
                                       padding:8px 12px;
                                       text-decoration:none;">Billing</a>

    <hr class="wf-divider" style="margin:4px 0;">

    <a href="#screen-help" style="display:block;
                                    padding:8px 12px;
                                    text-decoration:none;">Help & feedback</a>
    <a href="#screen-changelog" style="display:block;
                                          padding:8px 12px;
                                          text-decoration:none;">What's new</a>

    <hr class="wf-divider" style="margin:4px 0;">

    <a href="#screen-logout" style="display:block;
                                       padding:8px 12px;
                                       text-decoration:none;
                                       color:var(--vc-color-danger);">
      Log out
    </a>

  </div>
</div>
```

### Notes

- Trigger: avatar + name + `▾`.
- Popover header has the user's full name + email.
- Sections separated by dividers: account / help / sign out.
- Sign out is danger-tinted.

For a wireframe showing the menu, render it always-open.

---

## Notification badge convention

A red dot on a nav icon — indicating unread items.

```html
<a class="wf-nav-item" href="#screen-inbox" style="position:relative;">
  📬 Inbox
  <span style="position:absolute;
               top:8px; right:-6px;
               width:8px; height:8px;
               background:var(--vc-color-danger);
               border-radius:50%;"></span>
</a>
```

For a COUNT badge instead of a dot:

```html
<a class="wf-nav-item" href="#screen-inbox" style="position:relative;">
  📬 Inbox
  <span style="position:absolute;
               top:4px; right:-10px;
               min-width:16px;
               height:16px;
               padding:0 4px;
               background:var(--vc-color-danger);
               color:var(--vc-color-on-accent);
               border-radius:8px;
               font-size:11px;
               font-weight:600;
               display:inline-flex;
               align-items:center;
               justify-content:center;">3</span>
</a>
```

### Notes

- Dot for "unread exists" (boolean signal).
- Count for "you have N unread" (numeric signal).
- Cap the count at 99 (`99+` for higher).
- Tinted with `--vc-color-danger` for attention.

---

## Mobile drawer (hamburger menu)

A side drawer that slides in from the left when the user taps the
☰ icon. Already covered in [`mobile-screens.md`](mobile-screens.md).

Recap:

```html
<header class="wf-statusbar">
  <a href="#screen-drawer" class="wf-text" data-wf-lines="1">☰</a>
  <span class="wf-text" data-wf-lines="1">App title</span>
  <span></span>
</header>

<!-- on a separate wf-screen -->
<section class="wf-screen" id="screen-drawer">
  <div style="width:280px; height:100vh;
              background:var(--vc-color-surface-sunken);
              padding:24px;">
    <a class="wf-nav-item" href="#screen-home">Home</a>
    <a class="wf-nav-item" href="#screen-library">Library</a>
    <a class="wf-nav-item" href="#screen-profile">Profile</a>
    <a class="wf-nav-item" href="#screen-settings">Settings</a>
  </div>
</section>
```

The ☰ link navigates to the drawer screen; the drawer's items
navigate to their target screens (which close the drawer
naturally).

---

## Tabbed pages (header tabs within a screen)

Tabs within a single page — switch sub-views without changing the
URL much.

```html
<main class="wf-main">

  <h1 class="wf-text" data-wf-lines="1">User: Anna Chen</h1>

  <nav class="wf-nav" style="border-bottom:1px solid var(--vc-color-border);
                              gap:0;">
    <a class="wf-nav-item is-active" href="#screen-user-overview"
       style="border-bottom:2px solid var(--vc-color-content);
              padding-bottom:8px;">Overview</a>
    <a class="wf-nav-item" href="#screen-user-activity">Activity</a>
    <a class="wf-nav-item" href="#screen-user-billing">Billing</a>
    <a class="wf-nav-item" href="#screen-user-permissions">Permissions</a>
  </nav>

  <!-- the active tab's content -->
  <article class="wf-card">
    <p class="wf-text" data-wf-lines="6"></p>
  </article>

</main>
```

### Notes

- Active tab has a 2px bottom border + content color.
- Inactive tabs are muted.
- The whole `wf-nav` has a bottom border to mark the tab strip.
- For very long tab lists, allow horizontal scroll on the nav —
  BUT remember the wireframe rule: no nested scrollbars. Let the
  nav wrap to multiple lines instead, or use a popover for
  "more tabs".

For PILL tabs (alternative shape — rounded individual tabs instead
of underline):

```html
<nav style="display:flex; gap:4px; padding:4px;
            background:var(--vc-color-surface-sunken);
            border-radius:6px;
            width:fit-content;">
  <a class="wf-button" href="#tab-1">Overview</a>
  <a class="wf-button wf-button--ghost" href="#tab-2">Activity</a>
  <a class="wf-button wf-button--ghost" href="#tab-3">Billing</a>
</nav>
```

The active tab is a primary button; inactive tabs are ghost. The
whole pill bar has a sunken background.
