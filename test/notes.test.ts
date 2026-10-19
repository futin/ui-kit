import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderNotesHtml } from '../src/index.js';

const anchors = (html: string): string[] => html.match(/<a\b[^>]*>/g) ?? [];

describe('renderNotesHtml', () => {
  it('escapes a <script> to its own text', () => {
    const html = renderNotesHtml('<script>alert(1)</script>');
    assert.ok(html.includes('&lt;script&gt;'), html);
    assert.ok(!html.includes('<script'), html);
  });

  it('escapes an <img onerror>', () => {
    assert.ok(!renderNotesHtml('<img src=x onerror=alert(1)>').includes('<img'));
  });

  it('a javascript: link is not a link', () => {
    const html = renderNotesHtml('[x](javascript:alert(1))');
    assert.ok(!html.includes('<a'), html);
    assert.equal(html, '<p>[x](javascript:alert(1))</p>');
  });

  it('an https link opens in a new tab with noopener noreferrer', () => {
    const html = renderNotesHtml('[docs](https://e.com/a)');
    assert.deepEqual(anchors(html), ['<a href="https://e.com/a" target="_blank" rel="noopener noreferrer">']);
    assert.ok(html.includes('<a href="https://e.com/a" target="_blank" rel="noopener noreferrer">docs</a>'), html);
  });

  it('a quote in the url stays inside the href', () => {
    const html = renderNotesHtml('[q](https://e.com/"onmouseover="x)');
    assert.deepEqual(anchors(html), ['<a href="https://e.com/&quot;onmouseover=&quot;x" target="_blank" rel="noopener noreferrer">']);
    assert.ok(!/onmouseover="/.test(html), html);
  });

  it('parens in the text and & in the url stay inside one anchor', () => {
    const html = renderNotesHtml('[a (b)](https://e.com/?x=1&y=2)');
    assert.equal(html, '<p><a href="https://e.com/?x=1&amp;y=2" target="_blank" rel="noopener noreferrer">a (b)</a></p>');
  });

  it('bold markers inside a url are not turned into markup', () => {
    const html = renderNotesHtml('[x](https://e.com/**a**/**b**)');
    assert.equal(html, '<p><a href="https://e.com/**a**/**b**" target="_blank" rel="noopener noreferrer">x</a></p>');
  });

  it('bullets become a list', () => {
    assert.equal(renderNotesHtml('- one\n- two'), '<ul><li>one</li><li>two</li></ul>');
    assert.equal(renderNotesHtml('Two things:\n\n- one\n* two'), '<p>Two things:</p><ul><li>one</li><li>two</li></ul>');
  });

  it('code, bold, line breaks and paragraphs', () => {
    assert.equal(renderNotesHtml('`a<b`'), '<p><code>a&lt;b</code></p>');
    assert.equal(renderNotesHtml('**bold**'), '<p><strong>bold</strong></p>');
    assert.equal(renderNotesHtml('a\nb\n\nc'), '<p>a<br>b</p><p>c</p>');
    assert.equal(renderNotesHtml('`**not bold**`'), '<p><code>**not bold**</code></p>');
  });

  it('### is an h3 that ends a paragraph and is its own block', () => {
    assert.equal(renderNotesHtml('### Fixed'), '<h3>Fixed</h3>');
    assert.equal(renderNotesHtml('### Fixed\nthe chip'), '<h3>Fixed</h3><p>the chip</p>');
    assert.equal(renderNotesHtml('intro\n### Fixed'), '<p>intro</p><h3>Fixed</h3>');
    assert.equal(renderNotesHtml('- a\n### B\n- c'), '<ul><li>a</li></ul><h3>B</h3><ul><li>c</li></ul>');
    assert.equal(renderNotesHtml('### <script>x</script>'), '<h3>&lt;script&gt;x&lt;/script&gt;</h3>');
  });

  it('only ### is a heading: #, ##, #### and ###nospace stay text', () => {
    assert.equal(renderNotesHtml('## What\'s new'), '<p>## What&#39;s new</p>');
    assert.equal(renderNotesHtml('# top'), '<p># top</p>');
    assert.equal(renderNotesHtml('#### deep'), '<p>#### deep</p>');
    assert.equal(renderNotesHtml('###nospace'), '<p>###nospace</p>');
  });

  it('_em_ is emphasis at word boundaries only', () => {
    assert.equal(renderNotesHtml('_em_ here'), '<p><em>em</em> here</p>');
    assert.equal(renderNotesHtml('snake_case_name'), '<p>snake_case_name</p>');
    assert.equal(renderNotesHtml('a_b_ c'), '<p>a_b_ c</p>');
  });

  it('** is bold at word boundaries only', () => {
    assert.equal(renderNotesHtml('x**y**z'), '<p>x**y**z</p>');
    assert.equal(renderNotesHtml('**bold** word'), '<p><strong>bold</strong> word</p>');
  });

  it('emphasis is left alone inside code spans and urls', () => {
    assert.equal(renderNotesHtml('`_not_em_`'), '<p><code>_not_em_</code></p>');
    const html = renderNotesHtml('[a_b_c](https://x.dev/a_b_)');
    assert.deepEqual(anchors(html), ['<a href="https://x.dev/a_b_" target="_blank" rel="noopener noreferrer">']);
    assert.ok(html.includes('>a_b_c</a>'), html);
    assert.ok(!html.includes('<em>'), html);
  });

  it('empty notes render nothing', () => {
    assert.equal(renderNotesHtml(''), '');
  });
});
