import { expect, test, type Page } from "@playwright/test";

const trigger = (page: Page) => page.getByRole("button", { name: "Actions", exact: true });
const menu = (page: Page) => page.getByRole("menu", { name: "Actions" });
const item = (page: Page, name: string) => menu(page).getByRole("menuitem", { name });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("trigger and menu are wired for assistive tech", async ({ page }) => {
  await expect(trigger(page)).toHaveAttribute("aria-haspopup", "menu");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await expect(trigger(page)).toHaveAttribute("aria-controls", (await menu(page).getAttribute("id")) ?? "");
  await expect(menu(page).getByRole("menuitem")).toHaveCount(5);
  await expect(menu(page).getByRole("separator")).toHaveCount(1);
});

test("opening focuses the first item; arrows skip disabled items and wrap", async ({ page }) => {
  await trigger(page).click();
  await expect(item(page, "Rename")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(item(page, "Duplicate")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  // "Archive" is aria-disabled, so Download goes straight to Delete.
  await expect(item(page, "Delete")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(item(page, "Rename")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(item(page, "Delete")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(item(page, "Rename")).toBeFocused();
  await page.keyboard.press("End");
  await expect(item(page, "Delete")).toBeFocused();
});

test("typeahead jumps to the next item starting with the letter", async ({ page }) => {
  await trigger(page).click();
  await page.keyboard.press("d");
  await expect(item(page, "Duplicate")).toBeFocused();
  await page.keyboard.press("d");
  await expect(item(page, "Download")).toBeFocused();
  await page.keyboard.press("d");
  await expect(item(page, "Delete")).toBeFocused();
});

test("ArrowUp on the trigger opens on the last item", async ({ page }) => {
  await trigger(page).focus();
  await page.keyboard.press("ArrowUp");
  await expect(item(page, "Delete")).toBeFocused();
});

test("Escape closes and returns focus to the trigger", async ({ page }) => {
  await trigger(page).click();
  await page.keyboard.press("Escape");
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
});

test("choosing an item runs it, closes, and returns focus", async ({ page }) => {
  await trigger(page).click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await expect(page.getByText("Last action: Duplicate")).toBeVisible();
});

test("a disabled item does nothing", async ({ page }) => {
  await trigger(page).click();
  const archive = menu(page).getByRole("menuitem", { name: /Archive/ });
  await expect(archive).toHaveAttribute("aria-disabled", "true");
  // force: Playwright refuses to click aria-disabled elements, which is the point being tested.
  await archive.click({ force: true });
  await expect(menu(page)).toBeVisible();
  await expect(page.getByText("Last action: Nothing yet")).toBeVisible();
});

test("Tab and outside clicks close it", async ({ page }) => {
  await trigger(page).click();
  await page.keyboard.press("Tab");
  await expect(menu(page)).toBeHidden();
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(menu(page)).toBeHidden();
});

test("clicking the trigger again toggles it closed", async ({ page }) => {
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  await trigger(page).click();
  await expect(menu(page)).toBeHidden();
});
