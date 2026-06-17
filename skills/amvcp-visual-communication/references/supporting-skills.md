# Supporting skills — engines / elements / layers outside the 13-category routing

These skills are **not** in the 13-category routing matrix because they bolt on a specialized engine, design element, or layer rather than scaffold a generic visual. The agent reaches for them by name (the flat skill index in the umbrella's `## Resources` section lists every one). Each exports its edited state back through the standard selection round-trip.

| Supporting skill | What it adds | Reach for it when |
|---|---|---|
| `amvcp-graph-diagrams` | Mermaid + Graphviz alternative engine for the diagram category | An auto-layout graph with 9+ nodes is easier in Mermaid's terse syntax than hand-placing a `process-flow` |
| `amvcp-choice-tables` | Form-mode `<table>` for `data-ve-type="table-form"` only | A table asks the user to PICK (radio/checkbox per row) rather than just display data |
| `amvcp-modal-comments` | The per-element comment-thread layer, mounted by the runtime | Any element needs a comment thread (this is the universal comment layer) |
| `amvcp-math-and-latex` | KaTeX + TikZJax for equations / chemistry / TikZ figures | The content has inline math, an equation, a chemistry reaction, or a TikZ figure |
| `amvcp-regex-vis` | The vendored interactive regex visualizer + editor (`.ve-regex`) | A regex must be visualized, explained, debugged, or interactively edited |
| `amvcp-pierre-diff` | The high-fidelity vendored Pierre diff viewer — Shiki highlight, merge-conflict resolver, huge-file virtualizer | `amvcp-code-highlight`'s lightweight diff isn't enough (huge file, merge conflicts, streaming code, accept/reject UI) |
| `amvcp-tokens-contact-sheet` | The DESIGN.md "living design page" sheeting every *token* visually | You want every token rendered on one contact sheet |
| `amvcp-component-variant-matrix` | A sheet of every size · state · intent of ONE *component* — distinct from the token contact sheet | You want every variant of ONE component on a sheet (button states, card treatments, input sizes × states) |
| `amvcp-editor-kanban` | Interactive-editor: drag triage board → markdown export | The USER reorders Now/Next/Later/Cut tickets and exports markdown |
| `amvcp-editor-toggles` | Interactive-editor: feature-flag editor + dependency warnings + copy-diff | A grouped feature-flag editor with dependency warnings and copy-diff export |
| `amvcp-editor-template` | Interactive-editor: prompt/template tuner with live `{{var}}` re-render | A prompt/template tuner with editable `{{var}}` slots, live re-render, export template+values |
| `amvcp-anim-sandbox` | Interactive-editor: live duration/easing tuner for one transition | One transition isolated with live duration/easing sliders and export of tuned values |
| `amvcp-concept-demo` | Interactive-editor: manipulable concept explainer | A manipulable concept demo (param sliders driving a live SVG + values table + glossary) |

The five **interactive-editor skills** (`amvcp-editor-kanban`, `amvcp-editor-toggles`, `amvcp-editor-template`, `amvcp-anim-sandbox`, `amvcp-concept-demo`) all arrived from the html-effectiveness import; each one exports its edited state back through the standard selection round-trip.
