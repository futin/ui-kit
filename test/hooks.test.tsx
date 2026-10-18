import { flush, renderHook } from './dom.js';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { useReleases, useWhatsNew } from '../src/index.js';
import type { ReleasesResponse } from '../src/index.js';
import { mixed, noCurrent } from '../fixtures/releases.js';

const KEY = 'test.releases.lastSeen';

// Each fetch takes the next answer from `answers`: a body (JSON-encoded unless it is a string), 'reject' for a network failure, or a pending deferred the
// test resolves later. A fetch with no answer queued stays pending forever.
type Deferred = { promise: Promise<Response>; resolve(body: unknown): void };
type Answer = unknown | 'reject' | Deferred;
let answers: Answer[];
let calls: string[];

function deferred(): Deferred {
  let resolve!: (r: Response) => void;
  const promise = new Promise<Response>((r) => (resolve = r));
  return { promise, resolve: (body) => resolve(response(body)) };
}
const response = (body: unknown): Response => new Response(typeof body === 'string' ? body : JSON.stringify(body));
const isDeferred = (a: Answer): a is Deferred => typeof a === 'object' && a !== null && 'promise' in a && 'resolve' in a;

function stubStorage(initial: string | null, throws = false): Map<string, string> {
  const map = new Map<string, string>(initial === null ? [] : [[KEY, initial]]);
  const fail = (): never => {
    throw new Error('SecurityError: storage is blocked');
  };
  const storage = {
    getItem: (k: string) => (throws ? fail() : (map.get(k) ?? null)),
    setItem: (k: string, v: string) => (throws ? fail() : void map.set(k, v)),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
  return map;
}

/** `mixed` with one more release on top, so the newest is `version`. */
const newer = (version: string): ReleasesResponse => ({
  current: { version, ahead: 0 },
  releases: [{ ...mixed.releases[0], version, title: `release ${version}` }, ...mixed.releases],
});

beforeEach(() => {
  answers = [];
  calls = [];
  mock.method(globalThis, 'fetch', (url: string) => {
    calls.push(url);
    const a = answers.shift();
    if (a === undefined) return new Promise<Response>(() => {});
    if (a === 'reject') return Promise.reject(new TypeError('Failed to fetch'));
    if (isDeferred(a)) return a.promise;
    return Promise.resolve(response(a));
  });
});

afterEach(() => {
  mock.restoreAll();
});

describe('useReleases', () => {
  it('fetches the default url on mount and nothing more until refresh()', async () => {
    stubStorage(null);
    answers.push(mixed);
    const h = renderHook(() => useReleases());
    await flush();
    assert.deepEqual(calls, ['/api/releases']);
    assert.deepEqual(h.result.current.data, mixed);
    answers.push(noCurrent);
    act(() => h.result.current.refresh());
    await flush();
    assert.deepEqual(calls, ['/api/releases', '/api/releases']);
    assert.deepEqual(h.result.current.data, noCurrent);
    h.unmount();
  });

  it('fetches the url it is given', async () => {
    answers.push(mixed);
    const h = renderHook(() => useReleases('/x/releases'));
    await flush();
    assert.deepEqual(calls, ['/x/releases']);
    h.unmount();
  });
});

describe('useWhatsNew', () => {
  it('a first answer with empty storage seeds the newest and shows no dot', async () => {
    const storage = stubStorage(null);
    answers.push(mixed);
    const h = renderHook(() => useWhatsNew({ storageKey: KEY }));
    assert.equal(h.result.current.chip, null);
    await flush();
    assert.deepEqual(h.result.current.chip, { label: 'v0.3.0', dot: false });
    assert.equal(storage.get(KEY), '0.3.0');
    h.unmount();
  });

  it('a stored version below the newest shows the dot', async () => {
    const storage = stubStorage('0.2.1');
    answers.push(mixed);
    const h = renderHook(() => useWhatsNew({ storageKey: KEY }));
    await flush();
    assert.deepEqual(h.result.current.chip, { label: 'v0.3.0', dot: true });
    assert.equal(storage.get(KEY), '0.2.1');
    h.unmount();
  });

  it('show() opens at once, fires one refetch, clears the dot and stores the newest', async () => {
    const storage = stubStorage('0.2.1');
    answers.push(mixed);
    const h = renderHook(() => useWhatsNew({ storageKey: KEY }));
    await flush();
    assert.equal(h.result.current.chip?.dot, true);
    assert.equal(h.result.current.open, false);
    act(() => h.result.current.show());
    // The refetch is still pending: nothing has answered it, yet the drawer is already open.
    assert.equal(h.result.current.open, true);
    assert.equal(calls.length, 2);
    assert.equal(h.result.current.chip?.dot, false);
    assert.equal(storage.get(KEY), '0.3.0');
    act(() => h.result.current.close());
    assert.equal(h.result.current.open, false);
    assert.equal(h.result.current.chip?.dot, false);
    h.unmount();
  });

  it('storage that throws: no dot after the seed, no throw, still none after a re-render', async () => {
    stubStorage(null, true);
    answers.push(mixed);
    const h = renderHook(() => useWhatsNew({ storageKey: KEY }));
    await flush();
    assert.deepEqual(h.result.current.chip, { label: 'v0.3.0', dot: false });
    h.rerender();
    assert.deepEqual(h.result.current.chip, { label: 'v0.3.0', dot: false });
    h.unmount();
  });

  // show() is the only refetch useWhatsNew offers, so the refetch cases go through it; empty storage keeps the dot off before and after opening.
  it('a refetch that rejects keeps data and chip', async () => {
    stubStorage(null);
    answers.push(mixed, 'reject');
    const h = renderHook(() => useWhatsNew({ storageKey: KEY }));
    await flush();
    const before = { data: h.result.current.data, chip: h.result.current.chip };
    act(() => h.result.current.show());
    await flush();
    assert.equal(calls.length, 2);
    assert.equal(h.result.current.data, before.data);
    assert.deepEqual(h.result.current.chip, before.chip);
    h.unmount();
  });

  it("a body of '<html>' keeps the previous data", async () => {
    stubStorage(null);
    answers.push(mixed, '<html>');
    const h = renderHook(() => useWhatsNew({ storageKey: KEY }));
    await flush();
    act(() => h.result.current.show());
    await flush();
    assert.equal(calls.length, 2);
    assert.deepEqual(h.result.current.data, mixed);
    h.unmount();
  });

  it('a well-formed body of the wrong shape keeps the previous data', async () => {
    stubStorage(null);
    answers.push(mixed, { releases: 'nope' });
    const h = renderHook(() => useWhatsNew({ storageKey: KEY }));
    await flush();
    act(() => h.result.current.show());
    await flush();
    assert.equal(calls.length, 2);
    assert.deepEqual(h.result.current.data, mixed);
    h.unmount();
  });

  it('a null current gives no chip', async () => {
    stubStorage(null);
    answers.push(noCurrent);
    const h = renderHook(() => useWhatsNew({ storageKey: KEY }));
    await flush();
    assert.deepEqual(h.result.current.data, noCurrent);
    assert.equal(h.result.current.chip, null);
    h.unmount();
  });

  it('a fetch resolving after unmount writes nothing and logs no error', async () => {
    const storage = stubStorage(null);
    const late = deferred();
    answers.push(late);
    const error = mock.method(console, 'error');
    const h = renderHook(() => useWhatsNew({ storageKey: KEY }));
    h.unmount();
    late.resolve(mixed);
    await flush();
    assert.equal(storage.has(KEY), false);
    assert.equal(error.mock.callCount(), 0);
  });

  it('show() never writes a newest below the stored version', async () => {
    const storage = stubStorage('0.9.0');
    answers.push(newer('0.5.0'));
    const h = renderHook(() => useWhatsNew({ storageKey: KEY }));
    await flush();
    assert.equal(h.result.current.chip?.dot, false);
    act(() => h.result.current.show());
    await flush();
    assert.equal(storage.get(KEY), '0.9.0');
    h.unmount();
  });

  it('show() then a rejected refetch: the drawer stays open on the earlier answer', async () => {
    stubStorage(null);
    answers.push(mixed, 'reject');
    const h = renderHook(() => useWhatsNew({ storageKey: KEY }));
    await flush();
    act(() => h.result.current.show());
    await flush();
    assert.equal(calls.length, 2);
    assert.equal(h.result.current.open, true);
    assert.deepEqual(h.result.current.data, mixed);
    h.unmount();
  });

  it('fetches the url it is given', async () => {
    stubStorage(null);
    answers.push(mixed);
    const h = renderHook(() => useWhatsNew({ storageKey: KEY, url: '/x/releases' }));
    await flush();
    assert.deepEqual(calls, ['/x/releases']);
    h.unmount();
  });
});
