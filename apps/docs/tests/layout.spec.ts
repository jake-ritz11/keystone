import { expect, test, type Locator, type Page } from "@playwright/test";
import { open } from "./open";

/**
 * Layout stability: nothing should move under the user's pointer or caret as a side effect of
 * opening, focusing, validating or loading. Each test measures a box before and after.
 */

const box = async (locator: Locator) => {
  const b = await locator.boundingBox();
  if (!b) throw new Error("element isn't laid out");
  return { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height) };
};

/** A page tall enough to scroll, so there's a scrollbar for a modal to (not) take away. */
async function makeScrollable(page: Page) {
  await page.evaluate(() => {
    const spacer = document.createElement("div");
    spacer.style.height = "3000px";
    document.querySelector("main")?.append(spacer);
  });
}

test("opening a dialog doesn't shift the page sideways", async ({ page }) => {
  await open(page, "/components/dialog");
  await makeScrollable(page);
  const scrollbar = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);
  test.skip(scrollbar === 0, "This browser's scrollbars overlay the page and take no space, so there's no shift to measure.");
  const trigger = page.getByRole("button", { name: "Small, no footer" });
  // Scroll first, so the only thing that could move the layout is the dialog itself.
  await trigger.scrollIntoViewIfNeeded();
  const heading = page.getByRole("heading", { name: "Small, dismissible" });
  const before = await box(heading);
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  // Measured on real content: clientWidth isn't reliable here, since Chromium reports the full
  // width while overflow is hidden even though the gutter stays reserved.
  expect(await box(heading)).toEqual(before);
  // And the page behind really is locked.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await box(heading)).toEqual(before);
});

test("a validation error appearing on blur doesn't move the next field", async ({ page }) => {
  await open(page, "/components/input");
  const username = page.getByRole("textbox", { name: "Username" });
  const next = page.getByRole("textbox", { name: "Display name" });
  await username.fill("");
  await username.blur();
  await expect(username).toHaveAttribute("aria-invalid", "true");
  const withError = await box(next);
  await username.fill("grace");
  await expect(username).not.toHaveAttribute("aria-invalid", "true");
  expect(await box(next)).toEqual(withError);
  // The real-world case: typing a bad value, then clicking the next field.
  await username.fill("admin");
  const before = await box(next);
  await next.click();
  await expect(username).toHaveAttribute("aria-invalid", "true");
  expect(await box(next)).toEqual(before);
  await expect(next).toBeFocused();
});

test("an error replaces the hint instead of adding a line", async ({ page }) => {
  await open(page, "/components/input");
  const field = page.getByRole("textbox", { name: "Username" }).locator("xpath=ancestor::div[contains(@class,'field')][1]");
  const username = page.getByRole("textbox", { name: "Username" });
  await username.fill("grace");
  const valid = await box(field);
  await username.fill("admin");
  await expect(username).toHaveAttribute("aria-invalid", "true");
  expect((await box(field)).height).toBe(valid.height);
  // The hint is hidden visually but still part of the field's description.
  await expect(username).toHaveAccessibleDescription(/That username is taken\. Letters and numbers only\./);
});

test("a loading button keeps its size", async ({ page }) => {
  await open(page, "/components/button");
  const example = page.locator(".example").filter({ has: page.getByRole("heading", { name: "Loading and disabled" }) });
  const button = example.getByRole("button", { name: "Save changes" });
  await button.scrollIntoViewIfNeeded();
  const before = await box(button);
  await button.click();
  await expect(button).toHaveAttribute("aria-busy", "true");
  expect(await box(button)).toEqual(before);
  await expect(button).toHaveAccessibleName("Save changes");
});
