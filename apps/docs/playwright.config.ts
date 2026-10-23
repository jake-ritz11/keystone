import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;

/**
 * Behavior tests run against the production build of the docs site in real Chromium: the
 * components lean on <dialog>, popover and anchor positioning, which jsdom doesn't implement.
 */
export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Keeps transitions out of the way of assertions; the reduced-motion paths get exercised too.
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Real, space-taking scrollbars, so the layout-shift tests have something to measure.
        launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] },
      },
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
