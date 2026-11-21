// Playwright: phone-sized, touch-enabled runs against tools/design/serve.mjs (004 T004).
// 390×844 for every spec; 360×640 ("-small") for the fold spec and the tap-target audit.
import { defineConfig } from '@playwright/test';

const phone = { viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 };
const small = { viewport: { width: 360, height: 640 }, hasTouch: true, deviceScaleFactor: 2 };
const PORT = Number(process.env.KC_TEST_PORT || 4173);
const SITE_PORT = Number(process.env.KC_SITE_PORT || 4174);   // 005: the whole set (dist/) for the hub, website and dashboards

export default defineConfig({
  testDir: './tests',
  testMatch: /\.spec\.mjs$/,
  timeout: 120_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: `http://127.0.0.1:${PORT}/`, ...phone },
  webServer: [
    {
      command: `node serve.mjs`,
      env: { PORT: String(PORT) },
      url: `http://127.0.0.1:${PORT}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 20_000,
    },
    {
      command: `node build-site.mjs && node serve.mjs --root dist`,
      env: { PORT: String(SITE_PORT) },
      url: `http://127.0.0.1:${SITE_PORT}/robots.txt`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
  projects: [
    { name: 'chromium', testIgnore: /smoke\.spec|voice-dropin\.spec|[\\/]site[\\/]/, use: { browserName: 'chromium', isMobile: true, ...phone } },
    { name: 'webkit', testIgnore: /smoke\.spec|voice-dropin\.spec|[\\/]site[\\/]/, use: { browserName: 'webkit', ...phone } },
    { name: 'chromium-small', testMatch: /fold\.spec\.mjs$/, use: { browserName: 'chromium', isMobile: true, ...small } },
    { name: 'webkit-small', testMatch: /fold\.spec\.mjs$/, use: { browserName: 'webkit', ...small } },
    /* adds files to the served folder, so it waits for every other project to finish */
    { name: 'drop-in', testMatch: /voice-dropin\.spec\.mjs$/, dependencies: ['chromium', 'webkit', 'chromium-small', 'webkit-small'],
      use: { browserName: 'chromium', ...phone } },
    /* 005: specs under tests/site/ run against dist/ (baseURL = the set's root) and set their own viewport per test */
    { name: 'site', testMatch: /[\\/]site[\\/].*\.spec\.mjs$/, use: { browserName: 'chromium', baseURL: `http://127.0.0.1:${SITE_PORT}/`, viewport: { width: 1280, height: 800 }, hasTouch: false, deviceScaleFactor: 1 } },
    { name: 'smoke', testMatch: /smoke\.spec\.mjs$/, use: { browserName: 'chromium', ...phone } },
  ],
});
