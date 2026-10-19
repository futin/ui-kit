# One Look for the Releases UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Override of the writing-plans template:** this plan gives behaviour, signatures, exact values and exact test *cases* — never literal code bodies. Write the
> code yourself; if a value here looks wrong against the spec or the repo, say so rather than transcribing it. Size targets anywhere in here are soft.

**Goal:** ui-kit owns every shape of the version chip and the What's new drawer; the three apps map colour/font tokens only, and a shared guard test in
each app fails if they try anything else.

**Architecture:** ui-kit `v0.3.0` (breaking) moves backlog-manager's look into `src/styles.css`, drops `VersionChip.className` and the drawer's
`renderNotes`, adds `VersionChip.narrow`, a `sanitize` hook and two tokens, grows `renderNotesHtml`, and ships the guard as a dev-only `ui-kit/guard`
entry. Then each app, on its own bump PR, deletes its overrides and adds the guard.

**Tech Stack:** TypeScript, React 18/19, plain CSS; ui-kit tests on `node --test` + jsdom (`test/dom.ts`); guide-manager and backlog-manager on Jest;
the dashboard on `tsx test/run-all.ts`.

**Spec:** `ui-kit/docs/superpowers/specs/2026-10-19-uniform-releases-ui-design.md` (D1–D8 below refer to it). Review: `ui-kit/docs/superpowers/reviews/
2026-10-19-uniform-releases-ui-design-review-1.md`.

## Global Constraints

- Public tokens (D1), exactly: `--uk-panel-bg --uk-ink --uk-ink-muted --uk-hairline --uk-scrim --uk-shadow --uk-accent --uk-hover-bg --uk-code-bg
  --uk-chip-bg --uk-{feat,fix,perf,breaking}-{ink,tint} --uk-font --uk-font-mono --uk-z --uk-zoom`. Nothing else may be read by `src/styles.css` or set by
  an app.
- Removed tokens become literals, never `--uk-`-named private properties: `--uk-font-size` 14px, `-sm` 12px, `-xs` 11px, `-lg` 19px (the new heading
  size), `--uk-radius` 12px, `--uk-drawer-width` 400px.
- Every `var(--uk-…)` keeps a fallback; no media queries in `src/styles.css`; every class is `uk-*`; components never import CSS (existing
  `test/packaging.test.ts` rules — keep them green).
- ui-kit's `dist/` is committed and `test/dist-drift.test.ts` compares it with a fresh build: run `npm run build` before every ui-kit commit that touches
  `src/`.
- Comments explain *why*, at the density the surrounding file uses. New prose wraps at 160 columns.
- Pushing, opening PRs, merging and disabling auto-merge are the user's go-ahead, asked each time — never assumed from this plan.

## Review Focus

1. **A font scale other than 1** (Settings → text size): the drawer must fit the screen exactly, no overhang, desktop and phone, in all three apps —
   the `--uk-zoom` mapping is the only thing making that true. Owned by Tasks 2, 7, 8, 9 (manual check step).
2. **Dark themes**: the pill's `--uk-chip-bg` must be mapped in every app, or the light default well shows on a dark rail. The guard cannot see an
   unmapped token, so Tasks 7–9 each add one assertion that the app's mapping sets `--uk-chip-bg`.
3. **Real release notes** with `snake_case_names`, a stray `## heading`, `**bold**` inside a word, and a `###` section: must render as D8 says. Task 4
   tests each.
4. **The narrow chip's whole 44px row** is tappable, and only the 28px pill is drawn. Task 3 tests the class; Tasks 7–9 check by eye on a phone width.
5. **A sanitiser that rejects or reshapes markup** (guide-manager's `sanitizeSnapshot`): the h3s, ems and links must survive it. Task 7 renders a
   notes sample with every construct through the real sanitiser and asserts each tag is still there.

---

## Part A — ui-kit (branch `feat/one-look`, off `docs/uniform-releases-ui` or `main` once that is merged)

### Task 1: The guard, as a dev-only `ui-kit/guard` entry

**Files:**
- Create: `src/guard.ts`, `test/guard.test.ts`
- Modify: `package.json` (`exports["./guard"]`), `test/packaging.test.ts` (entry points list), `README.md` (§Consuming: how an app adds the guard)

**Interfaces:**
- Produces: `PUBLIC_TOKENS: readonly string[]` (D1's list, the one source of truth); `checkHostCss(css: string): string[]` — one human-readable
  message per violation, `[]` when clean. Exported from `src/guard.ts` only, **not** from `src/index.ts`, so nothing reaches an app's client bundle.
  Package path: `import { checkHostCss, PUBLIC_TOKENS } from 'ui-kit/guard'` (ESM and CJS, like the main entry).

Behaviour: strip `/* … */` comments; walk rules, descending into `@media`/`@supports`/any `@`-block; for each rule whose selector list contains a class
token beginning `uk-` (match `\.uk-[\w-]+`, not the substring `uk-` elsewhere), report it unless *every* declaration in it is a custom property named
`--uk-*`; separately, report any declaration anywhere whose property is `--uk-*` but not in `PUBLIC_TOKENS`. Messages name the selector or the token.
No dependency — a small hand splitter (the spec allows it).

- [ ] **Step 1: Write the failing tests** in `test/guard.test.ts`, `describe('checkHostCss')`, one `it` per case, asserting `deepEqual([], …)` for passes
  and that the single message *includes* the named selector/token for fails:
  - `:root { --uk-ink: var(--ink); --uk-zoom: var(--font-scale, 1) }` → `[]`
  - `.uk-chip,.uk-drawer-scrim { --uk-ink: var(--ink) }` → `[]`
  - `.uk-chip { color: red }` → 1 message, includes `.uk-chip`
  - `.uk-chip,.uk-drawer-scrim { --uk-ink: var(--ink); color: red }` → 1 message
  - `.rail .uk-chip-dot { width: 9px }` → 1 message, includes `.uk-chip-dot`
  - `.uk-releases-notes h3 { font-size: 13px }` → 1 message
  - `@media (max-width: 639px) { .uk-drawer { width: 100% } }` → 1 message (nested)
  - `:root { --uk-font-size-lg: 19px }` → 1 message, includes `--uk-font-size-lg`
  - `.rail-version-slot { margin-top: auto }` → `[]`
  - `/* .uk-chip { color: red } */ .a { color: red }` → `[]`
  - `.duck-chip { color: red }` → `[]` (no false hit on a class merely containing `uk-`)
  - `.uk-drawer.uk-drawer--narrow { padding: 0 }` → 1 message (chained classes)
  - `PUBLIC_TOKENS` has 22 entries and contains `--uk-chip-bg` and `--uk-zoom`, not `--uk-radius`.
- [ ] **Step 2: Run** `node --import tsx --test test/guard.test.ts` — FAIL (module missing).
- [ ] **Step 3: Implement** `src/guard.ts`; add `"./guard": { types, import, require }` pointing at `dist/{esm,cjs}/guard.*`; extend the packaging test's
  entry-point list with `esm/guard.js`, `cjs/guard.js`, `esm/guard.d.ts` and the `./guard` export, plus a `require`/`import` pair loading the guard
  entry in the style of the existing index load tests; README §Consuming gets a three-line "add the guard"
  recipe (read your sheets, `expect(checkHostCss(css)).toEqual([])`).
- [ ] **Step 4: Run** `npm run build && npm test` — PASS.
- [ ] **Step 5: Commit** `feat(guard): checkHostCss for host stylesheets`.

### Task 2: The stylesheet becomes the one look

**Files:**
- Modify: `src/styles.css`, `README.md` (§Rules, §Tokens), `playground/themes.css`, `test/packaging.test.ts`
- Test: `test/packaging.test.ts`, new `test/styles.test.ts`

**Interfaces:**
- Consumes: `PUBLIC_TOKENS` (Task 1).
- Produces: classes later tasks rely on — `.uk-chip`, `.uk-chip--narrow` (styled here, applied in Task 3), `.uk-releases-notes h3`/`em`/`strong`.

Values (D2, lifted from backlog-manager): chip `inline-flex`, gap 6px, min-height 28px, padding `4px 10px`, radius 999px, 12px/500, ink
`--uk-ink-muted` → hover `--uk-ink`, background `--uk-chip-bg` (default `rgba(0, 0, 0, .05)`), border `1px solid --uk-hairline` (constant on hover — no
new token). Drawer: width `min(400px, calc(100vw / var(--uk-zoom, 1)))`; height `calc(100vh / …)` then `calc(100dvh / …)`; `border-left: 1px solid
--uk-hairline`; shadow `-24px 0 64px --uk-shadow`; narrow: width `calc(100vw / …)`, no border, no shadow, padding `20px 16px`. Heading 19px. Notes 13px;
`h3` 13/600/`--uk-ink`, margin `10px 0 4px`; `.uk-releases-notes > div > :first-child` (Task 5's markup; the one selector)
has `margin-top: 0`; `em`/`strong` inherit colour. Badges weight 500. Baseline: gap 10px, `::before`/`::after` hairline rules (`flex: 1`, 1px,
`--uk-hairline`), date not pushed right. Narrow chip (D3): visible pill unchanged, hit area ≥ 44px tall — your call between an inner span carrying the
pill or a transparent `::before`; Task 3 picks the markup to match.

- [ ] **Step 1: Write the failing tests.** In `test/packaging.test.ts` replace the "reads the minimum tokens" test with *the set of tokens
  `src/styles.css` reads equals `PUBLIC_TOKENS`* (both directions). New `test/styles.test.ts` (a tiny rule lookup over the comment-stripped sheet):
  - `.uk-chip` declares `border-radius: 999px`, `min-height: 28px`, `background: var(--uk-chip-bg, …)`, a `border` reading `--uk-hairline`.
  - `.uk-drawer`'s height and width each contain `var(--uk-zoom, 1)`; there are two height declarations (vh then dvh).
  - `.uk-drawer--narrow` sets `box-shadow: none`.
  - a `.uk-releases-notes h3` rule exists with `font-size: 13px` and `font-weight: 600`.
  - `.uk-releases-badge` has `font-weight: 500`.
  - `.uk-releases-base::before` exists.
  - `.uk-chip--narrow` (or its pseudo-element) carries a 44px minimum height.
  - `checkHostCss` over `playground/themes.css` → `[]` (the playground is a host too).
- [ ] **Step 2: Run** `node --import tsx --test test/packaging.test.ts test/styles.test.ts` — FAIL.
- [ ] **Step 3: Rewrite the sheet's rules** to the values above; README §Tokens table loses the six removed rows and gains `--uk-chip-bg` (default and
  use) and `--uk-zoom` (`1`, "divides the drawer's viewport units; map it to your shell's zoom"), and its layout-classes sentence is joined by sizes;
  `src/styles.css`'s header comment drops the "placed through the chip's className" line; §Rules gains *"Hosts map tokens and nothing else:
  every `.uk-*` rule lives in this sheet, enforced by `ui-kit/guard`."* Playground maps gain `--uk-chip-bg` per theme.
- [ ] **Step 4: Run** `npm run build && npm test` — PASS. Open the playground (`npm run dev`) and eyeball all three columns: pill, drawer, baseline rules.
- [ ] **Step 5: Commit** `feat(styles)!: one look for the chip and drawer`.

### Task 3: `VersionChip` — no `className`, a `narrow`

**Files:** Modify `src/releases/VersionChip.tsx`; Test `test/releases-ui.test.tsx`

**Interfaces:**
- Produces: `VersionChipProps = { label: string; dot: boolean; onClick(): void; narrow?: boolean }` — `className` removed.

- [ ] **Step 1: Tests.** Delete `appends the host className`. Add: `narrow adds uk-chip--narrow` (`className === 'uk-chip uk-chip--narrow'`, or the
  inner-span shape Task 2 chose — assert that shape instead); `without narrow the class is exactly uk-chip`; a type-level check (in
  `test/type-contract.test.ts`'s style) that `className` is not a key of `VersionChipProps`.
- [ ] **Step 2: Run** `node --import tsx --test test/releases-ui.test.tsx` — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run build && npm test` — PASS.
- [ ] **Step 5: Commit** `feat(chip)!: narrow replaces className`.

### Task 4: `renderNotesHtml` — headings, em, word boundaries

**Files:** Modify `src/releases/notes.ts`; Test `test/notes.test.ts`

**Interfaces:** Produces `renderNotesHtml(md: string): string` — signature unchanged; emitted elements become exactly `p br ul li code strong em a h3`.

- [ ] **Step 1: Failing tests** (input → exact output), keep every existing case:
  - `### Fixed` → `<h3>Fixed</h3>`; `### Fixed\nthe chip` → `<h3>Fixed</h3><p>the chip</p>` (a heading ends a paragraph and is its own block)
  - `- a\n### B\n- c` → `<ul><li>a</li></ul><h3>B</h3><ul><li>c</li></ul>`
  - `## What's new` → `<p>## What&#39;s new</p>`; `#### deep` → `<p>#### deep</p>`; `###nospace` → `<p>###nospace</p>`
  - `_em_ here` → `<p><em>em</em> here</p>`
  - `snake_case_name` → `<p>snake_case_name</p>`; `a_b_ c` → `<p>a_b_ c</p>`
  - `x**y**z` → `<p>x**y**z</p>`; `**bold** word` → `<p><strong>bold</strong> word</p>`
  - `` `_not_em_` `` → `<p><code>_not_em_</code></p>`
  - `[a_b_c](https://x.dev/a_b_)` → one anchor, text `a_b_c`, href `https://x.dev/a_b_`, no `<em>` anywhere
  - `### <script>x</script>` → `<h3>&lt;script&gt;x&lt;/script&gt;</h3>`
- [ ] **Step 2: Run** `node --import tsx --test test/notes.test.ts` — FAIL.
- [ ] **Step 3: Implement.** Boundary rule: an opening `_`/`**` must be at line start or after a non-word character and followed by a non-space; a
  closing one must follow a non-space and be at line end or before a non-word character. Apply em/bold only to text outside code spans and outside
  hrefs (the existing split already separates them). Update the docblock's list of supported constructs.
- [ ] **Step 4: Run** `npm test` — PASS.
- [ ] **Step 5: Commit** `feat(notes): headings and emphasis in release notes`.

### Task 5: Panel and drawer — `sanitize` replaces `renderNotes`

**Files:** Create `fixtures/notes.ts`. Modify `src/releases/ReleasesPanel.tsx`, `src/releases/ReleasesDrawer.tsx`, `playground/main.tsx`; Test
`test/releases-ui.test.tsx`. Not `fixtures/releases.ts`: every export there must be a `ReleasesResponse` (`test/type-contract.test.ts:13`,
`playground/main.tsx:20` renders each one), so a bare string there breaks typecheck.

**Interfaces:**
- Consumes: `renderNotesHtml` (Task 4).
- Produces: `ReleasesPanelProps = { data: ReleasesResponse; sanitize?: (html: string) => string }`; `ReleasesDrawerProps` = that plus the drawer's
  `onClose | closeOnEscape | narrow | restoreFocus`. Notes render as `sanitize ? sanitize(renderNotesHtml(n)) : renderNotesHtml(n)` inside
  `.uk-releases-notes > div`. `fixtures/notes.ts` exports `NOTES_ALL_CONSTRUCTS: string` (one `###`, a list, a paragraph with code, bold, em and an
  https link).

- [ ] **Step 1: Tests.** Delete `replaces the default with a custom renderNotes` and `passes renderNotes through to the panel`. Add: `sanitize receives
  renderNotesHtml's output and its return is what renders` (mock returns `'<p>clean</p>'`; assert the call arg equals `renderNotesHtml(notes)` and the
  DOM shows `clean`); `the drawer passes sanitize through`; `renderNotes is not a key of ReleasesPanelProps` (type-level); `NOTES_ALL_CONSTRUCTS renders
  an h3, a ul, a code, a strong, an em and an a`.
- [ ] **Step 2: Run** `node --import tsx --test test/releases-ui.test.tsx` — FAIL.
- [ ] **Step 3: Implement**; the playground's drawer shows `NOTES_ALL_CONSTRUCTS` (imported separately, wrapped in a one-release `ReleasesResponse`
  there — not added to the `fixtures` loop).
- [ ] **Step 4: Run** `npm run build && npm run typecheck && npm test` — PASS.
- [ ] **Step 5: Commit** `feat(panel)!: sanitize replaces renderNotes`.

### Task 6: Release ui-kit v0.3.0

- [ ] **Step 1:** `npm run build && npm run typecheck && npm test` — all PASS; `git status` clean apart from the branch's commits.
- [ ] **Step 2:** Ask the user to push and open the PR. Title `feat!: one look for the releases UI`; body from the PR template with a `## What's new`:
  apps can no longer restyle the chip or drawer; new `narrow` on the chip; `sanitize` replaces `renderNotes`; `--uk-chip-bg`/`--uk-zoom` added; six size
  tokens removed; notes gain `###` headings and `_em_`; `ui-kit/guard` for hosts.
- [ ] **Step 3:** After the user merges: confirm the `v0.3.0` tag and Release exist (`gh release view v0.3.0 -R futin/ui-kit`) and that three
  `chore(deps): bump ui-kit to v0.3.0` PRs opened. **Before any push to them, ask the user to disable auto-merge on each** (D6;
  `gh pr merge --disable-auto <n> -R futin/<app>`), and do not re-run the bump workflow while Tasks 7–9 are in flight.

---

## Part B — the apps (each on its bump PR's branch; Tasks 7–9 are independent of one another)

Common to each: check out the bump PR's branch; **first** add the guard test over the real sheets and watch it fail (the red proof); then clean up until
it, typecheck and the touched suites pass; then the manual check; then ask the user to push, retitle the PR `fix(releases): one look for the version chip
and What's new drawer` and add a `## What's new` line ("The version chip and What's new drawer now match the other apps; release notes show headings").
Per the repo's CLAUDE.md, run only the touched suites locally — CI runs the full suite.

Guard test shape (each app, flat in `test/`): read every `.css` the app ships (listed explicitly in the test, so a new sheet is a deliberate add),
`expect(checkHostCss(css)).toEqual([])` per file with the file name in the message; plus one assertion that the app's `--uk-*` mapping sets
`--uk-chip-bg` and `--uk-zoom` (Review Focus 1–2).

Manual check (each app): run the stack; rail chip at desktop and at a phone width (menu open); open the drawer; at font scale 1 and one other value;
light and one dark theme. Drawer fits the screen; the pill matches the other two apps; the phone row is tappable across its height.

### Task 7: guide-manager

**Files:** Create `test/ui-kit-guard.test.ts`, `client/src/lib/breakpoints.ts` (exports `PHONE = '(max-width: 639px)'`). Modify
`client/src/components/SideRail.tsx`, `client/src/components/ReleasesDrawer.tsx`, `client/src/styles.css` (`.rail-version` → layout-only wrapper rule
`.rail-version-slot`; delete `.uk-drawer {…}`), `shared/theme.css` (add `--uk-chip-bg: var(--steel)`, `--uk-zoom: var(--font-scale, 1)`; rewrite the
comment at ~168–169 — the chip is `--uk-ink-muted` = `--ink2` now), `test/releases-ui.test.tsx` (selectors → the inner `.uk-chip` button),
`test/phone-css.test.ts:56` (text-only CSS suite, no jsdom: drop the `.rail-version` 44px assertion and nothing else; the narrow render is
asserted in `test/releases-ui.test.tsx`, Step 1), `CLAUDE.md` (the ui-kit
invariant: tokens only, guarded by `test/ui-kit-guard.test.ts`; drop the `.uk-drawer` height sentence).

**Interfaces:** Consumes `checkHostCss`, `VersionChip.narrow`, `ReleasesDrawer.sanitize` (Tasks 1, 3, 5).

- [ ] **Step 1:** Write `test/ui-kit-guard.test.ts` (sheets: `client/src/styles.css`, `shared/theme.css`) and a Review-Focus-5 case in
  `test/releases-ui.test.tsx`: an inline notes sample with the same constructs as ui-kit's `NOTES_ALL_CONSTRUCTS` (ui-kit's `fixtures/` do not ship —
  `files` is `dist` only), rendered through the drawer with the app's `sanitizeSnapshot`, keeps `h3 ul code strong em a`. In the same file's
  under-640 case (it already stubs `matchMedia` for `(max-width: 639px)`), assert the phone menu's chip carries `uk-chip--narrow`.
- [ ] **Step 2:** `pnpm exec jest test/ui-kit-guard.test.ts` — FAIL naming `.uk-drawer`.
- [ ] **Step 3:** Clean up as listed; `narrow` comes from ui-kit's `useMediaQuery(PHONE)`, read by both `SideRail` and `ReleasesDrawer` (replacing the
  private `NARROW`, including inside `restoreTarget`'s `matchMedia` call); `sanitize={sanitizeSnapshot}` replaces the `renderNotes` wrapper and the
  `renderNotesHtml` import goes.
- [ ] **Step 4:** `pnpm run typecheck && pnpm exec jest test/ui-kit-guard.test.ts test/releases-ui.test.tsx test/phone-css.test.ts
  test/theme-tokens.test.ts` — PASS. Manual check.
- [ ] **Step 5:** Commit `fix(releases): one look for the version chip and What's new drawer`; ask the user before pushing.

### Task 8: backlog-manager

**Files:** Create `test/ui-kit-guard.test.ts`. Modify `client/src/components/SideRail.tsx` (wrap; `narrow={narrow}` — the `useNarrow()` it already holds),
`client/src/components/ReleasesDrawer.tsx` (drop `renderNotes`), `client/src/styles.css` (`.rail-release` keeps placement only, on the wrapper; delete
~2747–2770's `.uk-*` block and its comment; drop `--uk-font-size-lg`; add `--uk-chip-bg: var(--steel)`, `--uk-zoom: var(--font-scale, 1)`),
`test/rail.test.tsx:364` and `:387` (both `nav.lastElementChild` assertions: the wrapper is the nav's last child and contains the chip), `test/ui-kit-tokens.test.ts` (every `KIT_DEFAULT` entry is a removed
token: delete the map, its `:18` docblock and the then-vacuous `:46` assertion; keep the `:34-40` test, which becomes "every token the kit reads is
mapped"), `test/releases-drawer.test.tsx:40-46,101` (the `###`-as-text comment and assertion now hold for ui-kit's renderer — rewrite to assert an `h3`),
`.claude/DESIGN.md` §8.7/§8.10 (point at ui-kit instead of restating values), `docs/subsystems/releases.md:73`, `CLAUDE.md` +
`docs/subsystems/invariants.md` (spec: one invariant line pointing at the guard — in CLAUDE.md a headline-only bullet linking a new
`invariants.md#…` anchor, the shape `test/claude-rules.test.ts`'s `HEADLINE_ONLY` enforces; the body goes in `invariants.md`; the same (anchor, headline) bullet also goes
in `.claude/rules/board.md`, because that suite requires CLAUDE.md and the rule files to carry the same pairs).

- [ ] **Step 1:** Guard test (sheets: every `.css` under `client/src` and `shared/`).
- [ ] **Step 2:** `pnpm exec jest test/ui-kit-guard.test.ts` — FAIL naming `.uk-drawer`, `.uk-releases-notes`, `--uk-font-size-lg`.
- [ ] **Step 3:** Clean up as listed. Decide `--uk-ink-muted` (`--ink3` today; the chip used `--ink2`): keep `--ink3` unless the pill reads too faint
  against `--steel` in daylight — note the choice in the commit body.
- [ ] **Step 4:** `pnpm run typecheck && pnpm exec jest test/ui-kit-guard.test.ts test/rail.test.tsx test/ui-kit-tokens.test.ts
  test/releases-drawer.test.tsx test/releases-app.test.tsx test/claude-rules.test.ts` — PASS. Manual check.
- [ ] **Step 5:** Commit; ask before pushing.

### Task 9: claude-agents-dashboard

**Files:** Create `test/ui-kit-guard.test.ts` (in the repo's `t(...)` style, exporting `run(): number` like every suite, imported and called from
`test/run-all.ts` — suites have no self-run entry). Modify
`client/src/components/SideRail.tsx` (wrap; `.rel-chip` moves to the wrapper, placement only; import `useNarrow` from `../hooks/useNarrow` and pass it),
`client/src/components/ReleasesDrawer.tsx` (drop `renderNotes`), `client/src/styles.css` (`.rel-chip` placement only, `.foot+.rel-chip` kept; delete
`.uk-releases-notes .md`; in the `.uk-chip,.uk-drawer-scrim` mapping drop `--uk-font-size-lg`, add `--uk-chip-bg:var(--steel)` and
`--uk-zoom:var(--font-scale,1)` — `.uk-drawer` renders inside `.uk-drawer-scrim`, so it inherits them), `test/releases-client.test.ts:92,95-100`
(assert the wrapper and `narrow`, no `renderNotes`), `test/visual/views.spec.ts:88` (click the chip inside `.rel-chip`; re-record the `releases`
baselines), `docs/subsystems/releases.md:39`, `client/src/main.tsx:11` comment, `.claude/CLAUDE.md` §Code rules (spec: one line pointing at the guard; this repo
has no Invariants section).

- [ ] **Step 1:** Guard test (sheets: every `.css` under `client/src`).
- [ ] **Step 2:** register the suite in `run-all.ts` (for CI), but run it alone — `run-all.ts` takes no filter and is the full suite, which this repo
  forbids locally before a push: `pnpm exec tsx --eval "import('./test/ui-kit-guard.test.ts').then(m => process.exit(m.run()))"` — FAIL naming `.uk-releases-notes .md` and
  `--uk-font-size-lg`.
- [ ] **Step 3:** Clean up as listed.
- [ ] **Step 4:** `pnpm run typecheck`, then the Step 2 form for `ui-kit-guard` and for `releases-client` — PASS; visual suite for `releases` re-recorded. Manual check.
- [ ] **Step 5:** Commit; ask before pushing.
