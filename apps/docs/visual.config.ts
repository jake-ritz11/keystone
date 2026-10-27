import { defineConfig, devices } from "@playwright/test";

const PORT = 3211;

/**
 * Visual regression: screenshots of every example and the open states of the overlays, compared
 * against committed baselines. Text rendering differs between operating systems, so the
 * baselines come from CI's Playwright image and the comparison only runs on Linux. To refresh
 * them, run the "Update screenshots" workflow and commit what it uploads.
 */
export default defineConfig({
  testDir: "tests-visual",
  snapshotPathTemplate: "{testDir}/screenshots/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: { animations: "disabled", caret: "hide" },
  },
  // Chromium only: the behavior specs cover the engines; this covers how the kit looks.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
