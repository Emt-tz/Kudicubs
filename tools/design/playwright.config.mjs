// T042: phone-sized, touch-enabled runs against the prototype opened from disk (file://).
import { defineConfig } from '@playwright/test';

const phone = { viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 };

export default defineConfig({
  testDir: './tests',
  testMatch: /flow\.spec\.mjs$/,
  timeout: 120_000,
  retries: 0,
  reporter: 'list',
  use: { ...phone },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', isMobile: true, ...phone } },
    { name: 'webkit', use: { browserName: 'webkit', ...phone } },
  ],
});
