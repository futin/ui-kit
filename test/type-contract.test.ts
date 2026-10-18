import { it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { ReleasesResponse as ReleaseKitResponse } from 'release-kit';
import type { ReleasesResponse } from '../src/types.js';
import * as fixtures from '../fixtures/releases.js';

// ui-kit owns its wire types and takes release-kit only as a devDependency (spec D19), so the two can drift apart silently. These declarations are the
// contract: tsc refuses this file the moment release-kit's ReleasesResponse stops fitting ui-kit's, or a fixture stops fitting either.
// Functions, not top-level values: the contract is checked by tsc and must cost nothing when tsx runs this file.
export const accepts = (fromReleaseKit: ReleaseKitResponse): ReleasesResponse => fromReleaseKit;
export const fixturesFit = (): Record<keyof typeof fixtures, ReleasesResponse> => fixtures;

const root = fileURLToPath(new URL('..', import.meta.url));

it('the type contract compiles: release-kit responses and every fixture fit ui-kit ReleasesResponse', () => {
  const tsc = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], { cwd: root, encoding: 'utf8' });
  assert.equal(tsc.status, 0, `tsc failed:\n${tsc.stdout}${tsc.stderr}`);
});
