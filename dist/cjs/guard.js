"use strict";
// Dev-only: the checker an app runs over its own stylesheets (`expect(checkHostCss(css)).toEqual([])`). It is its own package entry (`ui-kit/guard`),
// deliberately not re-exported from index.ts, so it never reaches an app's client bundle — and it imports nothing, not React and not the rest of the kit.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_TOKENS = void 0;
exports.checkHostCss = checkHostCss;
// The one source of truth for what an app may set (spec D1). src/styles.css reads exactly these and the README §Tokens lists exactly these.
exports.PUBLIC_TOKENS = [
    '--uk-panel-bg', '--uk-ink', '--uk-ink-muted', '--uk-hairline', '--uk-scrim', '--uk-shadow', '--uk-accent', '--uk-hover-bg', '--uk-code-bg',
    '--uk-chip-bg', '--uk-feat-ink', '--uk-feat-tint', '--uk-fix-ink', '--uk-fix-tint', '--uk-perf-ink', '--uk-perf-tint', '--uk-breaking-ink',
    '--uk-breaking-tint', '--uk-font', '--uk-font-mono', '--uk-z', '--uk-zoom',
];
// A hand splitter rather than a CSS parser: it only has to find where blocks and declarations start and end. Braces, semicolons and colons inside a string or
// a parenthesis (`url(data:…;…)`, `content: "}"`) belong to the value, so those two are tracked and nothing else is.
function split(text) {
    const items = [];
    let buf = '';
    let quote = '';
    let parens = 0;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quote) {
            buf += c;
            if (c === '\\' && i + 1 < text.length)
                buf += text[++i];
            else if (c === quote)
                quote = '';
        }
        else if (c === '"' || c === "'") {
            quote = c;
            buf += c;
        }
        else if (c === '(') {
            parens++;
            buf += c;
        }
        else if (c === ')') {
            parens = Math.max(0, parens - 1);
            buf += c;
        }
        else if (c === '{' && parens === 0) {
            const end = matching(text, i);
            items.push({ kind: 'block', prelude: buf.trim(), body: text.slice(i + 1, end) });
            buf = '';
            i = end;
        }
        else if (c === ';' && parens === 0) {
            if (buf.trim())
                items.push({ kind: 'decl', text: buf });
            buf = '';
        }
        else {
            buf += c;
        }
    }
    if (buf.trim())
        items.push({ kind: 'decl', text: buf });
    return items;
}
// Index of the `}` closing the block opened at `open`, or the end of the text when the sheet is cut short — a half-written sheet is still checked.
function matching(text, open) {
    let depth = 0;
    let quote = '';
    for (let i = open; i < text.length; i++) {
        const c = text[i];
        if (quote) {
            if (c === '\\')
                i++;
            else if (c === quote)
                quote = '';
        }
        else if (c === '"' || c === "'")
            quote = c;
        else if (c === '{')
            depth++;
        else if (c === '}' && --depth === 0)
            return i;
    }
    return text.length;
}
// `\.uk-` needs the dot, so `.duck-chip` and an attribute value like `[data-x="uk-y"]` are not hits. A class is hit wherever it sits in the selector.
const UK_CLASS = /\.uk-[\w-]+/g;
// A rule that only maps tokens is the sanctioned way to scope a token to a region; any other property restyles a kit class.
function restyle(selector, body, out) {
    const names = split(body)
        .filter((i) => i.kind === 'decl')
        .map((d) => d.text.slice(0, Math.max(d.text.indexOf(':'), 0)).trim());
    const others = names.filter((n) => n && !n.startsWith('--uk-'));
    if (others.length)
        out.push(`${selector} restyles a ui-kit class (${others.join(', ')}) — map --uk-* tokens instead`);
}
function walk(css, inUk, out) {
    const items = split(css);
    for (const item of items) {
        if (item.kind === 'decl') {
            const colon = item.text.indexOf(':');
            const prop = colon < 0 ? '' : item.text.slice(0, colon).trim();
            if (prop.startsWith('--uk-') && !exports.PUBLIC_TOKENS.includes(prop))
                out.push(`${prop} is not a public ui-kit token — an app may only set the ${exports.PUBLIC_TOKENS.length} listed in PUBLIC_TOKENS`);
            continue;
        }
        if (item.prelude.startsWith('@')) {
            // @media, @supports, @layer, … hold more rules; @font-face and friends hold declarations only, which the walk reads the same way. Nested in a .uk-* rule
            // (CSS nesting) the block's own declarations restyle that rule, so they are checked against it.
            if (inUk)
                restyle(inUk, item.body, out);
            walk(item.body, inUk, out);
            continue;
        }
        const classes = item.prelude.match(UK_CLASS);
        const selector = inUk ? `${inUk} ${item.prelude}` : item.prelude;
        if (classes || inUk)
            restyle(selector, item.body, out);
        walk(item.body, classes || inUk ? selector : '', out);
    }
}
// One human-readable message per violation, [] when the sheet is clean. A rule is reported when its selector names a `.uk-*` class and it declares anything
// but `--uk-*` custom properties; separately, any `--uk-*` property that is not in PUBLIC_TOKENS is reported wherever it appears.
function checkHostCss(css) {
    const out = [];
    walk(css.replace(/\/\*[\s\S]*?\*\//g, ''), '', out);
    return out;
}
