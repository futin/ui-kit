// Releases pure logic: what the version chip and the What's new drawer decide, with no React in it (test/logic.test.ts). Ported function for function from
// guide-manager's client/src/lib/releases.ts, plus isReleasesResponse from its hooks/useReleases.ts; the one change is that the localStorage key is a
// parameter, because each app keeps the key it already uses so no viewer's dot state resets (spec D17).
//
// The unseen dot is a per-viewer convenience over localStorage, never a record: a first visit seeds the newest version so a fresh browser never shows every
// release as new, a stored value that is not a version counts as missing and is reseeded, and storage that throws (a private window, blocked site data) means
// no dot rather than a crash.
import type { ReleasesResponse, ReleaseType } from '../types.js';

const VERSION = /^\d+\.\d+\.\d+$/;

/** A bare `X.Y.Z` — not `v0.2.0`, not a prerelease, not whatever an older build or a hand edit left in storage. */
export function isVersion(s: unknown): s is string {
  return typeof s === 'string' && VERSION.test(s);
}

/** Numeric order per part, so `0.10.0` is above `0.9.0` — a string compare would put it below. Both must be versions. */
export function compareVersions(a: string, b: string): number {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

/** `v0.2.0` on the tag, `v0.2.0+3` three commits past it — the shape `git describe` would give, minus the sha. */
export function chipLabel(current: { version: string; ahead: number }): string {
  return current.ahead > 0 ? `v${current.version}+${current.ahead}` : `v${current.version}`;
}

const CC_PREFIX = /^[a-z]+(?:\([a-z0-9-]+\))?!?: ?/;

/** The title without its `type(scope)!: ` prefix, which the badge already says. A title with none — the baseline's — is returned as it is. */
export function displayTitle(title: string): string {
  return title.replace(CC_PREFIX, '');
}

/** The type badge's words. Breaking is not a fourth type — it is a badge of its own beside this one — and the baseline has none. */
export const TYPE_LABEL: Record<Exclude<ReleaseType, 'baseline'>, string> = { feat: 'Feature', fix: 'Fix', perf: 'Performance' };

/**
 * Should the chip carry the dot, and what must storage be set to (`seed`, `null` for nothing)? A dot only when the newest release is above the stored one;
 * a missing or junk stored value is not "everything is new" but a first visit, so it answers no dot and asks the caller to store the newest. With the
 * drawer `open` there is never a dot, and the newest is marked seen — but only when it is above what is stored: a checkout behind the one last opened must
 * not write the lower version back, or the releases between the two would be flagged again once the newer checkout returns. Pure: the caller writes.
 */
export function dotState(newest: string | null, stored: string | null, open: boolean): { dot: boolean; seed: string | null } {
  if (!isVersion(newest)) return { dot: false, seed: null };
  if (!isVersion(stored)) return { dot: false, seed: newest };
  const above = compareVersions(newest, stored) > 0;
  if (open) return { dot: false, seed: above ? newest : null };
  return { dot: above, seed: null };
}

/** The last version the viewer opened the drawer on under `key`, or `null` — a storage that throws, or none at all, reads as never having seen one. */
export function readLastSeen(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Stores it under `key`; a storage that throws is swallowed, and the caller's in-memory mirror settles the dot instead. */
export function writeLastSeen(key: string, v: string): void {
  try {
    localStorage.setItem(key, v);
  } catch {
    /* a private window or blocked site data */
  }
}

/** `16 Oct 2026`, in the viewer's own timezone; a date that does not parse is shown as it came rather than as `Invalid Date`. */
export function formatReleaseDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// `items` is optional on the wire (an older server omits it) but never half-shaped: when present it is an array of objects with a numeric `pr`, which is the
// one field the grouped drawer cannot render without. The rest of an item is trusted as the release fields already are.
function hasValidItems(release: unknown): boolean {
  if (typeof release !== 'object' || release === null) return true;
  const items = (release as { items?: unknown }).items;
  if (items === undefined) return true;
  return Array.isArray(items) && items.every((i) => typeof i === 'object' && i !== null && typeof (i as { pr?: unknown }).pr === 'number');
}

/** The response guard: an HTML error page or a half-shaped body is rejected, so the caller keeps its last good answer. */
export function isReleasesResponse(v: unknown): v is ReleasesResponse {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as { current?: unknown; releases?: unknown };
  if (!Array.isArray(r.releases)) return false;
  if (!r.releases.every(hasValidItems)) return false;
  if (r.current === null) return true;
  const c = r.current as { version?: unknown; ahead?: unknown } | undefined;
  return typeof c === 'object' && c !== null && typeof c.version === 'string' && typeof c.ahead === 'number';
}
