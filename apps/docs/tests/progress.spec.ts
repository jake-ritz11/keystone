import { expect, test, type Page } from "@playwright/test";
import { open } from "./open";

const bar = (page: Page, name: string) => page.getByRole("progressbar", { name });

test("is a native progress bar, named by its label, with its value", async ({ page }) => {
  await open(page, "/components/progress");
  const indexing = bar(page, "Indexing the repository");
  await expect(indexing).toHaveJSProperty("value", 40);
  await expect(indexing).toHaveJSProperty("max", 100);
  // A percentage is what screen readers say for a progress bar anyway, so there's no valuetext.
  await expect(indexing).not.toHaveAttribute("aria-valuetext");
  await expect(page.getByText("40%", { exact: true })).toBeVisible();
  // A status, not a control: it isn't in the tab order.
  await expect(indexing).not.toHaveAttribute("tabindex");
});

test("formatValue sets the shown and announced value, and both follow updates", async ({ page }) => {
  await open(page, "/components/progress");
  const uploading = bar(page, "Uploading files");
  await expect(uploading).toHaveAttribute("aria-valuetext", "3 of 12 files");
  await expect(uploading).toHaveAccessibleDescription("You can keep working while this finishes.");
  await page.getByRole("button", { name: "Upload another" }).click();
  await expect(uploading).toHaveJSProperty("value", 4);
  await expect(uploading).toHaveAttribute("aria-valuetext", "4 of 12 files");
  await expect(page.getByText("4 of 12 files", { exact: true })).toBeVisible();
});

test("without a value it's indeterminate: a moving band, or stripes with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "/components/progress");
  const waiting = bar(page, "Waiting for the model");
  expect(await waiting.evaluate((el) => el.matches(":indeterminate"))).toBe(true);
  expect(await waiting.evaluate((el) => el.getAnimations().length)).toBe(1);
  // Nothing to show beside the label while the amount is unknown.
  await expect(page.locator(".example-preview").nth(1).locator('[aria-hidden="true"]')).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "/components/progress");
  expect(await waiting.evaluate((el) => el.getAnimations().length)).toBe(0);
  await expect(waiting).toHaveCSS("background-image", /repeating-linear-gradient/);
});
