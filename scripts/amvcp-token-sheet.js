/*!
 * ai-maestro-visual-communicator-plugin — token contact-sheet renderer.
 *
 * Phase 2 Build #1 (design-tokens). The headline deliverable: a
 * rendered, self-contained, DESIGN.md-themed HTML "living design page"
 * that shows EVERY token visually, click-to-copy. One panel per token
 * group; the renderer is schema-driven — a new token group in the
 * engine produces a new panel with no renderer change.
 *
 * It sits on top of the Phase-1 engine (amvcp-designmd.js) and the
 * design-tokens helper layer (amvcp-tokens.js): it reads a PARSED
 * designmd plus `amvcpDesignMd.tokenSchema`, and uses amvcpTokens for
 * the WCAG contrast helper. Both peers are looked up softly.
 *
 * Dual export:
 *   - browser: `window.amvcpTokenSheet = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Style matches scripts/amvcp-designmd.js — ES5-safe `var` / function
 * declarations, no arrow functions, no template literals, no classes,
 * no build step, no npm deps.
 *
 * Public API:
 *   renderContactSheet(designmd, opts) -> HTMLElement (the sheet root)
 *   mountContactSheet(designmd, container, opts)
 *   contrastRatio(hexA, hexB) -> number  (re-exported convenience)
 *
 * Every swatch / specimen / bar / chip is a <button> carrying
 * data-vc-copy="<value>"; one delegated click listener does the copy.
 * Copying is a CONVENIENCE affordance, not a data contract — so a
 * missing navigator.clipboard degrades gracefully (textarea fallback,
 * then selectable text) rather than throwing. Everything else fails
 * fast.
 *
 * No nested scrollbars: the color grid wraps, code samples are
 * <pre> with overflow:visible, no panel has max-height + overflow:auto.
 * Wide content extends the document's single scroll axis.
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

  function getTokens() {
    if (typeof window !== 'undefined' && window.amvcpTokens) {
      return window.amvcpTokens;
    }
    if (typeof module !== 'undefined' && typeof require === 'function') {
      try {
        return require('./amvcp-tokens.js');
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // ── WCAG contrast (re-exported; falls back to amvcpTokens) ─────────
  //
  // The renderer needs a contrast number per color cell. amvcpTokens
  // already implements the WCAG formula; reuse it when present, else
  // compute inline so the sheet still annotates contrast standalone.
  function contrastRatio(hexA, hexB) {
    var tokens = getTokens();
    if (tokens && typeof tokens.contrastRatio === 'function') {
      return tokens.contrastRatio(hexA, hexB);
    }
    var la = relLum(hexA);
    var lb = relLum(hexB);
    var hi = Math.max(la, lb);
    var lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  // Inline fallback relative-luminance (only used if amvcpTokens absent).
  function relLum(hex) {
    var rgb = parseHexLocal(hex);
    function lin(c255) {
      var c = c255 / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
  }

  // A minimal hex parser — only used by the contrast fallback. Returns
  // null on a non-hex (a var()/named color cannot get a contrast ratio).
  function parseHexLocal(hex) {
    if (typeof hex !== 'string') { return null; }
    var s = hex.replace(/^\s+|\s+$/g, '');
    if (s.charAt(0) === '#') { s = s.slice(1); }
    if (/^[0-9a-fA-F]{3}$/.test(s)) {
      return {
        r: parseInt(s.charAt(0) + s.charAt(0), 16),
        g: parseInt(s.charAt(1) + s.charAt(1), 16),
        b: parseInt(s.charAt(2) + s.charAt(2), 16)
      };
    }
    if (/^[0-9a-fA-F]{6}$/.test(s)) {
      return {
        r: parseInt(s.slice(0, 2), 16),
        g: parseInt(s.slice(2, 4), 16),
        b: parseInt(s.slice(4, 6), 16)
      };
    }
    return null;
  }

  // ── small DOM helpers ──────────────────────────────────────────────

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

  // The token roles that are TEXT (their contrast is measured against
  // the surface, not the canvas) — used by the color panel annotation.
  var TEXT_ROLES = {
    content: true, 'content-muted': true, 'content-subtle': true
  };

  // ── color-role panel ───────────────────────────────────────────────
  //
  // A CSS-grid color grid for ONE theme. Each cell is a button:
  // background = the role color, role name + hex + WCAG contrast ratio
  // overlaid. The grid WRAPS (no inner scrollbar) — the page extends.
  function buildColorGrid(themeColors, themeName, canvasHex) {
    var grid = el('div', 'vc-sheet-grid vc-sheet-color-grid',
      { 'data-vc-theme-grid': themeName });
    var roles = objectKeys(themeColors);
    var i;
    for (i = 0; i < roles.length; i++) {
      var role = roles[i];
      var value = String(themeColors[role]);
      var cell = el('button', 'vc-sheet-swatch', {
        type: 'button',
        'data-vc-copy': value,
        'data-vc-role': role
      });
      // The colored face.
      var face = el('span', 'vc-sheet-swatch-face');
      face.style.background = value;
      cell.appendChild(face);
      // The label strip — role name, hex, contrast ratio.
      var label = el('span', 'vc-sheet-swatch-label');
      label.appendChild(text(el('strong', 'vc-sheet-swatch-name'), role));
      label.appendChild(text(el('code', 'vc-sheet-swatch-hex'), value));
      // Contrast: text roles vs surface, everything else vs canvas.
      var against = TEXT_ROLES[role]
        ? String(themeColors.surface)
        : canvasHex;
      var ratio = null;
      try {
        ratio = contrastRatio(value, against);
      } catch (e) {
        ratio = null;
      }
      if (ratio !== null && isFinite(ratio)) {
        var ratioStr = ratio.toFixed(2) + ':1';
        var cr = text(el('span', 'vc-sheet-swatch-contrast'), ratioStr);
        // Body-text contrast threshold is 4.5:1 — mark a low cell so a
        // reviewer sees the dual-theme contract is honoured visually.
        if (TEXT_ROLES[role] && ratio < 4.5) {
          cr.setAttribute('data-vc-contrast-warn', '1');
          cell.setAttribute('data-vc-contrast-warn', '1');
        }
        label.appendChild(cr);
      }
      cell.appendChild(label);
      grid.appendChild(cell);
    }
    return grid;
  }

  function buildColorPanel(designmd) {
    var section = el('section', 'vc-sheet-panel',
      { 'data-vc-panel': 'color' });
    section.appendChild(panelHeading('Color',
      'Every color role, both themes. Click a swatch to copy its value.'));
    var colors = designmd.tokens.colors;
    var active = activeTheme(designmd);
    var other = active === 'light' ? 'dark' : 'light';
    // Active theme first, then the opposite theme — the dual-theme
    // contract rendered, not just asserted.
    section.appendChild(themeSubhead(active + ' theme (active)'));
    section.appendChild(buildColorGrid(
      colors[active], active, String(colors[active].canvas)));
    section.appendChild(themeSubhead(other + ' theme'));
    section.appendChild(buildColorGrid(
      colors[other], other, String(colors[other].canvas)));
    return section;
  }

  // ── typography panel ───────────────────────────────────────────────
  //
  // One specimen line per typography.scale step, rendered at that exact
  // --vc-text-<i> size; plus the three font stacks as named samples.
  function buildTypographyPanel(designmd) {
    var section = el('section', 'vc-sheet-panel',
      { 'data-vc-panel': 'typography' });
    section.appendChild(panelHeading('Typography',
      'The type scale at true pixel sizes, and the font stacks.'));
    var ty = designmd.tokens.typography;
    var i;
    // Type scale specimens.
    for (i = 0; i < ty.scale.length; i++) {
      var px = ty.scale[i];
      var spec = el('button', 'vc-sheet-type-specimen', {
        type: 'button',
        'data-vc-copy': 'var(--vc-text-' + i + ')'
      });
      var sample = el('span', 'vc-sheet-type-sample');
      sample.style.fontSize = 'var(--vc-text-' + i + ')';
      text(sample, 'The quick brown fox');
      spec.appendChild(sample);
      spec.appendChild(text(el('code', 'vc-sheet-type-meta'),
        'text-' + i + '  ·  ' + px + 'px'));
      section.appendChild(spec);
    }
    // Font stacks.
    var fonts = [
      ['heading', 'font-heading', ty['font-heading']],
      ['body', 'font-body', ty['font-body']],
      ['mono', 'font-mono', ty['font-mono']]
    ];
    for (i = 0; i < fonts.length; i++) {
      var f = fonts[i];
      var fc = el('button', 'vc-sheet-font-card', {
        type: 'button',
        'data-vc-copy': 'var(--vc-' + f[1] + ')'
      });
      var fs = el('span', 'vc-sheet-font-sample');
      fs.style.fontFamily = 'var(--vc-' + f[1] + ')';
      text(fs, 'Aa Bb Cc 123 — ' + f[0]);
      fc.appendChild(fs);
      fc.appendChild(text(el('code', 'vc-sheet-font-meta'), String(f[2])));
      section.appendChild(fc);
    }
    return section;
  }

  // ── spacing panel ──────────────────────────────────────────────────
  //
  // One bar per spacing.scale step — TRUE pixel width (not %).
  function buildSpacingPanel(designmd) {
    var section = el('section', 'vc-sheet-panel',
      { 'data-vc-panel': 'spacing' });
    section.appendChild(panelHeading('Spacing',
      'Each spacing step at its true pixel width.'));
    var scale = designmd.tokens.spacing.scale;
    var i;
    for (i = 0; i < scale.length; i++) {
      var row = el('button', 'vc-sheet-space-row', {
        type: 'button',
        'data-vc-copy': 'var(--vc-space-' + i + ')'
      });
      var bar = el('span', 'vc-sheet-space-bar');
      // True px width straight off the token — never a percentage.
      bar.style.width = 'var(--vc-space-' + i + ')';
      row.appendChild(bar);
      row.appendChild(text(el('code', 'vc-sheet-space-meta'),
        'space-' + i + '  ·  ' + scale[i] + 'px'));
      section.appendChild(row);
    }
    return section;
  }

  // ── radius panel ───────────────────────────────────────────────────
  function buildRadiusPanel(designmd) {
    var section = el('section', 'vc-sheet-panel',
      { 'data-vc-panel': 'radius' });
    section.appendChild(panelHeading('Radius',
      'The corner-radius scale.'));
    var grid = el('div', 'vc-sheet-grid vc-sheet-radius-grid');
    var radius = designmd.tokens.radius;
    var keys = ['none', 'sm', 'md', 'lg', 'xl', 'full'];
    var i;
    for (i = 0; i < keys.length; i++) {
      var k = keys[i];
      var cell = el('button', 'vc-sheet-radius-cell', {
        type: 'button',
        'data-vc-copy': 'var(--vc-radius-' + k + ')'
      });
      var box = el('span', 'vc-sheet-radius-box');
      box.style.borderRadius = 'var(--vc-radius-' + k + ')';
      cell.appendChild(box);
      cell.appendChild(text(el('code', 'vc-sheet-radius-meta'),
        k + '  ·  ' + radius[k] + 'px'));
      grid.appendChild(cell);
    }
    section.appendChild(grid);
    return section;
  }

  // ── elevation panel ────────────────────────────────────────────────
  //
  // One neutral card per --vc-shadow-* token actually present.
  function buildElevationPanel(designmd) {
    var elev = designmd.tokens.elevation;
    if (!isMap(elev)) {
      return null;   // optional group absent — no panel
    }
    var section = el('section', 'vc-sheet-panel',
      { 'data-vc-panel': 'elevation' });
    section.appendChild(panelHeading('Elevation',
      'The shadow scale — each card carries one elevation token.'));
    var grid = el('div', 'vc-sheet-grid vc-sheet-elevation-grid');
    var keys = ['shadow-0', 'shadow-1', 'shadow-2', 'shadow-3',
      'shadow-4', 'shadow-border'];
    var i;
    for (i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!hasOwn(elev, k)) {
        continue;
      }
      var cell = el('button', 'vc-sheet-elevation-cell', {
        type: 'button',
        'data-vc-copy': 'var(--vc-' + k + ')'
      });
      var card = el('span', 'vc-sheet-elevation-card');
      card.style.boxShadow = 'var(--vc-' + k + ')';
      cell.appendChild(card);
      cell.appendChild(text(el('code', 'vc-sheet-elevation-meta'), k));
      grid.appendChild(cell);
    }
    section.appendChild(grid);
    return section;
  }

  // ── motion panel ───────────────────────────────────────────────────
  //
  // One demo chip per easing. Clicking it runs a 1-cycle translate using
  // that easing + --vc-duration-base, so the curve is FELT. Gated by
  // prefers-reduced-motion — when reduced, the chip shows the
  // cubic-bezier string statically and does not animate.
  function buildMotionPanel(designmd) {
    var motion = designmd.tokens.motion;
    if (!isMap(motion)) {
      return null;
    }
    var section = el('section', 'vc-sheet-panel',
      { 'data-vc-panel': 'motion' });
    var reduced = prefersReducedMotion();
    section.appendChild(panelHeading('Motion',
      reduced
        ? 'Reduced-motion is on — easings shown statically.'
        : 'Click a chip to feel the easing curve.'));
    var keys = objectKeys(motion);
    var i;
    var grid = el('div', 'vc-sheet-grid vc-sheet-motion-grid');
    for (i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.indexOf('easing-') !== 0) {
        continue;
      }
      var chip = el('button', 'vc-sheet-motion-chip', {
        type: 'button',
        'data-vc-copy': 'var(--vc-' + k + ')',
        'data-vc-easing': k
      });
      var dot = el('span', 'vc-sheet-motion-dot');
      chip.appendChild(dot);
      chip.appendChild(text(el('code', 'vc-sheet-motion-meta'),
        k + '  ·  ' + motion[k]));
      if (reduced) {
        chip.setAttribute('data-vc-reduced', '1');
      }
      grid.appendChild(chip);
    }
    section.appendChild(grid);
    return section;
  }

  // ── z-index panel ──────────────────────────────────────────────────
  //
  // A small stack diagram — overlapping labelled plates, each positioned
  // with z-index:var(--vc-z-<k>), showing the layering order.
  function buildZIndexPanel(designmd) {
    var z = designmd.tokens['z-index'];
    if (!isMap(z)) {
      return null;
    }
    var section = el('section', 'vc-sheet-panel',
      { 'data-vc-panel': 'z-index' });
    section.appendChild(panelHeading('Z-Index',
      'The stacking scale — each plate is positioned by its z token.'));
    var stack = el('div', 'vc-sheet-zstack');
    var keys = ['behind', 'base', 'raised', 'dropdown', 'sticky',
      'overlay', 'modal', 'toast', 'tooltip'];
    var i;
    var shown = 0;
    for (i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!hasOwn(z, k)) {
        continue;
      }
      var plate = el('button', 'vc-sheet-zplate', {
        type: 'button',
        'data-vc-copy': 'var(--vc-z-' + k + ')'
      });
      plate.style.zIndex = 'var(--vc-z-' + k + ')';
      // Cascade each plate down-right so the stacking order is visible.
      plate.style.left = (shown * 26) + 'px';
      plate.style.top = (shown * 22) + 'px';
      plate.appendChild(text(el('span', 'vc-sheet-zplate-label'),
        k + '  ·  ' + z[k]));
      stack.appendChild(plate);
      shown++;
    }
    section.appendChild(stack);
    return section;
  }

  // ── state panel ────────────────────────────────────────────────────
  //
  // Interaction-state demos — a .vc-state button shown idle / hover /
  // focus / pressed / disabled (static states forced via a marker
  // class), plus one live interactive instance.
  function buildStatePanel() {
    var section = el('section', 'vc-sheet-panel',
      { 'data-vc-panel': 'state' });
    section.appendChild(panelHeading('Interaction states',
      'The state-layer overlay on each interactive base.'));
    var row = el('div', 'vc-sheet-state-row');
    var states = [
      ['idle', ''],
      ['hover', 'vc-state-demo-hover'],
      ['focus', 'vc-state-demo-focus'],
      ['pressed', 'vc-state-demo-pressed'],
      ['disabled', 'vc-state-demo-disabled']
    ];
    var i;
    for (i = 0; i < states.length; i++) {
      var s = states[i];
      var cls = 'vc-state vc-sheet-state-btn' + (s[1] ? ' ' + s[1] : '');
      var btn = el('button', cls, { type: 'button' });
      if (s[0] === 'disabled') {
        btn.setAttribute('aria-disabled', 'true');
      }
      text(btn, s[0]);
      row.appendChild(btn);
    }
    // A genuinely live interactive instance.
    var live = el('button', 'vc-state vc-sheet-state-btn vc-sheet-state-live',
      { type: 'button', 'data-vc-copy': '.vc-state' });
    text(live, 'live — hover / focus / press me');
    row.appendChild(live);
    section.appendChild(row);
    return section;
  }

  // ── code panel ─────────────────────────────────────────────────────
  //
  // A syntax-highlighted code sample. The renderer ships a tiny
  // regex-based tokenizer (keyword/string/number/comment/type/function
  // /operator/punctuation) and colors each class with --vc-code-<k>.
  // This is just the contact-sheet preview — the full tokenizer is the
  // code-block skill's job. No external highlighter.
  function buildCodePanel(designmd) {
    var code = designmd.tokens.code;
    if (!isMap(code)) {
      return null;
    }
    var section = el('section', 'vc-sheet-panel',
      { 'data-vc-panel': 'code' });
    section.appendChild(panelHeading('Code',
      'The syntax-highlight palette on a sample.'));
    var sample = [
      '// resolve a token reference, fail-fast on a cycle',
      'function resolveRef(node, depth) {',
      '  var MAX = 5;',
      '  if (depth > MAX) {',
      '    throw new Error("ref chain too deep");',
      '  }',
      '  return lookup(node.path) || node.value;',
      '}'
    ].join('\n');
    // <pre> with overflow:visible — wide code extends the page, never
    // an inner scrollbar (no-nested-scrollbars rule).
    var pre = el('pre', 'vc-sheet-code');
    var codeEl = el('code', 'vc-sheet-code-inner');
    highlightInto(codeEl, sample);
    pre.appendChild(codeEl);
    section.appendChild(pre);
    // A legend of the 12 code tokens, each click-to-copy.
    var legend = el('div', 'vc-sheet-grid vc-sheet-code-legend');
    var keys = ['keyword', 'string', 'number', 'comment', 'type',
      'variable', 'function', 'constant', 'operator', 'punctuation',
      'tag', 'attribute'];
    var i;
    for (i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!hasOwn(code, k)) {
        continue;
      }
      var chip = el('button', 'vc-sheet-code-chip', {
        type: 'button',
        'data-vc-copy': 'var(--vc-code-' + k + ')'
      });
      var dot = el('span', 'vc-sheet-code-dot');
      dot.style.background = 'var(--vc-code-' + k + ')';
      chip.appendChild(dot);
      chip.appendChild(text(el('code', 'vc-sheet-code-chip-meta'), k));
      legend.appendChild(chip);
    }
    section.appendChild(legend);
    return section;
  }

  // The tiny regex tokenizer. It emits <span class="vc-tok-<class>">
  // runs into `target`. Deliberately small — keyword / string / number
  // / comment / function-call / operator / punctuation. Anything else
  // falls through as plain text (the `variable`/`type` colors are shown
  // in the legend; the sample is kept simple).
  var CODE_KEYWORDS = {
    'var': 1, 'function': 1, 'return': 1, 'if': 1, 'else': 1,
    'for': 1, 'while': 1, 'new': 1, 'throw': 1, 'typeof': 1,
    'true': 1, 'false': 1, 'null': 1
  };

  function highlightInto(target, src) {
    // Tokenise line by line so a `//` comment ends at the newline.
    var lines = src.split('\n');
    var li;
    for (li = 0; li < lines.length; li++) {
      if (li > 0) {
        target.appendChild(document.createTextNode('\n'));
      }
      highlightLine(target, lines[li]);
    }
  }

  function highlightLine(target, line) {
    // A whole-line comment.
    var commentAt = line.indexOf('//');
    var code = line;
    var comment = '';
    if (commentAt !== -1) {
      code = line.slice(0, commentAt);
      comment = line.slice(commentAt);
    }
    // Token regex: strings, numbers, identifiers, operators, the rest.
    var re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|([(){}[\];,.])|([+\-*/=<>!&|]+)/g;
    var last = 0;
    var m;
    while ((m = re.exec(code)) !== null) {
      if (m.index > last) {
        target.appendChild(document.createTextNode(code.slice(last, m.index)));
      }
      if (m[1]) {
        appendTok(target, 'string', m[1]);
      } else if (m[2]) {
        appendTok(target, 'number', m[2]);
      } else if (m[3]) {
        if (CODE_KEYWORDS[m[3]]) {
          appendTok(target, 'keyword', m[3]);
        } else {
          // An identifier followed by `(` is a function call.
          var after = code.charAt(re.lastIndex);
          appendTok(target, after === '(' ? 'function' : 'variable', m[3]);
        }
      } else if (m[4]) {
        appendTok(target, 'punctuation', m[4]);
      } else if (m[5]) {
        appendTok(target, 'operator', m[5]);
      }
      last = re.lastIndex;
    }
    if (last < code.length) {
      target.appendChild(document.createTextNode(code.slice(last)));
    }
    if (comment) {
      appendTok(target, 'comment', comment);
    }
  }

  function appendTok(target, klass, str) {
    var span = el('span', 'vc-tok vc-tok-' + klass);
    span.textContent = str;
    target.appendChild(span);
  }

  // ── semantic-roles panel ───────────────────────────────────────────
  //
  // Renders the badge / activity / graph-node / icon-tint role maps as
  // labelled chip rows. Uses amvcpTokens.renderRoleMapCss when present;
  // each map's <style> is injected once, the chips reference it.
  function buildSemanticRolesPanel(designmd) {
    var tokens = getTokens();
    var section = el('section', 'vc-sheet-panel',
      { 'data-vc-panel': 'semantic-roles' });
    section.appendChild(panelHeading('Semantic roles',
      'Badge / activity / graph-node / icon-tint role maps.'));
    if (!tokens || typeof tokens.renderRoleMapCss !== 'function') {
      section.appendChild(text(el('p', 'vc-sheet-note'),
        'amvcp-tokens.js not loaded — role maps unavailable.'));
      return section;
    }
    // Seed the categorical ramps off the active accent so the role
    // colors are brand-coherent with the loaded DESIGN.md.
    var accent = String(
      designmd.tokens.colors[activeTheme(designmd)].accent
    );
    var maps = [
      ['badge', ['MUST', 'IMO', 'Q', 'FYI']],
      ['activity', ['working', 'meeting', 'break', 'idle', 'focus',
        'review', 'blocked']],
      ['graph-node', ['source', 'filter', 'transform', 'aggregate',
        'final', 'target']]
    ];
    var i;
    for (i = 0; i < maps.length; i++) {
      var name = maps[i][0];
      var roles = maps[i][1];
      // Inject the role-map CSS once into the document head.
      injectRoleMapCss(tokens, name, accent);
      var label = text(el('h4', 'vc-sheet-roles-label'), name);
      section.appendChild(label);
      var row = el('div', 'vc-sheet-roles-row');
      var j;
      for (j = 0; j < roles.length; j++) {
        var chip = el('span', 'vc-sheet-role-chip',
          { 'data-vc-role': roles[j] });
        text(chip, roles[j]);
        row.appendChild(chip);
      }
      section.appendChild(row);
    }
    return section;
  }

  // Inject a role map's <style> text once (keyed by name) into <head>.
  function injectRoleMapCss(tokens, name, accent) {
    var id = 'vc-sheet-rolemap-' + name;
    if (document.getElementById(id)) {
      return;
    }
    var cssText = tokens.renderRoleMapCss(name, accent);
    // renderRoleMapCss returns "<style …>…</style>" — strip the wrapper
    // and inject the inner CSS into a real <style> we control the id of.
    var inner = cssText
      .replace(/^<style[^>]*>/i, '')
      .replace(/<\/style>\s*$/i, '');
    var styleEl = el('style', null, { id: id });
    styleEl.textContent = inner;
    (document.head || document.documentElement).appendChild(styleEl);
  }

  // ── panel chrome helpers ───────────────────────────────────────────

  function panelHeading(title, sub) {
    var head = el('header', 'vc-sheet-panel-head');
    head.appendChild(text(el('h3', 'vc-sheet-panel-title'), title));
    if (sub) {
      head.appendChild(text(el('p', 'vc-sheet-panel-sub'), sub));
    }
    return head;
  }

  function themeSubhead(label) {
    return text(el('h4', 'vc-sheet-theme-subhead'), label);
  }

  // ── click-to-copy (delegated, graceful degradation) ────────────────
  //
  // One delegated click listener on the sheet root. On a click that
  // lands on (or inside) an element carrying data-vc-copy, copy that
  // value and flash a "copied" tooltip. Copying is a CONVENIENCE — a
  // missing clipboard API degrades (textarea + execCommand, then
  // selectable text) rather than throwing.
  function attachCopy(root) {
    root.addEventListener('click', function (ev) {
      var node = ev.target;
      while (node && node !== root && !node.hasAttribute('data-vc-copy')) {
        node = node.parentNode;
      }
      if (!node || node === root) {
        return;
      }
      var value = node.getAttribute('data-vc-copy');
      copyValue(value, node);
    });
  }

  function copyValue(value, anchor) {
    var done = function () { flashCopied(anchor); };
    // Preferred path — the async Clipboard API.
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
  // that fails, the swatch still shows the value as selectable text, so
  // the affordance never hard-fails (it is not a data contract).
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

  // Flash a transient "copied" tooltip on the anchor. Pure CSS class
  // toggle so it themes off --vc-* like the rest of the sheet.
  function flashCopied(anchor, altLabel) {
    if (!anchor) {
      return;
    }
    anchor.setAttribute('data-vc-copied', altLabel || 'copied');
    window.setTimeout(function () {
      anchor.removeAttribute('data-vc-copied');
    }, 1100);
  }

  // ── motion-chip live demo (reduced-motion aware) ───────────────────
  //
  // Wires each motion chip so a click runs a 1-cycle translate using
  // that easing. Skipped entirely when prefers-reduced-motion is set —
  // the chip already shows the cubic-bezier string statically.
  function attachMotionDemo(root) {
    if (prefersReducedMotion()) {
      return;
    }
    var chips = root.querySelectorAll('.vc-sheet-motion-chip');
    var i;
    for (i = 0; i < chips.length; i++) {
      wireMotionChip(chips[i]);
    }
  }

  function wireMotionChip(chip) {
    var easing = chip.getAttribute('data-vc-easing');
    var dot = chip.querySelector('.vc-sheet-motion-dot');
    chip.addEventListener('click', function () {
      if (!dot) {
        return;
      }
      // Run one cycle: slide right then back, using the chip's easing
      // and the DESIGN.md's --vc-duration-base token.
      dot.style.transition = 'transform var(--vc-duration-base, 300ms) ' +
        'var(--vc-' + easing + ', ease)';
      dot.style.transform = 'translateX(120px)';
      window.setTimeout(function () {
        dot.style.transform = 'translateX(0)';
      }, 360);
    });
  }

  // ── theme toggle ───────────────────────────────────────────────────
  //
  // The sheet's Theme button. When the runtime is present it delegates
  // to window.__veDesignMd.toggleTheme() (the whole page re-themes);
  // otherwise it re-resolves + re-applies via the engine directly so the
  // sheet still flips standalone.
  function attachThemeToggle(button, designmd) {
    button.addEventListener('click', function () {
      if (typeof window !== 'undefined' && window.__veDesignMd &&
          typeof window.__veDesignMd.toggleTheme === 'function') {
        window.__veDesignMd.toggleTheme();
        syncThemeButton(button);
        return;
      }
      // Standalone fallback — flip data-ve-theme + re-apply via engine.
      var engine = getEngine();
      if (!engine) {
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

  // ── public: renderContactSheet / mountContactSheet ─────────────────

  function renderContactSheet(designmd, opts) {
    if (typeof document === 'undefined') {
      throw new Error('renderContactSheet: no document — browser only');
    }
    if (!designmd || typeof designmd !== 'object' || !designmd.tokens) {
      throw new Error(
        'renderContactSheet: designmd must be a parsed DESIGN.md ' +
        '(amvcpDesignMd.parseDesignMd(...).designmd)'
      );
    }
    opts = opts || {};
    var root = el('main', 'vc-sheet');
    root.setAttribute('data-vc-sheet', '1');

    // Title strip — DESIGN.md name + a theme toggle.
    var head = el('header', 'vc-sheet-header');
    var titleName = (designmd.meta && designmd.meta.name)
      ? designmd.meta.name : 'DESIGN.md';
    head.appendChild(text(el('h1', 'vc-sheet-doc-title'),
      titleName + ' — token contact sheet'));
    var themeBtn = el('button', 'vc-sheet-theme-toggle vc-state',
      { type: 'button' });
    head.appendChild(themeBtn);
    root.appendChild(head);
    attachThemeToggle(themeBtn, designmd);

    // The panels. Each builder may return null for an absent optional
    // group — those are skipped, so the sheet is exactly the loaded
    // DESIGN.md's token surface.
    var panels = [
      buildColorPanel(designmd),
      buildTypographyPanel(designmd),
      buildSpacingPanel(designmd),
      buildRadiusPanel(designmd),
      buildElevationPanel(designmd),
      buildMotionPanel(designmd),
      buildZIndexPanel(designmd),
      buildStatePanel(),
      buildCodePanel(designmd),
      buildSemanticRolesPanel(designmd)
    ];
    var i;
    for (i = 0; i < panels.length; i++) {
      if (panels[i]) {
        root.appendChild(panels[i]);
      }
    }

    attachCopy(root);
    attachMotionDemo(root);
    return root;
  }

  function mountContactSheet(designmd, container, opts) {
    if (!container || typeof container.appendChild !== 'function') {
      throw new Error('mountContactSheet: container is not a DOM element');
    }
    var sheet = renderContactSheet(designmd, opts);
    container.appendChild(sheet);
    return sheet;
  }

  // ── generic helpers ────────────────────────────────────────────────

  function prefersReducedMotion() {
    return typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function activeTheme(designmd) {
    // Prefer the document's stamped theme (kept in sync by the runtime),
    // then the DESIGN.md's own default, then light.
    if (typeof document !== 'undefined' && document.documentElement) {
      var stamped = document.documentElement.getAttribute('data-ve-theme');
      if (stamped === 'light' || stamped === 'dark') {
        return stamped;
      }
    }
    if (designmd.meta && (designmd.meta.default_theme === 'light' ||
        designmd.meta.default_theme === 'dark')) {
      return designmd.meta.default_theme;
    }
    return 'light';
  }

  function isMap(v) {
    return v !== null && typeof v === 'object' &&
      Object.prototype.toString.call(v) !== '[object Array]';
  }

  function hasOwn(obj, key) {
    return isMap(obj) && Object.prototype.hasOwnProperty.call(obj, key);
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
    renderContactSheet: renderContactSheet,
    mountContactSheet: mountContactSheet,
    contrastRatio: contrastRatio
  };

  if (typeof window !== 'undefined') {
    window.amvcpTokenSheet = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
