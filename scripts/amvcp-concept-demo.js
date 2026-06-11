/*!
 * ai-maestro-visual-communicator-plugin — concept-demo (manipulable explainer).
 *
 * THE THING: "a concept, explained by a LIVE manipulable demo." A small set
 * of parameter sliders drives an inline-SVG visual that re-paints instantly
 * as the user drags; a live values table mirrors every parameter, and a
 * glossary lists the terms. It is the interactive sibling of the static
 * prose-pages document: prose explains in words, this explains by letting
 * the reader *turn the knobs* and watch the mapping respond.
 *
 * Two modes (project CLAUDE.md):
 *   - Interaction Design Mode = FIXED. The demo container is a runtime
 *     selection ATOM stamped data-ve-id="concept-demo:<id>" +
 *     data-ve-type="concept-demo", so selection · highlight · triple-state
 *     feedback · the comment round-trip all come from amvcp-runtime.js with
 *     ZERO code here. This module adds NO custom selection, NO foreign
 *     drag/highlight/export UX. "Editable" = either the sliders (explicit)
 *     OR the runtime's select→comment→re-emit channel. "Exportable" = the
 *     current parameter set is pushed as ONE deduped entry into
 *     window.veSelection (kind:"element", type:"concept-demo", with the
 *     params in entry.data) — the export rides the EXISTING selection wire,
 *     never a private channel.
 *   - Graphic Style Mode = VARIABLE via DESIGN.md. The visual, sliders,
 *     table and glossary are themed entirely from --vc-* tokens (with safe
 *     fallbacks), light + dark both. The SVG visual is drawn with token
 *     references via an injected scoped stylesheet, so a `data-ve-theme`
 *     flip / hot-swap re-paints it with NO JS re-render needed.
 *
 * THE NO-NEW-ELEMENTS RULE (user contract): dragging a slider mutates the
 * EXISTING SVG geometry (bar heights / dial angle / curve path / readout)
 * and the EXISTING table cells in place. It NEVER inserts, clones, or
 * removes a DOM node on interaction — the node set after a slider move is
 * byte-identical in count to the node set before it.
 *
 * Declarative markup contract — author ONE container:
 *
 *   <div data-vc-concept-demo>
 *     <script type="application/json" class="vc-concept-spec">
 *     { "title": "...", "params": [ {key,label,min,max,step,default,unit} ],
 *       "mapping": "human-readable description of what the visual shows",
 *       "visual": "bars" | "dial" | "curve",   // optional, default "bars"
 *       "glossary": [ {term, def} ] }
 *     </script>
 *   </div>
 *
 * The module scans for every [data-vc-concept-demo] on DOMContentLoaded,
 * reads its fenced JSON spec, and renders into it. It also exposes
 * mountConceptDemo / renderConceptDemo for explicit (test-driven) use.
 *
 * Dual export:
 *   - browser: window.amvcpConceptDemo = { … }
 *   - Node:    module.exports = { … }   (for the test harness)
 *
 * Style matches scripts/amvcp-component-variants.js — ES5-safe var /
 * function declarations, no arrow functions, no template literals, no
 * classes, no build step, no npm deps.
 */
(function () {
  'use strict';

  // ── tiny DOM helpers (mirror amvcp-component-variants.js) ───────────

  var SVGNS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    if (text != null) node.appendChild(document.createTextNode(String(text)));
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVGNS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          node.setAttributeNS(null, k, attrs[k]);
        }
      }
    }
    return node;
  }

  function isArray(v) {
    return Object.prototype.toString.call(v) === '[object Array]';
  }

  function clamp(v, lo, hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
  }

  // Decimal places implied by a step like 0.1 / 0.25 / 1 — used so the
  // live readouts don't show floating-point dust (0.30000000000000004).
  function decimalsOf(step) {
    var s = String(step);
    var dot = s.indexOf('.');
    return dot < 0 ? 0 : (s.length - dot - 1);
  }

  function fmt(value, step) {
    var d = decimalsOf(step);
    return d > 0 ? Number(value).toFixed(d) : String(Math.round(value));
  }

  // ── scoped, --vc-* themed stylesheet (graphic-style only) ──────────
  //
  // Injected ONCE. Contains NO selection / hover / highlight rules — those
  // are the runtime's FIXED Interaction Mode. Every colour is a --vc-*
  // token with a warm fallback, so a theme flip / hot-swap re-paints the
  // whole widget (SVG included) with no JS re-render.

  var STYLE_ID = 'vc-concept-demo-style';

  function injectStyleOnce() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      '.vc-cd {',
      '  display: block;',
      '  border: 1px solid var(--vc-color-border, #e3dcc9);',
      '  background: var(--vc-color-surface-sunken, #f1ece1);',
      '  border-radius: var(--vc-radius-lg, 12px);',
      '  padding: 22px 22px 18px;',
      '  color: var(--vc-color-content, #1f1a14);',
      '  font-family: var(--vc-font-body, system-ui, sans-serif);',
      '}',
      '.vc-cd-title {',
      '  margin: 0 0 4px;',
      '  font-family: var(--vc-font-heading, var(--vc-font-body, system-ui, sans-serif));',
      '  font-size: 20px; font-weight: 700;',
      '}',
      '.vc-cd-mapping {',
      '  margin: 0 0 18px;',
      '  color: var(--vc-color-content-muted, #5b5343);',
      '  font-size: 14px; line-height: 1.5;',
      '}',
      '.vc-cd-stage {',
      '  display: block; width: 100%;',
      '  background: var(--vc-color-surface, #fffefb);',
      '  border: 1px solid var(--vc-color-border, #e3dcc9);',
      '  border-radius: var(--vc-radius-md, 8px);',
      '  overflow: visible;',  /* no inner scroller — the page is the only scroller */
      '}',
      /* The SVG visual — drawn with token references so a theme flip
         re-paints it. Bars / dial / curve all reuse these classes. */
      '.vc-cd-svg { display: block; width: 100%; height: auto; }',
      '.vc-cd-svg .vc-cd-axis { stroke: var(--vc-color-border-strong, #c9bfa3); stroke-width: 1.4; }',
      '.vc-cd-svg .vc-cd-grid { stroke: var(--vc-color-border, #e3dcc9); stroke-width: 1; }',
      '.vc-cd-svg .vc-cd-bar { fill: var(--vc-color-accent, #b8861f); }',
      '.vc-cd-svg .vc-cd-bar-track { fill: var(--vc-color-surface-sunken, #f1ece1); }',
      '.vc-cd-svg .vc-cd-curve { stroke: var(--vc-color-accent, #b8861f); stroke-width: 2.4; fill: none; }',
      '.vc-cd-svg .vc-cd-curve-fill { fill: var(--vc-color-accent, #b8861f); opacity: 0.14; stroke: none; }',
      '.vc-cd-svg .vc-cd-dial-track { stroke: var(--vc-color-surface-sunken, #f1ece1); stroke-width: 14; fill: none; }',
      '.vc-cd-svg .vc-cd-dial-arc { stroke: var(--vc-color-accent, #b8861f); stroke-width: 14; fill: none; stroke-linecap: round; }',
      '.vc-cd-svg .vc-cd-dot { fill: var(--vc-color-accent, #b8861f); }',
      '.vc-cd-svg .vc-cd-readout { fill: var(--vc-color-content, #1f1a14); font-family: var(--vc-font-mono, ui-monospace, monospace); font-weight: 700; }',
      '.vc-cd-svg .vc-cd-caption { fill: var(--vc-color-content-muted, #5b5343); font-family: var(--vc-font-body, system-ui, sans-serif); }',
      /* Controls */
      '.vc-cd-controls { margin: 18px 0 0; display: grid; gap: 12px; }',
      '.vc-cd-row { display: grid; grid-template-columns: minmax(8ch, 14ch) 1fr minmax(6ch, auto); align-items: center; gap: 12px; }',
      '.vc-cd-row label { font-size: 13px; color: var(--vc-color-content, #1f1a14); }',
      '.vc-cd-range { width: 100%; accent-color: var(--vc-color-accent, #b8861f); }',
      '.vc-cd-val { font-family: var(--vc-font-mono, ui-monospace, monospace); font-size: 13px; text-align: right; color: var(--vc-color-content-muted, #5b5343); }',
      /* Live values table */
      '.vc-cd-table { width: 100%; border-collapse: collapse; margin: 18px 0 0; font-size: 13px; }',
      '.vc-cd-table caption { text-align: left; font-weight: 600; padding: 0 0 6px; color: var(--vc-color-content, #1f1a14); }',
      '.vc-cd-table th, .vc-cd-table td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--vc-color-border, #e3dcc9); }',
      '.vc-cd-table thead th { color: var(--vc-color-content-muted, #5b5343); font-weight: 600; }',
      '.vc-cd-table td.vc-cd-cell-val { font-family: var(--vc-font-mono, ui-monospace, monospace); color: var(--vc-color-content, #1f1a14); }',
      /* Glossary */
      '.vc-cd-glossary { margin: 18px 0 0; display: grid; gap: 8px; }',
      '.vc-cd-glossary h4 { margin: 0 0 2px; font-size: 13px; color: var(--vc-color-content-muted, #5b5343); text-transform: uppercase; letter-spacing: 0.04em; }',
      '.vc-cd-term { font-weight: 600; color: var(--vc-color-content, #1f1a14); }',
      '.vc-cd-def { color: var(--vc-color-content-muted, #5b5343); }',
      '.vc-cd-glossary dt { margin-top: 4px; }',
      '.vc-cd-glossary dd { margin: 0 0 2px; }'
    ].join('\n');
    var style = el('style', { id: STYLE_ID });
    style.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(style);
  }

  // ── spec parsing / validation (fail-fast) ──────────────────────────

  function parseSpec(text) {
    var spec;
    try {
      spec = JSON.parse(text);
    } catch (e) {
      throw new Error('concept-demo: spec is not valid JSON — ' + e.message);
    }
    if (!spec || typeof spec !== 'object') {
      throw new Error('concept-demo: spec must be a JSON object');
    }
    if (!isArray(spec.params) || spec.params.length === 0) {
      throw new Error('concept-demo: spec.params must be a non-empty array');
    }
    for (var i = 0; i < spec.params.length; i++) {
      var p = spec.params[i];
      if (!p || typeof p.key !== 'string' || !p.key) {
        throw new Error('concept-demo: every param needs a string key (index ' + i + ')');
      }
      if (typeof p.min !== 'number' || typeof p.max !== 'number' || p.max <= p.min) {
        throw new Error('concept-demo: param "' + p.key + '" needs numeric min < max');
      }
    }
    return spec;
  }

  // Normalise one param (defaults + clamped default value).
  function normParam(p) {
    var step = (typeof p.step === 'number' && p.step > 0) ? p.step : 1;
    var def = (typeof p['default'] === 'number') ? p['default'] : p.min;
    return {
      key: p.key,
      label: p.label || p.key,
      min: p.min,
      max: p.max,
      step: step,
      unit: p.unit || '',
      value: clamp(def, p.min, p.max)
    };
  }

  // ── the visual: a generic, spec-driven SVG drawn ONCE, mutated live ─
  //
  // We build the geometry once (so interaction never adds/removes nodes),
  // keep handles to the mutable bits, and `update()` only re-sets numeric
  // attributes/text. Three visual kinds — bars (one per param), dial
  // (first param as a gauge), curve (first param drives an eased curve).
  // All three are GENERIC: they map the params' normalised positions to
  // geometry; they carry no concept-specific assumptions.

  var W = 720, H = 300, PAD = 44;

  function norm(param) {
    return (param.value - param.min) / (param.max - param.min);
  }

  function buildBars(svg, params) {
    var n = params.length;
    var innerW = W - PAD * 2;
    var innerH = H - PAD * 2;
    var gap = 18;
    var bw = (innerW - gap * (n - 1)) / n;
    var baseY = H - PAD;
    // baseline axis
    svg.appendChild(svgEl('line', {
      'class': 'vc-cd-axis', x1: PAD - 6, y1: baseY, x2: W - PAD + 6, y2: baseY
    }));
    var bars = [];
    var caps = [];
    for (var i = 0; i < n; i++) {
      var x = PAD + i * (bw + gap);
      svg.appendChild(svgEl('rect', {
        'class': 'vc-cd-bar-track', x: x, y: PAD, width: bw, height: innerH, rx: 4
      }));
      var bar = svgEl('rect', { 'class': 'vc-cd-bar', x: x, y: baseY, width: bw, height: 0, rx: 4 });
      svg.appendChild(bar);
      bars.push(bar);
      var cap = svgEl('text', {
        'class': 'vc-cd-caption', x: x + bw / 2, y: baseY + 18,
        'text-anchor': 'middle', 'font-size': 12
      });
      cap.appendChild(document.createTextNode(params[i].label));
      svg.appendChild(cap);
      var val = svgEl('text', {
        'class': 'vc-cd-readout', x: x + bw / 2, y: PAD - 8,
        'text-anchor': 'middle', 'font-size': 13
      });
      val.appendChild(document.createTextNode(''));
      svg.appendChild(val);
      caps.push(val);
    }
    return function update(ps) {
      var maxBar = H - PAD * 2;
      for (var j = 0; j < ps.length; j++) {
        var t = norm(ps[j]);
        var h = Math.max(0, t * maxBar);
        bars[j].setAttributeNS(null, 'y', String(baseY - h));
        bars[j].setAttributeNS(null, 'height', String(h));
        caps[j].textContent = fmt(ps[j].value, ps[j].step) + (ps[j].unit ? ps[j].unit : '');
      }
    };
  }

  function buildDial(svg, params) {
    var cx = W / 2, cy = H - PAD - 6, r = Math.min(W, H * 2) / 2 - PAD;
    // semicircular gauge from 180° (left) to 0° (right)
    function pt(angleDeg) {
      var a = angleDeg * Math.PI / 180;
      return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
    }
    function arcPath(fromDeg, toDeg) {
      var a = pt(fromDeg), b = pt(toDeg);
      var large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
      // sweep: angles decrease left→right, so sweep-flag 1 draws the top arc
      return 'M ' + a.x.toFixed(2) + ' ' + a.y.toFixed(2)
        + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + b.x.toFixed(2) + ' ' + b.y.toFixed(2);
    }
    var track = svgEl('path', { 'class': 'vc-cd-dial-track', d: arcPath(180, 0) });
    svg.appendChild(track);
    var arc = svgEl('path', { 'class': 'vc-cd-dial-arc', d: arcPath(180, 180) });
    svg.appendChild(arc);
    var dot = svgEl('circle', { 'class': 'vc-cd-dot', cx: pt(180).x, cy: pt(180).y, r: 7 });
    svg.appendChild(dot);
    var readout = svgEl('text', {
      'class': 'vc-cd-readout', x: cx, y: cy - 24, 'text-anchor': 'middle', 'font-size': 28
    });
    readout.appendChild(document.createTextNode(''));
    svg.appendChild(readout);
    var caption = svgEl('text', {
      'class': 'vc-cd-caption', x: cx, y: cy + 22, 'text-anchor': 'middle', 'font-size': 13
    });
    caption.appendChild(document.createTextNode(params[0].label));
    svg.appendChild(caption);
    return function update(ps) {
      var t = norm(ps[0]);
      var toDeg = 180 - t * 180;           // 180° at min → 0° at max
      arc.setAttributeNS(null, 'd', arcPath(180, toDeg));
      var p = pt(toDeg);
      dot.setAttributeNS(null, 'cx', p.x.toFixed(2));
      dot.setAttributeNS(null, 'cy', p.y.toFixed(2));
      readout.textContent = fmt(ps[0].value, ps[0].step) + (ps[0].unit ? ps[0].unit : '');
    };
  }

  function buildCurve(svg, params) {
    var innerW = W - PAD * 2;
    var innerH = H - PAD * 2;
    var x0 = PAD, y0 = H - PAD;
    // axes
    svg.appendChild(svgEl('line', { 'class': 'vc-cd-axis', x1: x0, y1: PAD, x2: x0, y2: y0 }));
    svg.appendChild(svgEl('line', { 'class': 'vc-cd-axis', x1: x0, y1: y0, x2: W - PAD, y2: y0 }));
    var fill = svgEl('path', { 'class': 'vc-cd-curve-fill', d: '' });
    svg.appendChild(fill);
    var curve = svgEl('path', { 'class': 'vc-cd-curve', d: '' });
    svg.appendChild(curve);
    var readout = svgEl('text', {
      'class': 'vc-cd-readout', x: W - PAD, y: PAD + 4, 'text-anchor': 'end', 'font-size': 13
    });
    readout.appendChild(document.createTextNode(''));
    svg.appendChild(readout);
    var caption = svgEl('text', {
      'class': 'vc-cd-caption', x: x0, y: y0 + 18, 'text-anchor': 'start', 'font-size': 12
    });
    caption.appendChild(document.createTextNode(params[0].label));
    svg.appendChild(caption);
    var SAMPLES = 48;
    return function update(ps) {
      // first param = exponent/steepness; second (if any) = amplitude.
      var k = 0.25 + norm(ps[0]) * 3.5;              // 0.25 .. 3.75
      var amp = ps.length > 1 ? norm(ps[1]) : 1;
      amp = 0.15 + amp * 0.85;
      var d = '';
      for (var i = 0; i <= SAMPLES; i++) {
        var u = i / SAMPLES;
        var v = Math.pow(u, k) * amp;                // generic power curve
        var px = x0 + u * innerW;
        var py = y0 - v * innerH;
        d += (i === 0 ? 'M ' : 'L ') + px.toFixed(2) + ' ' + py.toFixed(2) + ' ';
      }
      curve.setAttributeNS(null, 'd', d.replace(/\s+$/, ''));
      fill.setAttributeNS(null, 'd', d + 'L ' + (x0 + innerW).toFixed(2) + ' ' + y0
        + ' L ' + x0.toFixed(2) + ' ' + y0 + ' Z');
      readout.textContent = 'k=' + fmt(ps[0].value, ps[0].step) + (ps[0].unit ? ps[0].unit : '');
    };
  }

  function buildVisual(kind, svg, params) {
    if (kind === 'dial') return buildDial(svg, params);
    if (kind === 'curve') return buildCurve(svg, params);
    return buildBars(svg, params);  // default
  }

  // ── export: one deduped entry on the EXISTING selection wire ────────
  //
  // Mirrors the runtime's finding-reply pattern: push / replace ONE entry
  // keyed by a stable entryId, carry the live params in entry.data. The
  // entry is a kind:"element" so the standard submit payload + the
  // agent's "you selected N items" follow-up handle it with no special
  // casing. We touch window.veSelection (the documented debugging hook /
  // source of truth) directly, and best-effort poke the runtime's submit-
  // button refresh if it is exposed — never reinventing the wire.

  function paramsToData(params) {
    var out = {};
    for (var i = 0; i < params.length; i++) {
      out[params[i].key] = params[i].value;
    }
    return out;
  }

  function pushExport(demoId, title, params) {
    if (typeof window === 'undefined') return;
    var sel = window.veSelection;
    if (!isArray(sel)) return;                  // runtime not present (Node test) — no-op
    var entryId = 'concept-demo:' + demoId;
    var data = { kind: 'concept-demo', demoId: demoId, params: paramsToData(params) };
    var idx = -1;
    for (var i = 0; i < sel.length; i++) {
      if (sel[i] && sel[i].entryId === entryId) { idx = i; break; }
    }
    var entry = {
      kind: 'element',
      entryId: entryId,
      id: entryId,
      type: 'concept-demo',
      label: title || demoId,
      data: data
    };
    if (idx >= 0) sel[idx] = entry;
    else sel.push(entry);
    // Best-effort: refresh the runtime's submit-button count if exposed.
    if (typeof window.updateSubmitButtonsState === 'function') {
      window.updateSubmitButtonsState();
    }
  }

  // ── render ──────────────────────────────────────────────────────────

  var idCounter = 0;

  function renderConceptDemo(spec, opts) {
    opts = opts || {};
    injectStyleOnce();
    var demoId = opts.id || spec.id || ('demo-' + (++idCounter));
    var params = [];
    for (var i = 0; i < spec.params.length; i++) params.push(normParam(spec.params[i]));

    // The container IS the runtime selection atom (FIXED Interaction Mode).
    var root = el('div', {
      'class': 'vc-cd',
      'data-vc-concept-demo-rendered': '1',
      'data-ve-id': 'concept-demo:' + demoId,
      'data-ve-type': 'concept-demo',
      'data-ve-label': (spec.title || demoId)
    });

    // Header
    root.appendChild(el('h3', { 'class': 'vc-cd-title' }, spec.title || demoId));
    if (spec.mapping) root.appendChild(el('p', { 'class': 'vc-cd-mapping' }, spec.mapping));

    // Stage + SVG visual (drawn once; mutated live).
    var stage = el('div', { 'class': 'vc-cd-stage' });
    var svg = svgEl('svg', {
      'class': 'vc-cd-svg',
      viewBox: '0 0 ' + W + ' ' + H,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img'
    });
    stage.appendChild(svg);
    root.appendChild(stage);
    var update = buildVisual(spec.visual, svg, params);

    // Controls (one range slider per param).
    var controls = el('div', { 'class': 'vc-cd-controls' });
    var valSpans = {};
    for (var c = 0; c < params.length; c++) {
      (function (p) {
        var row = el('div', { 'class': 'vc-cd-row' });
        var inputId = 'vc-cd-' + demoId + '-' + p.key;
        row.appendChild(el('label', { 'for': inputId }, p.label));
        var range = el('input', {
          'class': 'vc-cd-range',
          type: 'range',
          id: inputId,
          'data-vc-key': p.key,
          min: String(p.min),
          max: String(p.max),
          step: String(p.step),
          value: String(p.value)
        });
        row.appendChild(range);
        var valSpan = el('span', { 'class': 'vc-cd-val' }, fmt(p.value, p.step) + (p.unit ? ' ' + p.unit : ''));
        row.appendChild(valSpan);
        valSpans[p.key] = valSpan;
        controls.appendChild(row);
      })(params[c]);
    }
    root.appendChild(controls);

    // Live values table (one row per param, mirrors the sliders).
    var table = el('table', { 'class': 'vc-cd-table' });
    var caption = el('caption', null, 'Live parameters');
    table.appendChild(caption);
    var thead = el('thead');
    var htr = el('tr');
    htr.appendChild(el('th', null, 'Parameter'));
    htr.appendChild(el('th', null, 'Value'));
    htr.appendChild(el('th', null, 'Range'));
    thead.appendChild(htr);
    table.appendChild(thead);
    var tbody = el('tbody');
    var cellVals = {};
    for (var t = 0; t < params.length; t++) {
      var pp = params[t];
      var tr = el('tr', { 'data-vc-key': pp.key });
      tr.appendChild(el('td', null, pp.label));
      var tdv = el('td', { 'class': 'vc-cd-cell-val' }, fmt(pp.value, pp.step) + (pp.unit ? ' ' + pp.unit : ''));
      tr.appendChild(tdv);
      cellVals[pp.key] = tdv;
      tr.appendChild(el('td', null, fmt(pp.min, pp.step) + ' – ' + fmt(pp.max, pp.step) + (pp.unit ? ' ' + pp.unit : '')));
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    root.appendChild(table);

    // Glossary.
    if (isArray(spec.glossary) && spec.glossary.length) {
      var gloss = el('div', { 'class': 'vc-cd-glossary' });
      gloss.appendChild(el('h4', null, 'Glossary'));
      var dl = el('dl');
      for (var g = 0; g < spec.glossary.length; g++) {
        var item = spec.glossary[g];
        if (!item) continue;
        var dt = el('dt');
        dt.appendChild(el('span', { 'class': 'vc-cd-term' }, item.term || ''));
        dl.appendChild(dt);
        dl.appendChild(el('dd', { 'class': 'vc-cd-def' }, item.def || ''));
      }
      gloss.appendChild(dl);
      root.appendChild(gloss);
    }

    // ── the live update path (NO new DOM nodes on interaction) ────────
    function syncReadouts() {
      for (var i = 0; i < params.length; i++) {
        var p = params[i];
        var label = fmt(p.value, p.step) + (p.unit ? ' ' + p.unit : '');
        if (valSpans[p.key]) valSpans[p.key].textContent = label;
        if (cellVals[p.key]) cellVals[p.key].textContent = fmt(p.value, p.step) + (p.unit ? ' ' + p.unit : '');
      }
    }
    function refresh() {
      update(params);        // re-paint the SVG in place
      syncReadouts();        // re-paint the table cells + slider readouts in place
      pushExport(demoId, spec.title, params);
    }

    // One delegated input listener — re-reads the slider that moved,
    // clamps to its param's range, and refreshes everything in place.
    root.addEventListener('input', function (ev) {
      var tgt = ev.target;
      if (!tgt || !tgt.matches || !tgt.matches('input[type="range"][data-vc-key]')) return;
      var key = tgt.getAttribute('data-vc-key');
      for (var i = 0; i < params.length; i++) {
        if (params[i].key === key) {
          var raw = parseFloat(tgt.value);
          if (isNaN(raw)) raw = params[i].min;
          params[i].value = clamp(raw, params[i].min, params[i].max);
          break;
        }
      }
      refresh();
    });

    // Initial paint + initial export entry.
    update(params);
    pushExport(demoId, spec.title, params);

    return root;
  }

  function mountConceptDemo(spec, container, opts) {
    if (!container) throw new Error('concept-demo: mount container is required');
    var root = renderConceptDemo(spec, opts);
    container.appendChild(root);
    return root;
  }

  // Auto-scan declarative containers: every [data-vc-concept-demo] that
  // hasn't been rendered yet and carries a .vc-concept-spec fenced JSON
  // block is rendered in place. The single runtime page scan is what
  // boots us; we mirror that by self-scanning on DOMContentLoaded.
  function scanAndRender(rootScope) {
    var scope = rootScope || document;
    var hosts = scope.querySelectorAll('[data-vc-concept-demo]');
    for (var i = 0; i < hosts.length; i++) {
      var host = hosts[i];
      if (host.getAttribute('data-vc-concept-demo-rendered') === '1') continue;
      var specEl = host.querySelector('.vc-concept-spec, script[type="application/json"]');
      if (!specEl) continue;
      var spec;
      try {
        spec = parseSpec(specEl.textContent);
      } catch (e) {
        // Fail-fast surfacing: stamp the error so the page author sees it,
        // but don't throw out of the scan loop (other demos still render).
        host.setAttribute('data-vc-concept-error', e.message);
        if (typeof console !== 'undefined' && console.error) console.error(e.message);
        continue;
      }
      var idAttr = host.getAttribute('data-vc-concept-id');
      var root = renderConceptDemo(spec, idAttr ? { id: idAttr } : null);
      host.setAttribute('data-vc-concept-demo-rendered', '1');
      host.appendChild(root);
    }
  }

  function boot() {
    if (typeof document === 'undefined') return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { scanAndRender(document); });
    } else {
      scanAndRender(document);
    }
  }

  // ── export ─────────────────────────────────────────────────────────

  var api = {
    parseSpec: parseSpec,
    renderConceptDemo: renderConceptDemo,
    mountConceptDemo: mountConceptDemo,
    scanAndRender: scanAndRender
  };

  if (typeof window !== 'undefined') {
    window.amvcpConceptDemo = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  boot();
})();
