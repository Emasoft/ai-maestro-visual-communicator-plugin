# Email & messaging screens — inbox, conversation, composer, threads

Mail and chat are the most-built application shapes. Six canonical
screens: inbox list, conversation view, compose modal, thread tree,
contact picker, unread digest.

## Table of contents

- [Pattern 1 — Inbox (3-pane: sidebar / list / preview)](#pattern-1--inbox-3-pane-sidebar--list--preview)
- [Pattern 2 — Conversation view (header + message stack + composer)](#pattern-2--conversation-view-header--message-stack--composer)
- [Pattern 3 — Compose modal (overlay form)](#pattern-3--compose-modal-overlay-form)
- [Pattern 4 — Thread tree (nested replies)](#pattern-4--thread-tree-nested-replies)
- [Pattern 5 — Contact picker (search + result list + chip selection)](#pattern-5--contact-picker-search--result-list--chip-selection)
- [Pattern 6 — Unread digest (grouped by sender)](#pattern-6--unread-digest-grouped-by-sender)
- [The chat bubble — author + text + time + reply link](#the-chat-bubble--author--text--time--reply-link)
- [The mail row — sender + subject + preview + time](#the-mail-row--sender--subject--preview--time)
- [Unread vs read — the bold-weight signal](#unread-vs-read--the-bold-weight-signal)
- [The reply composer — inline at the bottom](#the-reply-composer--inline-at-the-bottom)

---

## Pattern 1 — Inbox (3-pane: sidebar / list / preview)

The classic mail app — folder sidebar on the left, message list in
the middle, selected message preview on the right.

```html
<section class="wf-screen" id="screen-inbox"
         data-ve-id="screen-inbox" data-ve-type="wireframe-screen">

  <div style="display:grid;
              grid-template-columns:
                var(--wf-sidebar-w, 240px)
                360px
                1fr;
              grid-template-rows:auto 1fr;
              grid-template-areas:
                'titlebar titlebar titlebar'
                'sidebar  list      preview';
              min-height:600px;">

    <header class="wf-titlebar" style="grid-area:titlebar;">
      <span class="wf-traffic-lights"><span></span><span></span><span></span></span>
      <span class="wf-text" data-wf-lines="1">Mailbox</span>
    </header>

    <aside class="wf-sidebar" style="grid-area:sidebar;">
      <a class="wf-nav-item is-active" href="#screen-inbox">Inbox <span class="wf-chip">23</span></a>
      <a class="wf-nav-item" href="#screen-starred">Starred</a>
      <a class="wf-nav-item" href="#screen-sent">Sent</a>
      <a class="wf-nav-item" href="#screen-drafts">Drafts <span class="wf-chip">3</span></a>
      <a class="wf-nav-item" href="#screen-archive">Archive</a>
      <a class="wf-nav-item" href="#screen-trash">Trash</a>
      <hr class="wf-divider">
      <span class="wf-label" style="padding-inline:12px;">LABELS</span>
      <a class="wf-nav-item" href="#screen-label-work">Work</a>
      <a class="wf-nav-item" href="#screen-label-personal">Personal</a>
    </aside>

    <div style="grid-area:list;
                border-right:1px solid var(--vc-color-border);
                display:flex;
                flex-direction:column;">

      <header style="padding:12px 16px;
                     border-bottom:1px solid var(--vc-color-border);
                     display:flex; gap:8px; align-items:center;">
        <input class="wf-input" placeholder="Search" style="flex:1;">
      </header>

      <a href="#screen-message-1"
         style="padding:12px 16px;
                border-bottom:1px solid var(--vc-color-border);
                background:var(--vc-color-surface-sunken);
                display:flex; flex-direction:column; gap:4px;
                text-decoration:none;">
        <header style="display:flex; justify-content:space-between;">
          <span class="wf-text" data-wf-lines="1"
                style="font-weight:600;">Sender name</span>
          <span class="wf-text" data-wf-lines="1"
                style="font-size:12px;
                       color:var(--vc-color-content-subtle);">2h</span>
        </header>
        <span class="wf-text" data-wf-lines="1"
              style="font-weight:600;">Subject line goes here</span>
        <span class="wf-text" data-wf-lines="1"
              style="color:var(--vc-color-content-subtle);">
          Preview of the message body…
        </span>
      </a>

      <a href="#screen-message-2"
         style="padding:12px 16px;
                border-bottom:1px solid var(--vc-color-border);
                display:flex; flex-direction:column; gap:4px;
                text-decoration:none;">
        <header style="display:flex; justify-content:space-between;">
          <span class="wf-text" data-wf-lines="1">Other sender</span>
          <span class="wf-text" data-wf-lines="1"
                style="font-size:12px;">5h</span>
        </header>
        <span class="wf-text" data-wf-lines="1">Re: Subject</span>
        <span class="wf-text" data-wf-lines="1"
              style="color:var(--vc-color-content-subtle);">Preview…</span>
      </a>

      <a href="#screen-message-3" style="padding:12px 16px; display:flex; flex-direction:column;">
        <span class="wf-text" data-wf-lines="1">Third sender</span>
        <span class="wf-text" data-wf-lines="1">Subject 3</span>
        <span class="wf-text" data-wf-lines="1">…</span>
      </a>

    </div>

    <main style="grid-area:preview; padding:24px;
                 display:flex; flex-direction:column; gap:16px;
                 overflow:visible;">

      <header>
        <h1 class="wf-text" data-wf-lines="1">Subject line goes here</h1>
        <div style="display:flex; gap:12px; align-items:center; margin-top:8px;">
          <span class="wf-avatar"></span>
          <div>
            <span class="wf-text" data-wf-lines="1">Sender name</span>
            <span class="wf-text" data-wf-lines="1"
                  style="font-size:12px;
                         color:var(--vc-color-content-subtle);">
              to me · 2 hours ago
            </span>
          </div>
        </div>
      </header>

      <hr class="wf-divider">

      <p class="wf-text" data-wf-lines="12"></p>

      <footer style="display:flex; gap:8px; margin-top:16px;">
        <button class="wf-button">Reply</button>
        <button class="wf-button wf-button--ghost">Reply all</button>
        <button class="wf-button wf-button--ghost">Forward</button>
      </footer>

    </main>

  </div>
</section>
```

### Notes

- Custom grid (not `wf-archetype--app`) because we need THREE
  columns plus a titlebar — the standard app archetype is 2-column.
- The sidebar has folder names + count chips for unread counts.
- The mid-pane message list uses individual `<a>` blocks (not
  `wf-card`s — the list density is too tight for card padding).
- The SELECTED message in the list has `background:
  var(--vc-color-surface-sunken)` — visually marks the current item.
- The preview pane has the action footer (Reply / Reply all /
  Forward) at the BOTTOM.

---

## Pattern 2 — Conversation view (header + message stack + composer)

A chat / IM conversation — header with contact name + message
bubbles + composer at the bottom.

```html
<section class="wf-screen" id="screen-chat"
         data-ve-id="screen-chat" data-ve-type="wireframe-screen">
  <div class="wf-archetype--mobile">

    <header class="wf-statusbar">
      <a href="#screen-chats" class="wf-text" data-wf-lines="1">←</a>
      <span class="wf-avatar" style="width:24px; height:24px;"></span>
      <span class="wf-text" data-wf-lines="1">Anna Chen</span>
      <span>·•·</span>
    </header>

    <main class="wf-main" style="gap:8px;">

      <!-- received bubble (left-aligned) -->
      <div style="display:flex; gap:8px; align-items:flex-end;">
        <span class="wf-avatar" style="width:32px; height:32px;"></span>
        <div class="wf-card" style="max-width:75%;
                                     border-radius:16px 16px 16px 4px;">
          <p class="wf-text" data-wf-lines="2"></p>
        </div>
      </div>

      <!-- sent bubble (right-aligned, accent background) -->
      <div style="display:flex; justify-content:flex-end;">
        <div class="wf-card" style="max-width:75%;
                                     background:var(--vc-color-accent);
                                     color:var(--vc-color-on-accent);
                                     border-radius:16px 16px 4px 16px;">
          <p class="wf-text" data-wf-lines="1"></p>
        </div>
      </div>

      <!-- received bubble again -->
      <div style="display:flex; gap:8px; align-items:flex-end;">
        <span class="wf-avatar" style="width:32px; height:32px;"></span>
        <div class="wf-card" style="max-width:75%;
                                     border-radius:16px 16px 16px 4px;">
          <p class="wf-text" data-wf-lines="3"></p>
        </div>
      </div>

      <!-- typing indicator -->
      <div style="display:flex; gap:8px; align-items:flex-end;">
        <span class="wf-avatar" style="width:32px; height:32px;"></span>
        <div class="wf-card" style="background:var(--vc-color-surface-sunken);
                                     border-radius:16px;
                                     padding:8px 16px;">
          <span class="wf-text" data-wf-lines="1">···</span>
        </div>
      </div>

    </main>

    <footer style="border-top:1px solid var(--vc-color-border);
                   padding:8px;
                   display:flex; gap:8px; align-items:center;">
      <input class="wf-input" placeholder="Message" style="flex:1;">
      <button class="wf-button">Send</button>
    </footer>

  </div>
</section>
```

### Notes

- Received bubbles: left-aligned, avatar on the left, neutral
  surface background, radius `16px 16px 16px 4px` (squared on the
  bottom-left to "point" at the sender).
- Sent bubbles: right-aligned, no avatar, accent background, radius
  `16px 16px 4px 16px` (squared on the bottom-right).
- The typing indicator is a small bubble with `···` text.
- The composer is a footer with input + Send button.

---

## Pattern 3 — Compose modal (overlay form)

A modal for composing a new email or message. Opens over the
inbox/conversation screen.

```html
<section class="wf-screen" id="screen-compose"
         data-ve-id="screen-compose" data-ve-type="wireframe-screen">

  <!-- the underlying inbox -->
  <div style="filter:brightness(0.6);">
    <!-- ghost of the inbox screen -->
  </div>

  <!-- the compose modal -->
  <div class="wf-overlay">
    <div class="wf-modal" style="width:min(560px, 90vw);">

      <header style="display:flex; gap:8px; align-items:center;">
        <span class="wf-text" data-wf-lines="1"
              style="font-weight:600; flex:1;">New message</span>
        <a href="#screen-inbox" class="wf-text" data-wf-lines="1">×</a>
      </header>

      <label class="wf-label">To</label>
      <input class="wf-input" placeholder="recipient@example.com">

      <label class="wf-label">Subject</label>
      <input class="wf-input">

      <textarea class="wf-input"
                placeholder="Message body"
                style="min-height:160px;"></textarea>

      <footer class="wf-modal__actions">
        <button class="wf-button wf-button--ghost">Save draft</button>
        <button class="wf-button">Send</button>
      </footer>

    </div>
  </div>

</section>
```

### Notes

- The "× close" link in the modal header navigates back to the
  inbox.
- Body textarea has `min-height: 160px` — give the composer real
  writing space.
- Two actions: Save draft (ghost), Send (primary).

---

## Pattern 4 — Thread tree (nested replies)

A forum / Reddit / GitHub-issue-style thread with nested replies.

```html
<article class="wf-card">

  <!-- root comment -->
  <header style="display:flex; gap:12px; align-items:flex-start;">
    <span class="wf-avatar"></span>
    <div style="flex:1;">
      <div style="display:flex; gap:8px; align-items:center;">
        <span class="wf-text" data-wf-lines="1" style="font-weight:600;">Anna</span>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">2h ago</span>
      </div>
      <p class="wf-text" data-wf-lines="2" style="margin-top:8px;"></p>
      <nav style="display:flex; gap:12px; margin-top:8px;">
        <a class="wf-text" data-wf-lines="1"
           style="font-size:12px;">↑ 12</a>
        <a class="wf-text" data-wf-lines="1"
           style="font-size:12px;">Reply</a>
      </nav>
    </div>
  </header>

  <!-- nested reply 1 -->
  <div style="margin-left:48px; margin-top:16px;
              border-left:2px solid var(--vc-color-border);
              padding-left:16px;">
    <header style="display:flex; gap:12px; align-items:flex-start;">
      <span class="wf-avatar"></span>
      <div style="flex:1;">
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="wf-text" data-wf-lines="1" style="font-weight:600;">Ben</span>
          <span class="wf-text" data-wf-lines="1"
                style="font-size:12px;">1h ago</span>
        </div>
        <p class="wf-text" data-wf-lines="3" style="margin-top:8px;"></p>
        <nav style="display:flex; gap:12px; margin-top:8px;">
          <a class="wf-text" data-wf-lines="1" style="font-size:12px;">↑ 5</a>
          <a class="wf-text" data-wf-lines="1" style="font-size:12px;">Reply</a>
        </nav>
      </div>
    </header>

    <!-- nested reply 2 (depth 2) -->
    <div style="margin-left:48px; margin-top:16px;
                border-left:2px solid var(--vc-color-border);
                padding-left:16px;">
      <header style="display:flex; gap:12px; align-items:flex-start;">
        <span class="wf-avatar"></span>
        <div style="flex:1;">
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="wf-text" data-wf-lines="1"
                  style="font-weight:600;">Anna</span>
            <span class="wf-text" data-wf-lines="1"
                  style="font-size:12px;">45m ago</span>
          </div>
          <p class="wf-text" data-wf-lines="1" style="margin-top:8px;"></p>
        </div>
      </header>
    </div>

  </div>

  <!-- nested reply 3 (separate branch) -->
  <div style="margin-left:48px; margin-top:16px;
              border-left:2px solid var(--vc-color-border);
              padding-left:16px;">
    <header style="display:flex; gap:12px; align-items:flex-start;">
      <span class="wf-avatar"></span>
      <div style="flex:1;">
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="wf-text" data-wf-lines="1" style="font-weight:600;">Chris</span>
          <span class="wf-text" data-wf-lines="1"
                style="font-size:12px;">30m ago</span>
        </div>
        <p class="wf-text" data-wf-lines="2" style="margin-top:8px;"></p>
      </div>
    </header>
  </div>

</article>
```

### Notes

- Each reply level adds `margin-left: 48px` + a left border (2px,
  border color). The hierarchy is read VISUALLY.
- Avoid nesting more than 3 levels — the horizontal space runs out
  on narrow viewports. Show "View more replies" link instead.
- The reply meta has upvote count + "Reply" link below each
  comment.

---

## Pattern 5 — Contact picker (search + result list + chip selection)

For "send to" pickers — search input, result list, selected
recipients shown as chips.

```html
<article class="wf-card">

  <label class="wf-label">To</label>

  <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
    <span class="wf-chip">Anna Chen ×</span>
    <span class="wf-chip">Ben Park ×</span>
    <input class="wf-input"
           placeholder="Add another"
           style="flex:1; min-width:200px;">
  </div>

  <!-- result dropdown (open state) -->
  <div style="border:1px solid var(--vc-color-border);
              border-top:none;
              max-height:240px;
              overflow:visible;">
    <a href="#" style="display:flex; gap:12px; padding:8px 12px;
                       align-items:center;
                       border-bottom:1px solid var(--vc-color-border);">
      <span class="wf-avatar" style="width:32px; height:32px;"></span>
      <div style="flex:1;">
        <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
          Chris Doe
        </span>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">
          chris@example.com
        </span>
      </div>
    </a>

    <a href="#" style="display:flex; gap:12px; padding:8px 12px;
                       align-items:center;
                       border-bottom:1px solid var(--vc-color-border);
                       background:var(--vc-color-surface-sunken);">
      <span class="wf-avatar" style="width:32px; height:32px;"></span>
      <div style="flex:1;">
        <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
          Diana Yu
        </span>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;">diana@example.com</span>
      </div>
    </a>

    <a href="#" style="display:flex; gap:12px; padding:8px 12px;
                       align-items:center;">
      <span class="wf-avatar" style="width:32px; height:32px;"></span>
      <div style="flex:1;">
        <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
          Ed Lopez
        </span>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;">ed@example.com</span>
      </div>
    </a>
  </div>

</article>
```

### Notes

- Selected recipients are chips with `×` for removal.
- The input grows (`flex: 1`) but has `min-width: 200px` so it
  always shows a comfortable typing area.
- The dropdown shows up to ~5 results with avatar + name + email.
- The HOVERED result has `background: var(--vc-color-surface-sunken)`
  — the keyboard-highlighted item.

---

## Pattern 6 — Unread digest (grouped by sender)

A summary screen showing unread messages grouped by sender.

```html
<main class="wf-main">

  <h1 class="wf-text" data-wf-lines="1">Unread (12)</h1>
  <p class="wf-text" data-wf-lines="1"
     style="color:var(--vc-color-content-subtle);">
    Across 4 conversations
  </p>

  <article class="wf-card">

    <header style="display:flex; gap:12px; align-items:center;">
      <span class="wf-avatar"></span>
      <div style="flex:1;">
        <span class="wf-text" data-wf-lines="1" style="font-weight:600;">Anna Chen</span>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">
          5 unread · most recent 2h ago
        </span>
      </div>
      <a class="wf-button wf-button--ghost" href="#screen-chat-anna">Open</a>
    </header>

    <hr class="wf-divider">

    <div style="margin-left:48px; display:flex; flex-direction:column; gap:8px;">
      <div class="wf-text" data-wf-lines="1"
           style="border-left:3px solid var(--vc-color-accent);
                  padding-left:8px;"></div>
      <div class="wf-text" data-wf-lines="1"
           style="border-left:3px solid var(--vc-color-accent);
                  padding-left:8px;"></div>
      <div class="wf-text" data-wf-lines="1"
           style="border-left:3px solid var(--vc-color-accent);
                  padding-left:8px;"></div>
    </div>

  </article>

  <article class="wf-card">…second sender group…</article>
  <article class="wf-card">…third sender group…</article>

</main>
```

### Notes

- Each card represents ONE SENDER with multiple unreads.
- The card header has avatar + name + meta + "Open" action.
- Below the divider, each unread message preview is shown with a
  3px accent left border — the "unread" visual signal.

---

## The chat bubble — author + text + time + reply link

The reusable chat bubble pattern:

```html
<div style="display:flex; gap:8px; align-items:flex-start;">
  <span class="wf-avatar"></span>
  <div class="wf-card" style="border-radius:12px;">
    <div style="display:flex; gap:8px;">
      <span class="wf-text" data-wf-lines="1" style="font-weight:600;">Author</span>
      <span class="wf-text" data-wf-lines="1"
            style="font-size:12px;
                   color:var(--vc-color-content-subtle);">2h ago</span>
    </div>
    <p class="wf-text" data-wf-lines="2"></p>
    <a class="wf-text" data-wf-lines="1"
       style="font-size:12px;
              color:var(--vc-color-content-muted);">Reply →</a>
  </div>
</div>
```

For nested reply, indent: `margin-left: 36px` (matches the avatar +
gap distance).

---

## The mail row — sender + subject + preview + time

The reusable inbox-row pattern:

```html
<a href="#screen-message-X"
   style="display:flex;
          flex-direction:column;
          gap:4px;
          padding:12px 16px;
          border-bottom:1px solid var(--vc-color-border);
          text-decoration:none;">
  <header style="display:flex; justify-content:space-between;">
    <span class="wf-text" data-wf-lines="1" style="font-weight:600;">Sender</span>
    <span class="wf-text" data-wf-lines="1"
          style="font-size:12px;
                 color:var(--vc-color-content-subtle);">2h</span>
  </header>
  <span class="wf-text" data-wf-lines="1" style="font-weight:600;">Subject</span>
  <span class="wf-text" data-wf-lines="1"
        style="color:var(--vc-color-content-subtle);">Preview…</span>
</a>
```

For UNREAD rows, ensure ALL THREE text elements have `font-weight:
600` (sender, subject, preview). For READ rows, only the sender and
subject are bold.

---

## Unread vs read — the bold-weight signal

The single most important mail-app convention:

- **Unread**: bold text, possibly an accent left border + dot.
- **Read**: regular weight text.

```html
<!-- unread row -->
<a style="border-left:3px solid var(--vc-color-accent);
          padding-left:8px;
          font-weight:600;">…</a>

<!-- read row -->
<a style="padding-left:8px;
          color:var(--vc-color-content-muted);">…</a>
```

The accent left border at wireframe fidelity desaturates to a grey
border (still visible as a strong-weight-vs-muted contrast). At hi
fidelity it paints the brand color.

---

## The reply composer — inline at the bottom

For inline reply (Slack-style — not a modal), put a composer at
the bottom of the conversation view:

```html
<footer style="border-top:1px solid var(--vc-color-border);
               padding:12px;
               display:flex; gap:8px; align-items:flex-end;">
  <span class="wf-avatar"></span>
  <textarea class="wf-input"
            placeholder="Reply…"
            style="flex:1; min-height:60px; resize:vertical;"></textarea>
  <button class="wf-button">Send</button>
</footer>
```

The avatar on the left identifies "you" (the current user); the
textarea is the body; the Send button is on the right.

For more complex composers (attachment picker, emoji picker), put
a row of action chips ABOVE the textarea:

```html
<footer>
  <nav style="display:flex; gap:8px; padding:8px;">
    <span class="wf-chip">📷</span>
    <span class="wf-chip">📎</span>
    <span class="wf-chip">@</span>
    <span class="wf-chip">😊</span>
  </nav>
  <div style="display:flex; gap:8px; padding:0 8px 8px;">
    <textarea class="wf-input" style="flex:1;"></textarea>
    <button class="wf-button">Send</button>
  </div>
</footer>
```
