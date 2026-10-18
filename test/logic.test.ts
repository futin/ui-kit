import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  chipLabel,
  compareVersions,
  displayTitle,
  dotState,
  formatReleaseDate,
  isReleasesResponse,
  isVersion,
  readLastSeen,
  TYPE_LABEL,
  writeLastSeen,
} from '../src/index.js';
import { empty, mixed } from '../fixtures/releases.js';

describe('isVersion', () => {
  it('accepts a bare X.Y.Z and nothing else', () => {
    assert.equal(isVersion('0.2.0'), true);
    for (const v of ['v0.2.0', '0.2', '0.2.0-rc.1', '', null, undefined, 1]) assert.equal(isVersion(v), false, String(v));
  });
});

describe('compareVersions', () => {
  it('orders each part numerically, so 0.10.0 is above 0.9.0', () => {
    assert.ok(compareVersions('0.10.0', '0.9.0') > 0);
    assert.ok(compareVersions('0.9.0', '0.10.0') < 0);
    assert.equal(compareVersions('1.2.3', '1.2.3'), 0);
  });
});

describe('chipLabel', () => {
  it('shows the bare tag on it and +N past it', () => {
    assert.equal(chipLabel({ version: '0.2.0', ahead: 0 }), 'v0.2.0');
    assert.equal(chipLabel({ version: '0.2.0', ahead: 3 }), 'v0.2.0+3');
  });
});

describe('displayTitle', () => {
  it('drops a conventional-commit prefix, scope and bang included', () => {
    assert.equal(displayTitle('feat(rail)!: x'), 'x');
    assert.equal(displayTitle('fix: y'), 'y');
  });
  it('leaves a title with no prefix as it is', () => {
    assert.equal(displayTitle('Baseline — versioning starts here'), 'Baseline — versioning starts here');
  });
});

describe('TYPE_LABEL', () => {
  it('names the three release types', () => {
    assert.deepEqual(TYPE_LABEL, { feat: 'Feature', fix: 'Fix', perf: 'Performance' });
  });
});

describe('dotState', () => {
  const cases: [string | null, string | null, boolean, { dot: boolean; seed: string | null }][] = [
    [null, '0.1.0', false, { dot: false, seed: null }],
    ['0.2.0', null, false, { dot: false, seed: '0.2.0' }],
    ['0.2.0', 'v0.2.0', false, { dot: false, seed: '0.2.0' }],
    ['0.3.0', '0.2.0', false, { dot: true, seed: null }],
    ['0.2.0', '0.2.0', false, { dot: false, seed: null }],
    ['0.3.0', '0.2.0', true, { dot: false, seed: '0.3.0' }],
    ['0.2.0', '0.3.0', true, { dot: false, seed: null }],
  ];
  for (const [newest, stored, open, want] of cases) {
    it(`(${newest}, ${stored}, ${open}) → ${JSON.stringify(want)}`, () => assert.deepEqual(dotState(newest, stored, open), want));
  }
});

describe('readLastSeen / writeLastSeen', () => {
  const g = globalThis as { localStorage?: unknown };
  afterEach(() => delete g.localStorage);

  it('reads and writes under the key it is given', () => {
    const map = new Map<string, string>();
    g.localStorage = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
    assert.equal(readLastSeen('app.last-seen'), null);
    writeLastSeen('app.last-seen', '0.2.0');
    assert.deepEqual([...map], [['app.last-seen', '0.2.0']]);
    assert.equal(readLastSeen('app.last-seen'), '0.2.0');
    assert.equal(readLastSeen('other.key'), null);
  });

  it('reads null and writes nothing, without throwing, when storage throws', () => {
    const boom = () => {
      throw new Error('SecurityError');
    };
    g.localStorage = { getItem: boom, setItem: boom };
    assert.equal(readLastSeen('app.last-seen'), null);
    assert.doesNotThrow(() => writeLastSeen('app.last-seen', '0.2.0'));
  });

  it('reads null and writes nothing when there is no localStorage at all', () => {
    assert.equal(readLastSeen('app.last-seen'), null);
    assert.doesNotThrow(() => writeLastSeen('app.last-seen', '0.2.0'));
  });
});

describe('formatReleaseDate', () => {
  it('formats as day, short month, year', () => assert.equal(formatReleaseDate('2026-10-16T09:00:00Z'), '16 Oct 2026'));
  it('returns a date that does not parse as it came', () => assert.equal(formatReleaseDate('junk'), 'junk'));
});

describe('isReleasesResponse', () => {
  it('accepts the empty shape and a full one', () => {
    assert.equal(isReleasesResponse(empty), true);
    assert.equal(isReleasesResponse(mixed), true);
  });
  it('rejects an HTML body, non-array releases and a current missing ahead', () => {
    for (const v of ['<html>', { releases: {} }, { current: { version: '1.0.0' }, releases: [] }, null, { releases: [] }]) {
      assert.equal(isReleasesResponse(v), false, JSON.stringify(v));
    }
  });
});
