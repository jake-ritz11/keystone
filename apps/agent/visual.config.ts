import { defineConfig, devices } from "@playwright/test";

const PORT = 3213;

/**
 * Visual regression for the agent app: the task picker and a session waiting for approval, at
 * desktop and phone widths, in both themes. Baselines come from CI's Linux image, like the
 * docs site's (see apps/docs/visual.config.ts).
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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
