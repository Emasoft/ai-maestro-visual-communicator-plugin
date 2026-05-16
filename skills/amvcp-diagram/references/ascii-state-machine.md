# ASCII state machine diagram

The ASCII variant of `state-machine-diagram.md` — a state machine
drawn in monospace box-drawing characters. No JS, no SVG, no
theming — pure text. Use when the audience reads in a terminal,
plain-text comment, or a markdown rendering context that doesn't
support inline SVG.

## When to choose ASCII

Use the ASCII variant when:

- The output must survive with JavaScript disabled.
- The diagram will be **pasted into a terminal session**, an
  email, a code comment, or a plain-text channel.
- The diagram is a **small FSM** (3-7 states) where a full SVG
  would be overkill.

Do NOT use ASCII for state machines when:

- The state machine has 8+ states (the layout becomes
  unwieldy; switch to SVG).
- The transitions have rich labels (guards, actions); ASCII
  truncates them.
- The reader will see the diagram in a browser anyway (use
  SVG for the richness).

## Authoring

The diagram is plain Unicode box-drawing characters inside a
`<pre class="ve-ascii-diagram">`:

```html
<pre class="ve-ascii-diagram"
     data-ve-ascii-style="detailed"
     data-ve-ascii-selectable="1">
            ┌─────────┐                  ┌──────────┐
   start ──▶│  IDLE   │── submit ──────▶│ LOGGING  │
            └─────────┘                  │   IN     │
                ▲                        └────┬─────┘
                │                             │
                │                 ok          │
                │             ┌───────────────┤
                │             ▼               │
                │       ┌──────────┐          │
                │       │  LOGGED  │          │ fail x3
                │       │   IN     │          │
                │       └────┬─────┘          ▼
                │            │           ┌──────────┐
                │  logout    │           │  LOCKED  │
                └────────────┘           │   OUT    │
                                         └────┬─────┘
                                              │ unlock (T)
                                              ▼
                                      (back to IDLE)
</pre>
```

The runtime styles the `<pre>`:

- `--vc-font-mono` font.
- `--vc-color-content` text on `--vc-color-surface-sunken` fill.
- `--vc-color-border` frame, `--vc-radius-md` corners.
- `overflow: visible` and `white-space: pre` (page-expand;
  never an inner scrollbar).

## Glyph vocabulary

| Glyph | Use |
|---|---|
| `┌ ┐ └ ┘` | corner of a state box |
| `─ │` | horizontal / vertical line of a box edge |
| `├ ┤ ┬ ┴ ┼` | T-junctions / cross |
| `▶ ◀ ▲ ▼` | arrowheads (use heavy variants for emphasis) |
| `═ ║ ╔ ╗ ╚ ╝` | double-line variants (use for one or two key states) |

Connector characters (the arrow shafts):

- `──▶` — solid right
- `╌╌▶` — dashed right
- `••▶` — dotted right
- `↩` / `↪` — back-edge curves
- `↻` — self-loop indicator

## Alignment validator (build-time)

Run the validator from `ascii-diagrams.md` BEFORE pasting the
state-machine into the `<pre>`. The validator flags:

- Double-width characters (emoji, CJK) that break the
  monospace grid.
- Tab characters (tabs are display-width-dependent).
- Inconsistent column alignment between adjacent lines.
- Vertical connectors (`│`) whose column drifts between rows.

A misaligned ASCII state machine reads as a broken diagram; the
validator catches the misalignment before the page ships.

## State boxes

Each state is a box:

```
┌─────────┐
│  IDLE   │
└─────────┘
```

Conventions:

- Box width = state name + 2 padding chars on each side
  (`IDLE` = 4 chars + 4 padding = 8 inside chars).
- Box height = 3 (top edge + label line + bottom edge); 5 for
  states with a 2-line label.

For a "start" state, use a double-line top border:

```
╔═════════╗
║  START  ║
╚═════════╝
```

For an "end" / accept state, use a double border all around:

```
╔═════════╗
║  DONE   ║
╚═════════╝
```

(Same as start in ASCII; the engine can't easily distinguish via
border alone. Annotate in prose.)

## Transitions

Transitions are labeled arrows between state boxes. Label sits
ABOVE the arrow shaft:

```
            submit
   IDLE ──────────▶ LOGGING IN
```

For long labels, break across multiple lines:

```
            submit
            credentials
   IDLE ──────────────▶ LOGGING IN
```

Keep labels SHORT — ASCII has no chip background; long labels
crowd the diagram.

## Self-loops

A self-loop bows out to the right:

```
   ┌─────────┐
   │  ALIVE  │↻ tick
   └─────────┘
```

Or a wraparound:

```
        ┌──── tick ────┐
        ▼              │
   ┌─────────┐         │
   │  ALIVE  │─────────┘
   └─────────┘
```

The single-character `↻` is shorter; the wraparound shows
the transition more explicitly.

## Conditional transitions (guards)

Inline the guard:

```
   IDLE ──── submit [valid] ─────▶ AUTH'D
   IDLE ──── submit [invalid] ───▶ ERROR
```

Brackets are the UML guard convention; mono font reads it
clearly.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | `--vc-color-content` (text), `--vc-color-surface-sunken` (bg), `--vc-color-border` (frame) |
| typography | `--vc-font-mono`, `--vc-text-1` |
| radius | `--vc-radius-md` for the `<pre>` corners |

## Selection atoms

ASCII diagrams are NOT broken into per-glyph atoms — that would
be meaningless. The whole `<pre>` is ONE optional selection
atom:

```html
<pre class="ve-ascii-diagram"
     data-ve-id="vc-ascii-fsm-1"
     data-ve-type="ascii-diagram"
     data-ve-ascii-selectable="1">
   ...
</pre>
```

Set `data-ve-ascii-selectable="1"` to enable selection;
otherwise the runtime treats the `<pre>` as inert content.

## Compactness — when to switch styles

The `data-ve-ascii-style` attribute records the glyph style:

- `detailed` — full Unicode boxes + arrows + labels (the example
  above).
- `unicode` — Unicode boxes, no transition labels.
- `classic` — ASCII-only `+ - |` for maximum portability.
- `compact` — one-line `A -> B -> C` style; arrows are `->` or
  `→`.

For a small FSM with 3-4 states, `compact` may be all you need:

```
IDLE → LOGGING → IN → IDLE (logout)
              → LOCKED (fail x3) → IDLE (unlock)
```

## Anti-patterns

- ASCII state machine with 10+ states: unreadable; switch to
  SVG.
- Mixing Unicode boxes with ASCII `+ -`: visual inconsistency;
  pick one style.
- Tabs anywhere in the diagram: tabs render different widths in
  different fonts; the diagram breaks.
- Emoji in labels (`✅`, `❌`): double-width breaks columns.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- The mono font renders cleanly.
- All connectors align vertically and horizontally.
- No broken box-drawing characters (a sign the font is
  missing the glyph).
- The `<pre>` is `overflow: visible` (no inner scrollbar; the
  page handles overflow).

## Cross-skill seam

For state machines beyond ~5 states, ASCII becomes a chore. The
SVG state machine via `state-machine-diagram.md` scales to 15-20
states; Mermaid's `stateDiagram-v2` (via `amvcp-graph-diagrams`)
scales further with auto-layout.
