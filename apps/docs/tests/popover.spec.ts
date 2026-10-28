import { expect, test, type Page } from "@playwright/test";
import { open } from "./open";

const share = (page: Page) => page.getByRole("button", { name: "Share", exact: true });
const shareDialog = (page: Page) => page.getByRole("dialog", { name: "Share this session" });
const filters = (page: Page) => page.getByRole("button", { name: "Filters", exact: true });
const filterDialog = (page: Page) => page.getByRole("dialog", { name: "Filter the log" });

test.beforeEach(async ({ page }) => open(page, "/components/popover"));

test("the trigger says it opens a dialog; opening it names the dialog and focuses the first control", async ({ page }) => {
  await expect(share(page)).toHaveAttribute("aria-haspopup", "dialog");
  await expect(share(page)).toHaveAttribute("aria-expanded", "false");
  await share(page).click();
  await expect(shareDialog(page)).toBeVisible();
  await expect(share(page)).toHaveAttribute("aria-expanded", "true");
  await expect(shareDialog(page).getByRole("textbox", { name: "Link" })).toBeFocused();
});

test("Escape and the close button close it and return focus to the trigger", async ({ page }) => {
  await share(page).focus();
  await page.keyboard.press("Enter");
  await expect(shareDialog(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(shareDialog(page)).toBeHidden();
  await expect(share(page)).toBeFocused();
  await expect(share(page)).toHaveAttribute("aria-expanded", "false");

  await page.keyboard.press("Space");
  await shareDialog(page).getByRole("button", { name: "Close" }).click();
  await expect(shareDialog(page)).toBeHidden();
  await expect(share(page)).toBeFocused();
});

test("it doesn't trap focus: Tab goes through it and on into the page, and it stays open", async ({ page }) => {
  await share(page).click();
  await expect(shareDialog(page).getByRole("textbox", { name: "Link" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(shareDialog(page).getByRole("switch")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(shareDialog(page).getByRole("button", { name: "Copy link" })).toBeFocused();
  await page.keyboard.press("Tab");
  // The next thing on the page after the trigger: the example's "Show code".
  await expect(page.locator(".example").first().locator("summary")).toBeFocused();
  await expect(shareDialog(page)).toBeVisible();
});

test("a click outside closes it without pulling focus back to the trigger", async ({ page }) => {
  await share(page).click();
  await expect(shareDialog(page)).toBeVisible();
  await page.getByRole("heading", { name: "Popover", level: 1 }).click();
  await expect(shareDialog(page)).toBeHidden();
  await expect(share(page)).not.toBeFocused();
});

test("controlled: Apply closes it through open, and reopening starts from what's applied", async ({ page }) => {
  await filters(page).click();
  await filterDialog(page).getByRole("checkbox", { name: "Reads" }).uncheck();
  await filterDialog(page).getByRole("button", { name: "Apply" }).click();
  await expect(filterDialog(page)).toBeHidden();
  await expect(page.getByText("Showing: Edits, Commands")).toBeVisible();
  await expect(filters(page)).toBeFocused();

  // A change that isn't applied is dropped.
  await filters(page).click();
  await filterDialog(page).getByRole("checkbox", { name: "Edits" }).uncheck();
  await page.keyboard.press("Escape");
  await filters(page).click();
  await expect(filterDialog(page).getByRole("checkbox", { name: "Edits" })).toBeChecked();
  await expect(filterDialog(page).getByRole("checkbox", { name: "Reads" })).not.toBeChecked();
});

test("it sits under its trigger, lined up with the start or the end edge", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1200 });
  await share(page).click();
  const trigger = (await share(page).boundingBox())!;
  const popover = (await shareDialog(page).boundingBox())!;
  expect(Math.abs(popover.x - trigger.x)).toBeLessThan(2);
  expect(popover.y).toBeGreaterThan(trigger.y + trigger.height);
  await page.keyboard.press("Escape");

  await filters(page).click();
  const endTrigger = (await filters(page).boundingBox())!;
  const endPopover = (await filterDialog(page).boundingBox())!;
  expect(Math.abs(endPopover.x + endPopover.width - (endTrigger.x + endTrigger.width))).toBeLessThan(2);
});

test("without room below, it flips above its trigger", async ({ page }) => {
  await share(page).evaluate((el) => el.scrollIntoView({ block: "end" }));
  await share(page).click();
  const trigger = (await share(page).boundingBox())!;
  const popover = (await shareDialog(page).boundingBox())!;
  expect(popover.y + popover.height).toBeLessThan(trigger.y);
});
