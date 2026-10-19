/**
 * The subset a notes section uses: `### ` headings (an `<h3>`, its own block), paragraphs (a blank line between, a single newline is a `<br>`), `- ` / `* `
 * bullet lists, `code`, **bold**, _emphasis_ and `[text](https://…)`; the emitted elements are exactly `p br ul li code strong em a h3`. Everything is
 * HTML-escaped BEFORE any markup is added, so a `<script>` or an `<img onerror>` arrives as its own text. Anything else in the Markdown shows as the literal
 * text it is. Empty notes render `''`.
 */
export declare function renderNotesHtml(md: string): string;
