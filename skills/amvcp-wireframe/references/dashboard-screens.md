# Dashboard screens — analytics, admin, and monitoring patterns

Six canonical dashboard-class shapes. All use `wf-archetype--app`
(titlebar + sidebar + main + statusbar). The main content area is
where the actual data viz happens; this file covers the SHELL plus
the most common content blocks.

## Table of contents

- [Pattern 1 — KPI overview (stat band + chart + recent activity)](#pattern-1--kpi-overview-stat-band--chart--recent-activity)
- [Pattern 2 — Data table (sortable list with filters + pagination)](#pattern-2--data-table-sortable-list-with-filters--pagination)
- [Pattern 3 — Single record (header + tabs + detail panel)](#pattern-3--single-record-header--tabs--detail-panel)
- [Pattern 4 — Settings (sectioned forms + save bar)](#pattern-4--settings-sectioned-forms--save-bar)
- [Pattern 5 — Empty admin (onboarding wizard step)](#pattern-5--empty-admin-onboarding-wizard-step)
- [Pattern 6 — Multi-column board (kanban / columns)](#pattern-6--multi-column-board-kanban--columns)
- [The stat-band recipe — 4 KPI cards in a row](#the-stat-band-recipe--4-kpi-cards-in-a-row)
- [The chart placeholder — `wf-image` substitute](#the-chart-placeholder--wf-image-substitute)
- [Sidebar grouping with `wf-divider`](#sidebar-grouping-with-wf-divider)
- [Dense data — when to break the 16px gap rule](#dense-data--when-to-break-the-16px-gap-rule)

---

## Pattern 1 — KPI overview (stat band + chart + recent activity)

The classic dashboard landing page. Four stat cards at the top, a
big chart in the middle, recent activity table at the bottom.

```html
<section class="wf-screen" id="screen-dashboard"
         data-ve-id="screen-dashboard" data-ve-type="wireframe-screen">
  <div class="wf-archetype--app">

    <header class="wf-titlebar">
      <span class="wf-traffic-lights">
        <span></span><span></span><span></span>
      </span>
      <span class="wf-text" data-wf-lines="1">Analytics</span>
    </header>

    <aside class="wf-sidebar">
      <a class="wf-nav-item is-active" href="#screen-dashboard">Dashboard</a>
      <a class="wf-nav-item" href="#screen-users">Users</a>
      <a class="wf-nav-item" href="#screen-billing">Billing</a>
      <hr class="wf-divider">
      <a class="wf-nav-item" href="#screen-settings">Settings</a>
    </aside>

    <main class="wf-main">

      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px;">
        <div class="wf-card">
          <span class="wf-label">Revenue</span>
          <span class="wf-text" data-wf-lines="1" style="font-size:32px;"></span>
          <span class="wf-chip">+12.4%</span>
        </div>
        <div class="wf-card">
          <span class="wf-label">Active users</span>
          <span class="wf-text" data-wf-lines="1" style="font-size:32px;"></span>
          <span class="wf-chip">+3.1%</span>
        </div>
        <div class="wf-card">
          <span class="wf-label">Churn</span>
          <span class="wf-text" data-wf-lines="1" style="font-size:32px;"></span>
          <span class="wf-chip">-0.4%</span>
        </div>
        <div class="wf-card">
          <span class="wf-label">NPS</span>
          <span class="wf-text" data-wf-lines="1" style="font-size:32px;"></span>
          <span class="wf-chip">+2</span>
        </div>
      </div>

      <article class="wf-card">
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Revenue, last 30 days</span>
        </header>
        <figure class="wf-image" style="min-height:280px;"></figure>
      </article>

      <article class="wf-card">
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Recent activity</span>
        </header>

        <div class="wf-table">
          <div class="wf-table-row wf-table-row--head">
            <span class="wf-text" data-wf-lines="1">User</span>
            <span class="wf-text" data-wf-lines="1">Action</span>
            <span class="wf-text" data-wf-lines="1">When</span>
          </div>
          <div class="wf-table-row">
            <span class="wf-text" data-wf-lines="1"></span>
            <span class="wf-text" data-wf-lines="1"></span>
            <span class="wf-text" data-wf-lines="1"></span>
          </div>
          <div class="wf-table-row">…</div>
          <div class="wf-table-row">…</div>
        </div>
      </article>

    </main>

    <footer class="wf-statusbar">
      <span>Synced 2 min ago</span>
      <span>·•·</span>
    </footer>

  </div>
</section>
```

### Notes

- The KPI grid is 4 columns on wide screens. On narrow viewports
  the grid wraps automatically to 2 cols. For 3-KPI dashboards,
  use `repeat(3, 1fr)`.
- Each KPI card has 3 children: a `wf-label` (small uppercase),
  the big number (`wf-text` with inline `font-size: 32px` override),
  and a `wf-chip` for the delta.
- The chart card has `min-height: 280px` — give chart placeholders
  REAL height; a 100px chart placeholder looks like a button.
- The activity table is `wf-table` (flex rows, not `<table>`).

---

## Pattern 2 — Data table (sortable list with filters + pagination)

A full-page table — the meat of every admin dashboard. Filters at
the top, the table itself, pagination footer.

```html
<section class="wf-screen" id="screen-users"
         data-ve-id="screen-users" data-ve-type="wireframe-screen">
  <div class="wf-archetype--app">

    <header class="wf-titlebar">…</header>
    <aside class="wf-sidebar">…</aside>

    <main class="wf-main">

      <header style="display:flex; gap:12px; align-items:center;">
        <h1 class="wf-text" data-wf-lines="1" style="flex:1;">Users</h1>
        <button class="wf-button wf-button--ghost">Export CSV</button>
        <button class="wf-button">+ New user</button>
      </header>

      <nav style="display:flex; gap:8px; flex-wrap:wrap;">
        <input class="wf-input" placeholder="Search" style="flex:1;">
        <span class="wf-chip">Status: any</span>
        <span class="wf-chip">Role: any</span>
        <span class="wf-chip">Joined: any</span>
      </nav>

      <div class="wf-table">
        <div class="wf-table-row wf-table-row--head">
          <span class="wf-text" data-wf-lines="1">Name</span>
          <span class="wf-text" data-wf-lines="1">Email</span>
          <span class="wf-text" data-wf-lines="1">Role</span>
          <span class="wf-text" data-wf-lines="1">Joined</span>
          <span class="wf-text" data-wf-lines="1">Status</span>
        </div>
        <div class="wf-table-row">…</div>
        <div class="wf-table-row">…</div>
        <div class="wf-table-row">…</div>
        <div class="wf-table-row">…</div>
        <div class="wf-table-row">…</div>
      </div>

      <footer style="display:flex; justify-content:space-between; align-items:center;">
        <span class="wf-text" data-wf-lines="1" style="font-size:12px;">
          1–10 of 234
        </span>
        <nav style="display:flex; gap:4px;">
          <button class="wf-button wf-button--ghost">‹</button>
          <button class="wf-button">1</button>
          <button class="wf-button wf-button--ghost">2</button>
          <button class="wf-button wf-button--ghost">3</button>
          <button class="wf-button wf-button--ghost">›</button>
        </nav>
      </footer>

    </main>

    <footer class="wf-statusbar">…</footer>

  </div>
</section>
```

### Notes

- The header row has THREE elements: title (flex:1 so it takes
  remaining space), secondary action (Export), primary action
  (+ New user). Layout pattern: title-left, actions-right.
- Filter chips are CLICKABLE in production (open a dropdown);
  in the wireframe they're shown CLOSED (showing the current
  filter value, e.g. "Status: any").
- The pagination footer is a flex row: count on the left,
  pager on the right. Pager uses `wf-button` for each page
  number; the active page is the primary variant (filled), the
  others are ghost (transparent).

---

## Pattern 3 — Single record (header + tabs + detail panel)

A user / order / item detail screen. Header with summary, tabs
for sections, content panel below.

```html
<section class="wf-screen" id="screen-user-detail"
         data-ve-id="screen-user-detail" data-ve-type="wireframe-screen">
  <div class="wf-archetype--app">

    <header class="wf-titlebar">…</header>
    <aside class="wf-sidebar">…</aside>

    <main class="wf-main">

      <a href="#screen-users" class="wf-text" data-wf-lines="1">
        ← All users
      </a>

      <header style="display:flex; gap:16px; align-items:center;">
        <span class="wf-avatar" style="width:80px; height:80px;"></span>
        <div style="flex:1;">
          <h1 class="wf-text" data-wf-lines="1"></h1>
          <p class="wf-text" data-wf-lines="1" style="color:var(--vc-color-content-subtle);"></p>
        </div>
        <span class="wf-chip">Active</span>
        <button class="wf-button wf-button--ghost">Edit</button>
        <button class="wf-button">Message</button>
      </header>

      <nav class="wf-nav">
        <a class="wf-nav-item is-active" href="#screen-user-overview">Overview</a>
        <a class="wf-nav-item" href="#screen-user-activity">Activity</a>
        <a class="wf-nav-item" href="#screen-user-billing">Billing</a>
        <a class="wf-nav-item" href="#screen-user-permissions">Permissions</a>
      </nav>

      <div style="display:grid; grid-template-columns:2fr 1fr; gap:16px;">

        <article class="wf-card">
          <header class="wf-card__title">
            <span class="wf-text" data-wf-lines="1">Profile</span>
          </header>
          <p class="wf-text" data-wf-lines="6"></p>
        </article>

        <aside style="display:flex; flex-direction:column; gap:12px;">

          <article class="wf-card">
            <span class="wf-label">Account ID</span>
            <span class="wf-text" data-wf-lines="1" style="font-family:monospace;"></span>
          </article>

          <article class="wf-card">
            <span class="wf-label">Plan</span>
            <span class="wf-text" data-wf-lines="1"></span>
            <span class="wf-chip">$49/mo</span>
          </article>

        </aside>

      </div>

    </main>

    <footer class="wf-statusbar">…</footer>

  </div>
</section>
```

### Notes

- The "← All users" back link is the FIRST thing in main —
  convention for detail screens, signals "you're nested below the
  list".
- The header has 5 elements: large avatar, name + email, status
  chip, secondary action, primary action.
- Tabs use `wf-nav` (with `aria-current` or `.is-active` for the
  active tab).
- The 2fr/1fr grid is the canonical detail-page split: 2/3 main
  content, 1/3 metadata sidebar.

---

## Pattern 4 — Settings (sectioned forms + save bar)

A settings page — multiple sectioned forms, a sticky save bar at
the bottom.

```html
<section class="wf-screen" id="screen-settings"
         data-ve-id="screen-settings" data-ve-type="wireframe-screen">
  <div class="wf-archetype--app">

    <header class="wf-titlebar">…</header>
    <aside class="wf-sidebar">…</aside>

    <main class="wf-main" style="max-width:640px;">

      <h1 class="wf-text" data-wf-lines="1">Settings</h1>

      <article class="wf-card">
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Profile</span>
        </header>

        <label class="wf-label">Display name</label>
        <input class="wf-input">

        <label class="wf-label">Bio</label>
        <textarea class="wf-input" style="min-height:80px;"></textarea>

      </article>

      <article class="wf-card">
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Notifications</span>
        </header>

        <div style="display:flex; align-items:center; gap:12px;">
          <span class="wf-text" data-wf-lines="1" style="flex:1;">Email digest</span>
          <span class="wf-chip">On</span>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="wf-text" data-wf-lines="1" style="flex:1;">Push notifications</span>
          <span class="wf-chip">Off</span>
        </div>

      </article>

      <article class="wf-card">
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Danger zone</span>
        </header>
        <p class="wf-text" data-wf-lines="2"></p>
        <button class="wf-button wf-button--ghost">Delete account</button>
      </article>

    </main>

    <footer class="wf-statusbar"
            style="position:sticky; bottom:0; gap:8px;">
      <span class="wf-text" data-wf-lines="1" style="flex:1;">
        You have unsaved changes.
      </span>
      <button class="wf-button wf-button--ghost">Discard</button>
      <button class="wf-button">Save changes</button>
    </footer>

  </div>
</section>
```

### Notes

- `max-width: 640px` on `wf-main` — settings pages don't need to
  fill the full width; a narrower column is more readable.
- Each settings section is a `wf-card` with a title + form rows.
- Toggle rows use a flex layout with a chip on the right; in
  production the chip is replaced by a real toggle switch.
- The save bar uses `position: sticky; bottom: 0` so it stays
  visible while the user scrolls.

---

## Pattern 5 — Empty admin (onboarding wizard step)

A wizard-style empty state — guide the admin through initial setup.

```html
<section class="wf-screen" id="screen-onboarding-1"
         data-ve-id="screen-onboarding-1" data-ve-type="wireframe-screen">
  <div class="wf-archetype--app">

    <header class="wf-titlebar">…</header>
    <aside class="wf-sidebar">…</aside>

    <main class="wf-main" style="max-width:560px; margin:0 auto;">

      <nav style="display:flex; gap:8px; align-items:center;">
        <span class="wf-chip" style="background:var(--vc-color-content);
                                       color:var(--vc-color-canvas);">1</span>
        <span class="wf-text" data-wf-lines="1">Setup</span>
        <hr style="flex:1;" class="wf-divider">
        <span class="wf-chip">2</span>
        <span class="wf-text" data-wf-lines="1">Connect</span>
        <hr style="flex:1;" class="wf-divider">
        <span class="wf-chip">3</span>
        <span class="wf-text" data-wf-lines="1">Done</span>
      </nav>

      <article class="wf-card">
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Set up your workspace</span>
        </header>
        <p class="wf-text" data-wf-lines="3"></p>

        <label class="wf-label">Workspace name</label>
        <input class="wf-input">

        <label class="wf-label">Region</label>
        <input class="wf-input" placeholder="Select a region">

        <footer class="wf-card__actions">
          <button class="wf-button wf-button--ghost">Skip for now</button>
          <button class="wf-button">Continue →</button>
        </footer>
      </article>

    </main>

  </div>
</section>
```

### Notes

- The step indicator is a flex row of chips + labels + dividers.
  The CURRENT step's chip is inverted (dark background, light
  text — overriding the default chip style).
- `max-width: 560px; margin: 0 auto` centers the form column.
- Primary CTA is "Continue →"; ghost CTA is "Skip for now".

---

## Pattern 6 — Multi-column board (kanban / columns)

A kanban-style board — fixed columns, draggable cards within.

```html
<section class="wf-screen" id="screen-board"
         data-ve-id="screen-board" data-ve-type="wireframe-screen">
  <div class="wf-archetype--app">

    <header class="wf-titlebar">…</header>
    <aside class="wf-sidebar">…</aside>

    <main class="wf-main">

      <header style="display:flex; gap:12px; align-items:center;">
        <h1 class="wf-text" data-wf-lines="1" style="flex:1;">Roadmap</h1>
        <button class="wf-button wf-button--ghost">Filter</button>
        <button class="wf-button">+ New card</button>
      </header>

      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px;">

        <section style="display:flex; flex-direction:column; gap:8px;">
          <header style="display:flex; gap:8px; align-items:center;">
            <span class="wf-text" data-wf-lines="1">Backlog</span>
            <span class="wf-chip">12</span>
          </header>
          <article class="wf-card">
            <span class="wf-text" data-wf-lines="2"></span>
            <span class="wf-chip">Bug</span>
          </article>
          <article class="wf-card">…</article>
          <article class="wf-card">…</article>
        </section>

        <section style="display:flex; flex-direction:column; gap:8px;">
          <header style="display:flex; gap:8px; align-items:center;">
            <span class="wf-text" data-wf-lines="1">In progress</span>
            <span class="wf-chip">4</span>
          </header>
          <article class="wf-card">…</article>
          <article class="wf-card">…</article>
        </section>

        <section style="display:flex; flex-direction:column; gap:8px;">
          <header style="display:flex; gap:8px; align-items:center;">
            <span class="wf-text" data-wf-lines="1">Review</span>
            <span class="wf-chip">2</span>
          </header>
          <article class="wf-card">…</article>
        </section>

        <section style="display:flex; flex-direction:column; gap:8px;">
          <header style="display:flex; gap:8px; align-items:center;">
            <span class="wf-text" data-wf-lines="1">Done</span>
            <span class="wf-chip">8</span>
          </header>
          <article class="wf-card">…</article>
          <article class="wf-card">…</article>
        </section>

      </div>

    </main>

  </div>
</section>
```

### Notes

- The board is a 4-column grid. Each column is a vertical stack
  of cards.
- The column header has the column name + a count chip.
- Cards are simple `wf-card`s with a tag chip per card.
- For 3 or 5 columns, change `repeat(4, 1fr)` accordingly.

---

## The stat-band recipe — 4 KPI cards in a row

The KPI band is the dashboard staple. Recipe:

```html
<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px;">
  <div class="wf-card">
    <span class="wf-label">Metric name</span>
    <span class="wf-text" data-wf-lines="1" style="font-size:32px;"></span>
    <span class="wf-chip">+12.4%</span>
  </div>
  …
</div>
```

Three children per card, in this exact order:

1. `wf-label` — small uppercase metric name.
2. `wf-text` with `font-size: 32px` — the big number.
3. `wf-chip` — the delta vs previous period (`+12.4%`, `-0.4%`).

For dashboards with both percentage AND absolute deltas, stack two
chips:

```html
<div class="wf-card">
  <span class="wf-label">Revenue</span>
  <span class="wf-text" data-wf-lines="1" style="font-size:32px;"></span>
  <div style="display:flex; gap:4px;">
    <span class="wf-chip">+12.4%</span>
    <span class="wf-chip">+$24k</span>
  </div>
</div>
```

---

## The chart placeholder — `wf-image` substitute

Charts in a wireframe are `wf-image` blocks at chart-appropriate
dimensions. Don't try to render a real chart in the wireframe — the
diagonal-X reads as "chart goes here" perfectly well.

| Chart type | Recommended dimensions |
|---|---|
| Bar / line (time series) | `min-height: 280px` |
| Pie / donut | `min-height: 240px; max-width: 240px` (square) |
| Sparkline | `min-height: 40px` (inline-flex with the metric) |
| Gauge / dial | `min-height: 160px; max-width: 240px` |

For multi-chart dashboards, use a grid:

```html
<div style="display:grid; grid-template-columns:2fr 1fr; gap:16px;">
  <article class="wf-card">
    <header class="wf-card__title">Revenue over time</header>
    <figure class="wf-image" style="min-height:280px;"></figure>
  </article>
  <article class="wf-card">
    <header class="wf-card__title">By region</header>
    <figure class="wf-image" style="min-height:280px;"></figure>
  </article>
</div>
```

---

## Sidebar grouping with `wf-divider`

Sidebars longer than 5 items should group by section. Use
`wf-divider` between groups:

```html
<aside class="wf-sidebar">

  <a class="wf-nav-item is-active" href="#screen-dashboard">Dashboard</a>
  <a class="wf-nav-item" href="#screen-users">Users</a>
  <a class="wf-nav-item" href="#screen-billing">Billing</a>

  <hr class="wf-divider">

  <span class="wf-label" style="padding:0 12px;">DEVELOPER</span>
  <a class="wf-nav-item" href="#screen-api">API keys</a>
  <a class="wf-nav-item" href="#screen-webhooks">Webhooks</a>

  <hr class="wf-divider">

  <a class="wf-nav-item" href="#screen-settings">Settings</a>
  <a class="wf-nav-item" href="#screen-logout">Log out</a>

</aside>
```

The optional uppercase `wf-label` inside a group is a section
header. Pad it to align with the nav items.

---

## Dense data — when to break the 16px gap rule

The default `wf-main` gap is `var(--vc-space-4, 24px)`. For data-
dense dashboards (lots of cards, charts, tables), this becomes too
breathy. Override at the screen level:

```html
<main class="wf-main"
      style="gap: 12px;">
  …
</main>
```

A 12px gap (`--vc-space-2`) packs more data per scroll. Don't go
below 8px — at that point sections start to visually merge.

For data-table rows specifically, the `wf-table-row` padding is
`var(--vc-space-2, 12px) var(--wf-block-pad)`. Override for ultra-
dense lists:

```html
<div class="wf-table" style="--vc-space-2: 6px;">
  …
</div>
```

This re-binds the token at the table scope; rows pad to 6px instead
of 12px. The table is the only block that uses this override
pattern — for everything else, keep the default density.
