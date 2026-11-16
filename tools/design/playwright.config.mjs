// Playwright: phone-sized, touch-enabled runs against tools/design/serve.mjs (004 T004).
// 390×844 for every spec; 360×640 ("-small") for the fold spec and the tap-target audit.
import { defineConfig } from '@playwright/test';

const phone = { viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 };
const small = { viewport: { width: 360, height: 640 }, hasTouch: true, deviceScaleFactor: 2 };
const PORT = Number(process.env.KC_TEST_PORT || 4173);

export default defineConfig({
  testDir: './tests',
  testMatch: /\.spec\.mjs$/,
  timeout: 120_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: `http://127.0.0.1:${PORT}/`, ...phone },
  webServer: {
    command: `node serve.mjs`,
    env: { PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
  projects: [
    { name: 'chromium', testIgnore: /smoke\.spec|voice-dropin\.spec/, use: { browserName: 'chromium', isMobile: true, ...phone } },
    { name: 'webkit', testIgnore: /smoke\.spec|voice-dropin\.spec/, use: { browserName: 'webkit', ...phone } },
    { name: 'chromium-small', testMatch: /fold\.spec\.mjs$/, use: { browserName: 'chromium', isMobile: true, ...small } },
    { name: 'webkit-small', testMatch: /fold\.spec\.mjs$/, use: { browserName: 'webkit', ...small } },
    /* adds files to the served folder, so it waits for every other project to finish */
    { name: 'drop-in', testMatch: /voice-dropin\.spec\.mjs$/, dependencies: ['chromium', 'webkit', 'chromium-small', 'webkit-small'],
      use: { browserName: 'chromium', ...phone } },
    { name: 'smoke', testMatch: /smoke\.spec\.mjs$/, use: { browserName: 'chromium', ...phone } },
  ],
});
