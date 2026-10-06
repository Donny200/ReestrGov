import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5183', viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
  globalSetup: './tests/start-vite.mjs',
  projects: [
    { name: 'ui', testMatch: ['admin-functions.spec.ts', 'primitives.spec.ts'] },
    { name: 'backend', testMatch: 'backend-flow.spec.ts' },
  ],
});
