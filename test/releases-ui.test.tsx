import './dom.js';
import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { baselineOnly, hostileNotes, mixed, noCurrent } from '../fixtures/releases.js';
import { formatReleaseDate } from '../src/releases/logic.js';
import { ReleasesDrawer } from '../src/releases/ReleasesDrawer.js';
import { ReleasesPanel } from '../src/releases/ReleasesPanel.js';
import { VersionChip } from '../src/releases/VersionChip.js';
import type { ReleasesResponse } from '../src/types.js';
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

  it('replaces the default with a custom renderNotes', () => {
    const renderNotes = mock.fn((notes: string) => <em className="custom">{notes.length}</em>);
    const m = mount(<ReleasesPanel data={mixed} renderNotes={renderNotes} />);
    // One call per release with notes; the baseline's are empty and never reach the renderer.
    assert.equal(renderNotes.mock.callCount(), 3);
    const notes = entry(m, '0.2.1').querySelector('.uk-releases-notes');
    assert.ok(notes);
    assert.equal(notes.innerHTML, `<em class="custom">${mixed.releases[1].notes.length}</em>`);
    assert.equal(entry(m, '0.3.0').querySelectorAll('li').length, 0);
  });

  it('keeps hostile notes inert through the default renderer', () => {
    const m = mount(<ReleasesPanel data={hostileNotes} />);
    assert.equal(document.querySelectorAll('script').length, 0);
    assert.equal(m.all('img').length, 0);
    assert.match(entry(m, '0.4.0').textContent ?? '', /<script>alert\("xss"\)<\/script>/);
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

  it('passes renderNotes through to the panel', () => {
    const m = mount(<ReleasesDrawer data={mixed} onClose={() => {}} renderNotes={() => <i className="mine" />} />);
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
