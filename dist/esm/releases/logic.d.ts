import type { ReleasesResponse, ReleaseType } from '../types.js';
/** A bare `X.Y.Z` — not `v0.2.0`, not a prerelease, not whatever an older build or a hand edit left in storage. */
export declare function isVersion(s: unknown): s is string;
/** Numeric order per part, so `0.10.0` is above `0.9.0` — a string compare would put it below. Both must be versions. */
export declare function compareVersions(a: string, b: string): number;
/** `v0.2.0` on the tag, `v0.2.0+3` three commits past it — the shape `git describe` would give, minus the sha. */
export declare function chipLabel(current: {
    version: string;
    ahead: number;
}): string;
/** The title without its `type(scope)!: ` prefix, which the badge already says. A title with none — the baseline's — is returned as it is. */
export declare function displayTitle(title: string): string;
/** The type badge's words. Breaking is not a fourth type — it is a badge of its own beside this one — and the baseline has none. */
export declare const TYPE_LABEL: Record<Exclude<ReleaseType, 'baseline'>, string>;
/**
 * Should the chip carry the dot, and what must storage be set to (`seed`, `null` for nothing)? A dot only when the newest release is above the stored one;
 * a missing or junk stored value is not "everything is new" but a first visit, so it answers no dot and asks the caller to store the newest. With the
 * drawer `open` there is never a dot, and the newest is marked seen — but only when it is above what is stored: a checkout behind the one last opened must
 * not write the lower version back, or the releases between the two would be flagged again once the newer checkout returns. Pure: the caller writes.
 */
export declare function dotState(newest: string | null, stored: string | null, open: boolean): {
    dot: boolean;
    seed: string | null;
};
/** The last version the viewer opened the drawer on under `key`, or `null` — a storage that throws, or none at all, reads as never having seen one. */
export declare function readLastSeen(key: string): string | null;
/** Stores it under `key`; a storage that throws is swallowed, and the caller's in-memory mirror settles the dot instead. */
export declare function writeLastSeen(key: string, v: string): void;
/** `16 Oct 2026`, in the viewer's own timezone; a date that does not parse is shown as it came rather than as `Invalid Date`. */
export declare function formatReleaseDate(iso: string): string;
/** The response guard: an HTML error page or a half-shaped body is rejected, so the caller keeps its last good answer. */
export declare function isReleasesResponse(v: unknown): v is ReleasesResponse;
