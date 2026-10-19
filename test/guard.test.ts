import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkHostCss, PUBLIC_TOKENS } from '../src/guard.js';

// One case per rule of the contract: an app may map --uk-* tokens and nothing else, and never target a .uk-* class (spec D1).
describe('checkHostCss', () => {
  const only = (css: string, needle: string): void => {
    const found = checkHostCss(css);
    assert.equal(found.length, 1, JSON.stringify(found));
    assert.ok(found[0].includes(needle), `${JSON.stringify(found[0])} does not name ${needle}`);
  };

  it('passes a :root that only maps public tokens', () => {
    assert.deepEqual([], checkHostCss(':root { --uk-ink: var(--ink); --uk-zoom: var(--font-scale, 1) }'));
  });

  it('passes a .uk-* selector list whose every declaration is a --uk-* custom property', () => {
    assert.deepEqual([], checkHostCss('.uk-chip,.uk-drawer-scrim { --uk-ink: var(--ink) }'));
  });

  it('reports a .uk-* rule that restyles', () => {
    only('.uk-chip { color: red }', '.uk-chip');
  });

  it('reports one message for a .uk-* selector list that mixes a token with a restyle', () => {
    assert.equal(checkHostCss('.uk-chip,.uk-drawer-scrim { --uk-ink: var(--ink); color: red }').length, 1);
  });

  it('reports a .uk-* class reached through a host ancestor', () => {
    only('.rail .uk-chip-dot { width: 9px }', '.uk-chip-dot');
  });

  it('reports a .uk-* class under a descendant element', () => {
    assert.equal(checkHostCss('.uk-releases-notes h3 { font-size: 13px }').length, 1);
  });

  it('descends into @media', () => {
    assert.equal(checkHostCss('@media (max-width: 639px) { .uk-drawer { width: 100% } }').length, 1);
  });

  it('descends into @supports inside @media', () => {
    assert.equal(checkHostCss('@media print { @supports (display: grid) { .uk-drawer { display: none } } }').length, 1);
  });

  it('reports a --uk-* property that is not public', () => {
    only(':root { --uk-font-size-lg: 19px }', '--uk-font-size-lg');
  });

  it('reports a private token even when it is set inside a .uk-* rule', () => {
    only('.uk-chip { --uk-radius: 4px }', '--uk-radius');
  });

  it('ignores a host class that has no uk- class in it', () => {
    assert.deepEqual([], checkHostCss('.rail-version-slot { margin-top: auto }'));
  });

  it('ignores a commented-out rule', () => {
    assert.deepEqual([], checkHostCss('/* .uk-chip { color: red } */ .a { color: red }'));
  });

  it('does not match a class that merely contains uk-', () => {
    assert.deepEqual([], checkHostCss('.duck-chip { color: red }'));
  });

  it('reports chained .uk-* classes', () => {
    assert.equal(checkHostCss('.uk-drawer.uk-drawer--narrow { padding: 0 }').length, 1);
  });

  it('is not confused by braces, semicolons and colons inside strings and url()', () => {
    assert.deepEqual([], checkHostCss('.a { background: url("data:image/svg+xml;utf8,<svg>{}</svg>"); content: "}" } :root { --uk-ink: #111 }'));
    only('.a { content: "{" } .uk-chip { color: red }', '.uk-chip');
  });

  it('reports a rule nested inside a .uk-* rule', () => {
    assert.equal(checkHostCss('.uk-chip { --uk-ink: red; &:hover { color: blue } }').length, 1);
  });

  it('reports a declaration inside an @media nested in a .uk-* rule', () => {
    assert.equal(checkHostCss('.uk-chip { @media print { color: red } }').length, 1);
  });

  it('reports a multi-line grouped selector on one line, whitespace collapsed', () => {
    const [message] = checkHostCss('.rail .uk-chip,\n  .rail .uk-chip-dot\n{ color: red }');
    assert.ok(!/[\r\n]/.test(message), JSON.stringify(message));
    assert.ok(message.startsWith('.rail .uk-chip, .rail .uk-chip-dot restyles'), JSON.stringify(message));
  });

  it('returns [] for an empty sheet', () => {
    assert.deepEqual([], checkHostCss(''));
  });
});

describe('PUBLIC_TOKENS', () => {
  it('lists the 22 tokens an app may map', () => {
    assert.equal(PUBLIC_TOKENS.length, 22);
    assert.equal(new Set(PUBLIC_TOKENS).size, 22);
    assert.ok(PUBLIC_TOKENS.includes('--uk-chip-bg') && PUBLIC_TOKENS.includes('--uk-zoom'));
    assert.ok(!PUBLIC_TOKENS.includes('--uk-radius'));
  });
});
