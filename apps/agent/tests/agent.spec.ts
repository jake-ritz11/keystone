import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const status = (page: Page) => page.getByRole("status").filter({ hasText: /Working|Waiting|Done|Stopped|Something/ }).first();

async function open(page: Page) {
  await page.goto("/?speed=fast");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

async function setVariants(page: Page, choices: { planning?: string; visibility?: string; approval?: string }) {
  await page.getByRole("button", { name: "Variants" }).click();
  const dialog = page.getByRole("dialog", { name: "Interaction variants" });
  if (choices.planning) await dialog.getByLabel("Planning").selectOption({ label: choices.planning });
  if (choices.visibility) await dialog.getByLabel("Tool calls").selectOption({ label: choices.visibility });
  if (choices.approval) await dialog.getByLabel("Approval").selectOption({ label: choices.approval });
  await dialog.getByRole("button", { name: "Start new session" }).click();
}

const startTask = (page: Page, title: string) => page.getByRole("button", { name: new RegExp(title) }).click();
const conversation = (page: Page) => page.getByRole("list", { name: "Conversation" });

test("tasks without a replay say they need live mode", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("button", { name: /Add a dark mode/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Fix the broken link/ })).toBeEnabled();
});

test("approve each edit: the run waits, approval applies it, the run finishes", async ({ page }) => {
  await open(page);
  await startTask(page, "Fix the broken link");
  await expect(status(page)).toHaveText("Waiting for you");
  const diff = page.getByRole("region", { name: "index.html", exact: true });
  await expect(diff).toContainText('Added: <a href="about.html">About</a>');
  await diff.getByRole("button", { name: "Approve" }).click();
  await expect(status(page)).toHaveText("Done");
  await expect(conversation(page)).toContainText("Fixed the About link");
  // The plan finished complete.
  await expect(page.getByRole("region", { name: "Plan" }).getByText("Done:")).toHaveCount(2);
  // And the workspace shows the change.
  await page.getByRole("tab", { name: /Changes/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText('<a href="about.html">About</a>');
});

test("rejecting an edit sends the reason back and changes nothing", async ({ page }) => {
  await open(page);
  await startTask(page, "Fix the broken link");
  const diff = page.getByRole("region", { name: "index.html", exact: true });
  await diff.getByRole("button", { name: "Reject" }).click();
  await page.getByLabel("Why? (optional)").fill("Link to the pricing page instead");
  await page.getByRole("button", { name: "Reject edit" }).click();
  await expect(diff).toContainText("Rejected");
  await expect(page.getByText("Your reason: Link to the pricing page instead")).toBeVisible();
  await page.getByRole("tab", { name: /Changes/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("No changes yet.");
});

test("plan first: nothing runs until the plan is approved", async ({ page }) => {
  await open(page);
  await setVariants(page, { planning: "Plan first" });
  await startTask(page, "Fix the broken link");
  const plan = page.getByRole("region", { name: "Plan" });
  await expect(plan.getByText("Waiting for your approval")).toBeVisible();
  await plan.getByLabel("Anything to change? (optional)").fill("Check about.html too");
  await plan.getByRole("button", { name: "Approve plan" }).click();
  await expect(status(page)).toHaveText("Waiting for you");
  await page.getByRole("region", { name: "index.html", exact: true }).getByRole("button", { name: "Approve" }).click();
  await expect(status(page)).toHaveText("Done");
});

test("review at the end: edits apply as it works, then wait for review", async ({ page }) => {
  await open(page);
  await setVariants(page, { approval: "Review at the end" });
  await startTask(page, "Fix the pricing table on phones");
  await expect(status(page)).toHaveText("Done. Review the changes.");
  await expect(page.getByRole("region", { name: "Review 4 changes" })).toBeVisible();
  const review = page.getByRole("region", { name: /^Review \d+ changes?$/ });
  await review.getByRole("button", { name: "Undo" }).first().click();
  await expect(page.getByRole("region", { name: "Review 3 changes" })).toBeVisible();
  await review.getByRole("button", { name: "Keep the rest" }).click();
  await expect(status(page)).toHaveText("Done");
});

test("apply automatically: edits land at once and can be undone", async ({ page }) => {
  await open(page);
  await setVariants(page, { approval: "Apply automatically" });
  await startTask(page, "Fix the broken link");
  await expect(status(page)).toHaveText("Done");
  const diff = page.getByRole("region", { name: "index.html", exact: true });
  await diff.getByRole("button", { name: "Undo" }).click();
  await expect(diff).toContainText("Undone");
  await page.getByRole("tab", { name: /Changes/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("No changes yet.");
});

test("visibility variants draw the same run differently", async ({ page }) => {
  await open(page);
  await setVariants(page, { visibility: "Narrative", approval: "Apply automatically" });
  await startTask(page, "Fix the broken link");
  await expect(status(page)).toHaveText("Done");
  await expect(conversation(page)).toContainText("Updated the plan, listed the files and searched once");
  await expect(conversation(page).getByText("Read index.html")).toHaveCount(0);

  // Changing variants mid-session restarts the same task under the new ones.
  await setVariants(page, { visibility: "Outcomes only", approval: "Apply automatically" });
  await expect(status(page)).toHaveText("Done");
  await expect(conversation(page).getByText(/Listed the files|Searched for/)).toHaveCount(0);
  await expect(page.getByRole("region", { name: "index.html", exact: true })).toBeVisible();
});

test("Stop answers every pending edit and lets you carry on", async ({ page }) => {
  await open(page);
  await startTask(page, "Fix the pricing table on phones");
  await expect(status(page)).toHaveText("Waiting for you");
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(status(page)).toHaveText("Stopped");
  await expect(conversation(page).getByText("Rejected")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
});

test("preview: page, before and after, and phone width", async ({ page }) => {
  await open(page);
  await setVariants(page, { approval: "Apply automatically" });
  await startTask(page, "Fix the pricing table on phones");
  await expect(status(page)).toHaveText("Done");
  const frame = page.frameLocator('iframe[title="Preview of index.html"]');
  await expect(frame.locator(".plans-scroll")).toHaveCount(1);
  await page.getByRole("button", { name: "Before" }).click();
  await expect(frame.locator(".plans-scroll")).toHaveCount(0);
  await page.getByRole("button", { name: "Phone" }).click();
  await expect(page.getByRole("button", { name: "Phone" })).toHaveAttribute("aria-pressed", "true");
  const width = await page.locator('iframe[title="Preview of index.html"]').evaluate((f) => f.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(390);
});

for (const theme of ["light", "dark"] as const) {
  test(`no axe violations in ${theme}: picker and a session awaiting review`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await open(page);
    const scan = async () => {
      const { violations } = await new AxeBuilder({ page }).exclude("iframe").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    };
    expect(await scan()).toEqual([]);
    await startTask(page, "Fix the pricing table on phones");
    await expect(status(page)).toHaveText("Waiting for you");
    expect(await scan()).toEqual([]);
  });
}

test("the app fits the window on desktop and never scrolls sideways on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page);
  await startTask(page, "Fix the pricing table on phones");
  await expect(status(page)).toHaveText("Waiting for you");
  const overflow = () =>
    page.evaluate(() => ({
      y: document.documentElement.scrollHeight - window.innerHeight,
      x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
  expect(await overflow()).toEqual({ y: 0, x: 0 });
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await overflow()).x).toBe(0);
  // Review buttons wrap below the file name instead of running off the right edge.
  for (const button of await page.getByRole("button", { name: "Approve" }).all()) {
    const box = (await button.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
});
