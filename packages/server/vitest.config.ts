import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Resolve the shared contract package to its TypeScript source so tests pick up
// changes without a build step.
export default defineConfig({
  resolve: {
    alias: {
      '@field-tracker/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
  },
});
