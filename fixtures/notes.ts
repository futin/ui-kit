// Release-notes Markdown for tests and the playground. Kept apart from fixtures/releases.ts on purpose: every export there is a `ReleasesResponse`
// (test/type-contract.test.ts and the playground's fixture loop both rely on it), so a bare string cannot live beside them.

/** One of every construct `renderNotesHtml` emits: `###` heading, a list, and a paragraph holding code, bold, em and an https link. */
export const NOTES_ALL_CONSTRUCTS = [
  '### Highlights',
  '',
  '- The board renders only the cards in view',
  '- Notes keep their headings',
  '',
  'Run `pnpm test` before you push: **every** suite must pass, and _nothing_ is skipped. See [the guide](https://example.com/guide) for the details.',
].join('\n');
