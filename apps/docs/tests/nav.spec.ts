import { expect, test, type Page } from "@playwright/test";
import { open } from "./open";

const nav = (page: Page) => page.getByRole("navigation", { name: "Docs" });
// A summary's text includes its count ("Forms9"), so the label is matched at the start.
const group = (page: Page, name: string) =>
  nav(page).locator("details").filter({ has: page.locator("summary", { hasText: new RegExp(`^${name}\\d`) }) });
const search = (page: Page) => page.getByRole("dialog", { name: "Search docs" });

test("the sidebar opens only the category holding the current page", async ({ page }) => {
  await open(page, "/components/slider");
  await expect(group(page, "Forms")).toHaveAttribute("open", "");
  for (const closed of ["Actions", "Overlays", "Layout", "Display"]) await expect(group(page, closed)).not.toHaveAttribute("open");
  await expect(nav(page).getByRole("link", { name: "Slider" })).toHaveAttribute("aria-current", "page");
  await expect(nav(page).getByRole("link", { name: "Dialog" })).toBeHidden();

  // A closed category opens with its summary, and stays open as the reader left it.
  await nav(page).locator("summary", { hasText: "Overlays" }).click();
  await expect(nav(page).getByRole("link", { name: "Dialog" })).toBeVisible();
  await nav(page).getByRole("link", { name: "Dialog" }).click();
  await expect(page).toHaveURL(/\/components\/dialog$/);
  await expect(group(page, "Overlays")).toHaveAttribute("open", "");
});

test("search finds pages by name and by what they are for, and Enter goes there", async ({ page }) => {
  await open(page, "/components/button");
  await page.getByRole("button", { name: "Search docs" }).click();
  await expect(search(page)).toBeVisible();
  await page.keyboard.type("modal");
  // "modal" is in no page title; the summaries find Dialog, Popover and Toast.
  await expect(search(page).getByRole("option")).toHaveText(["Dialog", "Popover", "Toast"]);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/components\/dialog$/);
  await expect(search(page)).toBeHidden();
});

test("Ctrl+K and / open search, but / typed into a field is just a character", async ({ page }) => {
  await open(page, "/components/input");
  await page.keyboard.press("Control+k");
  await expect(search(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(search(page)).toBeHidden();

  await page.keyboard.press("/");
  await expect(search(page)).toBeVisible();
  await page.keyboard.press("Escape");

  const field = page.getByRole("textbox", { name: "Name", exact: true });
  await field.fill("");
  await field.press("/");
  await expect(search(page)).toBeHidden();
  await expect(field).toHaveValue("/");
});

test("on the CommandMenu page, Ctrl+K belongs to the demo, and / still searches", async ({ page }) => {
  await open(page, "/components/command-menu");
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Commands" })).toBeVisible();
  await expect(search(page)).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Commands" })).toBeHidden();
  await page.keyboard.press("/");
  await expect(search(page)).toBeVisible();
});

test("on a phone, search stays above the Menu button", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page, "/components/button");
  const trigger = page.getByRole("button", { name: "Search docs" });
  await expect(trigger).toBeVisible();
  const menu = page.getByRole("button", { name: /^Menu/ });
  expect((await trigger.boundingBox())!.y).toBeLessThan((await menu.boundingBox())!.y);
});
