import { defineConfig } from '@playwright/test';
import { APP_DIR, SERVER_DIR, loadTestDb, venvPython } from './lib/test-db';

// Throws if the test DB equals the app's real DB — must run before any server starts.
const db = loadTestDb();

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  // Serial on purpose: ng serve compiles lazy routes on demand and the test DB pool is shared.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4200',
    // Always headed — deliberately hardcoded, do not flip to true.
    headless: false,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: `"${venvPython()}" -m uvicorn main:app --port 8000`,
      cwd: SERVER_DIR,
      url: 'http://localhost:8000/api/auth/session',
      // false on purpose: an already-running server was started against the REAL database.
      reuseExistingServer: false,
      timeout: 120_000,
      env: { DATABASE_URL: db.url, DB_SSL: db.ssl, ENV: 'development' },
    },
    {
      command: 'npm run --prefix client start',
      cwd: APP_DIR,
      url: 'http://localhost:4200',
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
});
