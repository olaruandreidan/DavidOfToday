import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/DavidOfToday/',
    trace: 'on-first-retry',
    ...devices['Pixel 7']
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/DavidOfToday/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
})
