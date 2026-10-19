# Review 1 — plan `2026-10-19-uniform-releases-ui.md`

Reviewed against `docs/superpowers/specs/2026-10-19-uniform-releases-ui-design.md` and the code in ui-kit (`docs/uniform-releases-ui`, HEAD a2ad73d),
guide-manager (539ee6c4), backlog-manager (2713d73) and claude-agents-dashboard (ba9cb75). Every path, export and line the plan names was checked
against the working tree. ui-kit has no CLAUDE.md; the plan's Global Constraints (plan:23-33) restate the packaging-test rules instead.

## Verdict: REVISE

One Critical: Task 5 places a `string` export in a fixtures module whose every export is type-checked and rendered as a `ReleasesResponse`, so the
plan as written fails `npm run typecheck`, `test/type-contract.test.ts` and the playground. Four Important findings, all small. Everything else holds up.

## Critical

### C1 — plan:171 `fixtures/releases.ts` exports `NOTES_ALL_CONSTRUCTS: string` breaks the type contract and the playground

- `test/type-contract.test.ts:7` imports `* as fixtures from '../fixtures/releases.js'` and `:12-13` declares
  `fixturesFit = (): Record<keyof typeof fixtures, ReleasesResponse> => fixtures`, then `:17-20` runs `tsc -p tsconfig.json` and asserts it passes. A
  `string` export makes `fixtures` not assignable to that record: `npm run typecheck` fails, `test/type-contract.test.ts` fails, and Task 5 Step 4
  (plan:178, "`npm run build && npm run typecheck && npm test` — PASS") cannot be reached. Task 6 Step 1 (plan:185) inherits the failure.
- `playground/main.tsx:20` does `Object.entries(fixtures) as [string, ReleasesResponse][]` and `:55-57` renders every entry as a fixture column, so the
  string would be handed to `ReleasesPanel` as `data` and throw at runtime.
- Fix (no new scope): put the notes fixture in its own module (`fixtures/notes.ts`) or make it a `ReleasesResponse` whose one release carries all the
  constructs (`fixtures.allConstructs`), and have plan:171, plan:174 and plan:176 ("the playground's drawer shows `NOTES_ALL_CONSTRUCTS`") name that.
  Task 7 Step 1 (plan:220) imports the same fixture into guide-manager's test — spell the import path there too. Either way `type-contract.test.ts`
  stays as it is.

## Important

### I1 — plan:230-245 and plan:247-262 omit the CLAUDE.md invariant line spec D7 requires

- spec:118-119: "Each app also gets one line in its CLAUDE.md invariants pointing at the guard." Task 7 has it (plan:216-217); Tasks 8 and 9 list no
  CLAUDE.md edit.
- Shape constraints the builder needs: backlog-manager's `test/claude-rules.test.ts` enforces `HEADLINE_ONLY`
  (`- **…** Why: [invariants.md](docs/subsystems/invariants.md#…)`) and `UNLINKED_WORD_CAP = 80` on invariant bullets, so its line needs a matching
  section and anchor in `docs/subsystems/invariants.md` (which already discusses ui-kit's drawer at `:1717-1719`). The dashboard's file is
  `.claude/CLAUDE.md`, rules under `## Code rules` (`.claude/CLAUDE.md:59`).
- Fix: add `CLAUDE.md` (+ `docs/subsystems/invariants.md`) to Task 8's file list and `.claude/CLAUDE.md` to Task 9's, with the one-line invariant
  ("tokens only; guarded by `test/ui-kit-guard.test.ts`") — same wording as Task 7.

### I2 — plan:215 asks a text-only CSS suite to assert a rendered class

- `test/phone-css.test.ts:1-11` reads `client/src/styles.css` as text with no `@jest-environment jsdom` docblock ("jsdom neither lays out nor evaluates
  media queries — so … this suite reads the stylesheet as text"). It cannot "assert the phone menu renders `.uk-chip--narrow`"; after the cleanup
  `.uk-chip--narrow` appears in no guide-manager sheet, so there is nothing textual to match either.
- Fix: in Task 7 keep `test/phone-css.test.ts:56` as "drop the `.rail-version` 44px assertion" only, and put the render assertion in
  `test/releases-ui.test.tsx`'s under-640 case (`:127-131` already stubs `matchMedia` to match exactly `(max-width: 639px)`, which is `PHONE`), asserting
  the chip carries `uk-chip--narrow` there and not in the desktop case (`:115-124`).

### I3 — plan:232 names one of two `lastElementChild` assertions in backlog-manager's rail suite

- `test/rail.test.tsx:364` and `:387` both `expect(nav.lastElementChild).toBe(chip())`, where `chip()` (`:345`) is the `VersionChip` button by role.
  Once the chip sits in a wrapper, both fail; the plan cites `:362` and one assertion. `chip()` itself keeps working (still a button).
- Fix: cite `test/rail.test.tsx:364,387` and say "both assertions".

### I4 — plan:255 `pnpm exec tsx test/ui-kit-guard.test.ts` runs nothing in the dashboard's runner

- Dashboard suites export `run(): number` and are executed only through `test/run-all.ts`'s explicit imports (`test/releases-client.test.ts:47`,
  `test/run-all.ts:92`); no suite self-executes (`releases-client.test.ts` has no `import.meta.main`/argv guard), and `.claude/CLAUDE.md:25-58` lists no
  single-file form. The red proof at Step 2 would print nothing and exit 0.
- Fix: state the mechanism — register the suite in `test/run-all.ts` (plan:249 already says so) and run `pnpm test` for the red proof, or give the new
  file a self-run guard the plan names. The suite must `export function run(): number` in the `t(...)` style to be picked up at all.

## Minor

- plan:102 / plan:171 — the first-child rule is spelt "direct, and through one wrapper div"; given Task 5's markup it is always `.uk-releases-notes > div
  > :first-child` (the panel today has no inner div — `src/releases/ReleasesPanel.tsx:43` — so "direct" is the pre-Task-5 shape). Name one selector.
- plan:67-80 — no compound-selector fixture (`.uk-drawer.uk-drawer--narrow { … }`, the spec's own example at spec:110 and backlog-manager's real rule at
  `client/src/styles.css:2763`). Add it as a fail case so the `\.uk-[\w-]+` match is proven on a chained class.
- plan:82-84 — Task 1 extends the packaging entry list but adds no load test for the new entry; `test/packaging.test.ts:96-108` loads the index surface
  through both CJS and ESM. One `require('ui-kit/guard')`/`import('ui-kit/guard')` pair in the same style would pin that the `exports["./guard"]` map
  resolves.
- plan:118-120 — spec:98 ("The sentence in §Tokens about layout classes stays true and is joined by sizes") has no counterpart in Task 2's README edits
  (`README.md:50-51` is the sentence). Add it to Step 3.
- plan:90 — `src/styles.css:1-7` header comment cites "spec D13" and says the chip is placed "through the chip's className"; Task 2 rewrites every rule
  but does not list the comment. Note it so the sheet does not describe a removed prop.
- plan:232 — backlog-manager's `SideRail.tsx:86` already has `const narrow = useNarrow();`; write `narrow={narrow}` rather than `narrow={useNarrow()}`
  (a second hook call is harmless but reads as a new subscription).
- plan:249-250 — the dashboard's `SideRail.tsx:1-9` does not import `useNarrow` (it lives at `client/src/hooks/useNarrow.ts:69`); say "import and pass".
- plan:253 — "check `.uk-drawer` sits under `.uk-drawer-scrim`" is verifiably true: `src/ui/Drawer.tsx:52-53` renders the `aside.uk-drawer` as a child
  of `div.uk-drawer-scrim`. State it as fact; the prior spec review's Minor note that they are siblings was wrong.
- plan:233 — after pruning, `test/ui-kit-tokens.test.ts`'s `KIT_DEFAULT` is empty (all five of its keys are among D1's removed six), so its
  read-but-unmapped test becomes vacuous; its `:23` comment also still describes `.rail-release` redrawing the chip as a pill. Say whether the test
  stays (empty) or goes.
- plan:245 — Task 8 Step 3's `--uk-ink-muted` decision has no test pinning the outcome; `test/daylight-contrast.test.ts:314-328` checks only the
  badge pairs. Acceptable as a judgement call, but the commit-body note is the only record — fine, flagging for awareness.
- plan:219 — `pnpm exec jest test/ui-kit-guard.test.ts — FAIL naming .uk-drawer` is right (`client/src/styles.css:266`); the same run will also name
  nothing from `shared/theme.css` (its mapping is all `--uk-*` in `:root`, `:173-187`). Correct as written; recording that it was checked.

## Checked and found correct

- D1: `PUBLIC_TOKENS` count is 22 (README §Tokens has 24 today, minus six size tokens, plus `--uk-chip-bg` and `--uk-zoom`); plan:80 matches.
- Task 2 values (plan:98-105) match spec D2 (spec:46-78) line by line, including `100vh` then `100dvh` both divided by `--uk-zoom`.
- Task 4 expected outputs (plan:146-154) are consistent with `src/releases/notes.ts`'s `escapeHtml` (`'` → `&#39;`) and the boundary rule at
  plan:156-158; `a_b_ c` and the href case follow from "closing `_` must follow a non-space".
- Guard fixtures at plan:67-80 cover every spec D7 case (spec:123-131) and add three (nested `@media`, comment, `.duck-chip`).
- Create/Modify reality: `src/guard.ts`, `test/guard.test.ts`, `test/styles.test.ts`, the three apps' `test/ui-kit-guard.test.ts` and guide-manager's
  `client/src/lib/breakpoints.ts` do not exist; every Modify path exists. Line cites checked: guide-manager `phone-css.test.ts:56` ✓,
  `releases-ui.test.tsx:39-40` ✓, `styles.css:266` ✓, `theme.css` comment at `:168-169` ✓; backlog-manager `styles.css:2747-2770` ✓,
  `releases-drawer.test.tsx:45,101` ✓, DESIGN.md §8.7 `:394` / §8.10 `:493` ✓, `docs/subsystems/releases.md:73` ✓; dashboard `styles.css` `.uk-releases-notes
  .md` at `:3145` and the mapping at `:3137-3144` ✓, `releases-client.test.ts:92,95-100` ✓ (plan says 91), `visual/views.spec.ts:88` ✓,
  `docs/subsystems/releases.md:39` ✓, `main.tsx:11` ✓.
- Interfaces: Task 2 consumes `PUBLIC_TOKENS` from Task 1; Task 5 consumes `renderNotesHtml` (unchanged signature, Task 4); Tasks 7-9 consume
  `checkHostCss`, `VersionChip.narrow`, `sanitize` from Tasks 1/3/5. `useMediaQuery` is exported from ui-kit and returns `false` with no `matchMedia`
  (`src/ui/useMediaQuery.ts:8-21`), so guide-manager's four other rail-rendering suites (`side-rail`, `app-projects`, `app-landing`,
  `favorites-deeplink`) survive Task 7 without a stub.
- Guard-fail expectations: guide-manager `.uk-drawer` (`styles.css:266`); backlog-manager `.uk-drawer`, `.uk-releases-notes`, `--uk-font-size-lg`
  (`styles.css:2757-2770`, `:2724-2745`); dashboard `.uk-releases-notes .md`, `--uk-font-size-lg` (`styles.css:3143-3145`). The dashboard's mapping on
  `.uk-chip,.uk-drawer-scrim` passes rule 1's exception, and `.uk-drawer` inherits from the scrim (`Drawer.tsx:52-53`).
- `scripts/build.mjs` compiles `src/**/*`, so `src/guard.ts` lands at `dist/{esm,cjs}/guard.js` + `dist/esm/guard.d.ts` as plan:82 lists; the dist
  scan at `test/packaging.test.ts:112-135` is unaffected (guard has no bare imports; `bare > 0` is over all files).
- PR titles: `feat!: one look for the releases UI` and `fix(releases): one look for the version chip and What's new drawer` match release-kit's
  `RELEASING` grammar (`release-kit/src/conventional.ts:4`) and spec D6; the disable-auto-merge-first step matches release-kit's README.
- guide-manager's `sanitizeSnapshot` is a denylist (`client/src/lib/sanitize.ts:101-115` `REMOVE_TAGS`: script, iframe, object, …), so `h3 em strong a
  ul code` survive — Task 7's Review-Focus-5 case (plan:220-221) can pass.
- Backlog-manager `test/releases-app.test.tsx:82` and guide-manager `test/releases-ui.test.tsx:40` select `.uk-chip-dot`, which Task 3 keeps.
- Plan conventions: no literal code, behaviour and exact values only (plan:5-6); size budgets soft; per-app "touched suites only" matches each CLAUDE.md.
