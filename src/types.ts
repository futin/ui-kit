// Releases wire types: the JSON shape release-kit's reader answers with, owned here so ui-kit has no runtime dependency on release-kit (spec D19).
// test/type-contract.test.ts proves at compile time that release-kit's ReleasesResponse is assignable to this one.

/** `baseline` is the first tag, which carries no conventional-commit type. */
export type ReleaseType = 'feat' | 'fix' | 'perf' | 'baseline';

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
};

export type ReleasesResponse = {
  /** The running version and how many releases are newer than it; `null` when it cannot be placed. */
  current: { version: string; ahead: number } | null;
  /** Newest first. */
  releases: Release[];
};
