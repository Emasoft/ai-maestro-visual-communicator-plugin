# amvcp — project instructions (ai-maestro-visual-communicator-plugin)

This plugin gives an agent a **palette of visual-element skills**. Each generates a
self-contained, interactive HTML artifact. The agent picks the element that fits what
it needs to show; every element must be **best-in-class** for its job.

## THE CORE ARCHITECTURE PRINCIPLE (do not violate)

### 1. A skill's uniqueness = THE THING it visualizes — never the mode

There is **exactly one** visual-element skill per *thing*:

- an agent report → ONE skill
- a code diff / PR → ONE skill
- a LaTeX scientific diagram / math expression → ONE skill
- a palette of colors & gradients → ONE skill
- a kanban / triage board → ONE skill
- a slide deck → ONE skill
- a flowchart → ONE skill
- … etc.

The "thing" is the only axis of uniqueness. Two skills that visualize the **same thing**
are a bug — merge them.

### 2. There are NO mode-specific skills

"Editor", "visualizer", "exporter", "gallery", "viewer", "slide", "animated",
"interactive" are **NOT** separate skills and **NOT** separate things. They are
*facets every element already has*. Never create `foo-editor` next to `foo-viewer`.
Every variation of an element lives **inside the one skill** for that thing.

### 3. Every visual element is — BY DESIGN — all of these at once

**Editable · Commentable · Compilable · Stylizable · Pickable · Exportable.**

- **Editable** — either *explicitly* (e.g. the regex element's inline node editor, a
  prompt-tuner's live variable slots, a kanban's drag-reorder) OR *implicitly via
  comments to Claude*: the user selects an element and says "change the selected
  element this way: …", and Claude re-emits it. The selection + modal-comment
  round-trip (`amvcp-select.py` → `{selections:[…]}` JSON → Claude) is the universal
  edit channel — it already exists; reuse it, don't reinvent per-skill.
- **Commentable** — per-element comment threads (the runtime + modal-comments layer).
- **Compilable** — the artifact is one self-contained `.html` that just opens.
- **Stylizable** — themed live via DESIGN.md tokens (light + dark, always both).
- **Pickable** — selectable atoms feed the selection payload.
- **Exportable** — every element ends with a way to turn UI state back into something
  the agent can read/commit (copy-as-markdown, copy-diff, the selection JSON, …).

So a request like "make an *editor* for X" or "an *exporter* for Y" never means a new
skill — it means: the X / Y element already is editable/exportable; use or augment that
one skill.

### 4. Two modes — one FIXED, one VARIABLE (orthogonal to the thing)

Every element has two separable "modes". Do not confuse them, and treat them very
differently when importing ideas:

- **Interaction Design Mode — FIXED. INVARIANT. The plugin's identity.**
  The signature UX: **interaction · selection · highlighting · triple-state feedback
  (normal · hover · selected, each with its brightness-direction + glow delta) ·
  the comment-box round-trip.** It is done ONE way and one way only, uniform across
  EVERY element — it IS the UI of the visual communicator. It is the same whether the
  element is a chart, a kanban, a diff, or a slide. **Imported ideas may NEVER change
  it.** An external example's own selection / drag / export / highlight UX is
  subordinate: map it onto OUR fixed interaction model (select → triple-feedback →
  comment/edit → re-emit), never adopt a foreign interaction paradigm in its place.
  **NO-NEW-ELEMENTS RULE (user, 2026-06-11):** highlight and selection NEVER add
  new visual elements on screen (no frames, rings, outlines, overlay rectangles)
  — they only re-paint the EXISTING element: brightness delta + glow/shadow (+
  stroke re-color for shapes). An `outline` on an SVG group renders as its
  bounding-box rectangle — that is a new element; forbidden. And NEVER fix a
  local contrast bug by swapping an approved palette — fix the contrast locally;
  the palette is the user's call.

- **Graphic Style Mode — VARIABLE. EDITABLE. Realtime.**
  Everything visual that is driven by **DESIGN.md** parameters/tokens: palette, type
  scale, spacing, radius, elevation, motion, density — live-themeable (always light +
  dark, presets, hot-swap). This is the ONLY place visual variation lives.

**Import rule:** ideas from external elements may **AUGMENT / ENRICH** — add a
graphic-style treatment, a new thing's coverage, a better DESIGN.md-driven visual —
but may **NEVER REPLACE** either mode. The UX pillars that make the visual communicator
what it is must never change. When a catalogued technique is an *interaction* technique
that differs from our fixed mode, do NOT adopt it as-is; either express it through our
selection/comment model or drop it. When it is a *graphic-style* technique, adopt it
(wire it to DESIGN.md so it stays themeable).

### 5. Composability via HTML + SVG — simple, modular, NO rigid structure

You can NEVER predict what combination of elements an agent will be asked to compose
("a network graph, with each node's icon on top and a traffic pie below it" is just one
of infinitely many). So the plugin must make ANY combination work with **no pre-existing
structure**. The way to guarantee that:

- **HTML + SVG are the only substrate, and SVG is a SUPERSET of HTML.** Via
  `<foreignObject>`, an SVG can embed arbitrary HTML; HTML can embed SVG; they nest
  bidirectionally to any depth. That nesting is the source of unbounded flexibility —
  anything can sit inside, on top of, or beside anything.
- **Every element is a SIMPLE, MODULAR, COMPOSABLE primitive** — never a rigid bespoke
  template baked for one scenario. Compose by **nesting / layering** the existing simple
  primitives, NOT by authoring a new combined component per request. Example: to put an
  icon + a chart on a graph node, reuse the graph element and drop the icon SVG + the
  chart into the node (e.g. a `<foreignObject>` or an overlay keyed to the node's
  position) — do NOT build a custom "graph-with-icons-and-charts" engine.
- **Keep elements orthogonal** so arbitrary combinations "just work": each owns its own
  markup + `data-ve-*` atoms + DESIGN.md theming, and none assumes what it's combined
  with. The runtime's single scan inits every element type on the page at once.
- **Harness HTML + SVG; do not over-engineer.** The basic ingredients already give
  near-total flexibility. If a composition feels like it needs a new structured
  container or a bespoke engine, step back — it almost always reduces to "nest simple
  primitives in HTML/SVG."

## Importing ideas from external examples / collections (the integration protocol)

When asked to "implement"/"integrate" an external set of artifacts (a zip of example
HTML, a gallery, another plugin, a blog's companion repo, …):

1. **Check for malicious code FIRST** — external scripts, `fetch`/XHR/WebSocket/
   `sendBeacon` exfil, `eval`/`new Function`, `document.cookie`, obfuscated blobs,
   meta-refresh, external form actions. Distinguish *executed* JS from *displayed*
   example code. Do not proceed until clean.
2. **Investigate each item in depth** — understand what thing it visualizes and how.
3. **Catalogue every idea** — techniques, styles, tricks, scripts, references, layout
   systems, interactions, a11y, animation, SVG, export mechanisms.
4. **Compare with the existing skills** for that thing.
5. **Adopt every improvement.** If a skill for that thing exists → integrate/augment it
   (better technique replaces worse; new facet is added). Only create a **new** skill
   when the thing has **no** existing home. **NEVER duplicate** to make a mode variant.

The goal: each element skill accumulates the best technique found anywhere for its
thing, and the palette has exactly one entry per thing.

## Other standing rules (see ~/.claude memory for detail)

- **Memory: recall before you render, write after you learn** — uses the global
  janitor wiki memory (`/janitor-memory-recall` · `/janitor-memory-write` ·
  `/janitor-memory-update`; protocol in `~/.claude/rules/markdown-memory-recall.md`;
  PROJECT-scope notes git-tracked in-repo at `.claude/project/memory/`). RECALL
  (indexed by the symptom, not the answer) before: generating any visual
  (house-style / confirmed prefs — themes, density, palette), debugging a recurring
  runtime/test gotcha (wedged chart, leaked page, missing selection payload), or a
  familiar design decision (theming, composition, export shape). WRITE after: a
  confirmed style preference (→ feedback), a runtime/test gotcha solved (→ reference,
  after the autopsy), or a composition decision worth its WHY.
- **Always ship light + dark** for every visual; single-theme is a correctness defect.
- **Screenshot-test every visual change** (dev-browser, light + dark).
- The runtime (`scripts/amvcp-runtime.js`) is exempt from the CPV LOC cap — don't split
  it by size. Over-cap *skills* get split into smaller focused skills (never trim the
  umbrella's routing tables / TOCs).
- One subagent handles ~5 medium files before context exhaustion — spawn more, don't
  overload one.
- Deferred feature gaps from the v1.3.6 audit live in
  `design/tasks/TRDD-503fb3af-*.md` (G1–G7).
