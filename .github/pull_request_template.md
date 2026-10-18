<!--
Title: Conventional Commits — feat(scope): / fix(scope): / docs: / chore: — `ci / pr-title` checks it, and feat/fix/perf cut a release on merge.
Lowercase, imperative, no trailing period. Scope is the area (releases, ui, tokens, playground…).

House rules for the body:
  • Lead in user terms first — what an app using ui-kit can now do.
  • State what you did NOT verify.
  • Every src/ change ships its rebuilt dist/: run npm run build before npm test, and commit both.
  • Delete every optional section that does not apply. A docs-only PR is three lines.
-->

<!-- LEAD (required, unlabelled): 1–3 sentences. What this does, in user terms. -->

## What's new

<!-- 1–3 lines in user terms: what an app using ui-kit can now do. These lines become the release notes. Delete this section for PRs with nothing
     user-visible. -->

## Why this shape

<!-- The constraint that forced this design, and the alternative you rejected.
     For a fix, retitle this "## The bug" and give the symptom, the mechanism,
     and how it was found. -->

## What changed

<!-- Group by boundary: components, hooks, tokens and styles.css, build and packaging, docs. Drop the groups you didn't touch. -->

-

## Verification

<!-- Required. Commands with their actual result, then what a human did by hand, then the honest gap. Never claim green without the output. -->

`npm run build` → `git status --porcelain dist` empty · `npm test` → pass (N cases, M new) · `npm run typecheck` clean

**Not verified, and it needs a human:**
-
