import { expect, test, type Page } from "@playwright/test";
import { colorHighContrast, color } from "@keystone-ui/tokens";
import { open } from "./open";

const token = (page: Page, name: string) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

/** The resolved border color of the first text field on the page, once its transition settles. */
async function fieldBorder(page: Page) {
  const control = page.getByRole("textbox", { name: "Name" }).first().locator("..");
  await control.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  return control.evaluate((el) => getComputedStyle(el).borderTopColor);
}

const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

for (const theme of ["light", "dark"] as const) {
  test(`${theme}: prefers-contrast: more switches to the high-contrast tokens`, async ({ page }) => {
    // Each state loads the page fresh: Firefox under Playwright doesn't restyle when the
    // emulated contrast changes after load.
    await page.emulateMedia({ colorScheme: theme, contrast: "no-preference" });
    await open(page, "/components/input");
    expect(await token(page, "--ks-color-text-muted")).toBe(color[theme].textMuted);
    expect(await fieldBorder(page)).toBe(rgb(color[theme].borderControl));

    await page.emulateMedia({ colorScheme: theme, contrast: "more" });
    await open(page, "/components/input");
    expect(await token(page, "--ks-color-text-muted")).toBe(colorHighContrast[theme].textMuted);
    expect(await fieldBorder(page)).toBe(rgb(colorHighContrast[theme].borderControl));

    // data-contrast pins it either way, whatever the system says.
    await page.evaluate(() => (document.documentElement.dataset.contrast = "normal"));
    expect(await fieldBorder(page)).toBe(rgb(color[theme].borderControl));
    await page.emulateMedia({ colorScheme: theme, contrast: "no-preference" });
    await open(page, "/components/input");
    await page.evaluate(() => (document.documentElement.dataset.contrast = "more"));
    expect(await fieldBorder(page)).toBe(rgb(colorHighContrast[theme].borderControl));
  });
}

test("a pinned theme and high contrast combine", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", contrast: "more" });
  await open(page, "/components/input");
  await page.evaluate(() => (document.documentElement.dataset.theme = "dark"));
  expect(await fieldBorder(page)).toBe(rgb(colorHighContrast.dark.borderControl));
});
