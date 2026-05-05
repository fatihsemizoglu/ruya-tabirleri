import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: false,
  retries: 0,
  workers: undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/test-results.json' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd server && npm run dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:8080',
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
