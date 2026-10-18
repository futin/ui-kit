# ui-kit

Shared React UI for futin's apps — claude-agents-dashboard, backlog-manager and guide-manager. It ships small components and one stylesheet of neutral defaults
that each app themes through `--uk-*` custom properties, so one implementation renders in three different visual systems.

The first content is the releases UI (version chip and What's new drawer), designed in release-kit's
`docs/superpowers/specs/2026-10-18-shared-releases-ui-design.md`. So far the package exports its wire types (`Release`, `ReleasesResponse`, `ReleaseType`) and the pure releases logic in `src/releases/logic.ts` (`isVersion`, `compareVersions`, `chipLabel`, `displayTitle`, `TYPE_LABEL`, `dotState`, `readLastSeen(key)`, `writeLastSeen(key, v)`, `formatReleaseDate`, `isReleasesResponse`) and the default notes renderer in `src/releases/notes.ts` (`renderNotesHtml(md)`, escape-first, safe to set
with no app sanitiser behind it), the hooks `useReleases(url?)` and `useWhatsNew({ storageKey, url? })` in `src/releases/`, the components `VersionChip`, `ReleasesPanel` and `ReleasesDrawer` in `src/releases/`, and `Drawer` and `useMediaQuery(query)` (so a host derives the drawer's `narrow` from its own breakpoint) in `src/ui/`, styled by `ui-kit/styles.css` (see §Tokens); shared test data lives in `fixtures/releases.ts`, which is never shipped.

## Rules

- Classes are `uk-*`. Every custom property is `--uk-*` and every `var(--uk-…)` carries a fallback, so an app that maps none still renders.
- The shipped CSS has no media queries; layout decisions that depend on width are the host's, passed in as props.
- Components never import CSS. The host imports `ui-kit/styles.css` once from its client entry, so a Jest suite over CommonJS never meets a `.css` import.
- `react` (`^18.3 || ^19`) is the only peer dependency; there is no `react-dom` peer.
- release-kit is a devDependency only: ui-kit defines its own wire types and checks at compile time that release-kit's are assignable to them.

## Tokens

`ui-kit/styles.css` reads these custom properties, each with the neutral default shown, so a host that maps none still gets a plain light drawer:

| Token | Default | Used for |
| --- | --- | --- |
| `--uk-panel-bg` | `#fff` | drawer panel background |
| `--uk-ink` | `#222` | primary text: heading, version, title, chip on hover |
| `--uk-ink-muted` | `#666` | secondary text: chip, dates, "running", notes, close button |
| `--uk-hairline` | `#e5e5e5` | divider between release entries |
| `--uk-scrim` | `rgba(0, 0, 0, .4)` | overlay behind the drawer |
| `--uk-shadow` | `rgba(0, 0, 0, .15)` | drawer panel's left-edge shadow |
| `--uk-accent` | `#2563eb` | the chip's unseen-release dot, links, the PR link |
| `--uk-hover-bg` | `rgba(0, 0, 0, .06)` | close button background on hover |
| `--uk-code-bg` | `rgba(0, 0, 0, .06)` | inline `code` in release notes |
| `--uk-feat-ink` / `--uk-feat-tint` | `#1a5e2a` / `#e3f4e6` | Feature badge text / background |
| `--uk-fix-ink` / `--uk-fix-tint` | `#7a4a00` / `#fbf0dc` | Fix badge text / background |
| `--uk-perf-ink` / `--uk-perf-tint` | `#7d1f6b` / `#f8e4f3` | Performance badge text / background |
| `--uk-breaking-ink` / `--uk-breaking-tint` | `#9b1c1c` / `#fde4e4` | Breaking badge text / background |
| `--uk-font` | `system-ui, sans-serif` | chip and drawer font family |
| `--uk-font-mono` | `ui-monospace, monospace` | inline `code` in release notes |
| `--uk-font-size` | `14px` | body text: version, title, notes |
| `--uk-font-size-sm` | `12px` | meta text: chip, dates, "running", PR link, baseline row |
| `--uk-font-size-xs` | `11px` | badges |
| `--uk-font-size-lg` | `20px` | the "What's new" heading |
| `--uk-radius` | `12px` | chip and close button corners |
| `--uk-drawer-width` | `400px` | drawer panel width (ignored under `narrow`, which is full screen) |
| `--uk-z` | `40` | stacking order of the scrim and drawer |

A host themes ui-kit by mapping these onto its own tokens once, in its own stylesheet, after importing `ui-kit/styles.css` — for example
`:root { --uk-panel-bg: var(--strip); --uk-ink: var(--ink); --uk-ink-muted: var(--ink3); --uk-accent: var(--accent); --uk-feat-ink: var(--green-ink); }`.
Map only what differs from the defaults; anything left unmapped falls back. Because each mapping points at the host's own variables, a host with light and
dark themes gets both for free, and its contrast tests (each badge ink against its tint, at 4.5:1) stay in its own suite over its own values. Layout
classes, spacing and the phone shape are not tokens: they are ui-kit's structure, and `narrow` is how a host asks for the full-screen drawer.

## Consuming

Install from a version tag. `dist/` is committed, so nothing builds at install time:

```bash
pnpm add github:futin/ui-kit#vX.Y.Z
```

```ts
import 'ui-kit/styles.css'; // once, in the client entry
import { ReleasesDrawer, VersionChip, useWhatsNew } from 'ui-kit';
```

The package resolves to ESM for bundlers and to CommonJS for `require`, with `.d.ts` types for both.

## Developing

```bash
npm install
npm run build      # regenerates dist/ (esm, cjs, .d.ts, styles.css)
npm test           # node:test via tsx (hook tests on a jsdom global); includes the dist-drift test
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
