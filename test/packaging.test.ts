import { it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// What a consumer installs is dist/ and nothing else (files: ["dist"]), so the entry points package.json names must be in it, and no built module may pull a
// stylesheet in: guide-manager and backlog-manager run Jest over CommonJS, which cannot load a .css import. The host imports ui-kit/styles.css itself.
const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

it('dist/ holds the esm, cjs and type entry points and the stylesheet', () => {
  for (const f of ['esm/index.js', 'cjs/index.js', 'esm/index.d.ts', 'styles.css']) assert.ok(existsSync(join(dist, f)), `dist/${f} is missing — run npm run build`);
});

it('package.json points its entry points into dist/', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.exports, {
    '.': { types: './dist/esm/index.d.ts', import: './dist/esm/index.js', require: './dist/cjs/index.js' },
    './styles.css': './dist/styles.css',
  });
  assert.equal(pkg.main, './dist/cjs/index.js');
  assert.equal(pkg.types, './dist/esm/index.d.ts');
  assert.deepEqual(pkg.files, ['dist']);
});

it('no file under dist/ imports or requires a stylesheet', () => {
  const css = /\bimport\s*(?:[^'"]*?\bfrom\s*)?['"][^'"]+\.css['"]|\brequire\(\s*['"][^'"]+\.css['"]\s*\)/;
  assert.ok(css.test(`import './a.css';`) && css.test(`import x from "b.css"`) && css.test(`require('c.css')`), 'the pattern itself must match');
  const files = (readdirSync(dist, { recursive: true, withFileTypes: true }) as { isFile(): boolean; parentPath: string; name: string }[]).filter((e) => e.isFile());
  for (const e of files) {
    const path = join(e.parentPath, e.name);
    assert.doesNotMatch(readFileSync(path, 'utf8'), css, `${path.slice(root.length)} imports a stylesheet — components never import CSS`);
  }
});

// The stylesheet's contract (spec D13): every class is uk-*, every var(--uk-…) carries a fallback so an app that maps no token still renders, there are no
// media queries (width is the host's call, passed in as `narrow`), and the README's §Tokens lists exactly the tokens the CSS reads.
const css = readFileSync(join(root, 'src/styles.css'), 'utf8');
const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = (text: string) => new Set(text.match(/--uk-[a-z0-9-]+/g) ?? []);

it('src/styles.css is not empty and reads the minimum tokens the spec names', () => {
  const read = tokens(noComments);
  for (const t of ['--uk-panel-bg', '--uk-ink', '--uk-ink-muted', '--uk-hairline', '--uk-scrim', '--uk-accent', '--uk-font', '--uk-font-mono', '--uk-radius', '--uk-drawer-width', '--uk-z']) {
    assert.ok(read.has(t), `${t} is missing from src/styles.css`);
  }
  for (const type of ['feat', 'fix', 'perf', 'breaking']) {
    for (const part of ['ink', 'tint']) assert.ok(read.has(`--uk-${type}-${part}`), `--uk-${type}-${part} is missing from src/styles.css`);
  }
});

it('every var(--uk-…) in src/styles.css has a fallback', () => {
  const bare = /var\(\s*--uk-[a-z0-9-]+\s*\)/;
  assert.ok(bare.test('var(--uk-ink)') && !bare.test('var(--uk-ink, #222)'), 'the pattern itself must tell the two apart');
  assert.match(noComments, /var\(\s*--uk-/, 'src/styles.css reads no tokens at all');
  assert.doesNotMatch(noComments, bare);
  assert.doesNotMatch(noComments, /var\(\s*--(?!uk-)/, 'every custom property the stylesheet reads is --uk-*');
});

it('src/styles.css has no media queries', () => {
  assert.doesNotMatch(noComments, /@media/i);
});

it('every class selector in src/styles.css starts with .uk-', () => {
  // Drop every declaration block first, so the numbers inside one (.92em, .15s) are never read as classes; with no @media there is no nesting to handle.
  const selectors = noComments.replace(/\{[^{}]*\}/g, '\n');
  const classes = selectors.match(/\.-?[_a-zA-Z][\w-]*/g) ?? [];
  assert.ok(classes.length > 0, 'no class selectors found');
  for (const c of classes) assert.match(c, /^\.uk-/, `${c} is not a uk-* class`);
});

it('the README §Tokens lists exactly the tokens src/styles.css reads', () => {
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  const section = readme.match(/^## Tokens\n([\s\S]*?)(?=^## )/m)?.[1] ?? '';
  const listed = tokens(section);
  const read = tokens(noComments);
  for (const t of listed) assert.ok(read.has(t), `README lists ${t}, which src/styles.css never reads`);
  for (const t of read) assert.ok(listed.has(t), `src/styles.css reads ${t}, which the README §Tokens does not list`);
});

it('dist/styles.css equals src/styles.css', () => {
  assert.equal(readFileSync(join(dist, 'styles.css'), 'utf8'), css, 'dist/styles.css is stale — run npm run build');
});

// The playground (playground/, vite.config.ts, npm run dev) is dev-only: scripts/build.mjs never builds it and files: ["dist"] never ships it.
it('no path under dist/ contains playground', () => {
  const paths = readdirSync(dist, { recursive: true }) as string[];
  assert.ok(paths.length > 0, 'dist/ is empty — run npm run build');
  for (const p of paths) assert.doesNotMatch(p, /playground/i, `dist/${p} is playground output — the playground is never built into dist/`);
});

// Both module systems a consumer can use load the built entry points (spec D7): the dashboard bundles ESM, and the Jest suites in guide-manager and
// backlog-manager require CommonJS. Each must expose the surface an app shell actually wires.
const surface = ['ReleasesDrawer', 'useWhatsNew', 'renderNotesHtml'];

it('require(dist/cjs/index.js) exposes ReleasesDrawer, useWhatsNew and renderNotesHtml', () => {
  const cjs = createRequire(import.meta.url)(join(dist, 'cjs/index.js'));
  for (const name of surface) assert.equal(typeof cjs[name], 'function', `the CommonJS build does not export ${name}`);
  assert.equal(cjs.renderNotesHtml('**a**'), '<p><strong>a</strong></p>');
});

it('import(dist/esm/index.js) exposes ReleasesDrawer, useWhatsNew and renderNotesHtml', async () => {
  const esm = await import(pathToFileURL(join(dist, 'esm/index.js')).href);
  for (const name of surface) assert.equal(typeof esm[name], 'function', `the ESM build does not export ${name}`);
  assert.equal(esm.renderNotesHtml('**a**'), '<p><strong>a</strong></p>');
});

// React is a peer: the consumer's copy must be the one that renders, or hooks break across two Reacts. So dist/ reaches React only through bare `react`
// specifiers the consumer resolves, never through a bundled or vendored copy, and package.json lists it as a peer and nothing else.
it('react resolves from the consumer: dist/ holds no react code and imports nothing else bare', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.peerDependencies, { react: '^18.3 || ^19' });
  assert.equal(pkg.dependencies, undefined, 'ui-kit has no runtime dependencies');
  const specifier = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(?\s*['"]([^'"]+)['"]|\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
  // React's own build carries these strings; a bundled or vendored copy of it would too.
  const reactCode = /react\.(?:transitional\.)?element|__CLIENT_INTERNALS_DO_NOT_USE|__SECRET_INTERNALS_DO_NOT_USE|ReactSharedInternals/;
  const files = (readdirSync(dist, { recursive: true, withFileTypes: true }) as { isFile(): boolean; parentPath: string; name: string }[]).filter((e) => e.isFile());
  let bare = 0;
  for (const e of files) {
    const path = join(e.parentPath, e.name);
    const text = readFileSync(path, 'utf8');
    const rel = path.slice(root.length);
    assert.doesNotMatch(text, reactCode, `${rel} contains react's own code — react is a peer, never bundled`);
    assert.doesNotMatch(rel, /node_modules/, `${rel} vendors a dependency`);
    for (const m of text.matchAll(specifier)) {
      const spec = m[1] ?? m[2] ?? m[3];
      if (spec.startsWith('.')) continue;
      bare++;
      assert.match(spec, /^react(?:\/jsx-runtime)?$/, `${rel} imports ${spec}; the only package dist/ may reach is the consumer's react`);
    }
  }
  assert.ok(bare > 0, 'dist/ imports react nowhere — the pattern found no bare specifiers');
});
