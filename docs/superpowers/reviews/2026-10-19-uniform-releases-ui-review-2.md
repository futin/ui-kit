# Review 2 — plan `2026-10-19-uniform-releases-ui.md`

Scope: the lines `git diff a2ad73d 7ca8ea3` adds or changes (the edits that answered review 1), checked against the spec
(`docs/superpowers/specs/2026-10-19-uniform-releases-ui-design.md`) and the code in ui-kit (7ca8ea3), guide-manager (539ee6c4), backlog-manager
(901fb5c) and claude-agents-dashboard (ba9cb75). Every path, export and line number the changed text names was read in the working tree; nothing below
relies on the plan's own description of the code.

## Verdict: APPROVE WITH FIXES

Review 1's Critical (the fixtures type contract) and all four Importants are correctly resolved. Three new Importants, each a few words of plan text:
one deletes a backlog-manager test the spec says to prune, one misses the second of backlog-manager's three rule tiers (its guard suite would go red),
one has the dashboard steps run the whole suite in a repo whose CLAUDE.md forbids exactly that before a push. No Critical.

## What the diff gets right (verified)

- plan:80 — chained-class case `.uk-drawer.uk-drawer--narrow` is spec:110's own example and backlog-manager's real rule (`client/src/styles.css:2763`).
- plan:84-85 — `test/packaging.test.ts:98,104` are the CJS/ESM index load tests the new pair mirrors. `scripts/build.mjs:12-13` runs `tsc` over
  `src/**/*` (`tsconfig.esm.json` `include`), so `src/guard.ts` lands as `dist/esm/guard.js`, `dist/esm/guard.d.ts`, `dist/cjs/guard.js` with no build
  change; the entry list at `test/packaging.test.ts:13` is the one to extend.
- plan:104 — `.uk-releases-notes > div > :first-child` is Task 5's markup (plan:174-175) and backlog-manager's rule at `styles.css:2766`.
- plan:121-122 — `README.md:50-51` is the layout-classes sentence; `src/styles.css:8` is the "through the chip's className" line.
- plan:167-169 — `test/type-contract.test.ts:13` (`Record<keyof typeof fixtures, ReleasesResponse>`) and `playground/main.tsx:20,55-57` are as
  stated; `fixtures/notes.ts` does not exist. `package.json` `files` is `["dist"]`, so plan:227's "fixtures do not ship" holds.
- plan:220-221 — `test/phone-css.test.ts:1-11` is text-only, no jsdom docblock; `:56` is the `.rail-version` 44px line.
- plan:226-229 — `test/releases-ui.test.tsx:127-132` stubs `matchMedia` to `q === '(max-width: 639px)'`; `client/src/lib/breakpoints.ts` does not
  exist; ui-kit's index exports `useMediaQuery` (`src/index.ts:26`).
- plan:240 — backlog-manager `SideRail.tsx:86` `const narrow = useNarrow();`.
- plan:243 — `test/rail.test.tsx:364` and `:387` both `expect(nav.lastElementChild).toBe(chip())`.
- plan:246-247 — `test/claude-rules.test.ts:38` `HEADLINE_ONLY` is `- **…** Why: [invariants.md](docs/subsystems/invariants.md#…)`; CLAUDE.md
  `## Invariants` at `:82`.
- plan:259-260 — dashboard suites `export function run(): number` (`test/releases-client.test.ts:47`), imported by `test/run-all.ts` (`:92`), no
  argv filter anywhere in `run-all.ts`; `package.json` `test` is `tsx test/run-all.ts; …`.
- plan:261 — `client/src/hooks/useNarrow.ts:69` exports `useNarrow` by name; `SideRail.tsx:1-9` does not import it.
- plan:264 — `src/ui/Drawer.tsx:52-53` renders `aside.uk-drawer` inside `div.uk-drawer-scrim`; `test/releases-client.test.ts:92` is the
  `className="rel-chip"` assertion, `:95-100` the `renderNotes` one.
- plan:266-267 — `.claude/CLAUDE.md:59` `## Code rules`; headings are Orientation, Commands, Code rules, Subagent rules, PR rules, Where things go — no
  Invariants section.
- plan:81 — 22 public tokens: 10 colours (incl. `--uk-chip-bg`) + 8 badge + 2 fonts + `--uk-z` + `--uk-zoom`.

## Important

### I1 — plan:243-244 deletes backlog-manager's mapping check; the spec says prune, and `:23` is inside what is removed

- `test/ui-kit-tokens.test.ts:19-25` — `KIT_DEFAULT` is exactly `--uk-font-size`, `-sm`, `-xs`, `--uk-radius`, `--uk-drawer-width`: all five are
  removed tokens, as the plan says. But the "read-but-unmapped" test is `:34-40`, *every `--uk-*` token the kit reads is mapped in styles.css or
  deliberately left to its fallback*. With `KIT_DEFAULT` emptied it does not go stale — it becomes "every token the kit reads is mapped", which is the
  strongest possible form of Review Focus 2 (plan:39-40) and costs nothing: after Task 8 backlog-manager maps all 22 (`styles.css:2725-2745` holds 20
  today, minus `--uk-font-size-lg`, plus `--uk-chip-bg` and `--uk-zoom`).
- spec:43-44 "That test's `KIT_DEFAULT` excuse list goes stale and is pruned on the bump" and spec:163 "prune `test/ui-kit-tokens.test.ts`'s
  `KIT_DEFAULT`" — prune the list, not the test. `docs/subsystems/releases.md:73` also describes the test as holding "every `--uk-*` token the kit's
  stylesheet reads to being mapped there or named as left to its fallback"; deleting the test makes that sentence false, and the plan edits `:73` only
  for the `renderNotes` clause.
- "fix its `:23` comment": `:23` is the `--uk-radius` entry *inside* `KIT_DEFAULT`, so it is removed with the map, not fixed. The comment that
  actually goes stale is the docblock at `:18` ("Sizes the kit's fallbacks already match … and the one geometry `styles.css` sets on `.uk-drawer`
  itself"); the only assertion that turns vacuous is `:46` (`Object.keys(KIT_DEFAULT)…`).
- Fix: "empty or remove `KIT_DEFAULT`; keep `:34-40` (it now asserts every read token is mapped — Review Focus 2); drop the `:46` assertion and the
  `:18` docblock; leave `releases.md:73`'s description of the test true."

### I2 — plan:245-247 names two of backlog-manager's three rule tiers; `test/claude-rules.test.ts` would fail

- `test/claude-rules.test.ts:9-17,28-30`: CLAUDE.md (tier one) carries headline-plus-link bullets, `.claude/rules/*.md` (tier two, ten files exist)
  carries the same bullets, `docs/subsystems/invariants.md` (tier three) the reasoning. The suite asserts "tier one and tier two are the same multiset
  of (anchor, headline) with one home per anchor" (`:16-17`) and that every anchor resolves to a heading in `invariants.md` (`:135-138`, GitHub
  slug rule at `:122-133`). A CLAUDE.md bullet with no `.claude/rules/` twin fails it (`:24-26`: "a CLAUDE.md that carries linked headlines with no
  rule file behind them is missing its mechanism, and the tier guard says so by name").
- Task 8's file list has `CLAUDE.md` + `docs/subsystems/invariants.md` only, and Step 4 (plan:253-254) does not run `test/claude-rules.test.ts`,
  so the breakage surfaces in CI, not locally.
- Fix: add "`.claude/rules/board.md` (or whichever rule file's `paths:` covers `client/src/**`): the same `- **headline** Why: [invariants.md](…#anchor)`
  bullet, the anchor being the GitHub slug of the new `invariants.md` heading" to the file list, and `test/claude-rules.test.ts` to Step 4's suite list.

### I3 — plan:270 and plan:273 run the dashboard's whole suite, which its CLAUDE.md forbids and the plan itself forbids

- `claude-agents-dashboard/.claude/CLAUDE.md:38-39`: "**CI is the full-suite gate — never re-run the whole `pnpm test` locally just before a push.**
  … locally run only the suites the change … touched." plan:205 restates it for every app. `test/run-all.ts` has no filter (no `argv` anywhere;
  `:272` exits after every suite), so `pnpm exec tsx test/run-all.ts` *is* the whole suite. Step 2's red proof at the start is defensible; Step 4's
  "the guard + `releases-client` suites — PASS" right before the commit (plan:273-274) names a per-suite run the plan says does not exist
  (plan:270 "the only way a suite runs here"), so the implementer either runs the full suite before the push or guesses.
- `tsx` supports `--eval` (`pnpm exec tsx --help` lists `-e, --eval`), and every suite exports `run(): number`, so a one-liner runs one suite without
  touching the runner.
- Fix: in Steps 2 and 4 give the per-suite form, e.g.
  `pnpm exec tsx --eval "import('./test/ui-kit-guard.test.ts').then(m => process.exit(m.run()))"` (and the same for `releases-client.test.ts`), and
  keep the `run-all.ts` registration for CI. If the author prefers run-all for the red proof, say so once and keep Step 4 per-suite.

## Minor

- plan:261 — `useNarrow` is the 767.98 density query; the phone bar and its burger (`.mnav`) are hidden from `min-width:640px`
  (`client/src/styles.css:394-399`), and `useNarrow.ts:33-47` documents `useShellNarrow` (639.98) as that boundary ("Using `NARROW_PX` for that would
  have been wrong by a whole band"). With `useNarrow` the chip has its 44px hit area in the desktop rail between 640 and 767. Spec-compliant — the
  visible pill does not grow (spec:58) and spec:81 leaves the breakpoint to the host — but `useShellNarrow` is the hook that means "phone menu row".
  Builder's call; worth one clause so the choice is deliberate (the drawer keeps `useNarrow`, matching its own full-screen band).
- plan:244 — `test/releases-drawer.test.tsx:101` already asserts `getByRole('heading', { level: 3, name: 'Sub' })`; only the comment at `:42-46`
  ("whose `### ` heading ui-kit's escape-first default would print as literal text") needs rewriting. "rewrite to assert an `h3`" overstates it.
- plan:104 — the `.uk-releases-notes > div > :first-child` rule is written in Task 2 but matches nothing until Task 5 adds the inner `div`
  (`src/releases/ReleasesPanel.tsx:43` renders the default notes straight into `.uk-releases-notes` today). Harmless; a parenthesis "(inert until
  Task 5)" would stop a Task 2 implementer looking for the div.
- plan:220 — spec:82-83 literally says `test/phone-css.test.ts:56` "is rewritten to assert the app passes `narrow`"; the plan correctly moves that
  assertion to the jsdom suite (review 1, I2). One clause noting the deliberate departure from the spec's wording would stop a later reviewer
  re-flagging it.
- plan:183-184 — the playground drawer currently shows `fixtures.mixed` (`playground/main.tsx:58`); say whether `NOTES_ALL_CONSTRUCTS` replaces it
  or is added as a second release, since spec:148 wants the sample "rendered in the playground" and D2's baseline rules also need a `baseline` entry
  on screen.

## Checklist

1. Coverage — unchanged from review 1 apart from I1 (now resolved: Tasks 8 and 9 carry the CLAUDE.md line). Every D7 guard case is in Task 1; the
   real-sheet case is Tasks 7–9 and the playground in Task 2; D8's two rules and the hostile cases are Task 4 (`test/notes.test.ts:8-21` already
   holds `<script>`, `onerror`, `javascript:`); spec:154's badge-contrast suite is in Task 7 Step 4.
2. Values — the changed lines carry no spec values; those checked in review 1 are untouched.
3. Reality — every path and line in the diff verified (list above); the three false or incomplete facts are I1 (`:23`), I2 (missing tier) and I3
   (per-suite run).
4. Interfaces — `NOTES_ALL_CONSTRUCTS` now Produced by Task 5 from `fixtures/notes.ts` and Consumed only inside ui-kit; Task 7 explicitly inlines its
   own sample. Consistent.
5. Order — Task 2 writes a selector Task 5 makes live (Minor above); nothing depends on a later task.
6. Tests — I1 removes a test that would still fail before and pass after Task 8's mapping (it pins Review Focus 2); I2 names a suite that would go red
   and is not in Step 4.
7. Conventions — no literal code bodies in the changed lines; new prose wraps at 160.
