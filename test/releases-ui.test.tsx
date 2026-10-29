import './dom.js';
import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { baselineOnly, hostileNotes, mixed, noCurrent, rollup } from '../fixtures/releases.js';
import { NOTES_ALL_CONSTRUCTS } from '../fixtures/notes.js';
import { formatReleaseDate } from '../src/releases/logic.js';
import { renderNotesHtml } from '../src/releases/notes.js';
import { ReleasesDrawer } from '../src/releases/ReleasesDrawer.js';
import { ReleasesPanel } from '../src/releases/ReleasesPanel.js';
import type { ReleasesPanelProps } from '../src/releases/ReleasesPanel.js';
import { VersionChip } from '../src/releases/VersionChip.js';
import type { Release, ReleaseItem, ReleasesResponse } from '../src/types.js';
import { useMediaQuery } from '../src/ui/useMediaQuery.js';
import { renderHook } from './dom.js';

// Renders into a container attached to document.body (focus only works on connected elements); afterEach empties the body again.
function mount(node: ReactNode) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(node));
  return {
    host,
    all: (sel: string) => [...host.querySelectorAll<HTMLElement>(sel)],
    q: <T extends Element = HTMLElement>(sel: string): T => {
      const el = host.querySelector<T>(sel);
      assert.ok(el, `${sel} is not rendered`);
      return el;
    },
    unmount: () => act(() => root.unmount()),
  };
}

const entry = (m: ReturnType<typeof mount>, version: string) => m.q(`[data-testid="release-${version}"]`);

afterEach(() => {
  mock.restoreAll();
  document.body.replaceChildren();
});

describe('VersionChip', () => {
  it('is a button.uk-chip showing the label, with the plain aria-label and no dot', () => {
    const onClick = mock.fn();
    const m = mount(<VersionChip label="v0.3.0" dot={false} onClick={onClick} />);
    const chip = m.q<HTMLButtonElement>('button.uk-chip');
    assert.equal(chip.getAttribute('aria-label'), "What's new — v0.3.0");
    assert.equal(chip.textContent, 'v0.3.0');
    assert.equal(m.all('.uk-chip-dot').length, 0);
    act(() => chip.click());
    assert.equal(onClick.mock.callCount(), 1);
  });

  it('with dot, says new release and renders .uk-chip-dot', () => {
    const m = mount(<VersionChip label="v0.3.0" dot onClick={() => {}} />);
    assert.equal(m.q('button.uk-chip').getAttribute('aria-label'), "What's new — v0.3.0, new release");
    assert.equal(m.all('.uk-chip-dot').length, 1);
  });

  it('narrow adds uk-chip--narrow to the same button, with no wrapper or inner span for it', () => {
    const m = mount(<VersionChip label="v0.3.0" dot={false} onClick={() => {}} narrow />);
    assert.equal(m.q('button').className, 'uk-chip uk-chip--narrow');
    assert.equal(m.all('button > span').length, 1, 'only the label span: the hit area is a pseudo-element');
  });

  it('without narrow the class is exactly uk-chip', () => {
    const m = mount(<VersionChip label="v0.3.0" dot={false} onClick={() => {}} />);
    assert.equal(m.q('button').className, 'uk-chip');
    const off = mount(<VersionChip label="v0.3.0" dot={false} onClick={() => {}} narrow={false} />);
    assert.equal(off.q('button').className, 'uk-chip');
  });
});

describe('ReleasesPanel', () => {
  it('renders the entries in the given order', () => {
    const m = mount(<ReleasesPanel data={mixed} />);
    const ids = m.all('[data-testid^="release-"]').map((e) => e.dataset.testid);
    assert.deepEqual(ids, ['release-0.3.0', 'release-0.2.1', 'release-0.2.0', 'release-0.1.0']);
  });

  it('keeps an unsorted input in its own order rather than re-sorting it', () => {
    const data: ReleasesResponse = { ...mixed, releases: [...mixed.releases].reverse() };
    const m = mount(<ReleasesPanel data={data} />);
    const ids = m.all('[data-testid^="release-"]').map((e) => e.dataset.testid);
    assert.deepEqual(ids, ['release-0.1.0', 'release-0.2.0', 'release-0.2.1', 'release-0.3.0']);
  });

  it('shows the baseline as a divider with its date and no badge', () => {
    const m = mount(<ReleasesPanel data={baselineOnly} />);
    const base = entry(m, '0.1.0');
    assert.match(base.textContent ?? '', /Versioning starts here · v0\.1\.0/);
    const date = formatReleaseDate('2026-09-01T10:00:00Z');
    // `1 Sept 2026`: en-GB abbreviates September to four letters.
    assert.match(date, /^\d{1,2} [A-Z][a-z]{2,3} \d{4}$/);
    assert.equal(base.querySelector('.uk-releases-date')?.textContent, date);
    assert.equal(base.querySelectorAll('.uk-releases-badge').length, 0);
  });

  it('shows Fix and a separate Breaking badge on 0.2.1', () => {
    const m = mount(<ReleasesPanel data={mixed} />);
    const badges = [...entry(m, '0.2.1').querySelectorAll('.uk-releases-badge')].map((b) => b.textContent);
    assert.deepEqual(badges, ['Fix', 'Breaking']);
    const plain = [...entry(m, '0.2.0').querySelectorAll('.uk-releases-badge')].map((b) => b.textContent);
    assert.deepEqual(plain, ['Feature']);
  });

  it('shows the title without its conventional-commit prefix', () => {
    const data: ReleasesResponse = { ...mixed, releases: [{ ...mixed.releases[1], title: 'fix(settings)!: Drop the legacy settings key' }] };
    const m = mount(<ReleasesPanel data={data} />);
    assert.equal(entry(m, '0.2.1').querySelector('.uk-releases-title')?.textContent, 'Drop the legacy settings key');
  });

  it('links PR #N only when both url and pr are set', () => {
    const r = mixed.releases[2];
    const data: ReleasesResponse = {
      current: null,
      releases: [r, { ...r, version: '0.1.9', url: undefined }, { ...r, version: '0.1.8', pr: undefined }],
    };
    const m = mount(<ReleasesPanel data={data} />);
    const pr = entry(m, '0.2.0').querySelector<HTMLAnchorElement>('a.uk-releases-pr');
    assert.ok(pr);
    assert.equal(pr.textContent, 'PR #42');
    assert.equal(pr.getAttribute('href'), r.url);
    assert.equal(pr.getAttribute('rel'), 'noopener noreferrer');
    assert.equal(entry(m, '0.1.9').querySelectorAll('.uk-releases-pr').length, 0);
    assert.equal(entry(m, '0.1.8').querySelectorAll('.uk-releases-pr').length, 0);
  });

  it("heads with What's new and the running version", () => {
    const m = mount(<ReleasesPanel data={mixed} />);
    assert.equal(m.q('.uk-releases-head h2').textContent, "What's new");
    assert.equal(m.q('.uk-releases-running').textContent, 'running v0.3.0');
  });

  it('shows +N when the checkout is ahead of the newest tag', () => {
    const m = mount(<ReleasesPanel data={{ ...mixed, current: { version: '0.3.0', ahead: 2 } }} />);
    assert.equal(m.q('.uk-releases-running').textContent, 'running v0.3.0+2');
  });

  it('has no running line when current is null', () => {
    const m = mount(<ReleasesPanel data={noCurrent} />);
    assert.equal(m.all('.uk-releases-running').length, 0);
    assert.doesNotMatch(m.host.textContent ?? '', /running/);
  });

  it('renders no notes element for empty notes', () => {
    const m = mount(<ReleasesPanel data={baselineOnly} />);
    assert.equal(m.all('.uk-releases-notes').length, 0);
    const blank: ReleasesResponse = { current: null, releases: [{ ...mixed.releases[1], notes: '' }] };
    assert.equal(mount(<ReleasesPanel data={blank} />).all('.uk-releases-notes').length, 0);
  });

  it('renders notes through renderNotesHtml by default', () => {
    const m = mount(<ReleasesPanel data={mixed} />);
    const notes = entry(m, '0.3.0').querySelector('.uk-releases-notes');
    assert.ok(notes);
    assert.equal(notes.querySelectorAll('li').length, 3);
  });

  it("sanitize receives renderNotesHtml's output and its return is what renders", () => {
    const sanitize = mock.fn((_html: string) => '<p>clean</p>');
    const m = mount(<ReleasesPanel data={mixed} sanitize={sanitize} />);
    // One call per release with notes; the baseline's are empty and never reach the hook.
    assert.equal(sanitize.mock.callCount(), 3);
    assert.equal(sanitize.mock.calls[0].arguments[0], renderNotesHtml(mixed.releases[0].notes));
    const notes = entry(m, '0.3.0').querySelector('.uk-releases-notes');
    assert.ok(notes);
    // The sanitised HTML sits directly on .uk-releases-notes: no wrapper element between it and the entry.
    assert.equal(notes.innerHTML, '<p>clean</p>');
    assert.equal(entry(m, '0.3.0').querySelectorAll('li').length, 0);
  });

  it('renderNotes is not a key of ReleasesPanelProps', () => {
    const absent: 'renderNotes' extends keyof ReleasesPanelProps ? never : true = true;
    assert.equal(absent, true);
  });

  it('NOTES_ALL_CONSTRUCTS renders an h3, a ul, a code, a strong, an em and an a', () => {
    const data: ReleasesResponse = {
      current: null,
      releases: [{ version: '1.0.0', date: '2026-10-19T10:00:00Z', title: 'All constructs', type: 'feat', breaking: false, notes: NOTES_ALL_CONSTRUCTS }],
    };
    const m = mount(<ReleasesPanel data={data} />);
    const notes = m.q('.uk-releases-notes');
    for (const tag of ['h3', 'ul', 'code', 'strong', 'em', 'a']) assert.ok(notes.querySelector(tag), `${tag} is not rendered`);
    assert.match(notes.querySelector('a')?.getAttribute('href') ?? '', /^https:\/\//);
  });

  it('keeps hostile notes inert through the default renderer', () => {
    const m = mount(<ReleasesPanel data={hostileNotes} />);
    assert.equal(document.querySelectorAll('script').length, 0);
    assert.equal(m.all('img').length, 0);
    assert.match(entry(m, '0.4.0').textContent ?? '', /<script>alert\("xss"\)<\/script>/);
  });
});

describe('ReleasesPanel with a rolled-up release', () => {
  const rolled = rollup.releases[0];
  const items = rolled.items as ReleaseItem[];
  const withItems = (list: ReleaseItem[] | undefined, over: Partial<Release> = {}): ReleasesResponse => ({
    current: null,
    releases: [{ ...rolled, ...over, items: list }],
  });
  const text = (el: Element | null | undefined) => el?.textContent ?? '';

  it('keeps the header row, drops the release-level title and notes, and groups the items by scope in item order', () => {
    const m = mount(<ReleasesPanel data={rollup} />);
    const e = entry(m, '0.5.0');
    assert.equal(text(e.querySelector('.uk-releases-ver')), 'v0.5.0');
    assert.deepEqual([...e.querySelectorAll('.uk-releases-badge')].map((b) => b.textContent), ['Feature', 'Breaking']);
    assert.equal(text(e.querySelector('.uk-releases-date')), formatReleaseDate(rolled.date));
    assert.equal(e.querySelectorAll(':scope > .uk-releases-title, :scope > .uk-releases-notes, :scope > .uk-releases-pr').length, 0);
    const groups = [...e.querySelectorAll('.uk-releases-group')];
    assert.deepEqual(groups.map((g) => text(g.querySelector('.uk-releases-scope'))), ['Kaizen', 'Routines']);
    assert.deepEqual(groups.map((g) => g.querySelectorAll('.uk-releases-item').length), [2, 1]);
  });

  it('shows an item as its rendered notes, or its title when it has none, each followed by its own PR link', () => {
    const m = mount(<ReleasesPanel data={rollup} />);
    const [notes, titleOnly, fix] = m.all('.uk-releases-item');
    assert.equal(notes.querySelector('.uk-releases-notes')?.innerHTML, renderNotesHtml(items[0].notes));
    assert.equal(notes.querySelectorAll('.uk-releases-title').length, 0);
    assert.equal(text(titleOnly.querySelector('.uk-releases-title')), 'Rename the log');
    assert.equal(titleOnly.querySelectorAll('.uk-releases-notes').length, 0);
    assert.ok(fix.querySelector('.uk-releases-notes'));
    for (const [el, it] of [[notes, items[0]], [titleOnly, items[1]], [fix, items[2]]] as const) {
      const links = el.querySelectorAll<HTMLAnchorElement>('a.uk-releases-pr');
      assert.equal(links.length, 1);
      assert.equal(links[0].textContent, `PR #${it.pr}`);
      assert.equal(links[0].getAttribute('href'), it.url);
      assert.equal(links[0].getAttribute('rel'), 'noopener noreferrer');
      assert.equal(links[0].previousElementSibling?.matches('.uk-releases-notes, .uk-releases-title'), true, 'the link follows the item text');
    }
  });

  it('renders an item title as it came — a per-PR prefix is not stripped here', () => {
    const list = items.map((i, n) => (n === 1 ? { ...i, title: 'feat(kaizen): Rename the log' } : i));
    const m = mount(<ReleasesPanel data={withItems(list)} />);
    assert.equal(text(m.all('.uk-releases-item')[1].querySelector('.uk-releases-title')), 'feat(kaizen): Rename the log');
  });

  it('puts unscoped items in a last group called Other, and orders groups by first appearance', () => {
    const [a, b, c] = items;
    const list: ReleaseItem[] = [{ ...c, scope: undefined }, { ...a, scope: 'zeta' }, { ...b, scope: undefined }, { ...c, pr: 321, scope: 'alpha' }];
    const m = mount(<ReleasesPanel data={withItems(list)} />);
    assert.deepEqual(m.all('.uk-releases-scope').map((s) => s.textContent), ['Zeta', 'Alpha', 'Other']);
    assert.deepEqual(m.all('.uk-releases-group').map((g) => g.querySelectorAll('.uk-releases-item').length), [1, 1, 2]);
  });

  it('puts Other last even when the unscoped item comes first', () => {
    const [a, b, c] = items;
    const m = mount(<ReleasesPanel data={withItems([{ ...a, scope: undefined }, b, c])} />);
    assert.deepEqual(m.all('.uk-releases-scope').map((s) => s.textContent), ['Kaizen', 'Routines', 'Other']);
  });

  it('shows an item with no url as text with no link', () => {
    const list = items.map((i, n) => (n === 0 ? { ...i, url: undefined } : i));
    const m = mount(<ReleasesPanel data={withItems(list)} />);
    const first = m.all('.uk-releases-item')[0];
    assert.equal(first.querySelectorAll('a.uk-releases-pr').length, 0);
    assert.equal(m.all('a.uk-releases-pr').length, 2);
  });

  it('runs item notes through the host sanitize, and keeps hostile item notes inert', () => {
    const hostile = [{ ...items[0], notes: '<script>alert(1)</script>\n[x](javascript:alert(1))' }, items[1]];
    const m = mount(<ReleasesPanel data={withItems(hostile)} />);
    assert.equal(document.querySelectorAll('script').length, 0);
    assert.equal(m.all('a[href^="javascript"]').length, 0);
    assert.match(text(m.all('.uk-releases-item')[0]), /<script>alert\(1\)<\/script>/);
    const seen: string[] = [];
    const m2 = mount(<ReleasesPanel data={rollup} sanitize={(h) => (seen.push(h), '<i class="mine"></i>')} />);
    assert.equal(m2.all('.uk-releases-item .uk-releases-notes .mine').length, 2, 'both items with notes, not the title-only one');
    assert.deepEqual(seen, [renderNotesHtml(items[0].notes), renderNotesHtml(items[2].notes)]);
  });

  // The pre-change markup for 0.2.0 and 0.2.1, captured from the panel before grouped rendering existed.
  const date = (iso: string) => formatReleaseDate(iso);
  const today020 =
    '<div class="uk-releases-entry" data-testid="release-0.2.0"><div class="uk-releases-row"><span class="uk-releases-ver">v0.2.0</span>' +
    '<span class="uk-releases-badge uk-releases-badge-feat">Feature</span>' +
    `<span class="uk-releases-date">${date('2026-09-20T12:00:00Z')}</span></div>` +
    "<div class=\"uk-releases-title\">Add the What's new drawer</div>" +
    '<div class="uk-releases-notes"><p>A version chip in the header opens a drawer listing every release, newest first.</p></div>' +
    '<a class="uk-releases-pr" href="https://github.com/futin/release-kit/releases/tag/v0.2.0" target="_blank" rel="noopener noreferrer">PR #42</a></div>';
  const today021 =
    '<div class="uk-releases-entry" data-testid="release-0.2.1"><div class="uk-releases-row"><span class="uk-releases-ver">v0.2.1</span>' +
    '<span class="uk-releases-badge uk-releases-badge-fix">Fix</span><span class="uk-releases-badge uk-releases-badge-breaking">Breaking</span>' +
    `<span class="uk-releases-date">${date('2026-10-08T14:00:00Z')}</span></div>` +
    '<div class="uk-releases-title">Drop the legacy settings key</div>' +
    '<div class="uk-releases-notes"><p>Settings saved under the old <code>prefs</code> key are no longer read. ' +
    'Re-save your settings once after upgrading.</p></div></div>';

  it('a release with one item renders exactly today\'s markup — the item list is not used', () => {
    const m = mount(<ReleasesPanel data={mixed} />);
    assert.ok(mixed.releases[2].items?.length === 1, 'the fixture 0.2.0 carries one item');
    assert.equal(entry(m, '0.2.0').outerHTML, today020);
    assert.equal(m.all('.uk-releases-group').length, 0);
  });

  it('a release with no items (an older server) renders exactly today\'s markup', () => {
    const m = mount(<ReleasesPanel data={mixed} />);
    assert.equal(mixed.releases[1].items, undefined);
    assert.equal(entry(m, '0.2.1').outerHTML, today021);
  });

  it('a release with an empty items array renders today\'s markup too', () => {
    const data: ReleasesResponse = { current: null, releases: [{ ...mixed.releases[1], items: [] }] };
    assert.equal(entry(mount(<ReleasesPanel data={data} />), '0.2.1').outerHTML, today021);
  });

  it('leaves the baseline alone', () => {
    const m = mount(<ReleasesPanel data={{ current: null, releases: [{ ...baselineOnly.releases[0], items: [] }] }} />);
    assert.equal(m.all('.uk-releases-group').length, 0);
    assert.match(entry(m, '0.1.0').textContent ?? '', /Versioning starts here · v0\.1\.0/);
  });
});

describe('ReleasesDrawer', () => {
  const escape = () => act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));

  it("is a Drawer labelled What's new around the panel", () => {
    const m = mount(<ReleasesDrawer data={mixed} onClose={() => {}} />);
    const panel = m.q('aside.uk-drawer[role="dialog"]');
    assert.equal(panel.getAttribute('aria-label'), "What's new");
    assert.equal(panel.querySelectorAll('[data-testid^="release-"]').length, 4);
  });

  it('the drawer passes sanitize through', () => {
    const m = mount(<ReleasesDrawer data={mixed} onClose={() => {}} sanitize={() => '<i class="mine"></i>'} />);
    assert.equal(m.all('.uk-releases-notes .mine').length, 3);
  });

  it('passes closeOnEscape through', () => {
    const onClose = mock.fn();
    mount(<ReleasesDrawer data={mixed} onClose={onClose} closeOnEscape={false} />);
    escape();
    assert.equal(onClose.mock.callCount(), 0);
    const onClose2 = mock.fn();
    mount(<ReleasesDrawer data={mixed} onClose={onClose2} />);
    escape();
    assert.equal(onClose2.mock.callCount(), 1);
  });

  it('passes narrow through', () => {
    assert.equal(mount(<ReleasesDrawer data={mixed} onClose={() => {}} narrow />).q('aside').className, 'uk-drawer uk-drawer--narrow');
    assert.equal(mount(<ReleasesDrawer data={mixed} onClose={() => {}} />).q('aside').className, 'uk-drawer');
  });

  it('passes restoreFocus through', () => {
    const opener = document.createElement('button');
    const target = document.createElement('button');
    document.body.append(opener, target);
    opener.focus();
    const restoreFocus = mock.fn((_prev: Element | null) => target);
    const m = mount(<ReleasesDrawer data={mixed} onClose={() => {}} restoreFocus={restoreFocus} />);
    m.unmount();
    assert.equal(restoreFocus.mock.callCount(), 1);
    assert.ok(restoreFocus.mock.calls[0].arguments[0] === opener, 'restoreFocus did not get the opener');
    assert.ok(document.activeElement === target, 'focus did not go to the restoreFocus target');
  });
});

describe('useMediaQuery', () => {
  type Listener = (e: { matches: boolean }) => void;

  /** A matchMedia stub: one query list whose `matches` the test flips, firing its change listeners as a browser would. */
  function stubMatchMedia(initial: boolean) {
    const listeners = new Set<Listener>();
    const mql = {
      matches: initial,
      media: '',
      addEventListener: (_: 'change', l: Listener) => void listeners.add(l),
      removeEventListener: (_: 'change', l: Listener) => void listeners.delete(l),
    };
    const matchMedia = mock.fn((q: string) => Object.assign(mql, { media: q }));
    Object.defineProperty(window, 'matchMedia', { value: matchMedia, configurable: true, writable: true });
    const set = (matches: boolean) => {
      mql.matches = matches;
      act(() => listeners.forEach((l) => l({ matches })));
    };
    return { matchMedia, listeners, set };
  }

  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it('follows the query through change events and unsubscribes on unmount', () => {
    const s = stubMatchMedia(false);
    const h = renderHook(() => useMediaQuery('(max-width: 700px)'));
    assert.equal(h.result.current, false);
    assert.equal(s.matchMedia.mock.calls[0].arguments[0], '(max-width: 700px)');
    s.set(true);
    assert.equal(h.result.current, true);
    s.set(false);
    assert.equal(h.result.current, false);
    h.unmount();
    assert.equal(s.listeners.size, 0);
  });

  it('starts true when the query already matches', () => {
    stubMatchMedia(true);
    assert.equal(renderHook(() => useMediaQuery('(max-width: 700px)')).result.current, true);
  });

  it('is false where matchMedia is missing', () => {
    assert.equal(typeof (window as { matchMedia?: unknown }).matchMedia, 'undefined');
    assert.equal(renderHook(() => useMediaQuery('(max-width: 700px)')).result.current, false);
  });
});
