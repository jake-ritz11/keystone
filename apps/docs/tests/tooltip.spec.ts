import { expect, test } from "@playwright/test";
import { open } from "./open";

test.beforeEach(async ({ page }) => {
  await open(page, "/components/tooltip");
});

test("describes its trigger, and labels an icon-only one", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Hover or focus me" })).toHaveAccessibleDescription(
    "Saves a copy to your workspace",
  );
  // The icon-only button has no text of its own; the tooltip is its name.
  await expect(page.getByRole("button", { name: "Search", exact: true })).toBeVisible();
});

test("hover shows it after the delay and leaving hides it", async ({ page }) => {
  const tooltip = page.getByRole("tooltip", { name: "Saves a copy to your workspace" });
  await page.getByRole("button", { name: "Hover or focus me" }).hover();
  await page.waitForTimeout(150);
  await expect(tooltip).toBeHidden();
  await expect(tooltip).toBeVisible();
  await page.mouse.move(5, 5);
  await expect(tooltip).toBeHidden();
});

test("the pointer can move onto the tooltip without it closing (WCAG 1.4.13)", async ({ page }) => {
  const tooltip = page.getByRole("tooltip", { name: "No delay on this one" });
  await page.getByRole("button", { name: "Instant" }).hover();
  await expect(tooltip).toBeVisible();
  await tooltip.hover();
  await page.waitForTimeout(300);
  await expect(tooltip).toBeVisible();
});

test("keyboard focus shows it at once; Escape and blur hide it", async ({ page }) => {
  const tooltip = page.getByRole("tooltip", { name: "Saves a copy to your workspace" });
  await page.getByRole("button", { name: "Hover or focus me" }).focus();
  // focus() from script doesn't count as :focus-visible, so arrive by keyboard instead.
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).toBeHidden();
  await expect(page.getByRole("button", { name: "Hover or focus me" })).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(tooltip).toBeHidden();
  await expect(page.getByRole("tooltip", { name: "Opens below, and flips if there is no room" })).toBeVisible();
});
