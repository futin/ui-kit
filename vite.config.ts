// The dev-only playground (spec D18): `npm run dev` serves playground/, which renders every fixture under three approximate app themes. It is never built
// into dist/ — scripts/build.mjs only runs tsc over src/ — and files: ["dist"] keeps it out of the package; test/packaging.test.ts checks the first half.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'playground',
  plugins: [react()],
});
