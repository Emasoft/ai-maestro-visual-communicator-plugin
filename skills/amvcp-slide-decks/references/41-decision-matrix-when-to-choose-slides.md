# 41 — Decision matrix: when to choose slide-deck category vs others

The slide-decks skill is for ONE specific output format: a
fixed-aspect, navigable, JSON-authored slide deck. This reference is
the decision matrix that picks slide-decks vs other AMVCP categories.

## What this is

A category-selection guide. When the user makes a vague request
("show me this", "make a thing for this"), this matrix maps the
request to the right skill.

## Decision flowchart

```
User request
    │
    ├─ Mentions "slides" / "deck" / "presentation"
    │      / "pitch" / "talk" / "slide show"?
    │
    │   YES ── slide-decks (this skill)
    │
    └─ NO ── continue
            │
            ├─ Wants an interactive web page to scroll through?
            │       → prose-pages
            │
            ├─ Wants a chart or graph?
            │       → charts-and-dashboards
            │
            ├─ Wants a diagram (flowchart / sequence / etc.)?
            │       → graph-diagrams
            │
            ├─ Wants a wireframe / mockup?
            │       → wireframe
            │
            ├─ Wants a table of comparisons?
            │       → choice-tables  OR  tables (if N comparisons)
            │
            ├─ Wants a comment thread on something?
            │       → modal-comments
            │
            └─ Wants a generic visualization?
                    → visual-communication
```

## When to pick `slide-decks`

The slide-decks skill is correct when:

| Trigger word | Context |
|---|---|
| "slides" | Always. Explicit ask. |
| "deck" | Slide deck context (vs trading-card deck etc.). |
| "presentation" | Always. |
| "pitch" / "pitch deck" | Investor / sales pitch. |
| "talk" / "talk slides" | Conference / lecture. |
| "slide show" / "slideshow" | Always. |
| `/amvcp-generate-slides` | Slash command — explicit. |
| `--slides` flag on another command | E.g. `/amvcp-plan-review --slides`. |
| User wants "fixed-aspect navigable view" | The structural request. |

The skill is also correct when the user has already chosen this
format implicitly:

- "Turn the Q3 readout into a deck."
- "Render the project plan as slides."
- "I want to present this — make a deck."
- "Format this for projection."

## When NOT to pick slide-decks

The skill is WRONG when:

| Request | Pick instead |
|---|---|
| "Make a scrollable page from this" | `prose-pages` |
| "Make a one-page summary" | `prose-pages` (or `slide-decks` with `kind: "poster"`) |
| "Make a chart of this data" | `charts-and-dashboards` |
| "Make a flowchart" | `graph-diagrams` |
| "Make a wireframe" | `wireframe` |
| "Compare these N options as a table" | `choice-tables` |
| "Show me the data as a table" | `tables` |
| "Add a comment thread to this report" | `modal-comments` |
| "Format the report as a magazine article" | `prose-pages` |
| "Print this for a handout" | `prose-pages` (the print CSS handles pagination) |

## Boundary cases

### Slide deck vs prose page

- Prose pages are SCROLLABLE; slide decks are NAVIGABLE (one slide
  at a time).
- Prose pages are read top-to-bottom at the reader's pace; slide
  decks are paced by the presenter (or by the reader's `→` key).
- Prose pages support arbitrarily long content; slide decks split
  long content across multiple slides.

If the content fits the talk/presentation paradigm → slide-decks.
If the content fits the article/report paradigm → prose-pages.

### Slide deck vs poster

- A poster is a SINGLE slide (`kind: "poster"` in this skill).
- A deck is multiple slides.

The boundary: if the artefact is ONE page (a tweet card, a
conference poster, a one-pager), use `kind: "poster"` in this
skill. If it's multi-page, use `kind: "deck"`.

### Slide deck vs share page

- Slide-decks renders the deck itself.
- Share-pages wraps a deck (or any visual) with a sharing-friendly
  container (URL with metadata, OG tags, embed snippet).

Use `slide-decks` to BUILD the deck; use `share-pages` to PUBLISH it.

### Slide deck vs visual-communication

- Visual-communication is the broad skill — any visual artefact.
- Slide-decks is the SPECIFIC skill for the slide format.

If the user names "slides" → slide-decks.
If the user says "I need a visual for X" without specifying format →
ask which format they want, then dispatch.

## Authoring-quality checklist before picking slide-decks

Even when the format is right, check that the content fits:

| Question | If NO → don't pick slide-decks |
|---|---|
| Does the content have ≥ 5 slides worth? (manifesto + 3 body + closing) | Pick a poster or a prose page. |
| Are there clear assertion-evidence pairs? | Pick a prose page (slide format wants claims, not exposition). |
| Will the artefact be presented (vs read at the reader's pace)? | Pick a prose page. |
| Will the artefact be projected / screen-shared / video-recorded? | Slide decks are the right format. |
| Is there a temporal sequence to the argument? | Slide decks pace per slide. |

## Lib functions called

None — category selection is the agent's pre-skill responsibility.
The slide-decks skill assumes the category has already been picked.

## When to use this reference

Open this ref when:

- A request is vague about format.
- The user pushed back on a previous format choice.
- A handoff document mentions a deliverable but not its format.
- An auto-dispatch trigger fires but the trigger could plausibly
  match multiple skills.

## Common mis-dispatches

### "Make a one-pager" → poster, not deck

A "one-pager" is a poster (`kind: "poster"`). Not a deck with
`slides: [oneSlide]`. The deck mode brings nav chrome the
one-pager doesn't want.

### "Show me a flow" → graph-diagrams, not slide-decks

"Show me the request flow" wants a flowchart, not a slide deck. The
deck format would build slides AROUND a flowchart; the user wants
the flowchart.

### "Format for the team" → ask, don't assume

"Format for the team" can mean prose page (Slack-shareable) OR
slide deck (meeting-presentable) OR share page (link-shareable).
Ask the user; don't assume.

## Don'ts

- Don't pick slide-decks for content that doesn't fit. The deck
  format wants claims; expository content fights the format.
- Don't pick slide-decks for one-pagers. Use `kind: "poster"` (in
  this skill) or `prose-pages` (a tighter one-page article).
- Don't auto-dispatch slide-decks when the user said "page" or
  "report". Those map to `prose-pages`.
- Don't ship a deck with < 5 slides. The deck format has overhead
  (nav chrome, transitions); under 5 slides the overhead beats
  the content.

## Visual verification

After picking slide-decks for a request:

1. Confirm with the user: "I'll make this as a slide deck — N
   slides — that work?"
2. Outline the deck per Step 1-3 of ref #34 BEFORE writing JSON.
3. Verify the slide count matches the source's natural density.
4. Generate; review end-to-end via
   `skills/amvcp-self-debug-rules/SKILL.md` for compositional
   variety + density warnings.

## Source provenance

- The category-selection rule comes from the consolidated AMVCP
  skill architecture (one skill per technique).
- The trigger-word table is the SKILL.md description discipline
  — each skill's description names its triggers explicitly.
- The boundary cases are the converged decisions from the master
  catalog's "which skill handles this?" notes.
