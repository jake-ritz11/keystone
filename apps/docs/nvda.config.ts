import { devices } from "@playwright/test";
import { withGuidepup } from "@guidepup/playwright";

const PORT = 3210;

/**
 * Screen-reader tests: a real NVDA, driven by Guidepup, listening to the production docs build.
 * Windows only, in their own CI job (see .github/workflows/screen-reader.yml). Guidepup runs
 * them one at a time in a headed browser, since there's only one screen reader to share.
 */
export default withGuidepup({
  testDir: "tests-sr",
  // NVDA is slow to start and its speech timing varies, so allow time and retries.
  timeout: 5 * 60 * 1000,
  retries: 2,
  reportSlowTests: null,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
  },
  projects: [{ name: "nvda-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
