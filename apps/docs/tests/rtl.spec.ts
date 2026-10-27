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

test("Slider: the fill grows from the right, where the minimum is", async ({ page, browserName }) => {
  await open(page, "/components/slider");
  const lines = page.getByRole("slider", { name: "Lines of context in diffs" });
  await expect(lines).toHaveCSS("--toward", "right");
  await page.locator(".example-preview").first().evaluate((el) => el.setAttribute("dir", "rtl"));
  await expect(lines).toHaveCSS("--toward", "left");
  // Both engines put the minimum on the right: a click at the right edge is 0.
  const box = (await lines.boundingBox())!;
  await page.mouse.click(box.x + box.width - 2, box.y + box.height / 2);
  await expect(lines).toHaveValue("0");
  // The arrow keys differ: Chromium's Left moves the thumb left (up), WebKit's means "less".
  await page.keyboard.press("ArrowLeft");
  await expect(lines).toHaveValue(browserName === "webkit" ? "0" : "1");
});

test("Progress: the indeterminate band travels in the reading direction", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "/components/progress");
  const waiting = page.getByRole("progressbar", { name: "Waiting for the model" });
  await expect(waiting).toHaveCSS("animation-direction", "normal");
  await waiting.evaluate((el) => el.setAttribute("dir", "rtl"));
  await expect(waiting).toHaveCSS("animation-direction", "reverse");
});
