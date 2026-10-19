# One look for the releases UI — design

Date: 2026-10-19. Repos: ui-kit (the change), then guide-manager, backlog-manager and claude-agents-dashboard (the consumers, one PR each).

## Why

ui-kit exists so the three apps render the same UI. Today they don't. The version chip is a bare muted label in guide-manager and a pill in
backlog-manager and claude-agents-dashboard — and the pill is not ui-kit's: both apps draw it themselves, through the `className` hook on `VersionChip`
(`.rail-release`, `.rel-chip`), with copy-pasted rules. The drawer has drifted the same way: backlog-manager restyles the notes, h3s, badges, the
base-version line, the panel's edge and shadow; the dashboard restyles the notes. ui-kit's own defaults are the one look nobody ships.

The user's rule: **ui-kit owns every shape; an app owns only its colours and font.** The apps must not be able to drift again.

## Goals

- The chip and the What's new drawer look the same in all three apps, apart from colour and font family.
- That look is backlog-manager's current one (the user's choice), moved into `ui-kit/styles.css`.
- The release notes' *content* looks the same too: one renderer, ui-kit's, in every app (D8).
- An app cannot restyle ui-kit: not through a prop, not through its own CSS. A guard test in each app fails if it tries.

## Non-goals

- The chip's label format. `v0.2.0+3` means three commits past the `v0.2.0` tag; it is ui-kit's `chipLabel` (`src/releases/logic.ts`), identical in every app, and stays.
- Any other ui-kit component (there are none yet beyond `Drawer`, which the releases drawer is).
- Where an app puts the chip. Placement — which element it sits in, `margin-top: auto` to sink it to the rail's foot — stays the app's (see D3).

## Anti-goals

- A dark-themed app getting a white drawer or a light pill. Colours keep flowing through the `--uk-*` mapping; nothing here hard-codes a palette.
- A guard so broad it blocks the token mapping itself, or so narrow a `.uk-releases-notes h3 { … }` rule slips past it.

## Decisions

**D1 — What may an app map (user's call: "tokens only"; the split below is the author's call, accepted in playback).** Public tokens after this change:

- colours: `--uk-panel-bg`, `--uk-ink`, `--uk-ink-muted`, `--uk-hairline`, `--uk-scrim`, `--uk-shadow`, `--uk-accent`, `--uk-hover-bg`, `--uk-code-bg`,
  `--uk-chip-bg` (new, D4), and the eight `--uk-{feat,fix,perf,breaking}-{ink,tint}`;
- font family: `--uk-font`, `--uk-font-mono`;
- integration, not look: `--uk-z` (stacking against the host's own overlays) and `--uk-zoom` (new, D5).

Removed from the public set: `--uk-font-size`, `--uk-font-size-sm`, `--uk-font-size-xs`, `--uk-font-size-lg`, `--uk-radius`, `--uk-drawer-width`. ui-kit
writes those values as **literals**, not as `--uk-`-named private properties — backlog-manager's `test/ui-kit-tokens.test.ts` requires every `--uk-*` the
kit reads to be mapped or excused, so a private `--uk-` name would collide with D7 rule 2 (builder check). That test's `KIT_DEFAULT` excuse list goes stale
and is pruned on the bump. An app mapping a removed token is a guard failure (D7).

**D2 — The canonical look is backlog-manager's (user's call).** Values below are lifted from `backlog-manager/client/src/styles.css` (`.rail-release`
at ~line 246, the `.uk-*` block at ~2757–2770) and its `--uk-*` mapping at ~2725–2745; where that file reads a theme variable, ui-kit reads the matching
`--uk-*` token.

Chip (`.uk-chip`):

- `inline-flex`, centred, `gap: 6px`, `min-height: 28px`, `padding: 4px 10px`, `border-radius: 999px`;
- 12px / 500, colour `--uk-ink-muted`, hover `--uk-ink`;
- background `--uk-chip-bg`, `1px solid --uk-hairline` border; hover also darkens the border (backlog-manager uses `--hairline2`; ui-kit has no second
  hairline token — builder's call whether to add `--uk-hairline-strong` or keep the border constant on hover; prefer not adding a token for one hover);
- the dot stays `.uk-chip-dot`, `--uk-accent`, 7px; it sits after the label (backlog-manager's order, already the kit's markup);
- `narrow` (D3): the pill keeps its look but its hit area reaches 44px tall, for a phone menu row. Builder's call how — `min-height: 44px` on the button
  with the pill drawn by an inner span, or a transparent `::before` extending the target; the visible pill must not grow.

Note backlog-manager maps `--uk-ink-muted` to `--ink3` but draws the chip in `--ink2`. Under this design the chip is `--uk-ink-muted`, so the chip in
backlog-manager gets a shade lighter unless that app remaps `--uk-ink-muted` to `--ink2` — which also lightens/darkens the drawer's dates and notes.
guide-manager shifts the other way: `.rail-version` draws its chip in `--ink3` today, and its `--uk-ink-muted` is `--ink2`, so its chip gets a shade
darker, and the comment at `shared/theme.css:168-169` ("The chip keeps its --ink3") becomes false and is rewritten. Builder's call per app; the guard does
not care which colour token an app picks.

Drawer:

- panel: `width: min(400px, calc(100vw / var(--uk-zoom, 1)))`, `height: calc(100dvh / var(--uk-zoom, 1))` (keep the `100vh` line before it for browsers
  without `dvh`, divided by `--uk-zoom` the same way), `border-left: 1px solid --uk-hairline`, `box-shadow: -24px 0 64px --uk-shadow`;
- narrow: `width: calc(100vw / var(--uk-zoom, 1))`, no left border, no shadow, padding `20px 16px` as today;
- heading 19px (backlog-manager's `--uk-font-size-lg`);
- notes 13px, below the 14px title; `.uk-releases-notes h3` 13 / 600 / `--uk-ink`, margin `10px 0 4px`; the first child of the notes has no top margin;
  every element D8's renderer emits is styled here, and only those;
- badges weight 500 (was 600);
- the base-version line (`.uk-releases-base`): `gap: 10px`, a hairline rule on each side (`::before`/`::after`, `flex: 1`, 1px, `--uk-hairline`), the
  date in the gap rather than pushed right.

Everything not listed keeps ui-kit's current value.

**D3 — `VersionChip` loses `className`, gains `narrow` (user's calls: "guard in code"; "ui-kit adds narrow prop").** `className` and its test
(`appends the host className`) go. `narrow?: boolean` comes in, same meaning as the drawer's: the host derives it from its own breakpoint (`useMediaQuery`)
and ui-kit gives the chip a 44px touch target (D2). guide-manager's `test/phone-css.test.ts:56` (`.rail-version` 44px) is rewritten to assert the app
passes `narrow` in the phone menu, not a CSS height. backlog-manager and the dashboard pass it too — their phone menus get the 44px target they lack today. An app that needs to
place the chip wraps it in its own element and places that: `<div className="rail-version-slot"><VersionChip …/></div>`. The wrapper may set layout on
itself (margins, `align-self`, order) — it is the app's element, not ui-kit's, and the guard does not look at it. `onClick` stays, so an app can still
close its phone menu on tap.

**D4 — New token `--uk-chip-bg`** for the pill's fill (backlog-manager and the dashboard both use `--steel`). Default: a light neutral well, e.g.
`rgba(0, 0, 0, .05)` — builder's call on the exact value.

**D5 — New token `--uk-zoom` (author's call).** guide-manager, backlog-manager and the dashboard all zoom their `.shell` by `--font-scale`, which leaves
`100dvh`/`100vw` meaning the unzoomed screen; guide-manager and backlog-manager each patch `.uk-drawer` for it, the dashboard does not (its drawer likely
overhangs at a non-1 scale — worth confirming while there). ui-kit divides its viewport units by `var(--uk-zoom, 1)`; each app maps
`--uk-zoom: var(--font-scale, 1)` with its other tokens. Default 1 means no change for a host that does not zoom.

**D6 — Releases as ui-kit `v0.3.0`, breaking.** Removing props and six tokens is breaking; the PR title is `feat!: …`, which release-kit turns into a
minor while ui-kit is 0.x (builder check confirmed). README §Tokens is rewritten to D1's set, and §Rules gains the rule itself: *hosts map tokens
and nothing else; every `.uk-*` rule lives in this sheet.* The sentence in §Tokens about layout classes stays true and is joined by sizes.

ui-kit's release workflow opens an automatic `chore(deps): bump ui-kit to v0.3.0` PR in each consumer. That PR will fail typecheck in all three apps —
each passes `className` to `VersionChip` and `renderNotes` to `ReleasesDrawer` — so each app's cleanup lands **on** that bump PR (or replaces it), never
after it. The bump PR arrives with GitHub auto-merge enabled (release-kit README §bump; all three consumers allow auto-merge), so the first push that turns
CI green would merge it as `chore(deps)` with no release: **disable auto-merge on the bump PR before pushing to it**, and do not re-run ui-kit's bump
workflow while cleanup sits on that branch — a re-run force-pushes a bump branch it finds. Each app's PR is retitled `fix(releases): one look for the version chip and What's new drawer` (or close to it) with a `## What's new`
section, so the visible change cuts a release in that app (user's call).

**D7 — A guard test in each app (user's call).** It reads the app's own stylesheets (every `.css` under its client source and, for guide-manager,
`shared/theme.css`) and fails when:

1. any rule's selector names a `uk-` class (`.uk-chip`, `.uk-drawer.uk-drawer--narrow`, `.uk-releases-notes h3`, `.foo .uk-chip-dot` …) — **except** a
   rule whose declarations are *only* `--uk-*` custom properties (the token mapping; the dashboard sets it on `.uk-chip,.uk-drawer-scrim` rather than
   `:root`, which is legitimate and must pass);
2. any declaration anywhere sets a `--uk-*` property outside D1's public set (catches `--uk-font-size-lg: 19px`, `--uk-radius`, …);
3. any `.tsx` passes `className` or `renderNotes` to a ui-kit component — typecheck already catches this after the bump; the test need not duplicate it.

Parse with a real CSS parser if the app already has one in its dev deps (postcss is likely present via Vite); otherwise a small rule splitter is fine —
the sheets are hand-written, no nested `@media` contains `.uk-` today. The test asserts on the general form, not on today's list of class names, so a
future ui-kit component is covered without editing it (same principle as guide-manager's `test/tailnet-script.test.ts`). Each app also gets one line in
its CLAUDE.md invariants pointing at the guard.

Test cases the guard must get right (each a fixture string, not the real sheet):

- `:root { --uk-ink: var(--ink); --uk-zoom: var(--font-scale, 1) }` → pass
- `.uk-chip,.uk-drawer-scrim { --uk-ink: var(--ink) }` → pass
- `.uk-chip { color: red }` → fail, names `.uk-chip`
- `.uk-chip,.uk-drawer-scrim { --uk-ink: var(--ink); color: red }` → fail (mixed)
- `.rail .uk-chip-dot { width: 9px }` → fail
- `.uk-releases-notes h3 { font-size: 13px }` → fail
- `:root { --uk-font-size-lg: 19px }` → fail, names the token
- `.rail-version-slot { margin-top: auto }` → pass
- a comment mentioning `.uk-chip` → pass (comments are not rules)

Plus one case run over the app's real stylesheets → pass.

**D8 — One notes renderer, ui-kit's (user's call).** Today each app brings its own: guide-manager uses `renderNotesHtml` (no headings — a `###` line
shows as text), backlog-manager its `renderMarkdown` (`marked`-based), the dashboard its `<Markdown>` emitting `.md-*` classes it styles itself. After:

- `renderNotesHtml` grows to cover what PR bodies' `## What's new` sections use: paragraphs, `-`/`*` lists, `###` headings (→ `h3`), inline code,
  `**bold**`, `_em_`, and `[text](url)` links. It stays escape-first: everything is escaped, then only these constructs are turned back into tags, and a
  link's `href` must be `http(s):` (anything else renders as text). No raw HTML passes through. Builder's call whether to keep the hand-written renderer or
  vendor a small dependency — the rule above is the contract either way, and ui-kit's tests cover each construct plus the hostile cases (`<script>`,
  `javascript:` link, an `onerror` attribute in the text). `_em_` and `**bold**` open only at a word boundary and close only before one, so a
  `snake_case_name` stays plain text. Heading depths other than `###` (`#`, `##`, `####`…) render as plain paragraphs with the hashes kept — a `## What's
  new` body should not contain them, and a visible `##` shows the author the mistake. Both rules get test cases.
- `ReleasesDrawer`/`ReleasesPanel` lose `renderNotes`. In its place `sanitize?: (html: string) => string` (author's call): a host may run ui-kit's HTML
  through its own sanitiser before it is set — guide-manager keeps its second wall (`sanitizeSnapshot`, CLAUDE.md's "notes' second sanitising wall") — but
  cannot change the markup, so the notes cannot drift. A sanitiser that strips tags would change the look; that is accepted, the wall is a safety net.
- Fixtures: add a notes sample with every construct, rendered in the playground, so the three apps' real `## What's new` bodies are checked once.

## Per-app work (after ui-kit v0.3.0 is tagged)

- **guide-manager** — `SideRail.tsx`: wrap the chip, drop `className`; `client/src/styles.css`: `.rail-version` becomes the wrapper's layout-only rule,
  delete `.uk-drawer { height … }`; `shared/theme.css`: add `--uk-zoom`, `--uk-chip-bg` (→ `--steel`); check the badge contrast suite
  (`test/theme-tokens.test.ts`) still passes — badge weight drops to 500, colours unchanged; update the CLAUDE.md invariant that describes the chip and
  `.uk-drawer`'s height rule; pass `narrow` to the chip — `SideRail.tsx` has no breakpoint today, the 639px query is a private `const NARROW` in
  `ReleasesDrawer.tsx:15`, so lift it into a shared module both read via `useMediaQuery`; swap `renderNotes` for `sanitize={sanitizeSnapshot}`; fix
  `test/releases-ui.test.tsx:39-40` (`.rail .rail-version` would now be the wrapper div, which has no `onClick` — target the inner `.uk-chip` button) and
  rewrite `test/phone-css.test.ts:56` (D3). Add the guard.
- **backlog-manager** — `SideRail.tsx` wrap; delete `.rail-release`'s visual declarations (keep placement on the wrapper) and the whole `.uk-*` block at
  ~2757–2770; remove `--uk-font-size-lg`; add `--uk-zoom`, `--uk-chip-bg`. `test/rail.test.tsx:362` breaks: `expect(nav.lastElementChild).toBe(chip())` — the nav's last child is now the wrapper, so assert the
wrapper is last and holds the chip. `.claude/DESIGN.md` §8.7 and
  §8.10 now describe ui-kit's look — point them at ui-kit rather than restating values. Drop `renderNotes` (its `renderMarkdown` stays for the item
  modal); pass `narrow`; prune `test/ui-kit-tokens.test.ts`'s `KIT_DEFAULT`. Add the guard.
- **claude-agents-dashboard** — `SideRail.tsx` wrap; `.rel-chip` keeps only placement (`margin`, `align-self`, `.foot + …` spacing) and moves to the
  wrapper; delete `.uk-releases-notes .md` and `--uk-font-size-lg` (`--uk-z` stays — integration); add `--uk-zoom`, `--uk-chip-bg` (the mapping on
  `.uk-chip,.uk-drawer-scrim` carries `--uk-zoom` fine — `--font-scale` inherits from the root). Drop `renderNotes`; pass `narrow`. Fix
  `test/releases-client.test.ts:91` (asserts `className="rel-chip"`) and `:95-100` (asserts the source text `renderNotes={t => <Markdown text={t} />}`), `test/visual/views.spec.ts:88` (clicks `.rel-chip`; the `releases` visual
  baselines will change — re-record them), and `docs/subsystems/releases.md:39`. Add the guard.

After each, look at the rail and open the drawer in the running app, light and dark, at font-scale 1 and one other value.

## Left to the builder

- Exact default for `--uk-chip-bg`; whether hover changes the chip's border; how the narrow chip's 44px target is built (D2).
- Hand-written renderer vs a small dependency for D8, within its contract.
- Literal values vs undocumented private custom properties for the removed size tokens.
- CSS parser vs hand splitter for the guard; whether to share the guard as a tiny exported helper from ui-kit (e.g. `ui-kit/guard`, dev-only) instead of
  three copies. Sharing is preferred if it does not drag a runtime dependency into the apps' bundles — the rule is ui-kit's, so its check can be too.
- ui-kit's playground maps (README §Developing) need the new tokens and lose the removed ones.
