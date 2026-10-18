// Shared releases fixtures for every test. Plain data, named exports; deliberately outside src/ so the package never ships them.
import type { Release, ReleasesResponse } from '../src/types.js';

const baseline: Release = {
  version: '0.1.0',
  date: '2026-09-01T10:00:00Z',
  title: 'Initial release',
  type: 'baseline',
  breaking: false,
  notes: '',
};

export const baselineOnly: ReleasesResponse = {
  current: { version: '0.1.0', ahead: 0 },
  releases: [baseline],
};

/** Newest first, as the route answers. */
export const mixed: ReleasesResponse = {
  current: { version: '0.3.0', ahead: 0 },
  releases: [
    {
      version: '0.3.0',
      date: '2026-10-15T09:30:00Z',
      title: 'Faster board rendering',
      type: 'perf',
      scope: 'board',
      breaking: false,
      notes: [
        'The board now renders only the cards in view, so a backlog with hundreds of items opens without a pause.',
        '',
        '- Cards outside the viewport are measured once and then skipped until they scroll into view.',
        '- Filtering reuses the previous layout instead of recomputing every column from scratch.',
        '- Drag previews no longer clone the whole card tree, which removes the stutter on long columns.',
        '',
        'On a 400-item backlog the first paint drops from roughly 900 ms to under 150 ms, and scrolling stays at 60 fps on a mid-range laptop. ' +
          'Nothing about the board looks or behaves differently; if anything renders out of place, reload once to clear the cached layout.',
      ].join('\n'),
    },
    {
      version: '0.2.1',
      date: '2026-10-08T14:00:00Z',
      title: 'Drop the legacy settings key',
      type: 'fix',
      scope: 'settings',
      breaking: true,
      notes: 'Settings saved under the old `prefs` key are no longer read. Re-save your settings once after upgrading.',
    },
    {
      version: '0.2.0',
      date: '2026-09-20T12:00:00Z',
      title: "Add the What's new drawer",
      type: 'feat',
      pr: 42,
      breaking: false,
      notes: "A version chip in the header opens a drawer listing every release, newest first.",
      url: 'https://github.com/futin/release-kit/releases/tag/v0.2.0',
    },
    baseline,
  ],
};

export const noCurrent: ReleasesResponse = { ...mixed, current: null };

export const empty: ReleasesResponse = { current: null, releases: [] };

export const hostileNotes: ReleasesResponse = {
  current: { version: '0.4.0', ahead: 0 },
  releases: [
    {
      version: '0.4.0',
      date: '2026-10-17T08:00:00Z',
      title: 'Notes that try to escape',
      type: 'fix',
      breaking: false,
      notes: [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '[click me](javascript:alert(1))',
        '[search](https://example.com/search?q=a&page=2)',
        '[see (details)](https://example.com/details)',
      ].join('\n'),
    },
    baseline,
  ],
};
