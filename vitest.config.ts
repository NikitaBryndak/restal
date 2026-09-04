import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@': root },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000, // first run downloads the mongod binary for mongodb-memory-server
    coverage: {
      provider: 'v8',
      include: [
        'app/**/*.{ts,tsx}',
        'lib/**/*.ts',
        'components/**/*.{ts,tsx}',
        'models/**/*.ts',
        'middleware.ts',
      ],
      exclude: ['**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
