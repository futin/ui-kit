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

  it('empty notes render nothing', () => {
    assert.equal(renderNotesHtml(''), '');
  });
});
