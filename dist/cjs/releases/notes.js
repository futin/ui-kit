"use strict";
// The default notes renderer (release-kit spec D14): a release's notes — the PR body's `## What's new` section — as HTML safe to set with no app sanitiser
// behind it. Ported from guide-manager's escape-first renderer (client/src/lib/releases.ts `renderNotes`), minus its `sanitizeSnapshot` pass: every link is
// built here with `target="_blank" rel="noopener noreferrer"` instead.
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderNotesHtml = renderNotesHtml;
function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// Over ALREADY escaped text, so a `"` in the url is `&quot;` by now and cannot close the href. Only http(s) matches: a `javascript:` link stays text.
const LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/;
// Word boundaries, so `snake_case_name`, `a_b_ c` and `x**y**z` stay text: an opener sits at the line start or after a non-word character and is followed by
// a non-space; a closer follows a non-space and sits at the line end or before a non-word character. `\w` counts `_` as a word character on purpose.
const BOLD = /(?<!\w)\*\*(?=\S)([^*\n]+?)(?<=\S)\*\*(?!\w)/g;
const EM = /(?<!\w)_(?=\S)([^_\n]+?)(?<=\S)_(?!\w)/g;
const BULLET = /^\s*[-*] +/;
// Exactly three hashes and a space: `#`, `##` and `####` are not headings the notes use, so they show as the literal text they are.
const H3 = /^###\s+(\S.*)$/;
const emphasis = (text) => text.replace(BOLD, '<strong>$1</strong>').replace(EM, '<em>$1</em>');
/** One line's inline markup, over text that is ALREADY escaped: `code` spans first and left alone, then links, then bold and emphasis outside the hrefs. */
function inline(escaped) {
    return escaped
        .split(/(`[^`\n]+`)/)
        .map((part, i) => {
        if (i % 2 === 1)
            return `<code>${part.slice(1, -1)}</code>`;
        // Split keeps both capture groups, so the pieces run text, link text, href, text, …
        const pieces = part.split(new RegExp(LINK.source, 'g'));
        let html = '';
        for (let j = 0; j < pieces.length; j += 3) {
            html += emphasis(pieces[j]);
            if (j + 2 < pieces.length)
                html += `<a href="${pieces[j + 2]}" target="_blank" rel="noopener noreferrer">${emphasis(pieces[j + 1])}</a>`;
        }
        return html;
    })
        .join('');
}
/**
 * The subset a notes section uses: `### ` headings (an `<h3>`, its own block), paragraphs (a blank line between, a single newline is a `<br>`), `- ` / `* `
 * bullet lists, `code`, **bold**, _emphasis_ and `[text](https://…)`; the emitted elements are exactly `p br ul li code strong em a h3`. Everything is
 * HTML-escaped BEFORE any markup is added, so a `<script>` or an `<img onerror>` arrives as its own text. Anything else in the Markdown shows as the literal
 * text it is. Empty notes render `''`.
 */
function renderNotesHtml(md) {
    const out = [];
    let para = [];
    let list = [];
    const flushPara = () => {
        if (para.length)
            out.push(`<p>${para.join('<br>')}</p>`);
        para = [];
    };
    const flushList = () => {
        if (list.length)
            out.push(`<ul>${list.map((li) => `<li>${li}</li>`).join('')}</ul>`);
        list = [];
    };
    for (const raw of md.replace(/\r\n?/g, '\n').split('\n')) {
        if (raw.trim() === '') {
            flushPara();
            flushList();
        }
        else if (H3.test(raw.trim())) {
            // A heading ends whatever block is open and is a block of its own, so the line after it starts a fresh paragraph or list.
            flushPara();
            flushList();
            out.push(`<h3>${inline(escapeHtml(raw.trim().replace(/^###\s+/, '')))}</h3>`);
        }
        else if (BULLET.test(raw)) {
            flushPara();
            list.push(inline(escapeHtml(raw.replace(BULLET, '').trim())));
        }
        else {
            flushList();
            para.push(inline(escapeHtml(raw.trim())));
        }
    }
    flushPara();
    flushList();
    return out.join('');
}
