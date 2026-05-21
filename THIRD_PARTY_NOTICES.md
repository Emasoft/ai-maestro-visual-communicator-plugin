# Third-party notices

This project's own source code is distributed under the [MIT License](./LICENSE) (Copyright © 2025 Nico Bailon).

In addition, the project ships **vendored copies** and **bundled artefacts** derived from the third-party open-source software listed below. Each entry preserves the upstream copyright notice and licence text as required by the upstream licence.

When the project is redistributed in source form, the licence files referenced below must be redistributed alongside it. When it is redistributed in compiled form (e.g. a single-file bundle), the same notices must accompany the bundle — either as a sibling file or embedded in the bundle's header.

---

## regex-vis

- **Source repository:** <https://github.com/Bowen7/regex-vis>
- **Upstream licence:** MIT
- **Upstream copyright:** Copyright © 2021 Bowen
- **Vendored under:** `vendor/regex-vis/` (top-level — listed in `package.json` `files` so it ships with the published plugin alongside the built artefact)
- **Licence text (verbatim):** [`vendor/regex-vis/LICENSE`](./vendor/regex-vis/LICENSE)
- **What was copied:** the `parser/`, `atom/`, `graph/`, `editor/`, `utils/`, `components/`, `constants/`, and `playground/` directories of the upstream `src/` tree, plus the upstream `LICENSE` and `README.md`. Tests were stripped from the vendored copy. The runtime entry file `src/ve-regex-entry.tsx` is **NEW** (not from upstream) and licensed under the project's own MIT licence.
- **What was modified:** none of the upstream source has been edited as of the current vendoring pass. Any future modifications will be tracked in `vendor/regex-vis/README.md`.
- **What ships to plugin end users:** the built artefact `scripts/amvcp-regex.umd.js` plus a sibling `scripts/amvcp-regex.LICENSE` (with the upstream MIT text), AND the full vendored source under `vendor/regex-vis/` (so contributors can rebuild without a separate clone). Both paths are listed in `package.json` `files`.
- **Pinned upstream commit:** `main` HEAD as of the vendoring date recorded in `vendor/regex-vis/README.md`.

---

## pierre-diffs

- **Source repository:** <https://github.com/pierre-computer-company/diffs-js> (path `packages/diffs`)
- **Upstream package:** `@pierre/diffs` 1.2.1
- **Upstream licence:** Apache-2.0
- **Upstream copyright:** Copyright © The Pierre Computer Company
- **Vendored under:** `vendor/pierre-diffs/` (top-level — listed in `package.json` `files` so it ships with the published plugin alongside the built artefact)
- **Licence text (verbatim):** [`vendor/pierre-diffs/LICENSE.md`](./vendor/pierre-diffs/LICENSE.md), mirrored at [`scripts/amvcp-pierre-diff.LICENSE`](./scripts/amvcp-pierre-diff.LICENSE) so the published bundle ships next to its licence.
- **What was copied:** the entire `packages/diffs/` directory of the upstream monorepo (`src/`, `LICENSE.md`, `README.md`, `tsconfig.json`, `tsdown.config.ts`). Tests and the monorepo-only `apps/`, `scripts/` files were not copied.
- **What was modified:**
    - `package.json` — replaced the workspace `catalog:` and `^3.0.0` refs with explicit version pins; dropped the React / SSR / Worker entry points; dropped jsdom / arethetypeswrong / react devDeps (we only build the vanilla-JS bundle).
    - `src/highlighter/shared_highlighter.ts` — remapped `@pierre/theme/pierre-{dark,light}-soft` (only available in `@pierre/theme@1.x`) to the `pierre-{dark,light}-vibrant` variants shipped by `@pierre/theme@0.0.29` (the most recent version that passes `bun`'s `minimum-release-age` policy at vendoring time). The skill-side theme names `pierre-{dark,light}-soft` still resolve at runtime — only the underlying asset is the `-vibrant` palette.
    - `tsconfig.json` — removed the `extends: '../../tsconfig.options.json'` reference (monorepo parent isn't vendored).
    - `scripts/bundle.mjs` — **NEW** (not from upstream). Single-file `esbuild` bundler that consumes the upstream source + node_modules and emits one browser-loadable ESM at `dist-bundle/index.mjs`. Released under the project's own MIT licence.
- **What ships to plugin end users:** the built artefact `scripts/amvcp-pierre-diff.mjs` (~10 MB raw / ~1.8 MB gzipped — Shiki grammars + themes dominate) plus a sibling `scripts/amvcp-pierre-diff.LICENSE` (with the upstream Apache-2.0 text), AND the full vendored source under `vendor/pierre-diffs/` (so contributors can rebuild without a separate clone). Both paths are listed in `package.json` `files`.
- **Pinned upstream commit:** the v1.2.1 release artefact, distributed inside `apps/demo/` of the monorepo snapshot vendored under `downloads_dev/pierre-main.zip` (gitignored). Replace via `bun run build:bundle` from inside `vendor/pierre-diffs/` after any future upstream re-vendor.

---

If you find a vendored library that is missing from this notice, or whose licence text has drifted out of sync with the upstream, please open an issue.
