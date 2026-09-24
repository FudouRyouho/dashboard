const { defineConfig } = require('vitest/config');
const path = require('path');

module.exports = defineConfig({
  test: {
    root: '.',
    environment: 'node',
    singleThread: true,
    testTimeout: 120000,
    include: [
      'packages/*/src/**/*.test.ts',
      'apps/server/src/**/*.test.ts',
    ],
    exclude: [
      'apps/server/src/scripts/trpc-error-smoke.test.ts',
      'apps/server/src/trpc-client.test.ts',
      'apps/server/src/server.e2e.test.ts',
      'apps/server/src/bootstrap/persistence-e2e.test.ts',
      'packages/integrations/src/prometheus/prometheus.e2e.test.ts',
      'references/**',
    ],
    coverage: {
      provider: 'v8',
      reporters: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: [
        'packages/*/src/**/*.ts',
        'apps/server/src/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '.git/**',
        'references/**',
      ],
      thresholds: {
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50,
      },
      all: true,
    },
  },
  resolve: {
    alias: {
      '@dashboard/common': path.resolve(__dirname, 'packages/common/src'),
      '@dashboard/contracts': path.resolve(__dirname, 'packages/contracts/src'),
      '@dashboard/db': path.resolve(__dirname, 'packages/db/src'),
      '@dashboard/definitions': path.resolve(__dirname, 'packages/definitions/src'),
      '@dashboard/integrations': path.resolve(__dirname, 'packages/integrations/src'),
      '@dashboard/tasks': path.resolve(__dirname, 'packages/tasks/src'),
      '@dashboard/testing-utils': path.resolve(__dirname, 'packages/testing-utils/src'),
    },
  },
});
