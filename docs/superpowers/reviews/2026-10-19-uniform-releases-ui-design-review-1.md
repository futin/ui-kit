# Review 1 — `docs/superpowers/specs/2026-10-19-uniform-releases-ui-design.md`

Reviewer: independent doc-review subagent (Fable). Date: 2026-10-19.
Repos read: `ui-kit` (spec's home), `release-kit`, `guide-manager`, `backlog-manager`, `claude-agents-dashboard`. Every code claim below was checked by
reading the cited file at the cited line; the spec's own description of the code was not trusted.

## Verdict: APPROVE WITH FIXES

No Critical findings. The design itself (D1–D8) is sound and consistent with the three apps' hard rules; the fixes are factual corrections and
under-specified requirements that would otherwise send the builder down a wrong path or leave a test to discover.

## Important

- **[I] spec:23 — "release-kit's `chipLabel`" is false.** `chipLabel` is ui-kit's: defined in `ui-kit/src/releases/logic.ts`, exported from
  `ui-kit/src/index.ts:4`; `release-kit/src/` contains no `chipLabel`. → Say "ui-kit's `chipLabel`" (the non-goal still holds: the label format is not
  changing).

- **[I] spec:98-99 — the bump-PR consequence is misstated on both axes.** (a) backlog-manager *also* passes `className`
  (`backlog-manager/client/src/components/SideRail.tsx:219`, `<VersionChip className="rail-release"`), and all three apps pass `renderNotes`
  (`guide-manager/client/src/components/ReleasesDrawer.tsx:40`, `backlog-manager/client/src/components/ReleasesDrawer.tsx:36`,
  `claude-agents-dashboard/client/src/components/ReleasesDrawer.tsx:15`), so under D3 + D8 the bump PR fails typecheck in **all three**, not two. (b) The
  bump PR arrives with GitHub auto-merge **enabled** where the consumer allows it (`release-kit/README.md:189-190,196-197`; `gh api` today:
  guide-manager `allow_auto_merge=true`, claude-agents-dashboard `true`, backlog-manager `false`). The spec's "cleanup lands on that bump PR" means the
  first push that makes typecheck pass merges the PR under its `chore(deps)` title — no release cut — unless auto-merge is disabled first, which
  release-kit's README names as the step *before* retitling (`README.md:196-201`). A re-run of a cancelled bump also force-pushes the bump branch
  (`README.md:208`), which would discard the app's cleanup. → Correct (a) to "fails typecheck in all three (`className` and `renderNotes`)"; add to the
  procedure: disable auto-merge on the bump PR before pushing to it, and do not re-run the bump workflow while the cleanup sits on that branch.

- **[I] spec:134 — `_em_` has no boundary rule and the heading rule is incomplete.** D8's contract names `_em_` with no word-boundary condition; the
  renderer is applied to PR bodies, where `snake_case` identifiers are routine (`guide-manager.releases-last-seen`, `--uk-ink_muted`, `__html`). A naive
  `_…_` rule italicises mid-word. Likewise only `###` is named: `#`, `##` and `####` lines are left undefined (escape as text? also `h3`?). → State the
  rule exactly (e.g. `_` only at a word boundary; intra-word underscores are literal) and the fate of other heading depths, and add those two cases to
  the test list beside the hostile ones.

- **[I] spec:60-62 vs spec:146-150 — guide-manager's chip changes shade too, and a comment goes stale, but only backlog-manager is called out.**
  `guide-manager/client/src/styles.css:259` draws `.rail-version` in `--ink3`, while `shared/theme.css:175` maps `--uk-ink-muted: var(--ink2)`, and
  `theme.css:168-169` says in so many words "The chip keeps its --ink3, set by `.rail-version`". Under D2 the chip becomes `--uk-ink-muted` → `--ink2`:
  the same lightening the spec documents for backlog-manager, plus a comment that becomes false. → Add the guide-manager case to the note at L60-62
  (builder's call which token, same as backlog) and list "rewrite `theme.css:168-169` comment" in the guide-manager bullet.

- **[I] spec:146,149-150 — guide-manager has no `narrow` source for the chip, and the test fix is under-specified.** "pass `narrow` to the chip":
  `guide-manager/client/src/components/SideRail.tsx` has no media-query hook (only `open` state); the breakpoint lives as a private
  `const NARROW = '(max-width: 639px)'` in `ReleasesDrawer.tsx:15`. And `test/releases-ui.test.tsx:39-40` queries `.rail .rail-version` and *clicks*
  it; after D3 `.rail-version` is a wrapper `div` and a click on it does not reach the inner button's `onClick` — the selector must land on `.uk-chip`
  (or the button role). → Name where `narrow` comes from (export `NARROW`/share the hook) and say the test targets the button inside the wrapper, not
  the wrapper.

- **[I] spec:152 — `test/rail.test.tsx` breaks, but not on a class assertion.** `backlog-manager/test/rail.test.tsx:362` asserts
  `expect(nav.lastElementChild).toBe(chip())` where `chip()` is the button by role; once a wrapper `div` is the rail's last child this fails. The spec's
  "if it asserts the chip's class" sends the builder to grep for a class and find nothing. → Replace with "`test/rail.test.tsx:362` asserts the chip
  button is `nav`'s last child — becomes the wrapper".

- **[I] spec:158 — `test/releases-client.test.ts` breaks at L95-100 as well as L91.** The suite asserts the source text
  `renderNotes=\{t => <Markdown text=\{t\} \/>\}` and `narrow=\{useNarrow\(\)\}` (`claude-agents-dashboard/test/releases-client.test.ts:95-100`); D8
  removes `renderNotes`. → List L95-100 beside L91.

## Minor

- **spec:66 — the `100vh` fallback line is kept verbatim but not divided by `--uk-zoom`.** Browsers without `dvh` then get a panel `--font-scale` times
  too tall — the exact bug `--uk-zoom` exists to fix. → `height: calc(100vh / var(--uk-zoom, 1))` on the fallback line too.
- **spec:68-69 — the dashboard's heading grows 16px → 19px** (`claude-agents-dashboard/client/src/styles.css:3134-3145` maps `--uk-font-size-lg: 16px`)
  and its notes drop from a `.md` 13px to… 13px (same). Only the first is a visible change and it is not mentioned anywhere. → One clause under D2 or the
  dashboard bullet.
- **spec:70 — "every element D8's renderer emits is styled here, and only those"** — list them (`p`, `br`, `ul`, `li`, `code`, `strong`, `em`, `h3`, `a`)
  so the guard/test has a fixed set; today `styles.css:55-61` styles only `p, ul, code, a`.
- **spec:114-115 — "update the CLAUDE.md invariant"** assumes each app has one. `claude-agents-dashboard/.claude/CLAUDE.md` has no Invariants section
  (sections: Orientation, Commands, Code rules, Subagent rules, PR rules, Where things go); backlog-manager's `test/claude-rules.test.ts:44` caps unlinked
  CLAUDE.md bullets at 80 words. → Say "where one exists" and note the word cap.
- **spec:152 — `DESIGN.md`** is `backlog-manager/.claude/DESIGN.md` (§8.7 at L394, §8.10 at L493-499). Path matters for the builder's first grep.
- **spec:153 — `docs/subsystems/releases.md`** also needs updating in backlog-manager (L73 mentions `renderNotes`/`renderMarkdown`) and the dashboard's
  L10 (names `Markdown` as the notes renderer), not only `:39`.
- **spec:153 — `backlog-manager/test/releases-drawer.test.tsx:40-46`** carries a comment that "ui-kit's default would print `###` as text" and L101
  asserts an `h3`; after D8 the comment is false and the assertion passes through ui-kit's renderer instead of `marked` — worth naming so it is rewritten,
  not deleted.
- **spec:155-156 — the mapping block `.uk-chip,.uk-drawer-scrim{…}`** in the dashboard also needs `.uk-drawer` itself to see `--uk-zoom` — it does
  (`.uk-drawer` is a descendant of neither; it is a sibling of the scrim). Check the selector list grows to include `.uk-drawer`, or move the map to `:root`.
- **spec:170 — "the playground's theme maps lose the removed ones"** — `ui-kit/playground/themes.css` maps none of the six removed tokens today; the
  sentence is vacuous. Drop or reword as "stay free of".
- **spec:134 — `--uk-zoom: 0`** makes every `calc(… / 0)` invalid and the panel falls to `auto`. Say the token is "≥ 0.5 or unset", or guard with
  `max(var(--uk-zoom,1), 0.5)`.
- **Guard test (D6) vs comments** — a stylesheet comment containing `--uk-*` or `.uk-` would trip a literal grep. Say the guard strips comments first,
  or that the apps' sheets have none to worry about (today they have the `theme.css:168-169` one).
- **Guard test (D6) vs nested `@media`** — if the guard is "no `.uk-*` selector", make explicit it also walks nested rules so a future
  `@media (max-width:…) { .uk-drawer {…} }` is caught.
- **spec:68 — `.uk-releases-notes > div > :first-child`** (`backlog-manager/client/src/styles.css:2757-2765`) becomes `> :first-child` once D8 drops the
  host's wrapper `div`. Worth one clause so the port keeps the rule.
- **`claude-agents-dashboard/client/src/main.tsx:11`** comment mentions `.rel-chip`; it survives D3 only because the class moves to the wrapper — say so
  or it looks like a missed rename.
- **Taste:** "builder check confirmed" at L95 reads as a note to self; the fact (`release-kit/src/conventional.ts:48-54`, major 0 breaking → minor bump)
  is verified and could just be stated.

## Checked and found correct

- D2's chip and drawer values match `backlog-manager/client/src/styles.css:246-252` and `2757-2765` exactly.
- release-kit allows `!` on `feat|fix|perf` and bumps minor for a breaking change at major 0 (`src/conventional.ts:16,20,48-54`) → ui-kit v0.3.0.
- ui-kit's README §Tokens (`README.md:18-51`) lists exactly the 24 tokens the spec enumerates, incl. the six to remove; §Rules at L10-16.
- ui-kit's `release.yml:23-37` targets the three named consumers through `bump-consumers.yml@v1`.
- `.shell { zoom: var(--font-scale,1) }` exists in all three apps (gm `styles.css:30`, bm `:33`, dash `:149`); the dashboard sets `--font-scale` on
  `documentElement` (`useSettings.tsx:71-75`) so "inherits from the root" holds.
- guide-manager's CLAUDE.md invariant about the chip, drawer and `.uk-drawer`'s height rule exists; `test/phone-css.test.ts:56` asserts
  `.rail-version` `min-height: 44px` as the spec says.
- `renderNotesHtml` today: escape-first, `p`/`br`, `-`/`*` bullets, `code`, `**bold**`, `http(s)` links only; no `###`, no `_em_` (`src/releases/notes.ts`).
- No hard rule in any of the four repos is violated by D1–D8 (pnpm, flat `test/`, jsdom docblock, PR-title grammar, CLAUDE.md word cap aside).
