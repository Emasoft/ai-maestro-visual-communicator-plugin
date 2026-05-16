# State & feedback patterns — loading, error, empty, success, offline

Every screen has multiple states beyond "happy path". Six patterns:
loading skeleton, inline spinner, error banner / page, offline state,
empty state, success / completion.

## Table of contents

- [Pattern 1 — Loading skeleton (full-page placeholder)](#pattern-1--loading-skeleton-full-page-placeholder)
- [Pattern 2 — Inline spinner (button + section loaders)](#pattern-2--inline-spinner-button--section-loaders)
- [Pattern 3 — Error banner / error page](#pattern-3--error-banner--error-page)
- [Pattern 4 — Offline state](#pattern-4--offline-state)
- [Pattern 5 — Empty state variants](#pattern-5--empty-state-variants)
- [Pattern 6 — Success / completion celebration](#pattern-6--success--completion-celebration)
- [Progress bar (determinate vs indeterminate)](#progress-bar-determinate-vs-indeterminate)
- [Optimistic update with revert](#optimistic-update-with-revert)
- [Partial-failure state (some succeeded, some failed)](#partial-failure-state-some-succeeded-some-failed)
- [Stale data warning](#stale-data-warning)

---

## Pattern 1 — Loading skeleton (full-page placeholder)

The pattern when async data hasn't arrived yet. Render the LAYOUT
with shimmering placeholders.

```html
<main class="wf-main">

  <!-- skeleton header -->
  <header style="display:flex; gap:16px; align-items:center;">
    <span class="wf-avatar"
          style="background:var(--vc-color-surface-sunken);
                 animation:wf-shimmer 1.5s infinite linear;"></span>
    <div style="flex:1;">
      <span class="wf-text" data-wf-lines="1"
            style="max-width:200px;
                   animation:wf-shimmer 1.5s infinite linear;"></span>
      <span class="wf-text" data-wf-lines="1"
            style="max-width:120px;
                   animation:wf-shimmer 1.5s infinite linear;"></span>
    </div>
  </header>

  <!-- skeleton stat band -->
  <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px;">
    <div class="wf-card" style="animation:wf-shimmer 1.5s infinite linear;">
      <span class="wf-text" data-wf-lines="1" style="max-width:60%;"></span>
      <span class="wf-text" data-wf-lines="1" style="font-size:32px;"></span>
    </div>
    <div class="wf-card" style="animation:wf-shimmer 1.5s infinite linear;">…</div>
    <div class="wf-card" style="animation:wf-shimmer 1.5s infinite linear;">…</div>
    <div class="wf-card" style="animation:wf-shimmer 1.5s infinite linear;">…</div>
  </div>

  <!-- skeleton chart card -->
  <article class="wf-card" style="animation:wf-shimmer 1.5s infinite linear;">
    <figure class="wf-image" style="min-height:280px;"></figure>
  </article>

  <!-- skeleton list rows -->
  <article class="wf-card" style="padding:0;">
    <div class="wf-table">
      <div class="wf-table-row" style="animation:wf-shimmer 1.5s infinite linear;">
        <span class="wf-text" data-wf-lines="1"></span>
        <span class="wf-text" data-wf-lines="1"></span>
        <span class="wf-text" data-wf-lines="1"></span>
      </div>
      <div class="wf-table-row" style="animation:wf-shimmer 1.5s infinite linear;">…</div>
      <div class="wf-table-row" style="animation:wf-shimmer 1.5s infinite linear;">…</div>
      <div class="wf-table-row" style="animation:wf-shimmer 1.5s infinite linear;">…</div>
    </div>
  </article>

</main>

<style>
@keyframes wf-shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 0.85; }
  100% { opacity: 0.5; }
}

@media (prefers-reduced-motion: reduce) {
  [style*="wf-shimmer"] { animation: none !important; }
}
</style>
```

### Notes

- The skeleton MIRRORS the eventual layout — same shapes, same
  positions.
- The pulse animation (0.5 → 0.85 → 0.5 opacity) is subtle.
- Always respect `prefers-reduced-motion` — kill the animation for
  motion-sensitive users.
- For a STATIC wireframe (no animation), drop the keyframes — the
  skeleton shape alone reads as "loading".

---

## Pattern 2 — Inline spinner (button + section loaders)

For SMALLER loading states — inside a button, inside a card, while
fetching part of a page.

### Button spinner

```html
<button class="wf-button" disabled style="opacity:0.7;">
  <span style="display:inline-block;
               width:14px; height:14px;
               border:2px solid currentColor;
               border-top-color:transparent;
               border-radius:50%;
               animation:wf-spin 0.6s infinite linear;"></span>
  <span style="margin-left:8px;">Saving…</span>
</button>

<style>
@keyframes wf-spin {
  to { transform: rotate(360deg); }
}
</style>
```

### Section spinner

```html
<article class="wf-card" style="min-height:240px;
                                  display:flex;
                                  align-items:center;
                                  justify-content:center;
                                  flex-direction:column;
                                  gap:16px;">
  <span style="display:inline-block;
               width:32px; height:32px;
               border:3px solid var(--vc-color-border);
               border-top-color:var(--vc-color-accent);
               border-radius:50%;
               animation:wf-spin 0.6s infinite linear;"></span>
  <span class="wf-text" data-wf-lines="1"
        style="color:var(--vc-color-content-subtle);">Loading…</span>
</article>
```

### Notes

- The CSS spinner is just a circle with a 2-3px border, one side
  transparent, rotating continuously.
- Button spinner: 14px, currentColor (inherits button text color).
- Section spinner: 32px, accent + border (visible).

For a static wireframe, render the spinner shape — the rotation
is implicit.

---

## Pattern 3 — Error banner / error page

Two error scopes: an INLINE banner (for partial errors) and a FULL
PAGE (for catastrophic errors like 500).

### Inline error banner

```html
<div class="wf-toast"
     style="background-color:var(--vc-color-danger);
            color:var(--vc-color-on-accent);
            border-radius:6px;
            padding:12px 16px;
            margin-bottom:16px;">
  <span style="flex:1;">
    <strong>Could not save changes.</strong>
    Please try again in a moment.
  </span>
  <button class="wf-button"
          style="background:transparent;
                 color:inherit;
                 border:1px solid currentColor;">
    Retry
  </button>
  <a href="#" style="color:inherit;">×</a>
</div>
```

### Full error page

```html
<section class="wf-screen" id="screen-error"
         data-ve-id="screen-error" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <main class="wf-main" style="text-align:center; padding-top:96px;">

      <h1 style="font-size:96px;
                 font-weight:300;
                 color:var(--vc-color-content-subtle);
                 margin:0;">500</h1>

      <h2 class="wf-text" data-wf-lines="1"
          style="font-size:24px; margin-top:16px;">
        Something went wrong
      </h2>

      <p class="wf-text" data-wf-lines="2"
         style="color:var(--vc-color-content-muted);
                max-width:400px;
                margin:16px auto;"></p>

      <div style="display:flex; gap:8px; justify-content:center;
                  margin-top:24px;">
        <button class="wf-button">Try again</button>
        <a class="wf-button wf-button--ghost" href="#screen-home">Go home</a>
      </div>

      <p class="wf-text" data-wf-lines="1"
         style="margin-top:48px;
                font-size:12px;
                color:var(--vc-color-content-subtle);">
        Error ID: <code>ERR-7K3J-FFP2</code>
      </p>

    </main>

  </div>
</section>
```

### Common error pages

| Status | Title | Headline |
|---|---|---|
| 404 | Page not found | We can't find that page |
| 403 | Forbidden | You don't have access |
| 500 | Server error | Something went wrong |
| 503 | Maintenance | We'll be right back |
| Offline | No connection | You're offline |

### Notes

- Big status number (e.g. 500) — light weight, muted color.
- Headline below.
- Body explains what to do next.
- Primary CTA + secondary CTA.
- Error ID for support reference at the bottom.

---

## Pattern 4 — Offline state

When the user loses network. Two scopes: a banner across the top
(partial functionality available), full-page (nothing available).

### Top banner

```html
<div style="position:sticky; top:0; z-index:50;
            background:var(--vc-color-warning);
            color:var(--vc-color-on-accent);
            padding:8px 16px;
            text-align:center;
            font-size:14px;">
  ⚠ You're offline. Some features may not work.
  <button class="wf-button"
          style="background:transparent;
                 color:inherit;
                 border:1px solid currentColor;
                 padding:2px 8px;
                 margin-left:8px;">Retry</button>
</div>
```

### Full-page offline

```html
<main class="wf-main" style="text-align:center; padding-top:96px;">

  <figure class="wf-image" style="width:120px; height:120px;
                                    margin:0 auto;
                                    border-radius:50%;"></figure>

  <h1 class="wf-text" data-wf-lines="1"
      style="font-size:24px; margin-top:24px;">
    You're offline
  </h1>

  <p class="wf-text" data-wf-lines="2"
     style="color:var(--vc-color-content-muted);
            max-width:400px;
            margin:16px auto;">
    Check your connection and try again.
  </p>

  <button class="wf-button">Try again</button>

</main>
```

### Notes

- Use `--vc-color-warning` (amber) for the offline state — NOT
  danger (network outage isn't an error, it's a state).
- For apps with offline-first capability, show the cached content
  but flag it as offline ("Last synced 2 hours ago").

---

## Pattern 5 — Empty state variants

The empty state evolves with the user's relationship to the data:

### 1. Never had data (first-run empty)

The user hasn't created anything yet. Encourage creation.

```html
<main class="wf-main" style="text-align:center; padding:96px 16px;">
  <figure class="wf-image" style="width:160px; height:160px;
                                    margin:0 auto;
                                    border-radius:50%;"></figure>
  <h2 class="wf-text" data-wf-lines="1"
      style="font-size:20px; margin-top:24px;">
    Welcome! Let's get started.
  </h2>
  <p class="wf-text" data-wf-lines="2"
     style="color:var(--vc-color-content-muted);
            max-width:400px;
            margin:8px auto 24px;">
    Create your first project to begin.
  </p>
  <button class="wf-button">Create your first project</button>
</main>
```

### 2. Had data, now filtered to nothing (search empty)

```html
<main class="wf-main" style="text-align:center; padding:64px 16px;">
  <span style="font-size:48px;">🔍</span>
  <h2 class="wf-text" data-wf-lines="1"
      style="font-size:18px; margin-top:16px;">
    No matches for "abc xyz"
  </h2>
  <p class="wf-text" data-wf-lines="1"
     style="color:var(--vc-color-content-muted);
            margin-top:8px;">
    Try a different search or clear filters.
  </p>
  <div style="display:flex; gap:8px; justify-content:center;
              margin-top:16px;">
    <button class="wf-button wf-button--ghost">Clear filters</button>
    <button class="wf-button wf-button--ghost">Show all</button>
  </div>
</main>
```

### 3. Had data, deleted (success)

```html
<main class="wf-main" style="text-align:center; padding:64px 16px;">
  <span style="font-size:48px;
               color:var(--vc-color-success);">✓</span>
  <h2 class="wf-text" data-wf-lines="1"
      style="font-size:18px; margin-top:16px;">
    Inbox zero
  </h2>
  <p class="wf-text" data-wf-lines="1"
     style="color:var(--vc-color-content-muted);
            margin-top:8px;">
    You've processed everything. Nice work.
  </p>
</main>
```

### 4. Error loading data (error empty)

```html
<main class="wf-main" style="text-align:center; padding:64px 16px;">
  <span style="font-size:48px;
               color:var(--vc-color-danger);">⚠</span>
  <h2 class="wf-text" data-wf-lines="1"
      style="font-size:18px; margin-top:16px;">
    Couldn't load items
  </h2>
  <p class="wf-text" data-wf-lines="2"
     style="color:var(--vc-color-content-muted);
            max-width:400px;
            margin:8px auto 16px;"></p>
  <button class="wf-button">Try again</button>
</main>
```

### Notes

- Each empty-state variant has DIFFERENT iconography + copy + CTA.
- First-run: spot illustration + creation CTA.
- Search empty: magnifier glyph + clear-filters CTAs.
- Done: green checkmark + congratulatory message + NO CTA.
- Error: warning glyph + retry CTA.

Don't reuse the SAME empty state for all 4 — it confuses the user
about WHAT happened.

---

## Pattern 6 — Success / completion celebration

After a major task completes — onboarding done, project published,
purchase made. Already covered in
[`onboarding-flows.md`](onboarding-flows.md).

Recap:

```html
<main class="wf-main" style="text-align:center; padding:96px 16px;">

  <span class="wf-chip"
        style="background:var(--vc-color-success);
               color:var(--vc-color-on-accent);
               font-size:36px;
               width:96px; height:96px;
               border-radius:50%;
               justify-content:center;
               margin:0 auto;">✓</span>

  <h1 class="wf-text" data-wf-lines="1"
      style="font-size:32px; margin-top:24px;">
    All done!
  </h1>

  <p class="wf-text" data-wf-lines="2"
     style="color:var(--vc-color-content-muted);
            max-width:400px;
            margin:8px auto 32px;"></p>

  <button class="wf-button">Next action</button>

</main>
```

---

## Progress bar (determinate vs indeterminate)

### Determinate (known percentage)

```html
<div style="background:var(--vc-color-border);
            border-radius:4px;
            height:8px;
            overflow:visible;">
  <div style="background:var(--vc-color-accent);
              width:60%;
              height:100%;
              border-radius:4px;"></div>
</div>
<span class="wf-text" data-wf-lines="1"
      style="font-size:12px;
             color:var(--vc-color-content-subtle);
             margin-top:4px;">
  60% — Uploading file…
</span>
```

### Indeterminate (unknown duration)

```html
<div style="background:var(--vc-color-border);
            border-radius:4px;
            height:4px;
            overflow:visible;
            position:relative;">
  <div style="background:var(--vc-color-accent);
              position:absolute;
              top:0; bottom:0;
              width:30%;
              border-radius:4px;
              animation:wf-progress-indeterminate 1.5s infinite ease;"></div>
</div>

<style>
@keyframes wf-progress-indeterminate {
  0% { left: -30%; }
  100% { left: 100%; }
}
</style>
```

### Notes

- Determinate: fill width = percentage.
- Indeterminate: a narrower bar slides across, indicating activity
  without specific progress.
- Both are 4-8px tall. Don't make them taller (that's a "status
  bar" not a "progress indicator").

---

## Optimistic update with revert

When the user clicks a button, show success IMMEDIATELY — revert
if the operation actually fails.

```html
<!-- the optimistic state — green check has appeared -->
<button class="wf-button"
        style="background:var(--vc-color-success);
               color:var(--vc-color-on-accent);">
  ✓ Saved
</button>

<!-- on failure, replace with the original state + a retry toast -->
<div class="wf-toast"
     style="background:var(--vc-color-danger);
            color:var(--vc-color-on-accent);">
  Could not save. Your changes are restored.
  <a href="#" style="color:inherit;">Retry</a>
</div>
```

For a wireframe showing the optimistic UI, render the SUCCESS state
+ annotate "(actual save happens in background; revert on failure)".

---

## Partial-failure state (some succeeded, some failed)

When a bulk action partially fails — show which succeeded and which
didn't.

```html
<div class="wf-toast"
     style="background:var(--vc-color-warning);
            color:var(--vc-color-on-accent);">
  <span style="flex:1;">
    8 of 10 items archived. 2 failed.
  </span>
  <a href="#" style="color:inherit;">View failures</a>
</div>
```

For deeper detail, a follow-up screen lists the failures:

```html
<article class="wf-card">
  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1">2 items failed to archive</span>
  </header>

  <div style="display:flex; gap:8px; align-items:center;
              padding:8px 0;
              border-bottom:1px solid var(--vc-color-border);">
    <span style="color:var(--vc-color-danger);">⚠</span>
    <div style="flex:1;">
      <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
        Item 1
      </span>
      <span class="wf-text" data-wf-lines="1"
            style="font-size:12px;
                   color:var(--vc-color-content-subtle);">
        Permission denied
      </span>
    </div>
    <button class="wf-button wf-button--ghost">Retry</button>
  </div>

  <div style="display:flex; gap:8px; align-items:center;
              padding:8px 0;">
    <span style="color:var(--vc-color-danger);">⚠</span>
    <div style="flex:1;">
      <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
        Item 2
      </span>
      <span class="wf-text" data-wf-lines="1"
            style="font-size:12px;
                   color:var(--vc-color-content-subtle);">
        Network timeout
      </span>
    </div>
    <button class="wf-button wf-button--ghost">Retry</button>
  </div>

  <footer class="wf-card__actions">
    <button class="wf-button wf-button--ghost">Dismiss</button>
    <button class="wf-button">Retry all</button>
  </footer>
</article>
```

---

## Stale data warning

When the data being viewed might be outdated (e.g. fetched 5
minutes ago).

```html
<div style="padding:8px 16px;
            background:var(--vc-color-surface-sunken);
            border-bottom:1px solid var(--vc-color-border);
            font-size:12px;
            color:var(--vc-color-content-muted);
            display:flex; gap:12px; align-items:center;">
  <span>Last updated 5 min ago</span>
  <a href="#" style="color:var(--vc-color-content);">Refresh →</a>
</div>
```

For dashboards, put this at the top of the page. For lists, put it
in the footer.
