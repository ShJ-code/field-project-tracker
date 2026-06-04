import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Resolve the shared contract package to its TypeScript source (same approach
// as the server's vitest config) so there is no separate build step.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@field-tracker/shared': fileURLToPath(
        new URL('../shared/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
  },
});
