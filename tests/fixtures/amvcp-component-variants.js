/*!
 * ai-maestro-visual-communicator-plugin — component variant-matrix renderer.
 *
 * THE THING: "every size · state · intent of ONE UI component, laid out
 * on a single sheet for review." Distinct from amvcp-token-sheet.js (that
 * sheets design *tokens*; this sheets a *component's* variants).
 *
 * It sits on top of the Phase-1 engine (amvcp-designmd.js): everything
 * visual is themed from the resolved --vc-* tokens, light + dark both,
 * with NO hardcoded palette. The engine peer is looked up softly so the
 * renderer also works standalone in the test harness.
 *
 * Two modes (project CLAUDE.md):
 *   - Interaction Design Mode = FIXED. Each variant cell is an atom
 *     stamped data-ve-id="component-variant:<component>:<axisvalues>" +
 *     data-ve-type="component-variant" (mirrors amvcp-token-sheet.js's
 *     color-swatch atom). The RUNTIME (amvcp-runtime.js) supplies
 *     selection · highlight · triple-state feedback · comment-box with
 *     zero code here — this module NEVER injects selection / hover /
 *     highlight CSS, never adds custom drag, never a foreign export UX.
 *     "Exportable" = per-cell click-to-copy snippet (mirrors the
 *     token-sheet's click-to-copy) + the runtime's selection payload.
 *   - Graphic Style Mode = VARIABLE via DESIGN.md. The grid, cell chrome,
 *     variant treatments and snippet panel are themed entirely from
 *     --vc-* custom properties; a theme swap / hot-swap re-themes live.
 *
 * Dual export:
 *   - browser: `window.amvcpComponentVariants = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Style matches scripts/amvcp-token-sheet.js — ES5-safe `var` / function
 * declarations, no arrow functions, no template literals, no classes,
 * no build step, no npm deps.
 *
 * Public API:
 *   renderVariantMatrix(schema, designmd, opts) -> HTMLElement (root)
 *   mountVariantMatrix(schema, designmd, container, opts)
 *
 * Every cell carries a <button data-vc-copy="<snippet>"> copy affordance;
 * one delegated click listener does the copy. Copying is a CONVENIENCE
 * affordance, not a data contract — a missing navigator.clipboard
 * degrades gracefully (textarea fallback, then selectable text) rather
 * than throwing. Everything else fails fast.
 *
 * No nested scrollbars: the matrix is a responsive CSS grid that WRAPS,
 * the snippet preview is a <pre> with overflow:visible, no element has
 * max-height + overflow:auto. Wide content extends the document's single
 * scroll axis (no-nested-scrollbars rule).
 */
(function () {
  'use strict';

  // ── peer lookup ────────────────────────────────────────────────────

  function getEngine() {
    if (typeof window !== 'undefined' && window.amvcpDesignMd) {
      return window.amvcpDesignMd;
    }
    if (typeof module !== 'undefined' && typeof require === 'function') {
      try {
        return require('./amvcp-designmd.js');
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // ── small DOM helpers (mirror amvcp-token-sheet.js) ────────────────

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (attrs) {
      var k;
      for (k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    return node;
  }

  function text(node, str) {
    node.textContent = str;
    return node;
  }

  // ── built-in variant treatments ────────────────────────────────────
  //
  // The GRAPHIC-STYLE ideas mined from the source example
  // (06-component-variants.html): six structural card treatments. Each
  // is expressed PURELY as --vc-* token references so a theme swap
  // re-skins them; NONE carry a literal color. A schema may add its own
  // `treatment` object per variant to override / extend this table.
  var BUILTIN_TREATMENTS = {
    flat: {
      background: 'var(--vc-color-surface)',
      border: 'none',
      boxShadow: 'none'
    },
    outlined: {
      background: 'var(--vc-color-surface)',
      border: '1px solid var(--vc-color-border)',
      boxShadow: 'none'
    },
    elevated: {
      background: 'var(--vc-color-surface-raised, var(--vc-color-surface))',
      border: 'none',
      boxShadow: 'var(--vc-shadow-2, 0 2px 8px rgba(0,0,0,0.12))'
    },
    accent: {
      background: 'var(--vc-color-surface)',
      border: '1px solid var(--vc-color-border)',
      boxShadow: 'none',
      stripe: 'var(--vc-color-accent)'
    },
    inset: {
      background: 'var(--vc-color-surface-sunken, var(--vc-color-canvas))',
      border: 'none',
      boxShadow: 'none'
    },
    danger: {
      background: 'var(--vc-color-surface)',
      border: '1px solid var(--vc-color-danger)',
      boxShadow: 'none',
      stripe: 'var(--vc-color-danger)'
    }
  };

  // ── cell rendering ──────────────────────────────────────────────────
  //
  // One cell = one component instance drawn with one variant's treatment.
  // The cell is a SELECTION ATOM: it carries data-ve-id / data-ve-type so
  // the runtime layers selection + highlight + triple-state + comment on
  // it for free. The visible "copy snippet" button is the only affordance
  // this module wires (click-to-copy); a PLAIN click falls through to the
  // runtime's [data-ve-id] selection handler.
  function buildCell(component, variant, opts) {
    var key = String(variant.key);
    var treatment = resolveTreatment(variant);
    var cell = el('div', 'vc-cvm-cell', {
      // ATOM CONTRACT (mirror amvcp-token-sheet.js lines ~173-175):
      // data-ve-id is the opaque id the agent receives back on select,
      // shaped component-variant:<component>:<axisvalues>.
      'data-ve-id': 'component-variant:' + component + ':' + key,
      'data-ve-type': 'component-variant',
      'data-ve-label': component + ' · ' + (variant.label || key)
    });

    // The axis-value label pill (graphic-style idea from the source).
    var labelRow = el('div', 'vc-cvm-cell-head');
    labelRow.appendChild(text(el('span', 'vc-cvm-variant-label'),
      variant.label || key));
    // Click-to-copy snippet button — the EXPORT affordance. Alt/Meta-click
    // copies the snippet; a plain click is left to the runtime selection.
    if (variant.snippet) {
      var copyBtn = el('button', 'vc-cvm-copy', {
        type: 'button',
        'data-vc-copy': String(variant.snippet),
        'aria-label': 'Copy snippet for ' + (variant.label || key),
        title: 'Alt-click to copy the snippet'
      });
      text(copyBtn, 'copy');
      labelRow.appendChild(copyBtn);
    }
    cell.appendChild(labelRow);

    // The component instance preview, drawn with this variant's treatment.
    var preview = renderComponentInstance(component, variant, treatment, opts);
    cell.appendChild(preview);

    // The "best for / note" line (graphic-style idea from the source).
    if (variant.note) {
      cell.appendChild(text(el('p', 'vc-cvm-variant-note'),
        String(variant.note)));
    }
    return cell;
  }

  // Merge a variant's explicit treatment over the named built-in. A
  // variant without either resolves to `outlined` (the safe default).
  function resolveTreatment(variant) {
    var base = {};
    var named = variant.treatment && typeof variant.treatment === 'string'
      ? variant.treatment
      : variant.kind;
    if (named && BUILTIN_TREATMENTS[named]) {
      base = shallowClone(BUILTIN_TREATMENTS[named]);
    } else if (!variant.treatment || typeof variant.treatment === 'string') {
      base = shallowClone(BUILTIN_TREATMENTS.outlined);
    }
    // An object treatment overrides / extends the named base.
    if (variant.treatment && typeof variant.treatment === 'object') {
      var k;
      for (k in variant.treatment) {
        if (Object.prototype.hasOwnProperty.call(variant.treatment, k)) {
          base[k] = variant.treatment[k];
        }
      }
    }
    return base;
  }

  // Draw a generic component instance. The BODY is fixed sample content
  // (avatar + title + meta chips + a ghost button — the same shape the
  // source example used) so the eye compares TREATMENTS, not content. A
  // schema may override the body text via variant.sample.* fields.
  function renderComponentInstance(component, variant, treatment, opts) {
    var inst = el('div', 'vc-cvm-instance');
    // Apply the treatment as inline style off --vc-* tokens. These are
    // the ONLY inline styles; everything else lives in the injected
    // stylesheet so it themes consistently.
    inst.style.background = treatment.background || 'var(--vc-color-surface)';
    inst.style.border = treatment.border || 'none';
    inst.style.boxShadow = treatment.boxShadow || 'none';
    if (treatment.stripe) {
      inst.setAttribute('data-vc-stripe', '1');
      inst.style.setProperty('--vc-cvm-stripe', treatment.stripe);
    }
    if (treatment.layout === 'row') {
      inst.setAttribute('data-vc-layout', 'row');
    }

    var sample = variant.sample || (opts && opts.sample) || {};
    var titleStr = sample.title || (component + ' instance');
    var subStr = sample.subtitle || '12 items · due Friday';
    var initials = sample.initials || initialsOf(titleStr);

    var head = el('div', 'vc-cvm-inst-head');
    var avatar = el('div', 'vc-cvm-avatar');
    text(avatar, initials);
    head.appendChild(avatar);
    var titles = el('div', 'vc-cvm-inst-titles');
    titles.appendChild(text(el('p', 'vc-cvm-inst-title'), titleStr));
    titles.appendChild(text(el('p', 'vc-cvm-inst-sub'), subStr));
    head.appendChild(titles);
    inst.appendChild(head);

    var chips = sample.chips || ['Q2', 'Roadmap'];
    if (isArray(chips) && chips.length) {
      var chipRow = el('div', 'vc-cvm-chips');
      var i;
      for (i = 0; i < chips.length; i++) {
        var chip = el('span', 'vc-cvm-chip');
        // The last chip gets the accent tint so the accent token is
        // exercised in every cell, regardless of treatment.
        if (i === chips.length - 1) {
          chip.setAttribute('data-vc-accent', '1');
        }
        text(chip, String(chips[i]));
        chipRow.appendChild(chip);
      }
      inst.appendChild(chipRow);
    }

    var action = sample.action || 'Open';
    var btn = el('span', 'vc-cvm-ghost-btn');
    text(btn, action);
    inst.appendChild(btn);
    return inst;
  }

  function initialsOf(str) {
    var words = String(str).replace(/^\s+|\s+$/g, '').split(/\s+/);
    var out = '';
    var i;
    for (i = 0; i < words.length && out.length < 2; i++) {
      if (words[i].length) {
        out += words[i].charAt(0).toUpperCase();
      }
    }
    return out || '?';
  }

  // ── axis layout ─────────────────────────────────────────────────────
  //
  // The matrix lays out the variants by 1-3 axes. The model:
  //   - the variants list is the cartesian product of the axis values
  //     (the SCHEMA supplies them already expanded — the renderer does
  //     not multiply axes itself, keeping cell content explicit);
  //   - the PRIMARY axis (axes[0]) becomes section groups (a labelled
  //     band per value); within a group, the cells flow in a responsive
  //     grid. With no axes, all cells flow in one grid.
  // This keeps it readable for size×state, intent-as-sections, etc.,
  // and the grid WRAPS so the page extends (no nested scrollbars).
  function buildMatrix(schema, opts) {
    var component = String(schema.component || 'Component');
    var variants = schema.render && isArray(schema.render.variants)
      ? schema.render.variants
      : [];
    var section = el('section', 'vc-cvm-matrix',
      { 'data-vc-panel': 'component-variants' });

    var axes = schema.axes && typeof schema.axes === 'object'
      ? schema.axes : {};
    var axisNames = objectKeys(axes);
    var groupBy = axisNames.length ? axisNames[0] : null;

    if (!groupBy) {
      // No axes — one flat responsive grid of all variants.
      section.appendChild(buildGrid(component, variants, opts));
      return section;
    }

    // Group the variants by their value on the primary axis. A variant
    // declares its position via variant.axisValues = { size:'md', … }.
    var groupValues = isArray(axes[groupBy]) ? axes[groupBy] : [];
    var g;
    var emitted = {};
    for (g = 0; g < groupValues.length; g++) {
      var gv = String(groupValues[g]);
      var inGroup = filterByAxis(variants, groupBy, gv);
      if (!inGroup.length) {
        continue;
      }
      emitted[gv] = true;
      section.appendChild(axisBand(groupBy, gv));
      section.appendChild(buildGrid(component, inGroup, opts));
    }
    // Any variant not matching a declared primary-axis value still gets
    // shown (fail-soft on schema drift) in a trailing "other" band.
    var leftover = [];
    var v;
    for (v = 0; v < variants.length; v++) {
      var av = variants[v].axisValues || {};
      var key = av[groupBy] === undefined ? undefined : String(av[groupBy]);
      if (key === undefined || !emitted[key]) {
        leftover.push(variants[v]);
      }
    }
    if (leftover.length) {
      section.appendChild(axisBand(groupBy, '(ungrouped)'));
      section.appendChild(buildGrid(component, leftover, opts));
    }
    return section;
  }

  function filterByAxis(variants, axisName, value) {
    var out = [];
    var i;
    for (i = 0; i < variants.length; i++) {
      var av = variants[i].axisValues || {};
      if (av[axisName] !== undefined && String(av[axisName]) === value) {
        out.push(variants[i]);
      }
    }
    return out;
  }

  function axisBand(axisName, value) {
    var band = el('header', 'vc-cvm-axis-band');
    band.appendChild(text(el('span', 'vc-cvm-axis-name'), axisName));
    band.appendChild(text(el('span', 'vc-cvm-axis-value'), value));
    return band;
  }

  function buildGrid(component, variants, opts) {
    var grid = el('div', 'vc-cvm-grid');
    var i;
    for (i = 0; i < variants.length; i++) {
      grid.appendChild(buildCell(component, variants[i], opts));
    }
    return grid;
  }

  // ── header + axis legend ────────────────────────────────────────────

  function buildHeader(schema, designmd) {
    var head = el('header', 'vc-cvm-header');
    var component = String(schema.component || 'Component');
    var titleStr = component + ' — variant matrix';
    head.appendChild(text(el('h1', 'vc-cvm-doc-title'), titleStr));
    if (schema.description) {
      head.appendChild(text(el('p', 'vc-cvm-doc-sub'),
        String(schema.description)));
    }
    // The axis legend — one chip per axis listing its values, so the
    // reviewer sees the matrix dimensions at a glance.
    var axes = schema.axes && typeof schema.axes === 'object'
      ? schema.axes : {};
    var axisNames = objectKeys(axes);
    if (axisNames.length) {
      var legend = el('div', 'vc-cvm-axis-legend');
      var i;
      for (i = 0; i < axisNames.length; i++) {
        var a = axisNames[i];
        var vals = isArray(axes[a]) ? axes[a].join(' · ') : '';
        var chip = el('span', 'vc-cvm-legend-chip');
        chip.appendChild(text(el('strong', 'vc-cvm-legend-axis'), a));
        chip.appendChild(text(el('span', 'vc-cvm-legend-vals'), vals));
        legend.appendChild(chip);
      }
      head.appendChild(legend);
    }
    // The Theme toggle — mirrors the token-sheet's header button so the
    // matrix flips light/dark live (delegates to the runtime when present).
    var themeBtn = el('button', 'vc-cvm-theme-toggle',
      { type: 'button' });
    head.appendChild(themeBtn);
    attachThemeToggle(themeBtn, designmd);
    return head;
  }

  // ── click-to-copy (delegated, graceful degradation) ────────────────
  //
  // Mirror amvcp-token-sheet.js: ONE delegated click listener. A plain
  // click is LEFT to the runtime's [data-ve-id] selection handler (so a
  // cell selects for comment); only an Alt/Meta-click copies the snippet.
  function attachCopy(root) {
    root.addEventListener('click', function (ev) {
      var node = ev.target;
      while (node && node !== root && !node.hasAttribute('data-vc-copy')) {
        node = node.parentNode;
      }
      if (!node || node === root) {
        return;
      }
      // PRIMARY action is select-for-comment (runtime handles it). Copy
      // is the SECONDARY action behind Alt/Option (or Meta on Mac).
      if (!(ev.altKey || ev.metaKey)) {
        return;
      }
      var value = node.getAttribute('data-vc-copy');
      ev.stopPropagation();   // keep the runtime from also selecting
      copyValue(value, node);
    });
  }

  function copyValue(value, anchor) {
    var done = function () { flashCopied(anchor); };
    if (typeof navigator !== 'undefined' && navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function') {
      try {
        var p = navigator.clipboard.writeText(value);
        if (p && typeof p.then === 'function') {
          p.then(done, function () { copyFallback(value, anchor); });
        } else {
          done();
        }
        return;
      } catch (e) {
        // fall through to the legacy path
      }
    }
    copyFallback(value, anchor);
  }

  // Legacy fallback — a hidden textarea + execCommand('copy'). If even
  // that fails, the snippet is still readable in the copied cell, so the
  // affordance never hard-fails (it is not a data contract).
  function copyFallback(value, anchor) {
    var ok = false;
    try {
      var ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', 'readonly');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand && document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {
      ok = false;
    }
    flashCopied(anchor, ok ? null : 'select to copy');
  }

  function flashCopied(anchor, altLabel) {
    if (!anchor) {
      return;
    }
    anchor.setAttribute('data-vc-copied', altLabel || 'copied');
    window.setTimeout(function () {
      anchor.removeAttribute('data-vc-copied');
    }, 1100);
  }

  // ── theme toggle (mirror amvcp-token-sheet.js) ─────────────────────

  function attachThemeToggle(button, designmd) {
    button.addEventListener('click', function () {
      if (typeof window !== 'undefined' && window.__veDesignMd &&
          typeof window.__veDesignMd.toggleTheme === 'function') {
        window.__veDesignMd.toggleTheme();
        syncThemeButton(button);
        return;
      }
      var engine = getEngine();
      if (!engine || !designmd) {
        return;
      }
      var root = document.documentElement;
      var cur = root.getAttribute('data-ve-theme') === 'dark'
        ? 'dark' : 'light';
      var next = cur === 'light' ? 'dark' : 'light';
      root.setAttribute('data-ve-theme', next);
      engine.applyTokens(engine.resolveTokens(designmd, next), root);
      syncThemeButton(button);
    });
    syncThemeButton(button);
  }

  function syncThemeButton(button) {
    var cur = document.documentElement.getAttribute('data-ve-theme');
    button.textContent = cur === 'dark'
      ? 'Switch to light' : 'Switch to dark';
  }

  // ── self-contained stylesheet (themed entirely from --vc-*) ─────────
  //
  // Injected ONCE (keyed by id, like amvcp-token-sheet.js's
  // injectRoleMapCss). This is GRAPHIC-STYLE chrome only — it carries NO
  // selection / hover / highlight rules (those belong to the runtime's
  // fixed Interaction Mode and would be a violation to duplicate). Every
  // value is a --vc-* token reference with a literal fallback so the
  // matrix still renders if a token is missing. No max-height +
  // overflow:auto anywhere (no-nested-scrollbars rule).
  var STYLE_ID = 'vc-cvm-style';

  function injectStyle() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
      return;
    }
    var css = [
      '.vc-cvm { display:block; box-sizing:border-box;',
      '  font-family:var(--vc-font-body, system-ui, sans-serif);',
      '  color:var(--vc-color-content, #1f1a14);',
      '  background:var(--vc-color-canvas, #faf6ee);',
      '  padding:var(--vc-space-4, 24px); }',
      '.vc-cvm *, .vc-cvm *::before, .vc-cvm *::after { box-sizing:border-box; }',
      // Header.
      '.vc-cvm-header { display:flex; flex-wrap:wrap; align-items:center;',
      '  gap:var(--vc-space-2, 12px); margin-bottom:var(--vc-space-5, 32px); }',
      '.vc-cvm-doc-title { flex:1 1 100%; margin:0;',
      '  font-family:var(--vc-font-heading, var(--vc-font-body, serif));',
      '  font-size:var(--vc-text-5, 32px); font-weight:var(--vc-weight-bold, 700);',
      '  letter-spacing:-0.01em; }',
      '.vc-cvm-doc-sub { flex:1 1 100%; margin:0;',
      '  color:var(--vc-color-content-muted, #555);',
      '  font-size:var(--vc-text-1, 14px); }',
      '.vc-cvm-axis-legend { display:flex; flex-wrap:wrap;',
      '  gap:var(--vc-space-1, 8px); }',
      '.vc-cvm-legend-chip { display:inline-flex; align-items:center;',
      '  gap:6px; padding:4px var(--vc-space-1, 8px);',
      '  border:1px solid var(--vc-color-border, #ddd);',
      '  border-radius:var(--vc-radius-full, 999px);',
      '  font-size:var(--vc-text-0, 12px); }',
      '.vc-cvm-legend-axis { font-family:var(--vc-font-mono, monospace);',
      '  color:var(--vc-color-content, #1f1a14); }',
      '.vc-cvm-legend-vals { color:var(--vc-color-content-muted, #555); }',
      '.vc-cvm-theme-toggle { margin-left:auto;',
      '  padding:6px var(--vc-space-2, 12px);',
      '  border:1px solid var(--vc-color-border, #ddd);',
      '  border-radius:var(--vc-radius-md, 8px);',
      '  background:var(--vc-color-surface, #fff);',
      '  color:var(--vc-color-content, #1f1a14);',
      '  font-size:var(--vc-text-0, 12px); cursor:pointer; }',
      // Axis bands (primary-axis section labels).
      '.vc-cvm-axis-band { display:flex; align-items:baseline;',
      '  gap:var(--vc-space-1, 8px);',
      '  margin:var(--vc-space-4, 24px) 0 var(--vc-space-2, 12px);',
      '  padding-bottom:var(--vc-space-1, 8px);',
      '  border-bottom:1px solid var(--vc-color-border, #ddd); }',
      '.vc-cvm-axis-name { font-family:var(--vc-font-mono, monospace);',
      '  font-size:var(--vc-text-0, 12px);',
      '  text-transform:uppercase; letter-spacing:0.06em;',
      '  color:var(--vc-color-content-subtle, #888); }',
      '.vc-cvm-axis-value { font-family:var(--vc-font-heading, serif);',
      '  font-size:var(--vc-text-3, 20px);',
      '  color:var(--vc-color-content, #1f1a14); }',
      // The responsive grid — WRAPS, never an inner scrollbar. auto-fill
      // with a min cell width keeps it readable from 1 to N columns.
      '.vc-cvm-grid { display:grid;',
      '  grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));',
      '  gap:var(--vc-space-3, 16px); align-items:start;',
      '  margin-bottom:var(--vc-space-3, 16px); }',
      // The cell — the selection atom. NO selection/hover CSS here; the
      // runtime owns that. Just layout + the variant-label pill + note.
      '.vc-cvm-cell { display:flex; flex-direction:column;',
      '  gap:var(--vc-space-1, 8px); }',
      '.vc-cvm-cell-head { display:flex; align-items:center;',
      '  justify-content:space-between; gap:var(--vc-space-1, 8px); }',
      '.vc-cvm-variant-label { display:inline-flex; align-items:center;',
      '  height:22px; padding:0 9px;',
      '  font-family:var(--vc-font-mono, monospace);',
      '  font-size:var(--vc-text-0, 12px);',
      '  font-weight:var(--vc-weight-medium, 500);',
      '  color:var(--vc-color-content-muted, #555);',
      '  background:var(--vc-color-surface-sunken, var(--vc-color-canvas, #eee));',
      '  border-radius:var(--vc-radius-full, 999px); }',
      '.vc-cvm-copy { position:relative; padding:2px 8px;',
      '  font-family:var(--vc-font-mono, monospace);',
      '  font-size:var(--vc-text-0, 12px);',
      '  color:var(--vc-color-content-muted, #555);',
      '  background:transparent;',
      '  border:1px solid var(--vc-color-border, #ddd);',
      '  border-radius:var(--vc-radius-sm, 4px); cursor:pointer; }',
      '.vc-cvm-copy[data-vc-copied]::after { content:attr(data-vc-copied);',
      '  position:absolute; top:-26px; right:0; white-space:nowrap;',
      '  z-index:var(--vc-z-tooltip, 600);',
      '  padding:2px var(--vc-space-1, 8px);',
      '  border-radius:var(--vc-radius-sm, 4px);',
      '  background:var(--vc-color-content, #1f1a14);',
      '  color:var(--vc-color-canvas, #faf6ee);',
      '  font-size:var(--vc-text-0, 12px); pointer-events:none; }',
      '.vc-cvm-variant-note { margin:0;',
      '  font-size:var(--vc-text-0, 12px);',
      '  color:var(--vc-color-content-subtle, #888); }',
      // The component instance — themed surface, treatment applied inline.
      '.vc-cvm-instance { position:relative; overflow:hidden;',
      '  padding:var(--vc-space-3, 16px);',
      '  border-radius:var(--vc-radius-lg, 12px);',
      '  transition:box-shadow var(--vc-duration-fast, 120ms) ease; }',
      '.vc-cvm-instance[data-vc-stripe]::before { content:"";',
      '  position:absolute; left:0; right:0; top:0; height:4px;',
      '  background:var(--vc-cvm-stripe, var(--vc-color-accent, #888)); }',
      '.vc-cvm-instance[data-vc-layout="row"] { display:flex;',
      '  align-items:center; gap:var(--vc-space-2, 12px); }',
      '.vc-cvm-instance[data-vc-layout="row"] .vc-cvm-inst-head { margin:0; flex:1; }',
      '.vc-cvm-instance[data-vc-layout="row"] .vc-cvm-chips,',
      '.vc-cvm-instance[data-vc-layout="row"] .vc-cvm-inst-sub { display:none; }',
      '.vc-cvm-inst-head { display:flex; align-items:center;',
      '  gap:var(--vc-space-2, 12px); margin-bottom:var(--vc-space-2, 12px); }',
      '.vc-cvm-avatar { flex-shrink:0; width:36px; height:36px;',
      '  display:flex; align-items:center; justify-content:center;',
      '  border-radius:var(--vc-radius-full, 999px);',
      '  background:var(--vc-color-surface-sunken, var(--vc-color-canvas, #eee));',
      '  color:var(--vc-color-content-muted, #555);',
      '  font-size:var(--vc-text-1, 13px);',
      '  font-weight:var(--vc-weight-bold, 700); }',
      '.vc-cvm-inst-titles { min-width:0; }',
      '.vc-cvm-inst-title { margin:0 0 2px;',
      '  font-family:var(--vc-font-heading, serif);',
      '  font-size:var(--vc-text-2, 17px);',
      '  font-weight:var(--vc-weight-medium, 500); line-height:1.3; }',
      '.vc-cvm-inst-sub { margin:0; font-size:var(--vc-text-1, 13px);',
      '  color:var(--vc-color-content-muted, #555);',
      '  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
      '.vc-cvm-chips { display:flex; gap:6px;',
      '  margin-bottom:var(--vc-space-2, 12px); }',
      '.vc-cvm-chip { display:inline-flex; align-items:center; height:20px;',
      '  padding:0 8px; font-size:var(--vc-text-0, 11px);',
      '  font-weight:var(--vc-weight-medium, 500);',
      '  border-radius:var(--vc-radius-full, 999px);',
      '  background:var(--vc-color-surface-sunken, var(--vc-color-canvas, #eee));',
      '  color:var(--vc-color-content-muted, #555); }',
      '.vc-cvm-chip[data-vc-accent] {',
      '  background:color-mix(in srgb, var(--vc-color-accent, #888) 16%, transparent);',
      '  color:var(--vc-color-accent, #888); }',
      '.vc-cvm-ghost-btn { display:inline-flex; align-items:center;',
      '  height:30px; padding:0 12px;',
      '  font-size:var(--vc-text-1, 13px);',
      '  font-weight:var(--vc-weight-medium, 500);',
      '  color:var(--vc-color-content, #1f1a14);',
      '  background:transparent;',
      '  border:1px solid var(--vc-color-border, #ddd);',
      '  border-radius:var(--vc-radius-md, 8px); }',
      // No nested scrollbars — belt + suspenders for the whole subtree.
      '.vc-cvm, .vc-cvm * { overflow-x:visible; }',
      '.vc-cvm-instance { overflow:hidden; }'   // clip the stripe only
    ].join('\n');
    var styleEl = el('style', null, { id: STYLE_ID });
    styleEl.textContent = css;
    (document.head || document.documentElement).appendChild(styleEl);
  }

  // ── public: renderVariantMatrix / mountVariantMatrix ───────────────

  function renderVariantMatrix(schema, designmd, opts) {
    if (typeof document === 'undefined') {
      throw new Error('renderVariantMatrix: no document — browser only');
    }
    if (!schema || typeof schema !== 'object' ||
        !schema.render || !isArray(schema.render.variants)) {
      throw new Error(
        'renderVariantMatrix: schema must be ' +
        '{ component, axes?, render:{ variants:[…] } }'
      );
    }
    opts = opts || {};
    injectStyle();
    var root = el('main', 'vc-cvm');
    root.setAttribute('data-vc-cvm', '1');
    root.appendChild(buildHeader(schema, designmd));
    root.appendChild(buildMatrix(schema, opts));
    attachCopy(root);
    return root;
  }

  function mountVariantMatrix(schema, designmd, container, opts) {
    if (!container || typeof container.appendChild !== 'function') {
      throw new Error('mountVariantMatrix: container is not a DOM element');
    }
    var root = renderVariantMatrix(schema, designmd, opts);
    container.appendChild(root);
    return root;
  }

  // ── generic helpers ────────────────────────────────────────────────

  function shallowClone(obj) {
    var out = {};
    var k;
    for (k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        out[k] = obj[k];
      }
    }
    return out;
  }

  function isArray(v) {
    return Object.prototype.toString.call(v) === '[object Array]';
  }

  function objectKeys(obj) {
    var out = [];
    var k;
    for (k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        out.push(k);
      }
    }
    return out;
  }

  // ── export ─────────────────────────────────────────────────────────

  var api = {
    renderVariantMatrix: renderVariantMatrix,
    mountVariantMatrix: mountVariantMatrix
  };

  if (typeof window !== 'undefined') {
    window.amvcpComponentVariants = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
