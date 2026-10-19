import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkHostCss } from '../src/guard.js';

// The stylesheet is the one look (spec D2): every size and geometry lives in src/styles.css, so these pin the values that make the chip and drawer identical in
// every app. The lookup is deliberately tiny — the sheet has no media queries and no nesting, so a rule is `selectors { declarations }` and nothing more.
const root = fileURLToPath(new URL('..', import.meta.url));
const sheet = readFileSync(join(root, 'src/styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selectors: m[1].split(',').map((s) => s.trim()), body: m[2] }));

// Every declaration block whose selector list names `selector` exactly, joined — a property may be split across two rules that share the selector.
const body = (selector: string): string => rules.filter((r) => r.selectors.includes(selector)).map((r) => r.body).join(';');
const decl = (selector: string, prop: string): string[] =>
  [...body(selector).matchAll(new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;]+)`, 'g'))].map((m) => m[1].trim());

it('the rule lookup finds what it is asked for and nothing else', () => {
  assert.ok(body('.uk-chip').length > 0);
  assert.equal(body('.uk-no-such-class'), '');
  assert.deepEqual(decl('.uk-no-such-class', 'color'), []);
});

it('.uk-chip is the one pill: 999px radius, 28px tall, a chip-bg fill and a hairline border', () => {
  assert.deepEqual(decl('.uk-chip', 'border-radius'), ['999px']);
  assert.deepEqual(decl('.uk-chip', 'min-height'), ['28px']);
  assert.match(decl('.uk-chip', 'background')[0] ?? '', /^var\(--uk-chip-bg, .+\)$/);
  assert.match(decl('.uk-chip', 'border')[0] ?? '', /--uk-hairline/);
  assert.deepEqual(decl('.uk-chip', 'position'), ['relative']);
});

it('.uk-chip:hover changes the ink only — the border stays the hairline', () => {
  const hover = body('.uk-chip:hover');
  assert.match(hover, /color:\s*var\(--uk-ink,/);
  assert.doesNotMatch(hover, /border/);
});

it('.uk-drawer divides its viewport units by --uk-zoom, and declares vh before dvh', () => {
  const heights = decl('.uk-drawer', 'height');
  assert.equal(heights.length, 2, 'one 100vh fallback, one 100dvh');
  assert.match(heights[0], /vh\b/);
  assert.match(heights[1], /dvh\b/);
  for (const h of heights) assert.match(h, /var\(--uk-zoom, 1\)/);
  assert.match(decl('.uk-drawer', 'width')[0] ?? '', /var\(--uk-zoom, 1\)/);
});

it('.uk-drawer--narrow is the whole screen with no border and no shadow', () => {
  assert.deepEqual(decl('.uk-drawer--narrow', 'box-shadow'), ['none']);
  assert.deepEqual(decl('.uk-drawer--narrow', 'border-left'), ['0']);
  assert.match(decl('.uk-drawer--narrow', 'width')[0] ?? '', /var\(--uk-zoom, 1\)/);
});

// A host page with `viewport-fit=cover` (an iPhone PWA) draws under the notch and the home indicator; the full-screen drawer keeps its own spacing on top
// of each edge's inset, and env() falls back to 0 where a browser has no insets, so every other layout is unchanged.
it('.uk-drawer--narrow adds each safe-area inset to its own padding on that edge', () => {
  const sides = { top: '20px', right: '16px', bottom: '20px', left: '16px' } as const;
  for (const [side, base] of Object.entries(sides)) {
    assert.deepEqual(decl('.uk-drawer--narrow', `padding-${side}`), [`calc(${base} + env(safe-area-inset-${side}, 0px))`], side);
  }
});

it('.uk-drawer-close keeps clear of the notch on the top and right edges', () => {
  assert.deepEqual(decl('.uk-drawer-close', 'top'), ['calc(16px + env(safe-area-inset-top, 0px))']);
  assert.deepEqual(decl('.uk-drawer-close', 'right'), ['calc(16px + env(safe-area-inset-right, 0px))']);
});

it('.uk-releases-notes h3 is 13px, 600', () => {
  assert.deepEqual(decl('.uk-releases-notes h3', 'font-size'), ['13px']);
  assert.deepEqual(decl('.uk-releases-notes h3', 'font-weight'), ['600']);
});

it('the notes first child sits flush, and em and strong inherit colour', () => {
  assert.deepEqual(decl('.uk-releases-notes > :first-child', 'margin-top'), ['0']);
  assert.deepEqual(decl('.uk-releases-notes em', 'color'), ['inherit']);
  assert.deepEqual(decl('.uk-releases-notes strong', 'color'), ['inherit']);
});

it('.uk-releases-badge is weight 500', () => {
  assert.deepEqual(decl('.uk-releases-badge', 'font-weight'), ['500']);
});

it('the baseline row draws a hairline rule on each side of its label', () => {
  assert.ok(body('.uk-releases-base::before').length > 0, '.uk-releases-base::before is missing');
  assert.ok(body('.uk-releases-base::after').length > 0, '.uk-releases-base::after is missing');
  assert.match(body('.uk-releases-base::before'), /--uk-hairline/);
});

it('the narrow chip carries a transparent 44px hit area that does not grow the pill', () => {
  assert.deepEqual(decl('.uk-chip--narrow::before', 'min-height'), ['44px']);
  assert.deepEqual(decl('.uk-chip--narrow::before', 'min-width'), ['44px']);
  assert.deepEqual(decl('.uk-chip--narrow::before', 'width'), ['100%'], 'a pill wider than 44px keeps a hit area at least as wide as itself');
  assert.deepEqual(decl('.uk-chip--narrow::before', 'left'), ['50%'], 'centred on the pill, so a short label is not hit-tested off-centre');
  assert.deepEqual(decl('.uk-chip--narrow::before', 'position'), ['absolute']);
  assert.deepEqual(decl('.uk-chip--narrow::before', 'top'), ['50%'], 'centred vertically on the 28px pill, so the 44px box overhangs it evenly');
  assert.deepEqual(decl('.uk-chip--narrow::before', 'transform'), ['translate(-50%, -50%)'], 'the translate is what centres the box on both axes');
  assert.ok(!/min-height/.test(body('.uk-chip--narrow')), 'the pill itself stays 28px');
});

it('playground/themes.css is a host too: it maps tokens and restyles nothing', () => {
  assert.deepEqual(checkHostCss(readFileSync(join(root, 'playground/themes.css'), 'utf8')), []);
});
