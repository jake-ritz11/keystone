import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("opens as a named modal and moves focus inside", async ({ page }) => {
  await page.getByRole("button", { name: "Edit profile" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit profile" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription("Changes are visible to everyone in your workspace.");
  await expect(dialog.getByLabel("Name")).toBeFocused();
  expect(await dialog.evaluate((el) => el.matches(":modal"))).toBe(true);
});

test("keeps Tab inside the dialog", async ({ page }) => {
  await page.getByRole("button", { name: "Edit profile" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit profile" });
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    // The browser chrome can take a turn in the cycle; the page itself must never get focus.
    const inside = await dialog.evaluate(
      (el) => document.activeElement === document.body || el.contains(document.activeElement),
    );
    expect(inside).toBe(true);
  }
});

test("Escape closes and returns focus to the trigger", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Edit profile" });
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("the close button closes and returns focus", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Small, no footer" });
  await trigger.click();
  await page.getByRole("dialog", { name: "Keyboard shortcuts" }).getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("a backdrop click closes a dismissible dialog", async ({ page }) => {
  await page.getByRole("button", { name: "Small, no footer" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a drag that ends on the backdrop does not close it", async ({ page }) => {
  await page.getByRole("button", { name: "Small, no footer" }).click();
  const box = await page.getByRole("dialog").getByText("Close with the corner button").boundingBox();
  if (!box) throw new Error("dialog body not laid out");
  await page.mouse.move(box.x + 4, box.y + 4);
  await page.mouse.down();
  await page.mouse.move(5, 5);
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("an alertdialog ignores backdrop clicks but still closes on Escape", async ({ page }) => {
  await page.getByRole("button", { name: "Delete project" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Delete this project?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Keep project" })).toBeFocused();
  await expect(dialog.getByRole("button", { name: "Close" })).toHaveCount(0);
  await page.mouse.click(5, 5);
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("the page behind does not scroll while a dialog is open", async ({ page }) => {
  await page.getByRole("button", { name: "Long content" }).click();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("visible");
});
