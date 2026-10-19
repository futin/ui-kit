# ui-kit

Shared React UI for futin's apps — claude-agents-dashboard, backlog-manager and guide-manager. It ships small components and one stylesheet of neutral defaults
that each app themes through `--uk-*` custom properties, so one implementation renders in three different visual systems.

The first content is the releases UI (version chip and What's new drawer), designed in release-kit's
`docs/superpowers/specs/2026-10-18-shared-releases-ui-design.md`. So far the package exports its wire types (`Release`, `ReleasesResponse`, `ReleaseType`) and the pure releases logic in `src/releases/logic.ts` (`isVersion`, `compareVersions`, `chipLabel`, `displayTitle`, `TYPE_LABEL`, `dotState`, `readLastSeen(key)`, `writeLastSeen(key, v)`, `formatReleaseDate`, `isReleasesResponse`) and the notes renderer in `src/releases/notes.ts` (`renderNotesHtml(md)`, escape-first, safe to set
with no app sanitiser behind it), the hooks `useReleases(url?)` and `useWhatsNew({ storageKey, url? })` in `src/releases/`, the components `VersionChip`, `ReleasesPanel` and `ReleasesDrawer` in `src/releases/`, and `Drawer` and `useMediaQuery(query)` (so a host derives the drawer's `narrow` from its own breakpoint) in `src/ui/`, styled by `ui-kit/styles.css` (see §Tokens); shared test data lives in `fixtures/releases.ts` (and the notes Markdown in `fixtures/notes.ts`), which are never shipped, and the dev-only playground in `playground/` is never shipped either (see §Developing).

## Rules

- Hosts map tokens and nothing else: every `.uk-*` rule lives in `ui-kit/styles.css`, enforced by `ui-kit/guard`. Sizes and geometry are ui-kit's, so the chip and drawer look identical in every app.
- Classes are `uk-*`. Every custom property is `--uk-*` and every `var(--uk-…)` carries a fallback, so an app that maps none still renders.
- The shipped CSS has no media queries; layout decisions that depend on width are the host's, passed in as props.
- Components never import CSS. The host imports `ui-kit/styles.css` once from its client entry, so a Jest suite over CommonJS never meets a `.css` import.
- `react` (`^18.3 || ^19`) is the only peer dependency; there is no `react-dom` peer.
- release-kit is a devDependency only: ui-kit defines its own wire types and checks at compile time that release-kit's are assignable to them.

## Tokens

`ui-kit/styles.css` reads these 22 custom properties and no others, each with the neutral default shown, so a host that maps none still gets a plain light drawer:

| Token | Default | Used for |
| --- | --- | --- |
| `--uk-panel-bg` | `#fff` | drawer panel background |
| `--uk-ink` | `#222` | primary text: heading, version, title, chip on hover |
| `--uk-ink-muted` | `#666` | secondary text: chip, dates, "running", notes, close button |
| `--uk-hairline` | `#e5e5e5` | divider between release entries, the chip's and the drawer's border, the baseline's rules |
| `--uk-scrim` | `rgba(0, 0, 0, .4)` | overlay behind the drawer |
| `--uk-shadow` | `rgba(0, 0, 0, .15)` | drawer panel's left-edge shadow |
| `--uk-accent` | `#2563eb` | the chip's unseen-release dot, links, the PR link |
| `--uk-hover-bg` | `rgba(0, 0, 0, .06)` | close button background on hover |
| `--uk-code-bg` | `rgba(0, 0, 0, .06)` | inline `code` in release notes |
| `--uk-chip-bg` | `rgba(0, 0, 0, .05)` | the version chip's fill |
| `--uk-feat-ink` / `--uk-feat-tint` | `#1a5e2a` / `#e3f4e6` | Feature badge text / background |
| `--uk-fix-ink` / `--uk-fix-tint` | `#7a4a00` / `#fbf0dc` | Fix badge text / background |
| `--uk-perf-ink` / `--uk-perf-tint` | `#7d1f6b` / `#f8e4f3` | Performance badge text / background |
| `--uk-breaking-ink` / `--uk-breaking-tint` | `#9b1c1c` / `#fde4e4` | Breaking badge text / background |
| `--uk-font` | `system-ui, sans-serif` | chip and drawer font family |
| `--uk-font-mono` | `ui-monospace, monospace` | inline `code` in release notes |
| `--uk-z` | `40` | stacking order of the scrim and drawer |
| `--uk-zoom` | `1` | divides the drawer's viewport units; map it to your shell's zoom |

A host themes ui-kit by mapping these onto its own tokens once, in its own stylesheet, after importing `ui-kit/styles.css` — for example
`:root { --uk-panel-bg: var(--strip); --uk-ink: var(--ink); --uk-ink-muted: var(--ink3); --uk-accent: var(--accent); --uk-feat-ink: var(--green-ink); }`.
Map only what differs from the defaults; anything left unmapped falls back. Because each mapping points at the host's own variables, a host with light and
dark themes gets both for free, and its contrast tests (each badge ink against its tint, at 4.5:1) stay in its own suite over its own values. Layout
classes, sizes (type, radius, spacing, the drawer's width and height) and the phone shape are not tokens: they are ui-kit's, the same in every app, and `narrow` is
how a host asks for the full-screen drawer. A host that scales its UI with CSS `zoom` maps `--uk-zoom` to that factor so the drawer still fits the window.

## Consuming

Install from a version tag. `dist/` is committed, so nothing builds at install time:

```bash
pnpm add github:futin/ui-kit#vX.Y.Z
```

```ts
import 'ui-kit/styles.css'; // once, in the client entry — never from a component, so a Jest suite over CommonJS never meets a .css import
import { ReleasesDrawer, VersionChip, useWhatsNew } from 'ui-kit';
```

The package resolves to ESM for bundlers and to CommonJS for `require`, with `.d.ts` types for both. React comes from the app: `react` is a peer, and
nothing in `dist/` bundles a copy of it (`test/packaging.test.ts` checks both builds load and that the only package `dist/` reaches is `react`).

Add the guard to the app's own tests: it reads the app's stylesheets and fails on any rule that restyles a `.uk-*` class or sets a `--uk-*` property that is
not a public token. It is dev-only — `ui-kit/guard` is its own entry and the main entry never exports it, so it stays out of the client bundle.

```ts
import { checkHostCss } from 'ui-kit/guard'; // also exports PUBLIC_TOKENS, the 22 tokens an app may map
it('maps tokens and never restyles the kit', () => expect(checkHostCss(readFileSync('client/src/theme.css', 'utf8'))).toEqual([])); // read each sheet
```

Each app wraps `ReleasesDrawer` once in its shell, fed by `const w = useWhatsNew({ storageKey })`. The drawer accepts the host's dismiss and focus layer
instead of owning one, so the wrapper is one of three shapes:

```tsx
// Default: the drawer closes itself on Escape and on a scrim click.
{w.open && w.data && <ReleasesDrawer data={w.data} onClose={w.close} />}
// Escape stack: the host already routes Escape to its topmost layer, so the drawer adds no key listener and the stack calls w.close.
{w.open && w.data && <ReleasesDrawer data={w.data} onClose={w.close} closeOnEscape={false} />}
// Back gesture: with narrow = useMediaQuery('(max-width: 640px)') the phone drawer is full screen, so the system back closes it — push a history
// entry on open, call w.close on popstate, and close through history.back() so the entry is consumed.
{w.open && w.data && <ReleasesDrawer data={w.data} onClose={() => history.back()} narrow={narrow} />}
```

The chip is `{w.chip && <VersionChip label={w.chip.label} dot={w.chip.dot} onClick={w.show} />}` in all three. Pass `restoreFocus` when the opener can
disappear while the drawer is open. On a narrow layout pass `narrow` to the chip as well: `<VersionChip … narrow={narrow} />` adds `uk-chip--narrow`,
which keeps the same visible pill but gives it a 44x44 transparent hit area for a thumb. The hit area overhangs the pill (8px above and below), so an ancestor
with `overflow: hidden` or `overflow: auto` clips it: do not place the narrow chip inside one that would. The chip takes no `className`; its look is ui-kit's.

Notes always render through ui-kit's own `renderNotesHtml`, so every app's drawer reads the same; there is no prop that swaps the renderer. A host with its
own sanitising policy passes `sanitize` (on `ReleasesDrawer` or `ReleasesPanel`), a `(html: string) => string` that runs over `renderNotesHtml`'s output, and
what it returns is what renders inside `.uk-releases-notes`. `ADD_ATTR: ['target']` keeps the `target="_blank"` that DOMPurify's default list would drop:
`<ReleasesDrawer data={w.data} onClose={w.close} sanitize={(html) => DOMPurify.sanitize(html, { ADD_ATTR: ['target'] })} />`.

## Developing

```bash
npm install
npm run build      # regenerates dist/ (esm, cjs, .d.ts, styles.css)
npm test           # node:test via tsx (hook tests on a jsdom global); includes the dist-drift test
npm run typecheck
npm run dev        # the playground: every fixture under three approximate app themes, plus a real drawer
```

Run `npm run build` before `npm test`, and commit `dist/` with every `src/` change: the dist-drift test fails when the committed `dist/` differs from a fresh
build.

`npm run dev` serves `playground/` with Vite: each fixture in `fixtures/releases.ts` as a chip and an open panel, side by side under three token maps in
`playground/themes.css` that approximate guide-manager (midnight), backlog-manager (daylight) and the dashboard (graphite), and one button per theme that
opens a real `ReleasesDrawer` over `NOTES_ALL_CONSTRUCTS`, the Markdown that exercises every construct the notes renderer handles. The maps are copied by hand
and nothing keeps them in step with the apps, so an app's real look is still checked in that app.
The playground is never built into `dist/` and never shipped.

## Releases

CI and releases run through release-kit's reusable workflows (`.github/workflows/ci.yml`, `.github/workflows/release.yml`); the PR title decides the
version bump, and the PR's `## What's new` section is the release note. After each release the `bump` job opens a `chore(deps): bump ui-kit to vX.Y.Z` PR in
every consumer that is behind, using the `BUMP_TOKEN` secret.

## Storybook

Storybook later — trigger: first multi-state primitive.
