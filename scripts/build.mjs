// Builds dist/esm (with .d.ts) and dist/cjs from src/, and copies src/styles.css to dist/. dist/ is committed: consumers install this package from a git
// tag, and pnpm blocks a dependency's lifecycle scripts by default, so nothing may need building at install time.
import { execFileSync } from 'node:child_process';
import { copyFileSync, rmSync, writeFileSync } from 'node:fs';

// An optional argument redirects the output; test/dist-drift.test.ts builds into a tmp dir this way and compares it with the committed dist/.
const out = process.argv[2] ?? 'dist';
const tsc = (project, outDir) => execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', project, '--outDir', outDir], { stdio: 'inherit' });

rmSync(out, { recursive: true, force: true });
tsc('tsconfig.esm.json', `${out}/esm`);
tsc('tsconfig.cjs.json', `${out}/cjs`);
// The package is "type": "module"; this marker makes Node read dist/cjs/*.js as CommonJS.
writeFileSync(`${out}/cjs/package.json`, '{"type":"commonjs"}\n');
// Components never import CSS (Jest in two consumers cannot load it); the host imports ui-kit/styles.css once from its client entry.
copyFileSync('src/styles.css', `${out}/styles.css`);
