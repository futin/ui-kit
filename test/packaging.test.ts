import { it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
