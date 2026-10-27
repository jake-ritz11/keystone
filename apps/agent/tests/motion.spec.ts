import { expect, test, type Page } from "@playwright/test";

const status = (page: Page) => page.getByRole("status").filter({ hasText: /Working|Waiting|Done|Stopped|Something/ }).first();

async function start(page: Page, task: RegExp) {
  await page.goto("/?speed=fast");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await page.getByRole("button", { name: task }).click();
}

test("the plan counts its steps in words, and the bar follows", async ({ page }) => {
  await start(page, /Fix the broken link/);
  const plan = page.getByRole("region", { name: "Plan" });
  await expect(status(page)).toHaveText("Waiting for you");
  await expect(plan).toContainText("1 of 2 done");
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(status(page)).toHaveText("Done");
  await expect(plan).toContainText("2 of 2 done");
  const bar = plan.locator("[aria-hidden] > span");
  await expect(bar).toHaveAttribute("data-complete");
  await expect(bar).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
});

test("thinking is timed once the agent moves on", async ({ page }) => {
  await start(page, /Fix the pricing table/);
  await expect(status(page)).toHaveText("Waiting for you");
  await expect(page.getByRole("list", { name: "Conversation" })).toContainText(/Reading the pricing markup.*for \ds/);
});

test("scrolled up: Jump to latest appears, and takes you back to the end and the composer", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await start(page, /Fix the pricing table/);
  await expect(status(page)).toHaveText("Waiting for you");
  const jump = page.getByRole("button", { name: "Jump to latest" });
  await expect(jump).toHaveCount(0);

  const scroller = page.locator("section[aria-label='Agent'] > div").first();
  await scroller.evaluate((el) => el.scrollTo({ top: 0 }));
  await expect(jump).toBeVisible();

  await jump.click();
  await expect(jump).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Message the agent" })).toBeFocused();
  await expect.poll(() => scroller.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight)).toBeLessThan(2);
});
