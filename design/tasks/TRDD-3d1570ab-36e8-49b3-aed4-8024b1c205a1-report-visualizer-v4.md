# TRDD-3d1570ab-36e8-49b3-aed4-8024b1c205a1 — Report visualizer v4: faithful render + universal selection model

**TRDD ID:** `3d1570ab-36e8-49b3-aed4-8024b1c205a1`
**Filename:** `design/tasks/TRDD-3d1570ab-36e8-49b3-aed4-8024b1c205a1-report-visualizer-v4.md`
**Tracked in:** this repo (design/tasks/ is git-tracked)
**Status:** Not started (this TRDD captures the v4 spec; implementation is phased)

## Verbatim user spec (2026-05-12)

> the whole re-numbering of paragraphs and headings, its all wrong. the
> original markdown text must not be changed. the headings must stay
> the same. internally you must add a numbering of paragraphs, lists,
> rows, etc. but it must be hidden. a reference for claude to
> understand that is actually written in the document but not displayed
> in the visualizer. the visualizer must display the original markdown
> structure, no changes at all. tables must be tables (also with
> visible boundaries for cells, columns, headers, rows, edges, etc and
> even alternate zebra rows background colors to make easier to
> distinguish the rows.), bullet list, paragraphs, lists, dir trees,
> inline images, etc. evetything must stay faithful to the original
> report.
>
> what the visual communicator must do with reports is to augment them
> with:
>
> - selectable rows/paragraphs/headings/bullet-points/list-entries/
>   gallery-elements/dirtrees-files-and-dirs/lists-of-options
>
> - for each selectable a switch with 3 states: skip/approve/deny (the
>   smaller the better. currently it uses 3 buttons, but the best is
>   something that allows one line of text for each option. so i
>   suggested a switch, but you forgot about it. but its ok, since it
>   had no 3 states, but 2. a 3 state switch is better. but you must
>   create it, and must be nice like the one i suggested you. aesthetic
>   is important.
>
> - there is a difference between selecteable and the switches for the
>   states. THEY ARE DIFFERENT THINGS! I can select 4 rows of a table
>   and use the handler (that must always appears at the left or at
>   the right end of the rows horizontal boundaries, and must be one,
>   only one for the whole set of selected rows/points/paragraphs) to
>   comment on those 4, to say: "those 4 options are unclear and
>   missing examples. edit and clarify them before i choose between
>   them)". That is what selection is about: defining what part of the
>   document i'm commenting on to claude. INSTEAD state selection is
>   another thing: it is the actual answer to the question, the final
>   choice. it can be multiple answer, or single answer (in that case
>   you must use no switches but radio buttons!), but it is completely
>   independent from what is currently selected or not. The switch
>   state (or the radio button choice among a group) is what count.
>   for each group there could be one radio button choice. or multiple
>   switches. or a limit explicitly told in the report (only if the
>   text is that originally.. no changes to the content anymore,
>   remember?). And after each choice for each group was finally made,
>   the user will press submit, and finally claude will process the
>   answer.
>
> - visually, the 3 states for the selectable elements must be
>   identical as for every other visualizer of the plugin. it can be
>   themed and styled differently, but the rules are the ones i
>   estabilished: normal, selected (+-delta brightness), hover
>   (+-delta brightness higher than selected, +glow). this is
>   important to let the user become familiar with the system and
>   start using it without having doubts.
>
> - everything that is selectable must be group-selectable in its
>   container (lists, tables, sections/chapters, dirtrees, galleries,
>   choices-list). selecting, as i said, is not like the choice state
>   of the elements. it only marks what the user want reference when
>   talking to claude. as if saying "about these things i selected, i
>   want to say this...". this is why the comment boxes are modal: once
>   you select what you want to talk about with claude, you cannot
>   change your selection anymore. only when one comment box chat is
>   concluded and the box closed you can select something else and
>   open a new comment box. and usually, after pressing done to close
>   the comment box, claude edits the report according to my requests,
>   so the selection is rarely preserved, since the whole document
>   could change. of course if that does not happen, the selection can
>   be preserved. but remember: at any time esc will cancel the
>   selection.
>
> - keyboard shortcuts: at any time esc will cancel the selection. and
>   at any time Ctrl-+ (ctrl and + ) will open the comment box for the
>   currently selected elements.

## Derived requirements

### R1 — Faithful render (renderer-side)

- The renderer must NOT add `1.1.1`, `1.1.2`, `1.2.1` numeric prefixes
  to paragraphs, list items, table rows, or headings. The visible text
  must match the source markdown character-for-character (modulo HTML
  entity escaping).
- The renderer must NOT inject synthetic `<h2>` finding wrappers around
  every `## ...` section. Sections render as the original heading
  (`<h2>`) followed by their content, no inserted chrome.
- Internal numbering for Claude's reference is stamped as `data-ve-pnum="N"`
  (or similar) on each selectable element. This attribute is used by
  Claude when generating responses ("regarding paragraph N at section X
  …") but is NEVER displayed.

### R2 — Tables look like tables

- `<table>`, `<th>`, `<td>` get visible cell borders.
- `<thead>` row has a stronger header divider.
- Alternating `<tr>` get a zebra background tint (every other row a
  slight bg, light enough not to fight the brown grid).
- No "table-as-block responsive" trick — tables extend the document
  width per the no-nested-scrollbars rule.

### R3 — Selection model (universal across the plugin)

- **Selectable**: paragraphs, list items, table rows (`<tr>`), heading
  blocks (per-heading commentable, NOT the heading TEXT — the
  heading-as-anchor for its section), gallery items, dir-tree files
  and dirs, code lines, diagram parts, list-of-options items.
- **NOT selectable as wholes**: tables, lists, code blocks, whole
  diagrams, galleries, headings, buttons, sliders, checkboxes, radio
  buttons, file/dir trees, sections/chapters.
- Group-selection: clicking any selectable toggles its membership in
  the current group. Multiple selections build a group. ESC clears.
  Selection state is INDEPENDENT of state-choice (skip/approve/deny).

### R4 — Single comment handle per group

- One floating handle (icon chip) appears at the LEFT or RIGHT end of
  the selected group's horizontal boundary. Always one — never one
  per row.
- Vertical position = vertical center of the selected group's bbox.
- Click → opens the comment modal. Modal is scoped to the selected
  group (Claude knows which paragraphs/rows/etc. the comment refers to).
- Modal is MODAL — selection is locked while it's open. Closing the
  modal (DONE) usually triggers a Claude edit that mutates the
  document, so the next selection starts fresh. ESC inside modal
  closes without committing.

### R5 — Three-state switch (replaces SKIP/APPROVE/REJECT buttons)

- Compact custom 3-state switch: SKIP / APPROVE / DENY.
- "The smaller the better" — three single-line slots, one per option.
- One switch per selectable element. Default = SKIP.
- Independent of selection state (R3) and independent of comment
  threads.
- For SINGLE-CHOICE groups (when the source markdown explicitly says
  "pick one of these N options"), use radio buttons instead of
  switches. The renderer detects the constraint from the markdown
  text and emits the right widget; runtime renders accordingly.
- For groups with an explicit limit ("pick at most 3"), the runtime
  enforces the limit on the switch states.
- After all groups have a final state and the user clicks the corner
  Submit/Send button, the runtime POSTs the full state map.

### R6 — Universal hover/selected visual rules

Every selectable visualizer surface MUST follow these three states:

- **Normal**: base styling.
- **Selected**: ±delta brightness (smaller delta).
- **Hover**: ±delta brightness (larger delta) + accent glow.

Already implemented for SVG nodes, table-form rows, prose paragraphs,
code lines. Must be applied to: report paragraphs, list items, table
rows (when `<tr>` is selectable), gallery items, dir-tree entries,
list-of-options items.

### R7 — Keyboard shortcuts (universal)

- `ESC` — cancel current selection (clear the group).
- `Ctrl-+` — open the comment box for the currently selected
  elements (alternative to clicking the floating handle).

Both shortcuts work at any time the page is focused. Modal-open
state intercepts ESC (closes the modal first) and ignores Ctrl-+.

### R8 — Selection vs state-choice are decoupled

This is a hard contract:

- SELECTION = "what part of the document I'm commenting on to Claude".
- STATE-CHOICE = "the actual answer to the question, the final
  decision (skip/approve/deny or radio choice)".

Selecting elements does NOT change their state. Setting a state does
NOT add the element to the current selection. The two affordances
must be visually distinguishable:

- Selection feedback: the universal selected-brightness + outline
  outer ring (per R6).
- State-choice feedback: the 3-state switch (or radio button) widget,
  with its own visual state (which of the 3 is active).

## Implementation phases

### Phase 1 — Faithful render + table styling (renderer + runtime CSS)

- Strip the `1.1.1`-style prefix injection from
  `scripts/render-interactive-report.py`.
- Replace the synthetic `<h2>finding-wrapper</h2>` chrome with the
  original heading + content unchanged.
- Stamp internal `data-ve-pnum="N"` attributes (hidden from view) for
  Claude's reference; the runtime ignores these for display.
- Add table CSS to the runtime: cell borders, header divider, zebra
  rows. Use accent colors so it sits in the warm palette.

### Phase 2 — Three-state switch widget (runtime)

- Build a compact 3-segment toggle visual (single horizontal pill
  with three slots, the active one highlighted in accent). One line
  of text per option. Smaller than the current 3-button row.
- Render one switch per selectable element next to the comment handle
  (when the element is part of a "decision" group declared in the
  markdown via convention or default).

### Phase 3 — Universal group selection + single handle

- Make `<tr>`, `<li>`, `<p>` (with data-ve-comment-id) clickable to
  toggle pressed state — same model as code lines.
- One handle per .ve-comment-group (the container holding the
  selectable children) — appears at the left/right end of the
  selected group's bbox.
- Handle click → comment modal scoped to the selected children.

### Phase 4 — Keyboard shortcuts

- Document-level `keydown` handler:
  - `ESC` → call `clearVeSelection()` (already exists for some
    surfaces; generalize).
  - `Ctrl/Cmd + +` (or `=`) → if there's a current selection, open
    the comment modal scoped to it.

### Phase 5 — Single-choice radio + group-limit detection

- Renderer scans markdown for "pick one of …" / "select at most N …"
  patterns and stamps `data-ve-choice-mode="single"` /
  `data-ve-choice-limit="N"` on the parent container.
- Runtime renders radio buttons instead of switches when
  `data-ve-choice-mode="single"`.
- Runtime enforces the limit when `data-ve-choice-limit="N"`.

## Files to touch

- `scripts/render-interactive-report.py` — Phase 1, 5
- `scripts/amvcp-runtime.js` — Phase 1 (CSS), 2, 3, 4, 5
- Tests under `tests/scripts/` — new tests per phase
- This TRDD: status updates as phases complete

## Out of scope

- Modifying the source markdown report itself.
- Server-side state persistence for switch values (already handled by
  the existing decision-summary path).
- Any change to the runner / queue-dir contract.

## References

- TRDD-7a2dab03 (per-element decision pills) — superseded by this
  TRDD's R5 (three-state switch).
- TRDD-eff1aa87 (interactive agent reports) — original design that
  this TRDD evolves.
- `~/.claude/rules/no-nested-scrollbars.md` — universal rule already
  applied this session.
