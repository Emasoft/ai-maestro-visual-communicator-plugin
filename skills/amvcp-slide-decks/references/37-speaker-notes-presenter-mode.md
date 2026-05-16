# 37 — Speaker notes + presenter mode (`?notes` window)

The presenter mode is a separate window that mirrors the deck's
position + displays the current slide's speaker notes. The user opens
it via `window.open('?notes', '_blank')` (a custom UI / keyboard
shortcut surfaces this); the deck sends slide-change events to the
notes window via `postMessage`.

Notes themselves are authored as a slide-level `notes` field — the
renderer stamps `data-vsd-notes` on the slide so the presenter
window can read it.

## What this is

Two coordinated views:

1. The DECK window (the main presentation; the audience sees this).
2. The NOTES window (a second tab; the presenter sees this).

The notes window is just the deck HTML again with `?notes` as the
URL query string. The slide module detects the query, switches to
notes-display mode, and listens for `postMessage` events from the
deck window.

Per-slide notes are authored in the JSON:

```jsonc
{ "layout": "content",
  "notes": "When I get to this slide, the audience usually asks about the eviction loop bug — pivot to the issue #4218 mention if so.",
  "blocks": [ ... ]
}
```

The renderer stamps `data-vsd-notes="..."` on the `<section>`; the
notes window reads it by slide index.

## Scaffold to emit

Deck with per-slide notes:

```jsonc
{
  "kind": "deck",
  "title": "Q3 Engineering Readout",
  "slides": [
    { "layout": "manifesto",
      "notes": "Opening. ~30 sec. Set the stage: the cache rewrite was the biggest Q3 project.",
      "blocks": [
        { "type": "eyebrow", "text": "Q3 2026" },
        { "type": "heading", "text": "Latency dropped 38% after the cache rewrite shipped." }
      ] },
    { "layout": "metrics",
      "notes": "The big-numbers slide. ~45 sec. Walk through each metric briefly; the audience usually wants to know p99 method.",
      "blocks": [
        { "type": "heading", "level": 2, "text": "By the numbers." },
        { "type": "metric", "value": "38%", "label": "p99 cut" },
        { "type": "metric", "value": "78%", "label": "hit rate" },
        { "type": "metric", "value": "14",  "label": "features" }
      ] },
    ...
  ]
}
```

Notes are free-form text; the presenter window displays them as
markdown (basic markdown — headings + bullets + bold/italic).

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — stamps `data-vsd-notes`
  attribute if the slide JSON has a `notes` field.
- `boot(doc)` — detects `?notes` in `window.location.search`;
  switches to notes-display mode if present.
- `wireKeyboard(deck)` — extended in presenter mode to forward
  navigation events to the notes window via `postMessage`.

The presenter mode is currently a P2 feature in the consolidated
plan — the renderer ships the `data-vsd-notes` stamping (so notes
are AUTHORABLE today), but the `?notes` window receiver is the
follow-on enhancement.

## DESIGN.md tokens used

The notes window themes off the same `--vc-*` tokens as the deck.
The presenter view typically uses:

| Token | Used for |
|---|---|
| `--vc-color-canvas` | Notes window background. |
| `--vc-color-content` | Notes text. |
| `--vc-color-accent` | Slide number + active indicator. |
| `--vc-font-body` | Notes typeface. |
| `--vc-text-2` | Notes text size (28 px — larger than body for stage-readable). |

The current slide's THUMBNAIL is shown alongside the notes — the
thumbnail's theming comes from the deck's own DESIGN.md, applied to
the thumbnail's own scaled-down stage.

## Selection / comment / decision-mini contract notes

The notes window is the PRESENTER's surface, not the audience's.
Selection / comment state is NOT mirrored to the notes window —
the presenter sees the notes, not the deck's interactive UI.

## postMessage contract

When the user navigates in the DECK window (the audience-facing one),
the deck posts a message to the notes window:

```js
notesWindow.postMessage({
  type: 'slide:change',
  index: deck.current,
  total: deck.slides.length,
  notes: deck.slides[deck.current].notes || ''
}, '*');
```

The notes window listens:

```js
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'slide:change') {
    updateNotesView(e.data.index, e.data.notes);
  }
});
```

The bidirectional channel ALSO works — clicking "next" in the notes
window posts back to the deck:

```js
deckWindow.postMessage({type: 'nav:next'}, '*');
```

This lets the presenter advance from the notes window without
switching focus to the deck.

## When to use this reference

Open this ref when:

- The user asks for "presenter mode" or "speaker notes".
- Authoring notes for a long talk (every slide has a 2-3 sentence
  cue / reminder / Q&A pivot).
- A live talk where the presenter needs separate notes display
  (laptop monitor for notes + projector for the deck).

## When NOT to use notes

- Self-running decks (no presenter — no need for notes).
- Status reports / decks consumed offline (notes are presenter
  cues, not standalone content).
- Posters (poster mode doesn't have a notes path; the poster IS
  the deliverable).

## Authoring rules

The strongest speaker notes:

1. Are time-budgeted ("~30 sec on this slide").
2. Anticipate questions ("audience usually asks about X — pivot
   to Y if so").
3. Cue the next slide's transition ("end with: 'and that brings
   us to the next chart' → flip to slide 6").
4. Are reminders, NOT scripts. Reading verbatim from notes
   sounds canned.

Avoid:

- Notes longer than 200 words per slide (the presenter can't
  read them at a glance).
- Notes that DUPLICATE the slide's content (the notes should
  ADD context, not repeat).
- Notes that contradict the slide (if the note says "don't focus
  on this metric", remove the metric from the slide).

## Don'ts

- Don't put confidential information in notes that gets shared
  with the audience. The `data-vsd-notes` attribute is visible in
  the DECK window's DOM — a curious viewer can `View Source` to
  read all notes. For truly private notes, use an external doc.
- Don't author HTML / scripts in the notes field. The renderer
  treats notes as plain text; HTML shows as literal characters.
- Don't omit notes for slides that need cues. A talk's flow is
  in the notes; missing notes for one slide means missing the
  cue for the next.
- Don't rely on notes for content the audience needs. Notes are
  presenter-only; if the audience needs to see it, put it on the
  slide.

## Visual verification

Notes attribute stamping verification:

1. Author a deck with notes on slides 1, 3, 5.
2. Render via dev-browser.
3. Inspect the DOM:
   `document.querySelectorAll('[data-vsd-notes]').length` should
   be 3.
4. Each slide's `data-vsd-notes` attribute should contain the
   notes text verbatim.

Presenter window verification (when the `?notes` receiver ships):

1. Open the deck.
2. Trigger the presenter window (custom UI / keyboard shortcut).
3. Navigate in the deck window; verify the notes window updates
   on every slide change.
4. Verify the slide thumbnail in the notes window matches the
   current slide.

## Source provenance

- SL-14 — Auto-Scaling Stage + Speaker Notes postMessage in the
  master catalog (lines 2041-2050).
- The `data-vsd-notes` attribute stamping is in `renderSlide()`
  at lines 1124-1126 of `amvcp-slide.js`.
- The `?notes` window is a P2 enhancement in the consolidated
  plan — the renderer ships authoring support today; the receiver
  ships next.
- The `postMessage` contract is the canonical browser cross-
  window communication API — the same pattern as DevTools panels
  talk to the page.
