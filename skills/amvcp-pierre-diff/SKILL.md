---
name: amvcp-pierre-diff
description: "Render high-fidelity code diffs with Pierre's diff viewer — syntax-highlighted (Shiki), split or unified layout, line virtualizer for huge files, line-anchored comments, accept/reject UI. Use when the user wants a full-featured visual diff that exceeds what the lightweight amvcp-code-diff layer provides: a PR review with thousands of lines, a side-by-side patch viewer, a merge-conflict resolver, or a streaming-code preview. Trigger with 'pierre diff', 'rich diff viewer', 'side-by-side diff with syntax highlighting', 'huge file diff', 'merge conflict viewer', 'render this patch with Pierre'."
license: Apache-2.0
compatibility: "Any modern browser supporting Custom Elements v1 + CSSStyleSheet.replaceSync (Chromium 79+, Safari 16.4+, Firefox 101+). Pure ESM, no npm runtime dependency — single bundled `amvcp-pierre-diff.mjs` (~10 MB raw / ~1.8 MB gzipped). Bundle weight is dominated by Shiki's TextMate grammars and themes; lazy-load the script tag only on pages that actually mount a `<diffs-container>`."
metadata:
  author: Emasoft
upstream:
  source: "https://github.com/pierre-computer-company/diffs-js (packages/diffs)"
  license: "Apache-2.0"
  version: "1.2.1"
---

# Pierre Diff Viewer

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md).
> **Lightweight alternative:** [`skills/amvcp-code-diff/SKILL.md`](../amvcp-code-diff/SKILL.md) — plain CSS twin-column diff (no Shiki, no virtualizer); pick that one for small inline diffs in a larger report.

## Overview

Vendored copy of [Pierre Computer Company's diff viewer](https://github.com/pierre-computer-company/diffs-js) (`@pierre/diffs` 1.2.1, Apache-2.0) bundled as a single browser ESM. Provides:

- Syntax-highlighted diff rendering via Shiki (every TextMate grammar Shiki ships — TS, JS, Python, Rust, Go, Swift, Kotlin, C, C++, Java, Markdown, HTML, CSS, SQL, etc.)
- **Split** (side-by-side) or **stacked** (unified) layout
- Line **virtualizer** for huge files — only the visible viewport's rows mount
- Inline annotation / comment / accept-reject UI (the agent injects line markers, the user clicks)
- Streaming code support (FileStream) — show code as it's being generated
- Merge conflict viewer (UnresolvedFile) — three-way merge with resolve regions
- Light + dark theme (Pierre's own themes, registered alongside any Shiki theme)

**What this skill owns.** The `<diffs-container>` web component scaffold, the Pierre instance lifecycle (`new FileDiff(...)`, `instance.render(...)`, `instance.dispose()`), the wrapping decisions (unified vs split, wrap-lines, virtualizer-or-not), the theme handoff (Pierre's `pierre-dark` / `pierre-light` mapped onto our DESIGN.md `--vc-theme`), the per-line annotation contract for comments + suggested-changes.

**What this skill does NOT own.** Lightweight CSS-only diff blocks (→ [`amvcp-code-diff`](../amvcp-code-diff/SKILL.md)). The patch parser when you already have hunks (Pierre's `parseDiffFromFile` does that internally). The PR-review page chrome (header bar, reviewer avatars, etc.) — that's still [`amvcp-code-diff`'s pr-review-page reference](../amvcp-code-diff/references/pr-review-page.md); Pierre slots INTO that chrome as the per-file diff body.

**When to pick this over amvcp-code-diff.**

| Pick `amvcp-pierre-diff` when… | Pick `amvcp-code-diff` when… |
|---|---|
| File is ≥ ~500 lines and you need the virtualizer | Inline diff is small (≤ 100 lines) |
| You want Shiki-quality syntax highlighting | The page already uses `amvcp-code-syntax` and you want a single highlighting stack |
| You need merge-conflict resolution (`<<<<<<<`, `=======`, `>>>>>>>`) | A simple add/del/ctx tint is enough |
| You're rendering a streaming-code preview | The diff is static and finished |
| Bundle weight is not a concern (~1.8 MB gz) | Lighter weight matters more than features |

## Prerequisites

- `<script type="module" src="amvcp-pierre-diff.mjs"></script>` injected into the page **before** the first `<diffs-container>` element. The script side-effect-registers the `<diffs-container>` custom element via `customElements.define`.
- `amvcp-runtime.js` injected (for the selection-atom contract — Pierre's per-line markers are wrapped with `data-ve-id` / `data-ve-type` / `data-ve-label` so they participate in the same multi-select payload as every other AMVCP visual).
- `:root { --ve-accent: <colour>; }` set per the base contract (Pierre reads it for the selection-highlight colour).
- DESIGN.md must expose `--vc-theme: light|dark` — the renderer flips Pierre's theme to match.

## Instructions

1. For each file you want to diff, emit a `<diffs-container data-ve-id="diff-<n>"></diffs-container>` wrapper.
2. After the runtime mounts, run the per-instance JS inside an inline `<script type="module">`:

   ```html
   <diffs-container data-ve-id="diff-1"></diffs-container>
   <script type="module">
     import { FileDiff, parseDiffFromFile } from './amvcp-pierre-diff.mjs';

     const oldContent = `…the pre-image…`;
     const newContent = `…the post-image…`;
     const patch = parseDiffFromFile(oldContent, newContent, 'src/foo.ts');

     const instance = new FileDiff({
       container: document.querySelector('[data-ve-id="diff-1"]'),
       patch,
       options: {
         layout: 'split',          // or 'stacked' (unified)
         wrap: false,               // turn ON for prose-heavy diffs
         theme: { dark: 'pierre-dark', light: 'pierre-light' },
         lang: 'typescript',
       },
     });
     await instance.render();
   </script>
   ```

3. To annotate (line comments, accept/reject UI, etc.), pass `lineAnnotations` into the options — see [`references/annotation-contract.md`](./references/annotation-contract.md) for the schema.
4. Open with `scripts/amvcp-select.py <file.html>` — never `open` / `xdg-open` directly. The runner picks a free localhost port, launches Chromium in `--app=URL`, waits for the user's Submit click, captures the selection payload.
5. On Submit, read the multi-select payload; each clicked line lands as `{kind:"pierre-diff-line", file, lineOld?, lineNew?, content, side: 'add' | 'del' | 'ctx'}`.

## Output

Per-line entry pushed into `selections[]`:

```json
{
  "kind": "pierre-diff-line",
  "diffId": "diff-1",
  "file": "src/foo.ts",
  "side": "add",
  "lineOld": null,
  "lineNew": 42,
  "content": "  return value + 1;",
  "annotation": null
}
```

When the user adds an inline comment via the Pierre annotation UI, the entry's `annotation` field carries the typed text.

## Error Handling

- **Bundle not loaded:** `customElements.get('diffs-container') == null` → throw a loud error before mounting any container; the renderer must check this and inject the `<script type="module">` if missing.
- **Bad patch input:** Pierre's `parseDiffFromFile` throws on malformed unified-diff input; catch and degrade to plain text inside the container.
- **Shiki language not bundled:** the requested language isn't in Shiki's default bundle — the highlighter falls back to plain text, no exception.

## Examples

**Input:** "Render this PR with Pierre — it's a 2000-line refactor of the authentication module."

**Output:** one HTML file with `<diffs-container>` per changed file, each wired up via inline `<script type="module">` calling `new FileDiff(...)`. The virtualizer keeps the page responsive even on huge diffs. The user clicks individual lines or comment bubbles → multi-select payload returned.

## Resources

- [annotation-contract](./references/annotation-contract.md) — schema for `lineAnnotations` / `diffLineAnnotations`
- [layout-choice](./references/layout-choice.md) — split vs stacked decision tree
- [streaming-codeview](./references/streaming-codeview.md) — `FileStream` for live-generated code
- [merge-conflict](./references/merge-conflict.md) — `UnresolvedFile` for `<<<<<<<` resolution
- [virtualizer-tradeoffs](./references/virtualizer-tradeoffs.md) — when to enable `VirtualizedFileDiff`

## Upstream attribution

This skill ships a vendored copy of [Pierre Computer Company](https://pierre.computer)'s [`@pierre/diffs` 1.2.1](https://github.com/pierre-computer-company/diffs-js/tree/main/packages/diffs) under the Apache 2.0 licence. See [`vendor/pierre-diffs/LICENSE.md`](../../vendor/pierre-diffs/LICENSE.md) for the full licence text and [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md#pierre-diffs) for the attribution entry.

Local modifications to the vendored source are limited to:

1. `package.json` — replaced workspace `catalog:` refs with explicit version pins; dropped the React / SSR / Worker entry points; dropped jsdom / arethetypeswrong / react devDeps (we only build the vanilla-JS bundle).
2. `src/highlighter/shared_highlighter.ts` — mapped `@pierre/theme/pierre-{dark,light}-soft` (1.x-only) to `pierre-{dark,light}-vibrant` (the 0.0.29 equivalent we pin against bun's minimum-release-age policy).
3. `tsconfig.json` — removed the `extends: '../../tsconfig.options.json'` reference (monorepo parent doesn't ship with the vendored copy).
4. `scripts/bundle.mjs` — NEW (not from upstream). Single-file esbuild bundler that produces `dist-bundle/index.mjs` for browser-direct loading. Released under the project's own MIT licence.

The upstream `dist/` build artefacts are NOT vendored — we produce our own browser bundle from the upstream source via the steps above.
