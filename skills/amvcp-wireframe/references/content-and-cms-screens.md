# Content & CMS screens — articles, editor, media library

Content-management shapes. Six patterns: article reader, post
editor (WYSIWYG-style), media library grid, content list, draft
preview, publish-flow modal.

## Table of contents

- [Pattern 1 — Article reader (long-form prose)](#pattern-1--article-reader-long-form-prose)
- [Pattern 2 — Post editor (WYSIWYG body + meta sidebar)](#pattern-2--post-editor-wysiwyg-body--meta-sidebar)
- [Pattern 3 — Media library (thumbnail grid + filter)](#pattern-3--media-library-thumbnail-grid--filter)
- [Pattern 4 — Content list (sortable table of posts)](#pattern-4--content-list-sortable-table-of-posts)
- [Pattern 5 — Draft preview (mobile + desktop side-by-side)](#pattern-5--draft-preview-mobile--desktop-side-by-side)
- [Pattern 6 — Publish-flow modal (visibility + schedule)](#pattern-6--publish-flow-modal-visibility--schedule)
- [Toolbar — bold, italic, link, list, image](#toolbar--bold-italic-link-list-image)
- [Inline embed (image, video, code block)](#inline-embed-image-video-code-block)
- [Author byline](#author-byline)
- [Comment thread (article-attached)](#comment-thread-article-attached)

---

## Pattern 1 — Article reader (long-form prose)

A blog post reading view. Narrow column, big typography, embedded
media.

```html
<section class="wf-screen" id="screen-article"
         data-ve-id="screen-article" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <header class="wf-header">
      <span class="wf-text" data-wf-lines="1">brand</span>
      <nav class="wf-nav">
        <a class="wf-nav-item" href="#screen-home">Home</a>
        <a class="wf-nav-item" href="#screen-blog">Blog</a>
        <a class="wf-nav-item" href="#screen-about">About</a>
      </nav>
    </header>

    <main class="wf-main" style="max-width:720px;">

      <nav style="display:flex; gap:8px;
                  font-size:12px;
                  color:var(--vc-color-content-subtle);">
        <a href="#screen-blog">Blog</a> /
        <span class="wf-text" data-wf-lines="1">Engineering</span>
      </nav>

      <header style="margin-top:24px;">
        <span class="wf-chip">ENGINEERING</span>
        <h1 class="wf-text" data-wf-lines="2"
            style="font-size:40px; line-height:1.2; margin-top:16px;"></h1>

        <div style="display:flex; gap:12px; align-items:center;
                    margin-top:24px;">
          <span class="wf-avatar"></span>
          <div>
            <span class="wf-text" data-wf-lines="1"
                  style="font-weight:600;">Author name</span>
            <span class="wf-text" data-wf-lines="1"
                  style="font-size:12px;
                         color:var(--vc-color-content-subtle);">
              May 16, 2026 · 8 min read
            </span>
          </div>
        </div>
      </header>

      <hr class="wf-divider" style="margin:32px 0;">

      <figure class="wf-image" style="min-height:320px; margin-bottom:24px;"></figure>

      <p class="wf-text" data-wf-lines="5"></p>

      <h2 class="wf-text" data-wf-lines="1"
          style="font-size:24px; margin-top:32px;">A section heading</h2>

      <p class="wf-text" data-wf-lines="7"></p>

      <blockquote style="border-left:4px solid var(--vc-color-accent);
                         padding-left:16px;
                         margin:24px 0;">
        <p class="wf-text" data-wf-lines="3"
           style="font-size:18px; font-style:italic;"></p>
      </blockquote>

      <p class="wf-text" data-wf-lines="6"></p>

      <h2 class="wf-text" data-wf-lines="1"
          style="font-size:24px; margin-top:32px;">Another section</h2>

      <p class="wf-text" data-wf-lines="8"></p>

      <pre style="background:var(--vc-color-surface-sunken);
                  padding:16px;
                  font-family:monospace;
                  font-size:14px;
                  border-radius:6px;
                  overflow:visible;">
function example() {
  return 'code block';
}
      </pre>

      <p class="wf-text" data-wf-lines="5"></p>

      <hr class="wf-divider" style="margin:48px 0;">

      <footer style="display:flex; gap:8px; flex-wrap:wrap;">
        <span class="wf-chip">#engineering</span>
        <span class="wf-chip">#typescript</span>
        <span class="wf-chip">#architecture</span>
      </footer>

    </main>

  </div>
</section>
```

### Notes

- Narrow column (720px) — readability beats density.
- Breadcrumb at the top — Blog / Category.
- Header: category eyebrow chip + big headline + author byline.
- Hero image is wide (full column width) and tall (320px).
- Body alternates between paragraphs, h2 sections, blockquote
  (with left accent border), code blocks.
- Footer has tag chips.

---

## Pattern 2 — Post editor (WYSIWYG body + meta sidebar)

A blog post editing screen. Big writing area on the left, metadata
sidebar on the right.

```html
<section class="wf-screen" id="screen-editor"
         data-ve-id="screen-editor" data-ve-type="wireframe-screen">
  <div class="wf-archetype--app">

    <header class="wf-titlebar">
      <span class="wf-traffic-lights"><span></span><span></span><span></span></span>
      <span class="wf-text" data-wf-lines="1">Editing: My new post</span>
      <span class="wf-chip" style="margin-left:auto;">DRAFT</span>
    </header>

    <aside class="wf-sidebar">
      <a class="wf-nav-item is-active" href="#screen-posts">Posts</a>
      <a class="wf-nav-item" href="#screen-pages">Pages</a>
      <a class="wf-nav-item" href="#screen-media">Media</a>
    </aside>

    <main class="wf-main" style="padding:0;">

      <div style="display:grid;
                  grid-template-columns:1fr 320px;
                  min-height:600px;">

        <!-- editor body -->
        <article style="padding:32px;
                        display:flex; flex-direction:column; gap:16px;">

          <!-- toolbar -->
          <nav style="display:flex; gap:4px;
                      padding:8px;
                      border:1px solid var(--vc-color-border);
                      border-radius:6px;
                      background:var(--vc-color-surface);">
            <button class="wf-button wf-button--ghost"
                    style="padding:6px 10px;"><b>B</b></button>
            <button class="wf-button wf-button--ghost"
                    style="padding:6px 10px;"><i>I</i></button>
            <button class="wf-button wf-button--ghost"
                    style="padding:6px 10px;">🔗</button>
            <span style="border-left:1px solid var(--vc-color-border);
                         margin:0 4px;"></span>
            <button class="wf-button wf-button--ghost"
                    style="padding:6px 10px;">H1</button>
            <button class="wf-button wf-button--ghost"
                    style="padding:6px 10px;">H2</button>
            <button class="wf-button wf-button--ghost"
                    style="padding:6px 10px;">¶</button>
            <span style="border-left:1px solid var(--vc-color-border);
                         margin:0 4px;"></span>
            <button class="wf-button wf-button--ghost"
                    style="padding:6px 10px;">•</button>
            <button class="wf-button wf-button--ghost"
                    style="padding:6px 10px;">1.</button>
            <button class="wf-button wf-button--ghost"
                    style="padding:6px 10px;">"</button>
            <span style="border-left:1px solid var(--vc-color-border);
                         margin:0 4px;"></span>
            <button class="wf-button wf-button--ghost"
                    style="padding:6px 10px;">📷</button>
            <button class="wf-button wf-button--ghost"
                    style="padding:6px 10px;">{ }</button>
          </nav>

          <!-- title input (large, no border) -->
          <input type="text"
                 placeholder="Post title"
                 style="font-size:32px;
                        font-weight:600;
                        border:none;
                        padding:8px 0;
                        background:transparent;
                        color:var(--vc-color-content);
                        outline:none;
                        font-family:inherit;">

          <!-- body editor (large textarea) -->
          <textarea placeholder="Start writing…"
                    style="min-height:400px;
                           border:none;
                           padding:0;
                           background:transparent;
                           color:var(--vc-color-content);
                           font:inherit;
                           font-size:16px;
                           line-height:1.7;
                           outline:none;
                           resize:vertical;"></textarea>

        </article>

        <!-- meta sidebar -->
        <aside style="background:var(--vc-color-surface-sunken);
                      padding:24px;
                      display:flex; flex-direction:column; gap:16px;
                      border-left:1px solid var(--vc-color-border);">

          <article class="wf-card">
            <header class="wf-card__title">
              <span class="wf-text" data-wf-lines="1">Status</span>
            </header>
            <select class="wf-input">
              <option>Draft</option>
              <option>Published</option>
              <option>Scheduled</option>
            </select>
            <button class="wf-button" style="width:100%; margin-top:8px;">
              Publish
            </button>
          </article>

          <article class="wf-card">
            <header class="wf-card__title">
              <span class="wf-text" data-wf-lines="1">Featured image</span>
            </header>
            <figure class="wf-image" style="min-height:120px;"></figure>
            <button class="wf-button wf-button--ghost"
                    style="width:100%; margin-top:8px;">
              Choose image
            </button>
          </article>

          <article class="wf-card">
            <header class="wf-card__title">
              <span class="wf-text" data-wf-lines="1">Categories</span>
            </header>
            <label style="display:flex; gap:8px;"><input type="checkbox" checked> Engineering</label>
            <label style="display:flex; gap:8px;"><input type="checkbox"> Design</label>
            <label style="display:flex; gap:8px;"><input type="checkbox"> Product</label>
          </article>

          <article class="wf-card">
            <header class="wf-card__title">
              <span class="wf-text" data-wf-lines="1">Tags</span>
            </header>
            <input class="wf-input" placeholder="Add tag and Enter">
            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:8px;">
              <span class="wf-chip">#typescript ×</span>
              <span class="wf-chip">#architecture ×</span>
            </div>
          </article>

        </aside>

      </div>

    </main>

  </div>
</section>
```

### Notes

- Titlebar has a DRAFT chip on the right — content state visible
  at all times.
- Main is split: editor (flexible width) + meta sidebar (320px
  fixed).
- The editor body uses real `<input>` / `<textarea>` elements
  with stripped borders — looks like just plain prose with a cursor.
- The toolbar has grouped sections: text formatting / headings /
  lists / inline embeds.
- Sidebar cards: Status (with Publish button), Featured image,
  Categories (checkboxes), Tags (chip input).

---

## Pattern 3 — Media library (thumbnail grid + filter)

A library of images / videos / files — thumbnail grid with filter
sidebar.

```html
<main class="wf-main">

  <header style="display:flex; gap:12px; align-items:center;">
    <h1 class="wf-text" data-wf-lines="1" style="flex:1;">Media library</h1>
    <button class="wf-button wf-button--ghost">Upload</button>
  </header>

  <div style="display:grid; grid-template-columns:240px 1fr; gap:32px;">

    <aside style="display:flex; flex-direction:column; gap:16px;">

      <input class="wf-input" type="search" placeholder="Search">

      <article class="wf-card">
        <span class="wf-label">Type</span>
        <label style="display:flex; gap:8px;"><input type="checkbox" checked> All</label>
        <label style="display:flex; gap:8px;"><input type="checkbox"> Images</label>
        <label style="display:flex; gap:8px;"><input type="checkbox"> Videos</label>
        <label style="display:flex; gap:8px;"><input type="checkbox"> Documents</label>
      </article>

      <article class="wf-card">
        <span class="wf-label">Date</span>
        <select class="wf-input">
          <option>All time</option>
          <option>This year</option>
          <option>This month</option>
          <option>This week</option>
        </select>
      </article>

    </aside>

    <div style="display:grid;
                grid-template-columns:repeat(auto-fill, minmax(160px, 1fr));
                gap:8px;">

      <figure style="aspect-ratio:1; display:flex; flex-direction:column;">
        <div class="wf-image" style="flex:1; aspect-ratio:1;"></div>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px; padding:4px 0;">image-1.jpg</span>
      </figure>

      <figure style="aspect-ratio:1; display:flex; flex-direction:column;">
        <div class="wf-image" style="flex:1; aspect-ratio:1;"></div>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px; padding:4px 0;">image-2.jpg</span>
      </figure>

      <figure style="aspect-ratio:1; display:flex; flex-direction:column;
                     outline:2px solid var(--vc-color-accent);">
        <div class="wf-image" style="flex:1; aspect-ratio:1;"></div>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px; padding:4px 0;
                     font-weight:600;">selected.jpg</span>
      </figure>

      <figure style="aspect-ratio:1; display:flex; flex-direction:column;">
        <div class="wf-image" style="flex:1; aspect-ratio:1;"></div>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px; padding:4px 0;">image-4.jpg</span>
      </figure>

      <figure style="aspect-ratio:1; display:flex; flex-direction:column;">…</figure>
      <figure style="aspect-ratio:1; display:flex; flex-direction:column;">…</figure>
      <figure style="aspect-ratio:1; display:flex; flex-direction:column;">…</figure>
      <figure style="aspect-ratio:1; display:flex; flex-direction:column;">…</figure>

    </div>

  </div>

</main>
```

### Notes

- Sidebar with type checkboxes + date select.
- Grid uses `repeat(auto-fill, minmax(160px, 1fr))` — auto-flows
  on viewport width.
- Each thumbnail: square image + filename below.
- SELECTED thumbnail has accent outline + bold filename.

---

## Pattern 4 — Content list (sortable table of posts)

A list of posts in table form — title, author, date, status.

```html
<main class="wf-main">

  <header style="display:flex; gap:12px; align-items:center;">
    <h1 class="wf-text" data-wf-lines="1" style="flex:1;">Posts</h1>
    <input class="wf-input" type="search" placeholder="Search posts"
           style="max-width:240px;">
    <button class="wf-button">+ New post</button>
  </header>

  <nav style="display:flex; gap:8px;">
    <span class="wf-chip">All (42)</span>
    <span class="wf-chip">Published (28)</span>
    <span class="wf-chip">Drafts (12)</span>
    <span class="wf-chip">Scheduled (2)</span>
  </nav>

  <article class="wf-card" style="padding:0;">
    <div class="wf-table">

      <div class="wf-table-row wf-table-row--head">
        <span class="wf-text" data-wf-lines="1">Title ↓</span>
        <span class="wf-text" data-wf-lines="1">Author</span>
        <span class="wf-text" data-wf-lines="1">Category</span>
        <span class="wf-text" data-wf-lines="1">Date</span>
        <span class="wf-text" data-wf-lines="1">Status</span>
      </div>

      <a href="#screen-edit-post-1" class="wf-table-row">
        <span class="wf-text" data-wf-lines="1"
              style="font-weight:600;">Post title here</span>
        <span class="wf-text" data-wf-lines="1">Anna</span>
        <span class="wf-text" data-wf-lines="1">Engineering</span>
        <span class="wf-text" data-wf-lines="1">May 16</span>
        <span class="wf-chip"
              style="background:var(--vc-color-success);
                     color:var(--vc-color-on-accent);">Published</span>
      </a>

      <a href="#screen-edit-post-2" class="wf-table-row">
        <span class="wf-text" data-wf-lines="1"
              style="font-weight:600;">Another post</span>
        <span class="wf-text" data-wf-lines="1">Ben</span>
        <span class="wf-text" data-wf-lines="1">Design</span>
        <span class="wf-text" data-wf-lines="1">May 14</span>
        <span class="wf-chip">Draft</span>
      </a>

      <a href="#screen-edit-post-3" class="wf-table-row">
        <span class="wf-text" data-wf-lines="1"
              style="font-weight:600;">Scheduled post</span>
        <span class="wf-text" data-wf-lines="1">Chris</span>
        <span class="wf-text" data-wf-lines="1">Product</span>
        <span class="wf-text" data-wf-lines="1">May 20</span>
        <span class="wf-chip"
              style="background:var(--vc-color-warning);
                     color:var(--vc-color-on-accent);">Scheduled</span>
      </a>

    </div>
  </article>

</main>
```

### Notes

- Header row title shows sort direction (`↓`) — the active sort.
- Filter chips above the table show counts (All / Published /
  Drafts / Scheduled).
- Each row is a clickable anchor (click anywhere to edit).
- Status chips use color: green for published, default for draft,
  amber for scheduled.

---

## Pattern 5 — Draft preview (mobile + desktop side-by-side)

A preview of the post on both desktop and mobile, side-by-side.

```html
<main class="wf-main">

  <header style="display:flex; gap:12px; align-items:center;">
    <h1 class="wf-text" data-wf-lines="1" style="flex:1;">Preview</h1>

    <nav style="display:flex; gap:4px;">
      <button class="wf-button">Desktop</button>
      <button class="wf-button wf-button--ghost">Tablet</button>
      <button class="wf-button wf-button--ghost">Mobile</button>
    </nav>

    <a class="wf-button wf-button--ghost" href="#screen-editor">← Back to editor</a>
  </header>

  <div style="display:grid;
              grid-template-columns:1fr 400px;
              gap:32px;
              align-items:flex-start;">

    <!-- desktop preview -->
    <div class="wf-frame wf-frame--browser">
      <div class="wf-frame__chromebar">
        <span class="wf-traffic-lights"><span></span><span></span><span></span></span>
        <div class="wf-frame__url">/blog/post-slug</div>
      </div>
      <div class="wf-frame__content">
        <article style="padding:48px; max-width:720px; margin:0 auto;">
          <h1 class="wf-text" data-wf-lines="1"
              style="font-size:32px;"></h1>
          <p class="wf-text" data-wf-lines="6" style="margin-top:16px;"></p>
        </article>
      </div>
    </div>

    <!-- mobile preview -->
    <div class="wf-frame wf-frame--ios" style="margin:0 auto;">
      <div class="wf-frame__island"></div>
      <div class="wf-frame__content">
        <article style="padding:16px;">
          <h1 class="wf-text" data-wf-lines="2"
              style="font-size:24px;"></h1>
          <p class="wf-text" data-wf-lines="8" style="margin-top:12px;"></p>
        </article>
      </div>
      <div class="wf-frame__home"></div>
    </div>

  </div>

</main>
```

### Notes

- Device picker tab bar (Desktop / Tablet / Mobile) — the active
  device is primary.
- Side-by-side: desktop preview in browser frame, mobile preview
  in iOS frame.
- Both preview the SAME content, rendered at the target viewport
  width.

---

## Pattern 6 — Publish-flow modal (visibility + schedule)

A modal that opens when the user clicks Publish — confirm details
before going live.

```html
<div class="wf-modal" style="width:min(520px, 90vw);">

  <h2 class="wf-text" data-wf-lines="1"
      style="font-size:18px;">Publish post</h2>

  <article class="wf-card" style="background:var(--vc-color-surface-sunken);">
    <span class="wf-label">Preview</span>
    <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
      Post title here
    </span>
    <p class="wf-text" data-wf-lines="2"
       style="font-size:12px;
              color:var(--vc-color-content-subtle);"></p>
  </article>

  <label class="wf-label">Visibility</label>
  <div style="display:flex; gap:4px;">
    <button class="wf-button">Public</button>
    <button class="wf-button wf-button--ghost">Members only</button>
    <button class="wf-button wf-button--ghost">Private</button>
  </div>

  <label class="wf-label">When</label>
  <div style="display:flex; gap:4px;">
    <button class="wf-button">Now</button>
    <button class="wf-button wf-button--ghost">Schedule</button>
  </div>

  <footer class="wf-modal__actions">
    <button class="wf-button wf-button--ghost">Cancel</button>
    <button class="wf-button">Publish now</button>
  </footer>

</div>
```

### Notes

- Preview card recaps title + excerpt — confirm what's being
  published.
- Visibility + When are 3-button and 2-button toggles.
- Confirm action label matches the When choice ("Publish now" or
  "Schedule").

---

## Toolbar — bold, italic, link, list, image

A reusable toolbar pattern for editors. See [Pattern 2](#pattern-2--post-editor-wysiwyg-body--meta-sidebar)
above for full markup. The recipe:

```html
<nav style="display:flex; gap:4px;
            padding:8px;
            border:1px solid var(--vc-color-border);
            border-radius:6px;
            background:var(--vc-color-surface);">

  <!-- text formatting group -->
  <button class="wf-button wf-button--ghost" style="padding:6px 10px;"><b>B</b></button>
  <button class="wf-button wf-button--ghost" style="padding:6px 10px;"><i>I</i></button>
  <button class="wf-button wf-button--ghost" style="padding:6px 10px;">🔗</button>

  <!-- separator -->
  <span style="border-left:1px solid var(--vc-color-border); margin:0 4px;"></span>

  <!-- headings group -->
  <button class="wf-button wf-button--ghost" style="padding:6px 10px;">H1</button>
  <button class="wf-button wf-button--ghost" style="padding:6px 10px;">H2</button>
  <button class="wf-button wf-button--ghost" style="padding:6px 10px;">¶</button>

  <!-- separator -->
  <span style="border-left:1px solid var(--vc-color-border); margin:0 4px;"></span>

  <!-- lists + quote group -->
  <button class="wf-button wf-button--ghost" style="padding:6px 10px;">•</button>
  <button class="wf-button wf-button--ghost" style="padding:6px 10px;">1.</button>
  <button class="wf-button wf-button--ghost" style="padding:6px 10px;">"</button>

</nav>
```

### Notes

- Group related buttons with vertical-bar separators.
- Compact padding (`6px 10px`).
- Use `<b>` and `<i>` inside the bold/italic buttons so they look
  bold/italic.
- For OFTEN-USED actions, prefer keyboard shortcuts over toolbar
  buttons (Ctrl-B for bold, etc.). The toolbar is the discoverable
  affordance; shortcuts are the power-user path.

---

## Inline embed (image, video, code block)

Inline media inside the editor body:

### Inline image

```html
<figure style="margin:16px 0;">
  <img src="…" style="width:100%; height:auto;">
  <figcaption class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);
                     text-align:center;
                     margin-top:8px;">
    Image caption
  </figcaption>
</figure>
```

### Inline video

```html
<figure style="margin:16px 0;">
  <div class="wf-image" style="min-height:240px;
                                aspect-ratio:16/9;
                                position:relative;">
    <span style="position:absolute;
                 inset:0;
                 display:flex;
                 align-items:center;
                 justify-content:center;
                 font-size:48px;">▶</span>
  </div>
  <figcaption class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     text-align:center;
                     margin-top:8px;">
    Video caption
  </figcaption>
</figure>
```

### Inline code block

```html
<pre style="background:var(--vc-color-surface-sunken);
            padding:16px;
            font-family:monospace;
            font-size:14px;
            border-radius:6px;
            overflow:visible;
            margin:16px 0;">
function example() {
  return 'code';
}
</pre>
```

### Notes

- All inline embeds have `margin: 16px 0` for vertical breathing
  room.
- Code blocks use `overflow: visible` (not `auto`) — wide code
  extends the page (no inner scrollbar).
- Video placeholder shows a ▶ glyph centered on the image area.

---

## Author byline

The reusable author info row:

```html
<div style="display:flex; gap:12px; align-items:center;">
  <span class="wf-avatar"></span>
  <div>
    <span class="wf-text" data-wf-lines="1"
          style="font-weight:600;">Author name</span>
    <span class="wf-text" data-wf-lines="1"
          style="font-size:12px;
                 color:var(--vc-color-content-subtle);">
      May 16, 2026 · 8 min read
    </span>
  </div>
</div>
```

### Notes

- Avatar + name + date/read-time.
- For multi-author posts, show the FIRST author's avatar + "Anna
  & 2 others" + date.

---

## Comment thread (article-attached)

A comment thread at the bottom of an article — see the thread
pattern in [`email-and-messaging-screens.md`](email-and-messaging-screens.md).

For an article, the thread is INLINE (not a modal). The composer
sits below the article body:

```html
<section style="border-top:1px solid var(--vc-color-border);
                padding-top:32px;
                margin-top:48px;">

  <h2 class="wf-text" data-wf-lines="1"
      style="font-size:20px;">Comments (12)</h2>

  <!-- composer -->
  <article class="wf-card" style="margin-top:16px;">
    <div style="display:flex; gap:12px;">
      <span class="wf-avatar"></span>
      <div style="flex:1;">
        <textarea class="wf-input"
                  placeholder="Add a comment"
                  style="min-height:80px;"></textarea>
        <footer style="display:flex; justify-content:flex-end;
                       gap:8px; margin-top:8px;">
          <button class="wf-button wf-button--ghost">Cancel</button>
          <button class="wf-button">Post comment</button>
        </footer>
      </div>
    </div>
  </article>

  <!-- comments -->
  <div style="margin-top:24px; display:flex; flex-direction:column; gap:16px;">
    <!-- individual comment threads — see email-and-messaging-screens.md -->
  </div>

</section>
```
