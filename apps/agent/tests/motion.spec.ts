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

test("the preview swaps pages behind the scenes: one named frame, the old one cleaned up", async ({ page }) => {
  await start(page, /Fix the broken link/);
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(status(page)).toHaveText("Done");
  const named = page.locator('iframe[title="Preview of index.html"]');
  const frames = page.locator("iframe");

  await page.getByRole("radio", { name: "Before" }).click();
  // Mid-swap there can be two frames, but only the new one is named and reachable.
  await expect(named).toHaveCount(1);
  await expect(page.frameLocator('iframe[title="Preview of index.html"]').locator('a[href="about.html"]')).toHaveCount(0);
  await expect(frames).toHaveCount(1);

  await page.getByRole("radio", { name: "Now" }).click();
  await expect(page.frameLocator('iframe[title="Preview of index.html"]').locator('a[href="about.html"]')).toHaveCount(1);
  await expect(frames).toHaveCount(1);
});

test("Ctrl+K: the command menu approves the pending edit and starts tasks", async ({ page }) => {
  await start(page, /Fix the broken link/);
  await expect(status(page)).toHaveText("Waiting for you");

  await page.keyboard.press("Control+k");
  const menu = page.getByRole("dialog", { name: "Commands" });
  const search = menu.getByRole("combobox", { name: "Commands" });
  // The search field takes focus in the open effect, a frame after the dialog shows; keys
  // typed before that would go to the page. No person types that fast, but a test can.
  await expect(search).toBeFocused();
  await page.keyboard.type("approve");
  await expect(menu.getByRole("option", { name: "Approve the edit to index.html" })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  await expect(status(page)).toHaveText("Done");

  // From anywhere, start another task.
  await page.getByRole("button", { name: "Commands" }).click();
  await expect(search).toBeFocused();
  await page.keyboard.type("pricing");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("list", { name: "Conversation" })).toContainText("pricing table");
});
