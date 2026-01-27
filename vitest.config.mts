import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts', 'src/app/api/**/*.ts'],
      exclude: ['**/*.d.ts', '**/types.ts', '**/schema.ts'],
      thresholds: {
        // Starting thresholds based on current coverage
        // Increase these as coverage improves
        lines: 30,
        functions: 30,
        branches: 20,
        statements: 30,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
