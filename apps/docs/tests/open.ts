import type { Page } from "@playwright/test";

/** Navigates and waits for React to hydrate, so keyboard input isn't lost to a race. */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}
