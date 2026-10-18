/**
 * The subset a notes section uses: paragraphs (a blank line between, a single newline is a `<br>`), `- ` / `* ` bullet lists, `code`, **bold** and
 * `[text](https://…)`. Everything is HTML-escaped BEFORE any markup is added, so a `<script>` or an `<img onerror>` arrives as its own text. Anything else
 * in the Markdown shows as the literal text it is. Empty notes render `''`.
 */
export declare function renderNotesHtml(md: string): string;
