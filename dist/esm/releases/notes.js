// The default notes renderer (release-kit spec D14): a release's notes — the PR body's `## What's new` section — as HTML safe to set with no app sanitiser
// behind it. Ported from guide-manager's escape-first renderer (client/src/lib/releases.ts `renderNotes`), minus its `sanitizeSnapshot` pass: every link is
// built here with `target="_blank" rel="noopener noreferrer"` instead.
function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// Over ALREADY escaped text, so a `"` in the url is `&quot;` by now and cannot close the href. Only http(s) matches: a `javascript:` link stays text.
const LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/;
const BOLD = /\*\*([^*\n]+)\*\*/g;
const BULLET = /^\s*[-*] +/;
const bold = (text) => text.replace(BOLD, '<strong>$1</strong>');
/** One line's inline markup, over text that is ALREADY escaped: `code` spans first and left alone, then links, then bold outside the hrefs. */
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
            html += bold(pieces[j]);
            if (j + 2 < pieces.length)
                html += `<a href="${pieces[j + 2]}" target="_blank" rel="noopener noreferrer">${bold(pieces[j + 1])}</a>`;
        }
        return html;
    })
        .join('');
}
/**
 * The subset a notes section uses: paragraphs (a blank line between, a single newline is a `<br>`), `- ` / `* ` bullet lists, `code`, **bold** and
 * `[text](https://…)`. Everything is HTML-escaped BEFORE any markup is added, so a `<script>` or an `<img onerror>` arrives as its own text. Anything else
 * in the Markdown shows as the literal text it is. Empty notes render `''`.
 */
export function renderNotesHtml(md) {
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
