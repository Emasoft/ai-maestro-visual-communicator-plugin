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

- **Always ship light + dark** for every visual; single-theme is a correctness defect.
- **Screenshot-test every visual change** (dev-browser, light + dark).
- The runtime (`scripts/amvcp-runtime.js`) is exempt from the CPV LOC cap — don't split
  it by size. Over-cap *skills* get split into smaller focused skills (never trim the
  umbrella's routing tables / TOCs).
- One subagent handles ~5 medium files before context exhaustion — spawn more, don't
  overload one.
- Deferred feature gaps from the v1.3.6 audit live in
  `design/tasks/TRDD-503fb3af-*.md` (G1–G7).
