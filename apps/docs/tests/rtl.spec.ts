/**
 * Right-to-left mirroring through `:dir(rtl)`. These broke silently once: without a browserslist,
 * the CSS build compiled `:dir(rtl)` into a list of right-to-left languages, which a `dir`
 * attribute never matches.
 */
import { expect, test } from "@playwright/test";
import { open } from "./open";

test("Disclosure: the closed chevron points along the reading direction", async ({ page }) => {
  await open(page, "/components/disclosure");
  const chevron = page.locator(".example-preview summary").first().locator("svg");
  await expect(chevron).toHaveCSS("scale", "none");
  await page.locator(".example-preview").first().evaluate((el) => el.setAttribute("dir", "rtl"));
  await expect(chevron).toHaveCSS("scale", "-1 1");
});

test("Shimmer: the light sweeps in the reading direction", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "/components/shimmer");
  const live = page.locator(".example-preview [data-active]").first();
  await expect(live).toHaveCSS("animation-direction", "normal");
  await live.evaluate((el) => el.setAttribute("dir", "rtl"));
  await expect(live).toHaveCSS("animation-direction", "reverse");
});
