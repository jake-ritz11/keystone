import { expect, test, type Page } from "@playwright/test";

const region = (page: Page) => page.getByRole("region", { name: "Notifications" });
const show = (page: Page, name: string) => page.getByRole("button", { name, exact: true }).click();

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
});

test("shows in the Notifications region and announces politely", async ({ page }) => {
  await show(page, "Success");
  await expect(region(page).getByRole("listitem")).toHaveCount(1);
  await expect(region(page)).toContainText("Project published");
  await expect(page.getByRole("status").filter({ hasText: "Project published" })).toHaveText(
    "Project published. It's live for everyone in the workspace.",
  );
});

test("a danger toast announces assertively", async ({ page }) => {
  await show(page, "Danger");
  // Next.js has its own role="alert" route announcer, so pick ours by its text.
  await expect(page.getByRole("alert").filter({ hasText: "Couldn't upload file" })).toHaveText(
    "Couldn't upload file. Check your connection and try again.",
  );
});

test("dismisses itself after its duration", async ({ page }) => {
  await show(page, "Neutral");
  await expect(region(page).getByRole("listitem")).toHaveCount(1);
  await page.clock.fastForward(5_500);
  await expect(region(page).getByRole("listitem")).toHaveCount(0);
});

test("hovering the stack pauses the timer (WCAG 2.2.1)", async ({ page }) => {
  await show(page, "Neutral");
  await region(page).getByRole("listitem").hover();
  await page.clock.fastForward(20_000);
  await expect(region(page).getByRole("listitem")).toHaveCount(1);
  await page.mouse.move(5, 5);
  await page.clock.fastForward(5_500);
  await expect(region(page).getByRole("listitem")).toHaveCount(0);
});

test("a persistent toast stays until dismissed by its named button", async ({ page }) => {
  await show(page, "Persistent");
  await page.clock.fastForward(60_000);
  const dismiss = region(page).getByRole("button", { name: "Dismiss: Stays until closed" });
  await expect(dismiss).toBeVisible();
  await dismiss.click();
  await expect(region(page).getByRole("listitem")).toHaveCount(0);
});

test("the action runs and dismisses its toast", async ({ page }) => {
  await show(page, "With action");
  await region(page).getByRole("button", { name: "Undo" }).click();
  await expect(region(page)).not.toContainText("3 files moved to trash");
  await expect(region(page)).toContainText("Files restored");
});

test("over a modal dialog it can be used without closing the dialog", async ({ page }) => {
  await show(page, "From a dialog");
  const dialog = page.getByRole("dialog", { name: "Toasts above a modal" });
  await dialog.getByRole("button", { name: "Show toast" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Shown above the dialog" })).toHaveCount(1);
  await region(page).getByRole("button", { name: "Dismiss: Shown above the dialog" }).click();
  await expect(region(page).getByRole("listitem")).toHaveCount(0);
  await expect(dialog).toBeVisible();
});
