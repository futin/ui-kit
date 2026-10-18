# ui-kit

Shared React UI for futin's apps — claude-agents-dashboard, backlog-manager and guide-manager. It ships small, unstyled-by-default components that each
app themes through `--uk-*` custom properties, so one implementation renders in three different visual systems.

The first content is the releases UI (version chip and What's new drawer), designed in release-kit's
`docs/superpowers/specs/2026-10-18-shared-releases-ui-design.md`. So far the package exports its wire types (`Release`, `ReleasesResponse`, `ReleaseType`) and the pure releases logic in `src/releases/logic.ts` (`isVersion`, `compareVersions`, `chipLabel`, `displayTitle`, `TYPE_LABEL`, `dotState`, `readLastSeen(key)`, `writeLastSeen(key, v)`, `formatReleaseDate`, `isReleasesResponse`); shared test data lives in `fixtures/releases.ts`, which is never shipped.

## Rules

- Classes are `uk-*`. Every custom property is `--uk-*` and every `var(--uk-…)` carries a fallback, so an app that maps none still renders.
- The shipped CSS has no media queries; layout decisions that depend on width are the host's, passed in as props.
- Components never import CSS. The host imports `ui-kit/styles.css` once from its client entry, so a Jest suite over CommonJS never meets a `.css` import.
- `react` (`^18.3 || ^19`) is the only peer dependency; there is no `react-dom` peer.
- release-kit is a devDependency only: ui-kit defines its own wire types and checks at compile time that release-kit's are assignable to them.

## Tokens

Placeholder: the `--uk-*` list, each token's default, and how an app maps them onto its own theme land with the stylesheet.

## Consuming

Install from a version tag. `dist/` is committed, so nothing builds at install time:

```bash
pnpm add github:futin/ui-kit#vX.Y.Z
```

```ts
import 'ui-kit/styles.css'; // once, in the client entry
import { /* components */ } from 'ui-kit';
```

The package resolves to ESM for bundlers and to CommonJS for `require`, with `.d.ts` types for both.

## Developing

```bash
npm install
npm run build      # regenerates dist/ (esm, cjs, .d.ts, styles.css)
npm test           # node:test via tsx; includes the dist-drift test
npm run typecheck
```

Run `npm run build` before `npm test`, and commit `dist/` with every `src/` change: the dist-drift test fails when the committed `dist/` differs from a fresh
build.

## Releases

CI and releases run through release-kit's reusable workflows (`.github/workflows/ci.yml`, `.github/workflows/release.yml`); the PR title decides the
version bump, and the PR's `## What's new` section is the release note. After each release the `bump` job opens a `chore(deps): bump ui-kit to vX.Y.Z` PR in
every consumer that is behind, using the `BUMP_TOKEN` secret.

## Storybook

Storybook later — trigger: first multi-state primitive.
