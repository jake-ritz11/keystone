import { expect, test, type Page } from "@playwright/test";
import { open } from "./open";

const group = (page: Page, name: string) => page.getByRole("group", { name });
const item = (page: Page, groupName: string, name: string) => group(page, groupName).getByRole("button", { name, exact: true });

test.beforeEach(async ({ page }) => open(page, "/components/toggle-group"));

test("toggle buttons in a named group, icon-only ones still named by their labels", async ({ page }) => {
  await expect(item(page, "Text style", "Bold")).toHaveAttribute("aria-pressed", "true");
  await expect(item(page, "Text style", "Italic")).toHaveAttribute("aria-pressed", "false");
  // Visually hidden, the same way as a hidden field label: clipped to nothing, still in the tree.
  await expect(page.getByText("Bold", { exact: true })).toHaveCSS("clip-path", "inset(50%)");
  // Disabled stays in place and announced, so it isn't the native disabled attribute.
  const network = item(page, "Show in the activity log", "Network");
  await expect(network).toHaveAttribute("aria-disabled", "true");
  await expect(network).not.toHaveAttribute("disabled");
});

test("with multiple, any number press and release, kept in the options' order", async ({ page }) => {
  await item(page, "Text style", "Code").click();
  await item(page, "Text style", "Italic").click();
  await expect(page.getByText("Pressed: bold, italic, code")).toBeVisible();
  await item(page, "Text style", "Bold").click();
  await expect(page.getByText("Pressed: italic, code")).toBeVisible();
  // force: Playwright won't click what's aria-disabled, which is the point being tested.
  await item(page, "Show in the activity log", "Network").click({ force: true });
  await expect(item(page, "Show in the activity log", "Network")).toHaveAttribute("aria-pressed", "false");
});

test("without multiple, at most one is pressed, and pressing it again leaves none", async ({ page }) => {
  const errors = item(page, "Only show", "Errors");
  const warnings = item(page, "Only show", "Warnings");
  await errors.click();
  await expect(errors).toHaveAttribute("aria-pressed", "true");
  await warnings.click();
  await expect(errors).toHaveAttribute("aria-pressed", "false");
  await expect(warnings).toHaveAttribute("aria-pressed", "true");
  await warnings.click();
  await expect(group(page, "Only show").locator('[aria-pressed="true"]')).toHaveCount(0);
});

test("one Tab stop; the arrows move without pressing, skip disabled and wrap; Space presses", async ({ page }) => {
  const log = (name: string) => item(page, "Show in the activity log", name);
  // The Tab stop starts on the first pressed button.
  await item(page, "Only show", "Errors").focus();
  await page.keyboard.press("Shift+Tab");
  await expect(log("Edits")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(log("Commands")).toBeFocused();
  // Moving didn't change anything.
  await expect(log("Commands")).toHaveAttribute("aria-pressed", "true");
  await expect(log("Edits")).toHaveAttribute("aria-pressed", "true");
  // Network is disabled, so Right wraps to the first.
  await page.keyboard.press("ArrowRight");
  await expect(log("Reads")).toBeFocused();
  await page.keyboard.press("Space");
  await expect(log("Reads")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("End");
  await expect(log("Commands")).toBeFocused();
  // Tab leaves the group, and Shift+Tab comes back to the button last used.
  await page.keyboard.press("Tab");
  await expect(group(page, "Only show").getByRole("button").first()).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(log("Commands")).toBeFocused();
});

test("the arrow keys follow the reading direction", async ({ page }) => {
  await page.locator(".example-preview").nth(1).evaluate((el) => el.setAttribute("dir", "rtl"));
  await item(page, "Show in the activity log", "Edits").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(item(page, "Show in the activity log", "Commands")).toBeFocused();
});
