# Request-routing decision tree — "which technique should I use?"

## Table of Contents

- [Top-level decision tree](#top-level-decision-tree)
- [Layering: shape × element skills](#layering-shape--element-skills)
- [Decision matrix — when shapes overlap](#decision-matrix--when-shapes-overlap)
- [The "5-layer infographic composition" mental model (OT-07)](#the-5-layer-infographic-composition-mental-model-ot-07)
- [Composition](#composition)
- [Anti-patterns](#anti-patterns)

The decision tree the agent walks when the user asks for a visual
deliverable but does not specify which one of the 13 element skills
to use. Lifted from master catalog OT-01 (7-method × 4-level HTML
output framework, trimmed to remove library-specific cells like
Plotly / D3 / Chart.js — those decisions belong in the per-skill
docs).

Without a routing tree, every "visualize this" request becomes a
guessing game. With it, the agent can deterministically pick the
right document shape AND the right element skills to compose,
producing a consistent answer to the same kind of request every
time.

## Top-level decision tree

```
Q1. What is the deliverable?
    ├── A document the reader will scroll → §1 Document shapes
    ├── A figure the reader will look at  → §2 Figure types
    ├── An interactive surface the reader will manipulate → §3 Surfaces
    └── A specification the reader will reference → §4 Reference docs
```

### §1 Document shapes (the report-doc decision tree)

```
Q1.1. What is the reader's role?
      ├── Reviewer (peer, manager, reader) → Q1.1.a
      ├── Author (you, your team)          → Q1.1.b
      ├── Operator (on-call, support)      → Q1.1.c
      └── Decision-maker (executive)       → Q1.1.d

Q1.1.a (Reviewer)
      ├── Reviewing a PR → pr-review-reviewer-side-shape
      ├── Reviewing a design → visual-design-exploration-shape
      ├── Reviewing options → compare-n-approaches-shape
      └── Reviewing an RFC → (no shape; just GitHub comments)

Q1.1.b (Author)
      ├── Writing a PR description → pr-writeup-author-side-shape
      ├── Proposing a feature → implementation-plan-shape
      ├── Recording a decision → adr-decision-log-shape
      └── Deliberating before deciding → rfc-shape

Q1.1.c (Operator)
      ├── Writing a postmortem → incident-postmortem-shape
      ├── Writing a runbook → feature-explainer-shape
      └── Periodic status → status-report-shape

Q1.1.d (Decision-maker)
      ├── Quarterly retro → retrospective-shape
      ├── Executive summary → executive-summary template (vc-doc--executive-summary)
      └── Brand / strategy doc → whitepaper-shape
```

### §2 Figure types

```
Q1.2. What is the figure's purpose?
      ├── Show data over time / categories → amvcp-charts-and-dashboards
      ├── Show structural relationships → amvcp-graph-diagrams or amvcp-diagram
      ├── Show a sequence of states → amvcp-animation
      ├── Show a UI mockup → amvcp-wireframe
      └── Show a typographic specimen → amvcp-typography
```

### §3 Surfaces

```
Q1.3. What is the user doing?
      ├── Picking from a small set of choices → amvcp-choice-tables
      ├── Comparing N options at length → compare-n-approaches-shape
      ├── Editing a draft / form → amvcp-interactive-controls
      ├── Reviewing changes line-by-line → pr-review-reviewer-side-shape
      └── Stepping through slides → amvcp-slide-decks
```

### §4 Reference docs

```
Q1.4. What is being referenced?
      ├── Tokens / colors / type / spacing → design-system-doc-shape (renders amvcp-design-tokens)
      ├── A subsystem's flow → architecture-explainer-shape
      ├── A single algorithm / concept → concept-explainer-shape
      ├── A feature with config knobs → feature-explainer-shape
      └── A glossary of terms → glossary-and-hover-linked-terms (embedded in another shape)
```

## Layering: shape × element skills

After Q1 picks a *shape*, the shape itself nominates which *element
skills* to embed. The shape-to-skills map is documented in each
shape reference's "Composition with other skills" section. Quick
summary:

| Shape | Heavy users (always) | Optional embeds |
|---|---|---|
| `implementation-plan-shape` | layout, charts, diagrams, wireframe, code-highlight, tables | animation, modal-comments |
| `status-report-shape` | charts, tables, prose | animation |
| `incident-postmortem-shape` | tables, code-highlight, diagram | animation, interactive-controls |
| `pr-review-reviewer-side-shape` | code-highlight, tables, interactive-controls | modal-comments |
| `pr-writeup-author-side-shape` | layout, code-highlight, interactive-controls | diagram |
| `feature-explainer-shape` | code-highlight, interactive-controls | tables, diagram |
| `architecture-explainer-shape` | graph-diagrams, code-highlight, interactive-controls, layout | tables |
| `concept-explainer-shape` | interactive-controls, diagram, animation | tables |
| `compare-n-approaches-shape` | layout, code-highlight, tables | charts |
| `visual-design-exploration-shape` | interactive-controls, design-tokens, wireframe | typography |
| `rfc-shape` | layout, graph-diagrams | tables, code-highlight |
| `adr-decision-log-shape` | (minimal — text only) | tables |
| `retrospective-shape` | interactive-controls (checkboxes) | (none) |
| `design-system-doc-shape` | design-tokens, typography, layout, interactive-controls | code-highlight |
| `whitepaper-shape` | layout, typography, charts, references | diagram, code-highlight |

## Decision matrix — when shapes overlap

Some user requests look like they could fit multiple shapes. The
disambiguation rules:

| User said | Possible shapes | Pick |
|---|---|---|
| "Write up the cache stampede" | postmortem / pr-writeup / status | postmortem (it was an incident) |
| "Show me design options" | exploration / compare / executive | exploration (visual + interactive) |
| "Compare X vs Y" | compare-n-approaches / visual-design-exploration / concept | compare-n-approaches (with code) OR exploration (without code) |
| "Document how X works" | architecture / feature / concept | architecture (subsystem) / feature (single feature) / concept (algorithm) |
| "Plan the next sprint" | implementation-plan / status | implementation (forward-looking) |
| "Sprint review" | status / retrospective | status (descriptive) OR retro (deliberative) |
| "Pitch this to leadership" | executive-summary / whitepaper | executive-summary (≤1 page) OR whitepaper (≥3 pages) |
| "Decide between A and B" | rfc / compare-n-approaches / adr | rfc (still deliberating) / compare (need analysis) / adr (already decided, recording) |

When in doubt, ask the user which shape they expect. Two questions:
"Will the reader make a decision based on this?" and "How long should
this be?" — usually disambiguate quickly.

## The "5-layer infographic composition" mental model (OT-07)

For figures specifically (not documents), apply the 5-layer rule:

```
Layer 1: Data       — JSON / CSV / source content
Layer 2: Layout     — grid / flow / radial / freeform
Layer 3: Visual     — chart / diagram / icon / typography
Layer 4: Annotation — callouts / arrows / labels / titles
Layer 5: Output     — HTML / SVG / PNG / PDF
```

Hard rules (from OT-07):

- **≤3 typefaces per figure** (heading + body + mono).
- **≤4 colors per figure** (canvas + content + accent + one
  semantic).
- **The title MUST carry the insight** — not "Sales over time" but
  "Sales doubled in Q3".

The figure is **one piece** of a document; the document shape
decides where that figure sits.

## Composition

This decision tree itself is reference material — it is not a
visible primitive. The decision is made by the agent at request
time; the tree is the agent's lookup table.

When the agent's choice is not obvious (the user request is
ambiguous), the agent surfaces the decision via a decision-mini:

```html
<div class="ve-decision" data-decision-id="visualize-which-shape">
  <p>I can render this two ways. Which do you want?</p>
  <button data-choice="postmortem">Postmortem (timeline + impact + actions)</button>
  <button data-choice="status-report">Status report (metrics + highlights + carryover)</button>
</div>
```

…and waits for the user to pick.

## Anti-patterns

- **Defaulting to a single shape regardless of request** — every
  user request becomes a `pr-writeup-author-side-shape`, even when
  it's a postmortem.
- **Ignoring the user's stated audience** — they said "for
  leadership"; you wrote a `feature-explainer-shape` instead of
  `executive-summary`.
- **Mixing two shapes in one document** — a single document
  cannot be both a postmortem AND a status report. Pick one and
  cross-reference the other.
- **Refusing to ask** — when the request is genuinely ambiguous, the
  agent should ask. Picking blind wastes both your time and the
  user's.
- **Skipping the layering** — picking a shape but failing to embed
  the right element skills produces a thin document. Use the
  shape-to-skills map.
- **Treating Q1 as the only decision** — the shape is the
  *frame*; the element skills are the *content*. Both decisions
  matter.
- **Embedding charts in every shape** — `incident-postmortem-shape`
  uses charts rarely; `architecture-explainer-shape` uses them
  rarely. Read the shape's composition guide.
- **Overlooking the 5-layer rule for figures** — figures with 7
  colors and 4 typefaces fail the anti-slop pass and look like
  generic AI output.
- **Forgetting to run QA** — every choice produces a page; every
  page goes through `runGates`. The decision tree gets you to the
  right page; QA verifies it.
