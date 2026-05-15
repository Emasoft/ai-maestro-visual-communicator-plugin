/*!
 * ai-maestro-visual-communicator-plugin — DESIGN.md realtime style engine.
 *
 * Phase 1a (TRDD-352ef46a): a standalone, dependency-free DESIGN.md parser
 * and token-mapper. Parses a Google-DESIGN.md-style spec (YAML frontmatter
 * + markdown prose), resolves `{token.refs}`, validates the schema, and
 * maps every token to a `--vc-*` CSS custom property so the runtime can
 * style every visual component from the tokens. Hot-swapping a different
 * DESIGN.md re-resolves + re-applies, restyling the whole page live.
 *
 * No build step, no npm runtime deps, no YAML library — the YAML subset
 * the schema needs (2-level nested maps, scalars, inline numeric arrays,
 * quoted strings) is parsed inline below.
 *
 * Dual export:
 *   - browser: `window.amvcpDesignMd = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Style matches scripts/amvcp-runtime.js — `var`, function declarations,
 * ES5-safe, no arrow functions, no template literals, no classes.
 *
 * Fail-fast contract: a missing required key, a malformed frontmatter, a
 * circular `{token.ref}`, or an out-of-range reference is a HARD ERROR.
 * The engine never invents defaults. The two documented exceptions are
 * the `elevation` and `motion` groups — if a group is absent entirely,
 * its CSS vars are simply not emitted (no error). If the group is present
 * but partially filled, the present keys are validated normally.
 *
 * API:
 *   parseDesignMd(text)            -> { ok, designmd, errors:[] }
 *   resolveTokens(designmd, theme) -> { '--vc-color-canvas':'#…', … }
 *   applyTokens(cssVarMap, rootEl) -> rootEl (CSS vars set on its style)
 *   serializeDesignMd(designmd)    -> text (round-trips frontmatter+prose)
 *   tokenSchema                    -> descriptor array driving the Phase-1b
 *                                     style-controller pad
 */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────

  // The 15 color roles every theme must define (DM-11). Both `light` and
  // `dark` are first-class — one is NEVER inferred from the other.
  var COLOR_ROLES = [
    'canvas', 'surface', 'surface-raised', 'surface-sunken',
    'content', 'content-muted', 'content-subtle',
    'border', 'border-strong',
    'accent', 'on-accent',
    'success', 'warning', 'danger', 'info'
  ];

  // The radius keys the schema fixes (DM section). `full` maps to 9999.
  var RADIUS_KEYS = ['none', 'sm', 'md', 'lg', 'xl', 'full'];

  // Typography weight keys.
  var WEIGHT_KEYS = ['regular', 'medium', 'bold'];

  // Optional groups whose total absence is allowed (DM-16 exception).
  var OPTIONAL_GROUPS = ['elevation', 'motion'];

  // `{token.ref}` recursion guard — references deeper than this many hops
  // are rejected as a hard error (defends against a chain bomb even when
  // there is no literal cycle).
  var MAX_REF_DEPTH = 5;

  // A `{a.b.c}` reference: at least one dotted segment, ASCII-ish path
  // chars only. Anchored so the whole scalar must BE a reference — partial
  // references inside a longer string are intentionally NOT supported
  // (the schema never needs them and supporting them invites ambiguity).
  var REF_RE = /^\{([A-Za-z0-9_.\-]+)\}$/;

  // ── tokenSchema ────────────────────────────────────────────────────
  //
  // The single source of truth for what tokens exist, how they are typed,
  // and what UI control the Phase-1b style-controller pad should render
  // for each. A controller can be built purely by iterating this array —
  // it carries no values, only structure.
  //
  // Fields per descriptor:
  //   key      — stable identifier (also the suffix of the CSS var)
  //   group    — color | typography | spacing | radius | elevation | motion
  //   type     — color | length | number | select | text | shadow | easing
  //   cssVar   — the `--vc-*` custom property this token maps to, or a
  //              template with `<i>` for indexed tokens (scale arrays)
  //   control  — UI hint for the Phase-1b pad
  //   themed   — true only for color tokens (value depends on active theme)
  //   indexed  — true for scale arrays (one CSS var per element)
  //   unit     — appended to the raw value when emitting the CSS var
  //   optional — true if the token may be absent without error
  function buildTokenSchema() {
    var schema = [];
    var i;

    // Colors — 15 themed roles. Each resolves against the ACTIVE theme.
    for (i = 0; i < COLOR_ROLES.length; i++) {
      schema.push({
        key: COLOR_ROLES[i],
        group: 'color',
        type: 'color',
        cssVar: '--vc-color-' + COLOR_ROLES[i],
        control: 'color-swatch',
        themed: true,
        indexed: false,
        unit: '',
        optional: false
      });
    }

    // Typography — fonts.
    var fonts = ['heading', 'body', 'mono'];
    for (i = 0; i < fonts.length; i++) {
      schema.push({
        key: 'font-' + fonts[i],
        group: 'typography',
        type: 'text',
        cssVar: '--vc-font-' + fonts[i],
        control: 'font-stack',
        themed: false,
        indexed: false,
        unit: '',
        optional: false
      });
    }
    // Typography — the type scale (indexed, px).
    schema.push({
      key: 'scale',
      group: 'typography',
      type: 'length',
      cssVar: '--vc-text-<i>',
      control: 'scale-list',
      themed: false,
      indexed: true,
      unit: 'px',
      optional: false
    });
    // Typography — weights.
    for (i = 0; i < WEIGHT_KEYS.length; i++) {
      schema.push({
        key: 'weight-' + WEIGHT_KEYS[i],
        group: 'typography',
        type: 'number',
        cssVar: '--vc-weight-' + WEIGHT_KEYS[i],
        control: 'number',
        themed: false,
        indexed: false,
        unit: '',
        optional: false
      });
    }
    // Typography — line height.
    schema.push({
      key: 'line-height',
      group: 'typography',
      type: 'number',
      cssVar: '--vc-line-height',
      control: 'number',
      themed: false,
      indexed: false,
      unit: '',
      optional: false
    });

    // Spacing — the spacing scale (indexed, px).
    schema.push({
      key: 'scale',
      group: 'spacing',
      type: 'length',
      cssVar: '--vc-space-<i>',
      control: 'scale-list',
      themed: false,
      indexed: true,
      unit: 'px',
      optional: false
    });

    // Radius — fixed key set, px (full → 9999px).
    for (i = 0; i < RADIUS_KEYS.length; i++) {
      schema.push({
        key: RADIUS_KEYS[i],
        group: 'radius',
        type: 'length',
        cssVar: '--vc-radius-' + RADIUS_KEYS[i],
        control: 'number',
        themed: false,
        indexed: false,
        unit: 'px',
        optional: false
      });
    }

    // Elevation — optional group, three shadow tokens.
    var shadows = ['sm', 'md', 'lg'];
    for (i = 0; i < shadows.length; i++) {
      schema.push({
        key: 'shadow-' + shadows[i],
        group: 'elevation',
        type: 'shadow',
        cssVar: '--vc-shadow-' + shadows[i],
        control: 'shadow',
        themed: false,
        indexed: false,
        unit: '',
        optional: true
      });
    }

    // Motion — optional group, durations (ms) + easings.
    var durations = ['fast', 'normal', 'slow'];
    for (i = 0; i < durations.length; i++) {
      schema.push({
        key: 'duration-' + durations[i],
        group: 'motion',
        type: 'number',
        cssVar: '--vc-duration-' + durations[i],
        control: 'number',
        themed: false,
        indexed: false,
        unit: 'ms',
        optional: true
      });
    }
    var easings = ['standard', 'accel', 'decel'];
    for (i = 0; i < easings.length; i++) {
      schema.push({
        key: 'easing-' + easings[i],
        group: 'motion',
        type: 'easing',
        cssVar: '--vc-easing-' + easings[i],
        control: 'easing',
        themed: false,
        indexed: false,
        unit: '',
        optional: true
      });
    }

    return schema;
  }

  var tokenSchema = buildTokenSchema();

  // ── Frontmatter splitter ───────────────────────────────────────────
  //
  // A DESIGN.md file is `---\n<yaml>\n---\n<prose>`. The leading `---`
  // must be the very first line (a leading BOM / trailing CR is the only
  // tolerated noise). Anything else is a hard error — the engine cannot
  // guess where the token block is.
  function splitFrontmatter(text) {
    if (typeof text !== 'string') {
      throw new Error('parseDesignMd: input must be a string');
    }
    // Normalise CRLF/CR to LF up front so line handling is uniform.
    var src = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var lines = src.split('\n');
    if (lines.length === 0 || lines[0].trim() !== '---') {
      throw new Error(
        'DESIGN.md must open with a `---` frontmatter fence on line 1'
      );
    }
    var closeIdx = -1;
    var i;
    for (i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        closeIdx = i;
        break;
      }
    }
    if (closeIdx === -1) {
      throw new Error('DESIGN.md frontmatter has no closing `---` fence');
    }
    var yamlLines = lines.slice(1, closeIdx);
    // Prose is everything after the closing fence; drop exactly one blank
    // separator line if present so a round-trip is byte-stable.
    var proseLines = lines.slice(closeIdx + 1);
    if (proseLines.length > 0 && proseLines[0] === '') {
      proseLines = proseLines.slice(1);
    }
    return { yaml: yamlLines.join('\n'), prose: proseLines.join('\n') };
  }

  // ── Minimal YAML-subset parser ─────────────────────────────────────
  //
  // Supports exactly what the DESIGN.md schema needs and NOTHING more:
  //   - 2-space-per-level nested maps (up to 3 levels: group → theme → role)
  //   - scalar values: numbers, quoted strings ("…" or '…'), bare strings
  //   - inline numeric arrays:  scale: [12, 14, 16]
  //   - `# comment` lines and blank lines (ignored)
  //
  // It deliberately rejects tabs, block sequences (`- item`), multi-line
  // strings, anchors, and flow maps — anything outside the subset is a
  // hard error rather than a silent mis-parse.
  //
  // Returns a plain nested-object tree. Indentation MUST be a multiple of
  // two spaces; an odd indent is a hard error.
  function parseYamlSubset(yamlText) {
    var rawLines = yamlText.split('\n');
    var root = {};
    // Stack of { indent, obj } frames. The root frame's sentinel indent is
    // -2 (NOT -1) so the "a child indent must equal parent.indent + 2" rule
    // below makes a top-level key sit at indent 0 (-2 + 2), exactly where
    // real YAML puts it. -1 would wrongly demand top-level keys at indent 1.
    var stack = [{ indent: -2, obj: root }];
    var lineNo;

    for (lineNo = 0; lineNo < rawLines.length; lineNo++) {
      var raw = rawLines[lineNo];
      var human = lineNo + 1;

      // Strip a trailing inline comment, but only when the `#` is not
      // inside a quoted string. Walk the line tracking quote state.
      var stripped = stripInlineComment(raw);

      // Blank / comment-only line → skip.
      if (stripped.replace(/\s+$/, '') === '') {
        continue;
      }
      if (stripped.indexOf('\t') !== -1) {
        throw new Error(
          'YAML line ' + human + ': tabs are not allowed for indentation'
        );
      }

      // Measure leading-space indent.
      var indent = 0;
      while (indent < stripped.length && stripped.charAt(indent) === ' ') {
        indent++;
      }
      if (indent % 2 !== 0) {
        throw new Error(
          'YAML line ' + human + ': indentation must be a multiple of 2 spaces'
        );
      }
      var body = stripped.slice(indent).replace(/\s+$/, '');

      // The subset has no block sequences — a `- ` line is malformed.
      if (body.charAt(0) === '-') {
        throw new Error(
          'YAML line ' + human + ': block sequences ("- item") are not supported'
        );
      }

      var colon = findKeyColon(body);
      if (colon === -1) {
        throw new Error(
          'YAML line ' + human + ': expected "key: value" or "key:"'
        );
      }
      var key = body.slice(0, colon).replace(/\s+$/, '');
      if (key === '') {
        throw new Error('YAML line ' + human + ': empty key');
      }
      key = unquoteScalar(key, human);
      var valuePart = body.slice(colon + 1).replace(/^\s+/, '');

      // Pop the stack until we find the parent frame for this indent.
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }
      var parent = stack[stack.length - 1].obj;
      // A child indent must be exactly parent.indent + 2 — a jump of 4+
      // spaces means a level was skipped, which is malformed.
      var parentIndent = stack[stack.length - 1].indent;
      if (indent !== parentIndent + 2) {
        throw new Error(
          'YAML line ' + human + ': unexpected indentation ' + indent +
          ' (parent is at ' + (parentIndent < 0 ? 'root' : parentIndent) + ')'
        );
      }
      if (Object.prototype.hasOwnProperty.call(parent, key)) {
        throw new Error(
          'YAML line ' + human + ': duplicate key "' + key + '"'
        );
      }

      if (valuePart === '') {
        // `key:` with nothing after it → opens a nested map.
        var child = {};
        parent[key] = child;
        stack.push({ indent: indent, obj: child });
      } else {
        // `key: value` → a leaf scalar (or inline array).
        parent[key] = parseScalarOrArray(valuePart, human);
      }
    }
    return root;
  }

  // Strip a trailing ` # comment` that is OUTSIDE any quoted run. Returns
  // the line with the comment removed (leading indent preserved).
  function stripInlineComment(line) {
    var inSingle = false;
    var inDouble = false;
    var i;
    for (i = 0; i < line.length; i++) {
      var c = line.charAt(i);
      if (c === '"' && !inSingle) {
        inDouble = !inDouble;
      } else if (c === '\'' && !inDouble) {
        inSingle = !inSingle;
      } else if (c === '#' && !inSingle && !inDouble) {
        // A `#` only starts a comment when preceded by whitespace or at
        // the very start of the (post-indent) content — matches YAML.
        if (i === 0 || line.charAt(i - 1) === ' ' || line.charAt(i - 1) === '\t') {
          return line.slice(0, i);
        }
      }
    }
    return line;
  }

  // Find the `:` that separates a key from its value, skipping any `:`
  // that sits inside a quoted key. Returns -1 if there is no separator.
  function findKeyColon(body) {
    var inSingle = false;
    var inDouble = false;
    var i;
    for (i = 0; i < body.length; i++) {
      var c = body.charAt(i);
      if (c === '"' && !inSingle) {
        inDouble = !inDouble;
      } else if (c === '\'' && !inDouble) {
        inSingle = !inSingle;
      } else if (c === ':' && !inSingle && !inDouble) {
        // YAML requires the `:` be followed by a space or end-of-line to
        // count as a key separator (so `https://x` is not split). The
        // schema never has a bare `key:value`, so enforce the space.
        if (i === body.length - 1 || body.charAt(i + 1) === ' ') {
          return i;
        }
      }
    }
    return -1;
  }

  // Remove a single matched pair of surrounding quotes from a scalar. A
  // lone unmatched quote is a hard error.
  function unquoteScalar(s, human) {
    if (s.length >= 2) {
      var first = s.charAt(0);
      var last = s.charAt(s.length - 1);
      if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
        return s.slice(1, s.length - 1);
      }
    }
    if (s.charAt(0) === '"' || s.charAt(0) === '\'' ||
        s.charAt(s.length - 1) === '"' || s.charAt(s.length - 1) === '\'') {
      throw new Error('YAML line ' + human + ': unbalanced quote in "' + s + '"');
    }
    return s;
  }

  // Parse the value side of a `key: value` line: an inline numeric array,
  // a quoted string, a bare number, or a bare string.
  function parseScalarOrArray(value, human) {
    if (value.charAt(0) === '[') {
      if (value.charAt(value.length - 1) !== ']') {
        throw new Error(
          'YAML line ' + human + ': inline array missing closing "]"'
        );
      }
      var inner = value.slice(1, value.length - 1).replace(/^\s+|\s+$/g, '');
      if (inner === '') {
        return [];
      }
      var parts = inner.split(',');
      var arr = [];
      var i;
      for (i = 0; i < parts.length; i++) {
        var item = parts[i].replace(/^\s+|\s+$/g, '');
        if (item === '') {
          throw new Error(
            'YAML line ' + human + ': empty element in inline array'
          );
        }
        var n = toNumber(item);
        if (n === null) {
          throw new Error(
            'YAML line ' + human + ': inline arrays support numbers only, got "' +
            item + '"'
          );
        }
        arr.push(n);
      }
      return arr;
    }
    // Quoted string — return verbatim contents.
    if (value.charAt(0) === '"' || value.charAt(0) === '\'') {
      return unquoteScalar(value, human);
    }
    // Bare scalar: a number if it parses cleanly, else a string.
    var num = toNumber(value);
    if (num !== null) {
      return num;
    }
    return value;
  }

  // Strict numeric coercion — returns a JS number or null (NOT NaN) so
  // callers can distinguish "not a number" from a real value.
  function toNumber(s) {
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) {
      return null;
    }
    var n = parseFloat(s);
    if (isNaN(n) || !isFinite(n)) {
      return null;
    }
    return n;
  }

  // ── {token.ref} resolution ─────────────────────────────────────────
  //
  // Walks the parsed tree and replaces every scalar string that is wholly
  // a `{a.b.c}` reference with the value it points at. Resolution is
  // recursive (a referenced value may itself be a reference) and is
  // guarded two ways:
  //   - a visited-set rejects literal cycles ({a}->{b}->{a})
  //   - a depth counter rejects chains longer than MAX_REF_DEPTH
  // Resolution happens at parse time so resolveTokens() is a pure lookup.
  function resolveAllRefs(tree) {
    resolveRefsInNode(tree, tree, [], 0);
  }

  function resolveRefsInNode(node, root, path, depth) {
    var key;
    for (key in node) {
      if (!Object.prototype.hasOwnProperty.call(node, key)) {
        continue;
      }
      var val = node[key];
      var here = path.concat([key]);
      if (val !== null && typeof val === 'object' && !isArray(val)) {
        resolveRefsInNode(val, root, here, depth);
      } else if (isArray(val)) {
        // Arrays in the schema are numeric-only; refs inside arrays are
        // not part of the subset, so nothing to resolve. Left explicit
        // so a future change does not silently skip them.
        continue;
      } else if (typeof val === 'string') {
        node[key] = resolveScalarRef(val, root, here.join('.'), []);
      }
    }
  }

  // Resolve one scalar. If it is a `{ref}`, follow it; otherwise return
  // it unchanged. `visited` carries the chain of ref-paths already seen
  // on this resolution so a cycle is caught.
  function resolveScalarRef(value, root, originPath, visited) {
    var m = REF_RE.exec(value);
    if (!m) {
      return value;
    }
    var refPath = m[1];
    if (indexOf(visited, refPath) !== -1) {
      throw new Error(
        'circular token reference: ' +
        visited.concat([refPath]).join(' -> ')
      );
    }
    if (visited.length + 1 > MAX_REF_DEPTH) {
      throw new Error(
        'token reference chain exceeds max depth ' + MAX_REF_DEPTH +
        ': ' + visited.concat([refPath]).join(' -> ')
      );
    }
    var target = lookupPath(root, refPath);
    if (target === undefined) {
      throw new Error(
        'token reference "{' + refPath + '}" (from ' + originPath +
        ') points at a missing key'
      );
    }
    if (typeof target === 'object') {
      throw new Error(
        'token reference "{' + refPath + '}" must point at a scalar, ' +
        'not a map or array'
      );
    }
    if (typeof target === 'string') {
      // The referenced value may itself be a reference — recurse.
      return resolveScalarRef(
        target, root, refPath, visited.concat([refPath])
      );
    }
    // Numeric / boolean target — terminal.
    return target;
  }

  // Walk a dotted path through the tree. Returns undefined if any segment
  // is missing or a non-final segment is not a map.
  function lookupPath(root, dotted) {
    var segs = dotted.split('.');
    var cur = root;
    var i;
    for (i = 0; i < segs.length; i++) {
      if (cur === null || typeof cur !== 'object' || isArray(cur)) {
        return undefined;
      }
      if (!Object.prototype.hasOwnProperty.call(cur, segs[i])) {
        return undefined;
      }
      cur = cur[segs[i]];
    }
    return cur;
  }

  // ── Schema validation ──────────────────────────────────────────────
  //
  // Enforces the canonical visual-communicator v1 schema. Every problem
  // is collected into `errors`; parseDesignMd returns ok:false when the
  // list is non-empty (fail-fast — no partial designmd is handed back).
  function validateSchema(tree, errors) {
    // Reject any top-level key that is neither a required group nor one of
    // the OPTIONAL_GROUPS. A stray `colros:` typo must fail loudly here
    // rather than be silently dropped (fail-fast — no silent defaults).
    var allowedTopLevel = [
      'designmd_version', 'meta', 'colors',
      'typography', 'spacing', 'radius'
    ].concat(OPTIONAL_GROUPS);
    rejectUnknownKeys(tree, allowedTopLevel, '(document root)', errors);

    // designmd_version — must be present and equal to 1.
    if (!has(tree, 'designmd_version')) {
      errors.push('missing required key: designmd_version');
    } else if (tree.designmd_version !== 1) {
      errors.push(
        'designmd_version must be 1, got ' + jsonish(tree.designmd_version)
      );
    }

    // meta — name + default_theme.
    if (!isMap(tree.meta)) {
      errors.push('missing or malformed `meta` map');
    } else {
      if (typeof tree.meta.name !== 'string' || tree.meta.name === '') {
        errors.push('meta.name must be a non-empty string');
      }
      if (tree.meta.default_theme !== 'light' &&
          tree.meta.default_theme !== 'dark') {
        errors.push(
          'meta.default_theme must be "light" or "dark", got ' +
          jsonish(tree.meta.default_theme)
        );
      }
    }

    // colors — light AND dark, each with all 15 roles. Both are required;
    // one is NEVER inferred from the other.
    if (!isMap(tree.colors)) {
      errors.push('missing or malformed `colors` map');
    } else {
      validateThemeColors(tree.colors, 'light', errors);
      validateThemeColors(tree.colors, 'dark', errors);
    }

    // typography.
    if (!isMap(tree.typography)) {
      errors.push('missing or malformed `typography` map');
    } else {
      var t = tree.typography;
      checkString(t, 'font-heading', 'typography.font-heading', errors);
      checkString(t, 'font-body', 'typography.font-body', errors);
      checkString(t, 'font-mono', 'typography.font-mono', errors);
      checkAscendingNumArray(t.scale, 'typography.scale', errors);
      checkPositiveNumber(t, 'weight-regular', 'typography.weight-regular', errors);
      checkPositiveNumber(t, 'weight-medium', 'typography.weight-medium', errors);
      checkPositiveNumber(t, 'weight-bold', 'typography.weight-bold', errors);
      checkPositiveNumber(t, 'line-height', 'typography.line-height', errors);
    }

    // spacing.
    if (!isMap(tree.spacing)) {
      errors.push('missing or malformed `spacing` map');
    } else {
      checkAscendingNumArray(tree.spacing.scale, 'spacing.scale', errors);
    }

    // radius — fixed key set, each a non-negative number.
    if (!isMap(tree.radius)) {
      errors.push('missing or malformed `radius` map');
    } else {
      var ri;
      for (ri = 0; ri < RADIUS_KEYS.length; ri++) {
        checkNonNegNumber(
          tree.radius, RADIUS_KEYS[ri], 'radius.' + RADIUS_KEYS[ri], errors
        );
      }
    }

    // elevation — OPTIONAL group. Absent entirely → fine. Present → each
    // declared shadow key must be a non-empty string.
    if (has(tree, 'elevation')) {
      if (!isMap(tree.elevation)) {
        errors.push('`elevation` is present but is not a map');
      } else {
        checkOptionalStringMap(
          tree.elevation, ['shadow-sm', 'shadow-md', 'shadow-lg'],
          'elevation', errors
        );
      }
    }

    // motion — OPTIONAL group. Durations are numbers, easings are strings.
    if (has(tree, 'motion')) {
      if (!isMap(tree.motion)) {
        errors.push('`motion` is present but is not a map');
      } else {
        var m = tree.motion;
        checkOptionalNumber(m, 'duration-fast', 'motion.duration-fast', errors);
        checkOptionalNumber(m, 'duration-normal', 'motion.duration-normal', errors);
        checkOptionalNumber(m, 'duration-slow', 'motion.duration-slow', errors);
        checkOptionalString(m, 'easing-standard', 'motion.easing-standard', errors);
        checkOptionalString(m, 'easing-accel', 'motion.easing-accel', errors);
        checkOptionalString(m, 'easing-decel', 'motion.easing-decel', errors);
        // Reject keys that are not part of the motion schema so a typo
        // like `duration-meduim` fails loudly instead of being ignored.
        rejectUnknownKeys(m, [
          'duration-fast', 'duration-normal', 'duration-slow',
          'easing-standard', 'easing-accel', 'easing-decel'
        ], 'motion', errors);
      }
    }
  }

  function validateThemeColors(colors, theme, errors) {
    if (!isMap(colors[theme])) {
      errors.push('colors.' + theme + ' is missing or not a map');
      return;
    }
    var themeMap = colors[theme];
    var i;
    for (i = 0; i < COLOR_ROLES.length; i++) {
      var role = COLOR_ROLES[i];
      if (!has(themeMap, role)) {
        errors.push('colors.' + theme + '.' + role + ' is missing');
      } else if (typeof themeMap[role] !== 'string' || themeMap[role] === '') {
        errors.push(
          'colors.' + theme + '.' + role +
          ' must be a non-empty color string, got ' + jsonish(themeMap[role])
        );
      }
    }
    // A role not in the canonical set is a typo — fail loudly.
    rejectUnknownKeys(themeMap, COLOR_ROLES, 'colors.' + theme, errors);
  }

  // ── small validation helpers ───────────────────────────────────────

  function checkString(obj, key, label, errors) {
    if (!has(obj, key) || typeof obj[key] !== 'string' || obj[key] === '') {
      errors.push(label + ' must be a non-empty string');
    }
  }

  function checkOptionalString(obj, key, label, errors) {
    if (has(obj, key) && (typeof obj[key] !== 'string' || obj[key] === '')) {
      errors.push(label + ' (when present) must be a non-empty string');
    }
  }

  function checkOptionalStringMap(obj, keys, groupLabel, errors) {
    var i;
    for (i = 0; i < keys.length; i++) {
      checkOptionalString(obj, keys[i], groupLabel + '.' + keys[i], errors);
    }
    rejectUnknownKeys(obj, keys, groupLabel, errors);
  }

  function checkPositiveNumber(obj, key, label, errors) {
    if (!has(obj, key)) {
      errors.push(label + ' is missing');
    } else if (typeof obj[key] !== 'number' || obj[key] <= 0) {
      errors.push(label + ' must be a positive number, got ' + jsonish(obj[key]));
    }
  }

  function checkNonNegNumber(obj, key, label, errors) {
    if (!has(obj, key)) {
      errors.push(label + ' is missing');
    } else if (typeof obj[key] !== 'number' || obj[key] < 0) {
      errors.push(
        label + ' must be a non-negative number, got ' + jsonish(obj[key])
      );
    }
  }

  function checkOptionalNumber(obj, key, label, errors) {
    if (has(obj, key) && (typeof obj[key] !== 'number' || obj[key] < 0)) {
      errors.push(
        label + ' (when present) must be a non-negative number, got ' +
        jsonish(obj[key])
      );
    }
  }

  function checkAscendingNumArray(value, label, errors) {
    if (!isArray(value)) {
      errors.push(label + ' must be an inline numeric array');
      return;
    }
    if (value.length === 0) {
      errors.push(label + ' must not be empty');
      return;
    }
    var i;
    for (i = 0; i < value.length; i++) {
      if (typeof value[i] !== 'number' || value[i] < 0) {
        errors.push(
          label + '[' + i + '] must be a non-negative number, got ' +
          jsonish(value[i])
        );
        return;
      }
      if (i > 0 && value[i] <= value[i - 1]) {
        errors.push(
          label + ' must be strictly ascending — ' + label + '[' + i +
          '] (' + value[i] + ') <= ' + label + '[' + (i - 1) + '] (' +
          value[i - 1] + ')'
        );
        return;
      }
    }
  }

  function rejectUnknownKeys(obj, allowed, groupLabel, errors) {
    var key;
    for (key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) {
        continue;
      }
      if (indexOf(allowed, key) === -1) {
        errors.push(
          'unknown key "' + key + '" in `' + groupLabel +
          '` is not part of the DESIGN.md v1 schema'
        );
      }
    }
  }

  // ── parseDesignMd ──────────────────────────────────────────────────

  function parseDesignMd(text) {
    var errors = [];
    var split;
    var tree;
    try {
      split = splitFrontmatter(text);
    } catch (e) {
      return { ok: false, designmd: null, errors: [errMsg(e)] };
    }
    try {
      tree = parseYamlSubset(split.yaml);
    } catch (e) {
      return { ok: false, designmd: null, errors: [errMsg(e)] };
    }
    // Resolve {token.refs} before validation so validation sees concrete
    // values. A bad reference is itself a fatal parse error.
    try {
      resolveAllRefs(tree);
    } catch (e) {
      return { ok: false, designmd: null, errors: [errMsg(e)] };
    }
    validateSchema(tree, errors);
    if (errors.length > 0) {
      // Fail-fast: never hand back a partially-valid designmd.
      return { ok: false, designmd: null, errors: errors };
    }
    var designmd = {
      version: tree.designmd_version,
      meta: tree.meta,
      tokens: tree,        // the full resolved token tree
      prose: split.prose   // the human-readable markdown body, verbatim
    };
    return { ok: true, designmd: designmd, errors: [] };
  }

  // ── resolveTokens ──────────────────────────────────────────────────
  //
  // Pure function: maps a parsed designmd + a theme to the flat
  // `{ '--vc-*': '<value>' }` object the runtime applies. Only the ACTIVE
  // theme's colors are emitted; switching theme = call this again.
  function resolveTokens(designmd, theme) {
    if (!designmd || typeof designmd !== 'object' || !designmd.tokens) {
      throw new Error('resolveTokens: designmd is not a parsed DESIGN.md');
    }
    if (theme !== 'light' && theme !== 'dark') {
      throw new Error('resolveTokens: theme must be "light" or "dark"');
    }
    var tokens = designmd.tokens;
    var out = {};
    var i;

    // Colors — active theme only.
    var themeColors = tokens.colors[theme];
    if (!isMap(themeColors)) {
      // parseDesignMd validates this, but resolveTokens is public — guard.
      throw new Error('resolveTokens: colors.' + theme + ' is missing');
    }
    for (i = 0; i < COLOR_ROLES.length; i++) {
      var role = COLOR_ROLES[i];
      out['--vc-color-' + role] = String(themeColors[role]);
    }

    // Typography — fonts, scale (indexed px), weights, line-height.
    var ty = tokens.typography;
    out['--vc-font-heading'] = String(ty['font-heading']);
    out['--vc-font-body'] = String(ty['font-body']);
    out['--vc-font-mono'] = String(ty['font-mono']);
    for (i = 0; i < ty.scale.length; i++) {
      out['--vc-text-' + i] = ty.scale[i] + 'px';
    }
    out['--vc-weight-regular'] = String(ty['weight-regular']);
    out['--vc-weight-medium'] = String(ty['weight-medium']);
    out['--vc-weight-bold'] = String(ty['weight-bold']);
    out['--vc-line-height'] = String(ty['line-height']);

    // Spacing — indexed px scale.
    for (i = 0; i < tokens.spacing.scale.length; i++) {
      out['--vc-space-' + i] = tokens.spacing.scale[i] + 'px';
    }

    // Radius — fixed keys, px (full → 9999px).
    for (i = 0; i < RADIUS_KEYS.length; i++) {
      out['--vc-radius-' + RADIUS_KEYS[i]] = tokens.radius[RADIUS_KEYS[i]] + 'px';
    }

    // Elevation — optional. Emit only the shadow keys actually present.
    if (isMap(tokens.elevation)) {
      emitOptional(tokens.elevation, 'shadow-sm', '--vc-shadow-sm', '', out);
      emitOptional(tokens.elevation, 'shadow-md', '--vc-shadow-md', '', out);
      emitOptional(tokens.elevation, 'shadow-lg', '--vc-shadow-lg', '', out);
    }

    // Motion — optional. Durations get a `ms` unit, easings are verbatim.
    if (isMap(tokens.motion)) {
      emitOptional(tokens.motion, 'duration-fast', '--vc-duration-fast', 'ms', out);
      emitOptional(tokens.motion, 'duration-normal', '--vc-duration-normal', 'ms', out);
      emitOptional(tokens.motion, 'duration-slow', '--vc-duration-slow', 'ms', out);
      emitOptional(tokens.motion, 'easing-standard', '--vc-easing-standard', '', out);
      emitOptional(tokens.motion, 'easing-accel', '--vc-easing-accel', '', out);
      emitOptional(tokens.motion, 'easing-decel', '--vc-easing-decel', '', out);
    }

    return out;
  }

  // Emit one optional token only when the source key exists.
  function emitOptional(srcMap, srcKey, cssVar, unit, out) {
    if (has(srcMap, srcKey)) {
      out[cssVar] = String(srcMap[srcKey]) + unit;
    }
  }

  // ── applyTokens ────────────────────────────────────────────────────
  //
  // Sets every `--vc-*` pair on `rootEl.style` (defaults to the document
  // root so the vars cascade to the whole page). Returns rootEl so calls
  // can be chained. A theme swap is just resolveTokens + applyTokens.
  function applyTokens(cssVarMap, rootEl) {
    if (!cssVarMap || typeof cssVarMap !== 'object') {
      throw new Error('applyTokens: cssVarMap must be an object');
    }
    var el = rootEl;
    if (!el) {
      if (typeof document === 'undefined' || !document.documentElement) {
        throw new Error(
          'applyTokens: no rootEl given and no document is available'
        );
      }
      el = document.documentElement;
    }
    if (!el.style || typeof el.style.setProperty !== 'function') {
      throw new Error('applyTokens: rootEl has no style.setProperty');
    }
    var key;
    for (key in cssVarMap) {
      if (Object.prototype.hasOwnProperty.call(cssVarMap, key)) {
        el.style.setProperty(key, String(cssVarMap[key]));
      }
    }
    return el;
  }

  // ── serializeDesignMd ──────────────────────────────────────────────
  //
  // Round-trips a parsed designmd back to `---\n<yaml>\n---\n\n<prose>`
  // text. The Phase-1b style controller edits the token tree in memory
  // then calls this to persist. The emitted YAML uses the same 2-space
  // indentation and key order the schema documents, so a parse → mutate →
  // serialize → parse cycle is stable.
  function serializeDesignMd(designmd) {
    if (!designmd || typeof designmd !== 'object' || !designmd.tokens) {
      throw new Error('serializeDesignMd: designmd is not a parsed DESIGN.md');
    }
    var t = designmd.tokens;
    var lines = ['---'];

    lines.push('designmd_version: ' + emitScalar(t.designmd_version));

    lines.push('meta:');
    lines.push('  name: ' + emitScalar(t.meta.name));
    lines.push('  default_theme: ' + emitScalar(t.meta.default_theme));

    lines.push('colors:');
    serializeThemeColors(lines, t.colors, 'light');
    serializeThemeColors(lines, t.colors, 'dark');

    lines.push('typography:');
    lines.push('  font-heading: ' + emitScalar(t.typography['font-heading']));
    lines.push('  font-body: ' + emitScalar(t.typography['font-body']));
    lines.push('  font-mono: ' + emitScalar(t.typography['font-mono']));
    lines.push('  scale: ' + emitArray(t.typography.scale));
    lines.push('  weight-regular: ' + emitScalar(t.typography['weight-regular']));
    lines.push('  weight-medium: ' + emitScalar(t.typography['weight-medium']));
    lines.push('  weight-bold: ' + emitScalar(t.typography['weight-bold']));
    lines.push('  line-height: ' + emitScalar(t.typography['line-height']));

    lines.push('spacing:');
    lines.push('  scale: ' + emitArray(t.spacing.scale));

    lines.push('radius:');
    var ri;
    for (ri = 0; ri < RADIUS_KEYS.length; ri++) {
      lines.push('  ' + RADIUS_KEYS[ri] + ': ' +
                 emitScalar(t.radius[RADIUS_KEYS[ri]]));
    }

    if (isMap(t.elevation)) {
      lines.push('elevation:');
      serializeOptionalMap(lines, t.elevation,
        ['shadow-sm', 'shadow-md', 'shadow-lg']);
    }

    if (isMap(t.motion)) {
      lines.push('motion:');
      serializeOptionalMap(lines, t.motion, [
        'duration-fast', 'duration-normal', 'duration-slow',
        'easing-standard', 'easing-accel', 'easing-decel'
      ]);
    }

    lines.push('---');
    var prose = (typeof designmd.prose === 'string') ? designmd.prose : '';
    // One blank line between the closing fence and the prose body — the
    // exact separator splitFrontmatter() consumes, so round-trips match.
    return lines.join('\n') + '\n\n' + prose;
  }

  function serializeThemeColors(lines, colors, theme) {
    lines.push('  ' + theme + ':');
    var i;
    for (i = 0; i < COLOR_ROLES.length; i++) {
      var role = COLOR_ROLES[i];
      lines.push('    ' + role + ': ' + emitScalar(colors[theme][role]));
    }
  }

  function serializeOptionalMap(lines, map, keys) {
    var i;
    for (i = 0; i < keys.length; i++) {
      if (has(map, keys[i])) {
        lines.push('  ' + keys[i] + ': ' + emitScalar(map[keys[i]]));
      }
    }
  }

  // Emit a scalar for YAML output. Numbers go bare; strings are quoted
  // when they contain a character that would break the parse (colon,
  // leading/trailing space, comment hash, quote, bracket) or would be
  // mis-read as a number — otherwise emitted bare.
  function emitScalar(v) {
    if (typeof v === 'number') {
      return String(v);
    }
    var s = String(v);
    var needsQuote =
      s === '' ||
      /[:#\[\]'"]/.test(s) ||
      /^\s|\s$/.test(s) ||
      toNumber(s) !== null;
    if (!needsQuote) {
      return s;
    }
    // Prefer double quotes; escape any embedded double quote.
    return '"' + s.replace(/"/g, '\\"') + '"';
  }

  function emitArray(arr) {
    var parts = [];
    var i;
    for (i = 0; i < arr.length; i++) {
      parts.push(String(arr[i]));
    }
    return '[' + parts.join(', ') + ']';
  }

  // ── generic helpers ────────────────────────────────────────────────

  function isArray(v) {
    return Object.prototype.toString.call(v) === '[object Array]';
  }

  function isMap(v) {
    return v !== null && typeof v === 'object' && !isArray(v);
  }

  function has(obj, key) {
    return isMap(obj) && Object.prototype.hasOwnProperty.call(obj, key);
  }

  function indexOf(arr, v) {
    var i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i] === v) {
        return i;
      }
    }
    return -1;
  }

  // Compact value rendering for error messages — quotes strings, prints
  // numbers/booleans bare, names maps/arrays by kind.
  function jsonish(v) {
    if (v === null) {
      return 'null';
    }
    if (v === undefined) {
      return 'undefined';
    }
    if (typeof v === 'string') {
      return '"' + v + '"';
    }
    if (isArray(v)) {
      return '[array]';
    }
    if (typeof v === 'object') {
      return '{map}';
    }
    return String(v);
  }

  function errMsg(e) {
    return (e && e.message) ? String(e.message) : String(e);
  }

  // ── export ─────────────────────────────────────────────────────────

  var api = {
    parseDesignMd: parseDesignMd,
    resolveTokens: resolveTokens,
    applyTokens: applyTokens,
    serializeDesignMd: serializeDesignMd,
    tokenSchema: tokenSchema
  };

  // Browser global.
  if (typeof window !== 'undefined') {
    window.amvcpDesignMd = api;
  }
  // Node / CommonJS (test harness).
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
