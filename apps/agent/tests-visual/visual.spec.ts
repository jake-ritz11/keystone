import { expect, test, type Page } from "@playwright/test";

const THEMES = ["light", "dark"] as const;
const SIZES = { desktop: { width: 1280, height: 800 }, phone: { width: 390, height: 844 } } as const;

test.skip(process.platform !== "linux", "baselines are rendered in CI's Linux image; fonts and antialiasing differ elsewhere");

async function load(page: Page, theme: (typeof THEMES)[number], size: keyof typeof SIZES) {
  await page.setViewportSize(SIZES[size]);
  await page.emulateMedia({ colorScheme: theme });
  await page.goto("/?speed=fast");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
}

/** How long the agent thought depends on the machine; everything else in a replay is fixed. */
const hideTimers = (page: Page) => page.addStyleTag({ content: '[class*="_elapsed"] { visibility: hidden }' });

for (const theme of THEMES) {
  test(`task picker, ${theme}`, async ({ page }) => {
    await load(page, theme, "desktop");
    await expect(page.getByRole("heading", { name: "What should the agent work on?" })).toBeVisible();
    await expect(page).toHaveScreenshot(`picker--${theme}.png`);
  });

  for (const size of ["desktop", "phone"] as const) {
    test(`waiting for approval, ${size}, ${theme}`, async ({ page }) => {
      await load(page, theme, size);
      await page.getByRole("button", { name: /Fix the broken link/ }).click();
      await expect(page.getByRole("status").filter({ hasText: "Waiting for you" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
      await hideTimers(page);
      await expect(page).toHaveScreenshot(`waiting--${size}--${theme}.png`);
    });
  }
}
