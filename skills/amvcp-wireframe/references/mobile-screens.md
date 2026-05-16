# Mobile screens — common mobile app patterns

Six canonical mobile-app screen shapes you'll author dozens of times.
All use `wf-archetype--mobile` (390px wide). Pair with a device frame
(`wf-frame--ios` or `wf-frame--android`) for marketing screenshots.

## Table of contents

- [Pattern 1 — Feed (vertical scroll list)](#pattern-1--feed-vertical-scroll-list)
- [Pattern 2 — Detail (header + body + actions)](#pattern-2--detail-header--body--actions)
- [Pattern 3 — Search (input + filter chips + result list)](#pattern-3--search-input--filter-chips--result-list)
- [Pattern 4 — Profile (avatar header + stats grid + sections)](#pattern-4--profile-avatar-header--stats-grid--sections)
- [Pattern 5 — Compose (form + send action)](#pattern-5--compose-form--send-action)
- [Pattern 6 — Empty state (illustration + CTA)](#pattern-6--empty-state-illustration--cta)
- [Bottom-tab convention](#bottom-tab-convention)
- [Floating-action-button (FAB) convention](#floating-action-button-fab-convention)
- [Pull-to-refresh affordance](#pull-to-refresh-affordance)
- [Modal sheets — the half-screen drawer](#modal-sheets--the-half-screen-drawer)

---

## Pattern 1 — Feed (vertical scroll list)

The most common mobile screen — a stack of cards, each with image +
title + body + meta. Tap a card to navigate to its detail screen.

```html
<section class="wf-screen" id="screen-feed"
         data-ve-id="screen-feed" data-ve-type="wireframe-screen">
  <div class="wf-archetype--mobile">

    <header class="wf-statusbar">
      <span>9:41</span>
      <span class="wf-text" data-wf-lines="1">Feed</span>
      <span>·•·</span>
    </header>

    <main class="wf-main">

      <a class="wf-card" href="#screen-detail-1"
         data-ve-id="card-feed-1" data-ve-type="wireframe-block">
        <figure class="wf-image"></figure>
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Item title</span>
        </header>
        <p class="wf-text" data-wf-lines="2"></p>
        <footer style="display:flex; gap:8px; align-items:center;">
          <span class="wf-avatar"></span>
          <span class="wf-text" data-wf-lines="1">Author · 2h</span>
        </footer>
      </a>

      <a class="wf-card" href="#screen-detail-2">…</a>
      <a class="wf-card" href="#screen-detail-3">…</a>

    </main>

    <nav class="wf-nav">
      <a class="wf-nav-item is-active" href="#screen-feed">Feed</a>
      <a class="wf-nav-item" href="#screen-search">Search</a>
      <a class="wf-nav-item" href="#screen-profile">Profile</a>
    </nav>

  </div>
</section>
```

### Notes

- Each card is a CLICKABLE anchor (`<a class="wf-card" href="…">`).
  The whole card becomes the tap target.
- Card structure: image → title → body → meta (avatar + author +
  time). The meta footer uses inline `style` for a quick flex row;
  for many cards, extract to a real CSS class.
- The bottom `wf-nav` is the tab bar (the mobile archetype's CSS
  applies `justify-content: space-around`).

---

## Pattern 2 — Detail (header + body + actions)

The screen you land on after tapping a feed card. Big hero image,
title, body, actions.

```html
<section class="wf-screen" id="screen-detail-1"
         data-ve-id="screen-detail-1" data-ve-type="wireframe-screen">
  <div class="wf-archetype--mobile">

    <header class="wf-statusbar">
      <a href="#screen-feed" class="wf-text" data-wf-lines="1">← Back</a>
      <span></span>
      <span class="wf-text" data-wf-lines="1">Share</span>
    </header>

    <main class="wf-main">
      <figure class="wf-image" style="min-height: 260px;"></figure>

      <header>
        <h1 class="wf-text" data-wf-lines="2"></h1>
        <div style="display:flex; gap:8px; align-items:center; margin-top:8px;">
          <span class="wf-avatar"></span>
          <span class="wf-text" data-wf-lines="1">Author · 2h</span>
        </div>
      </header>

      <p class="wf-text" data-wf-lines="8"></p>

      <hr class="wf-divider">

      <footer style="display:flex; gap:8px;">
        <button class="wf-button wf-button--ghost">Save</button>
        <button class="wf-button">Continue</button>
      </footer>
    </main>

  </div>
</section>
```

### Notes

- The hero image is taller than default (`min-height: 260px` instead
  of the default ~128px) — a hero on a detail screen wants real
  presence.
- No tab bar — detail screens typically replace the tab bar with a
  primary action footer (Save / Continue). The user can still
  navigate back via the `← Back` link in the status bar.
- The `wf-divider` separates content from actions.

---

## Pattern 3 — Search (input + filter chips + result list)

A search input at the top, filter chips below, scrollable results.

```html
<section class="wf-screen" id="screen-search"
         data-ve-id="screen-search" data-ve-type="wireframe-screen">
  <div class="wf-archetype--mobile">

    <header class="wf-statusbar">
      <span>9:41</span>
      <span></span>
      <span>·•·</span>
    </header>

    <header class="wf-header">
      <input class="wf-input" placeholder="Search">
    </header>

    <nav class="wf-nav" style="overflow-x:visible; flex-wrap:wrap;">
      <span class="wf-chip">All</span>
      <span class="wf-chip">Articles</span>
      <span class="wf-chip">Videos</span>
      <span class="wf-chip">People</span>
    </nav>

    <main class="wf-main">
      <a class="wf-card" href="#screen-detail-1">
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Result title</span>
        </header>
        <p class="wf-text" data-wf-lines="2"></p>
      </a>
      <a class="wf-card" href="#screen-detail-2">…</a>
      <a class="wf-card" href="#screen-detail-3">…</a>
    </main>

    <nav class="wf-nav">
      <a class="wf-nav-item" href="#screen-feed">Feed</a>
      <a class="wf-nav-item is-active" href="#screen-search">Search</a>
      <a class="wf-nav-item" href="#screen-profile">Profile</a>
    </nav>

  </div>
</section>
```

### Notes

- The search input is the FIRST interactive element below the
  status bar — convention is established.
- Filter chips use `wf-chip` with `flex-wrap: wrap` so they wrap to
  multiple rows on narrow widths.
- Cards are simpler than feed cards (no image, no avatar) — search
  results favor density over richness.

---

## Pattern 4 — Profile (avatar header + stats grid + sections)

A user profile screen — large avatar + name + stats grid + a
sectioned content area below.

```html
<section class="wf-screen" id="screen-profile"
         data-ve-id="screen-profile" data-ve-type="wireframe-screen">
  <div class="wf-archetype--mobile">

    <header class="wf-statusbar">
      <span>9:41</span>
      <span class="wf-text" data-wf-lines="1">Profile</span>
      <span>Edit</span>
    </header>

    <main class="wf-main">

      <header style="display:flex; flex-direction:column; align-items:center; gap:12px;">
        <span class="wf-avatar" style="width:96px; height:96px;"></span>
        <h1 class="wf-text" data-wf-lines="1"></h1>
        <p class="wf-text" data-wf-lines="2" style="text-align:center;"></p>
      </header>

      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px;">
        <div class="wf-card" style="text-align:center;">
          <span class="wf-text" data-wf-lines="1">42</span>
          <span class="wf-label">Posts</span>
        </div>
        <div class="wf-card" style="text-align:center;">
          <span class="wf-text" data-wf-lines="1">1.2k</span>
          <span class="wf-label">Followers</span>
        </div>
        <div class="wf-card" style="text-align:center;">
          <span class="wf-text" data-wf-lines="1">315</span>
          <span class="wf-label">Following</span>
        </div>
      </div>

      <button class="wf-button">Follow</button>

      <hr class="wf-divider">

      <article class="wf-card">
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Recent posts</span>
        </header>
        <p class="wf-text" data-wf-lines="3"></p>
      </article>

    </main>

    <nav class="wf-nav">
      <a class="wf-nav-item" href="#screen-feed">Feed</a>
      <a class="wf-nav-item" href="#screen-search">Search</a>
      <a class="wf-nav-item is-active" href="#screen-profile">Profile</a>
    </nav>

  </div>
</section>
```

### Notes

- The avatar is oversized via inline `style` (96px instead of the
  default 40px) — profile headers want big avatars.
- Stats grid uses `grid-template-columns: repeat(3, 1fr)` for
  three equal columns. Each cell is a tiny `wf-card` with a number
  + label.
- The Follow button is full-width below the stats — primary CTA
  position.

---

## Pattern 5 — Compose (form + send action)

A screen for creating new content — a textarea, optional fields,
send button. Modeled on Twitter/Bluesky composer.

```html
<section class="wf-screen" id="screen-compose"
         data-ve-id="screen-compose" data-ve-type="wireframe-screen">
  <div class="wf-archetype--mobile">

    <header class="wf-statusbar">
      <a href="#screen-feed" class="wf-text" data-wf-lines="1">Cancel</a>
      <span></span>
      <button class="wf-button">Post</button>
    </header>

    <main class="wf-main">

      <div style="display:flex; gap:12px;">
        <span class="wf-avatar"></span>
        <div style="flex:1;">
          <textarea class="wf-input"
                    placeholder="What's happening?"
                    style="min-height:120px; resize:none;"></textarea>
        </div>
      </div>

      <hr class="wf-divider">

      <nav class="wf-nav" style="justify-content:flex-start;">
        <span class="wf-chip">📷 Photo</span>
        <span class="wf-chip">📍 Location</span>
        <span class="wf-chip">🔗 Link</span>
      </nav>

      <p class="wf-text" data-wf-lines="1" style="text-align:right; color:var(--vc-color-content-subtle);">
        180 characters left
      </p>

    </main>

  </div>
</section>
```

### Notes

- The Post button is in the status bar, top-right — convention for
  destructive-when-tapped buttons (you only tap it intentionally).
- The textarea has `resize: none` — mobile composers don't show
  the resize handle.
- The avatar + textarea row makes the composer feel like a reply
  (avatar = "you").
- Attachment chips (`📷 Photo`, `📍 Location`) are conventional
  emoji-prefixed chips; production replaces emoji with real icons.
- The character counter is right-aligned, muted color — read but
  not loud.

---

## Pattern 6 — Empty state (illustration + CTA)

A screen with NO content yet — encourage the user to create
something.

```html
<section class="wf-screen" id="screen-empty"
         data-ve-id="screen-empty" data-ve-type="wireframe-screen">
  <div class="wf-archetype--mobile">

    <header class="wf-statusbar">
      <span>9:41</span>
      <span class="wf-text" data-wf-lines="1">Library</span>
      <span>+</span>
    </header>

    <main class="wf-main" style="justify-content:center; min-height:500px;">

      <figure class="wf-image" style="
        max-width:160px; min-height:160px;
        margin: 0 auto;
      "></figure>

      <h2 class="wf-text" data-wf-lines="1" style="text-align:center;">No items yet</h2>
      <p class="wf-text" data-wf-lines="2" style="text-align:center;"></p>

      <button class="wf-button" style="align-self:center;">Add your first item</button>

    </main>

    <nav class="wf-nav">
      <a class="wf-nav-item" href="#screen-feed">Feed</a>
      <a class="wf-nav-item is-active" href="#screen-library">Library</a>
      <a class="wf-nav-item" href="#screen-profile">Profile</a>
    </nav>

  </div>
</section>
```

### Notes

- `min-height: 500px` on `wf-main` + `justify-content: center`
  centers the empty-state contents vertically.
- The illustration is a small `wf-image` (160×160) — empty states
  usually feature a small icon-style spot illustration.
- The CTA button is `align-self: center` — primary action, NOT
  full-width (that would feel like a feed CTA, not an empty-state
  invitation).

---

## Bottom-tab convention

The bottom `wf-nav` in `wf-archetype--mobile` is the TAB BAR. Its
items get `justify-content: space-around` automatically.

| Position | Common labels |
|---|---|
| Tab 1 | Home / Feed / Today |
| Tab 2 | Search / Discover / Browse |
| Tab 3 | Library / Create (+) / Inbox |
| Tab 4 (optional) | Notifications / Cart |
| Tab 5 (rightmost) | Profile / Account / Settings |

3 tabs is the minimum, 5 is the maximum. With 4+ tabs the labels
shrink — consider icon-only tabs (a small icon + tiny label below).

The active tab uses `.is-active` (or `aria-current="page"`) so the
nav-item CSS bumps its weight to 600 and its color from muted to
content.

---

## Floating-action-button (FAB) convention

A FAB is a primary action button that floats over the screen
content. The pattern:

```html
<main class="wf-main" style="position:relative;">

  <!-- regular screen content -->
  <article class="wf-card">…</article>

  <!-- the FAB -->
  <button class="wf-button" style="
    position: absolute;
    bottom: 16px;
    right: 16px;
    width: 56px; height: 56px;
    border-radius: 50%;
    padding: 0;
    font-size: 24px;
  ">+</button>

</main>
```

### Notes

- `position: absolute` inside a `position: relative` parent.
- Standard size is `56 × 56` (matches Material Design).
- The `+` is the universal "create" glyph; replace with `✎` for
  "edit", `📷` for "camera", etc.
- The radius-50% override is INTENTIONAL — overrides the fidelity
  lock's radius-0 rule because a FAB is round at every fidelity.

---

## Pull-to-refresh affordance

Pull-to-refresh is a hidden gesture, so the wireframe doesn't
render the animation. Instead, the wireframe shows the SLOT where
the spinner WOULD appear, with an annotation:

```html
<main class="wf-main">
  <div class="wf-toast"
       style="margin:0 auto; opacity:0.5;">
    ↻ Refresh (pull to update)
  </div>

  <!-- the rest of the screen -->
</main>
```

The toast at half-opacity reads as "this is the affordance that
appears when the user pulls down". Annotation in the text content
explains the gesture for the wireframe reviewer.

---

## Modal sheets — the half-screen drawer

A modal sheet is a drawer that slides up from the bottom — common
for iOS share sheets, action menus. Authored as a screen with
specific layout:

```html
<section class="wf-screen" id="screen-share-sheet"
         data-ve-id="screen-share-sheet" data-ve-type="wireframe-screen">

  <!-- the dimmed underlying screen -->
  <div class="wf-archetype--mobile"
       style="filter: brightness(0.5);">
    <!-- ghost of the previous screen -->
  </div>

  <!-- the sheet -->
  <div class="wf-modal"
       style="
         position: fixed; bottom: 0; left: 50%;
         transform: translateX(-50%);
         width: var(--wf-mobile-w);
         border-radius: 16px 16px 0 0;
       ">
    <span class="wf-divider" style="
      width: 36px; margin: 0 auto;
      border-top-width: 4px;
      border-radius: 2px;
    "></span>

    <h2 class="wf-text" data-wf-lines="1">Share</h2>

    <nav style="display:flex; gap:16px; justify-content:space-around;">
      <a class="wf-button wf-button--ghost">📩 Mail</a>
      <a class="wf-button wf-button--ghost">💬 Messages</a>
      <a class="wf-button wf-button--ghost">🔗 Copy link</a>
    </nav>

    <a class="wf-button wf-button--ghost" href="#screen-detail-1">Cancel</a>
  </div>

</section>
```

### Notes

- The 36px-wide "grabber" bar at the top is the iOS-conventional
  sheet handle. Authored as a styled `wf-divider`.
- `border-radius: 16px 16px 0 0` — rounded top corners, flat bottom
  (the sheet sits at the bottom of the screen).
- `filter: brightness(0.5)` on the underlying archetype dims it —
  the wireframe equivalent of a backdrop blur.
