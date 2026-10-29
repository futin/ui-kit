// Releases wire types: the JSON shape release-kit's reader answers with, owned here so ui-kit has no runtime dependency on release-kit (spec D19).
// test/type-contract.test.ts proves at compile time that release-kit's ReleasesResponse is assignable to this one.

/** `baseline` is the first tag, which carries no conventional-commit type. */
export type ReleaseType = 'feat' | 'fix' | 'perf' | 'baseline';

/** One PR's change inside a release. `title` is set on a per-PR release's item (the full PR title) and on a rollup's title-only item (its prefix stripped). */
export type ReleaseItem = {
  pr: number;
  type: Exclude<ReleaseType, 'baseline'>;
  scope?: string;
  breaking: boolean;
  title?: string;
  /** Markdown release note; untrusted text to be rendered safely. Empty when the item is title-only. */
  notes: string;
  /** The PR's page, when release-kit could derive one. */
  url?: string;
};

export type Release = {
  version: string;
  /** ISO 8601 date of the tag. */
  date: string;
  title: string;
  type: ReleaseType;
  scope?: string;
  /** Pull request number the release came from. */
  pr?: number;
  breaking: boolean;
  /** Markdown release note; untrusted text to be rendered safely. */
  notes: string;
  url?: string;
  /** Empty for a baseline, one for a per-PR release, one per PR for a rollup. Absent from an older server. */
  items?: ReleaseItem[];
};

export type ReleasesResponse = {
  /** The running version and how many releases are newer than it; `null` when it cannot be placed. */
  current: { version: string; ahead: number } | null;
  /** Newest first. */
  releases: Release[];
};
