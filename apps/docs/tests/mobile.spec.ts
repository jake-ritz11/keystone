/**
 * Phone-width checks for every page, from the standards in docs/mobile.md:
 * - WCAG 1.4.10 Reflow: at 320 CSS px nothing scrolls the page sideways. Only a part that needs
 *   two dimensions (a table, a code block, a diff) may scroll, inside its own container.
 * - WCAG 2.5.8 Target Size: every control is at least 24 by 24 CSS px. Links inside a sentence
 *   are exempt, as the criterion allows.
 * - iOS zooms into a text field whose text is under 16px, so on a touch screen fields use 16px.
 */
import { expect, test, type Browser, type Page } from "@playwright/test";
import { COMPONENTS } from "@keystone-ui/ui/docs";
import { open } from "./open";
import { WRITING } from "../app/_docs/registry";

const PAGES = [
  "/",
  "/tokens",
  "/motion",
  ...COMPONENTS.map((c) => `/components/${c.slug}`),
  "/writing",
  ...WRITING.map((w) => `/writing/${w.slug}`),
];

/** Elements that stick out past the right edge without a scroll container of their own to hold them. */
function overflowing(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const scrolls = (el: Element | null): boolean => {
      for (let node = el?.parentElement; node && node !== document.body; node = node.parentElement) {
        const { overflowX } = getComputedStyle(node);
        if (overflowX === "auto" || overflowX === "scroll" || overflowX === "hidden" || overflowX === "clip") return true;
      }
      return false;
    };
    const out: string[] = [];
    for (const el of document.body.querySelectorAll("*")) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.right <= width + 1 || scrolls(el)) continue;
      // Hidden things (a closed popover, a visually hidden label) don't count.
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none" || style.position === "fixed") continue;
      out.push(`${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(" ")[0]}` : ""} right=${Math.round(box.right)}`);
    }
    return { page: document.documentElement.scrollWidth - width, elements: out.slice(0, 5) };
  });
}

/**
 * Controls whose hit area is smaller than `min` in either direction. A native checkbox or radio
 * is measured by its row, which is its label's hit area too. Controls inside a sentence are exempt,
 * as 2.5.8 allows. With `spacing`, 2.5.8's spacing exception applies: an undersized target passes
 * if a circle of diameter `min` centered on it touches no other target and no other such circle.
 */
function smallTargets(page: Page, min: number, spacing: boolean, scope = "body") {
  return page.evaluate(
    ({ min, spacing, scope }) => {
      const controls = [
        ...document.querySelectorAll<HTMLElement>(
          `${scope} :is(button, a[href], input:not([type="hidden"]), select, textarea, summary, [role="radio"], [role="tab"])`,
        ),
      ];
      const rowOf = (el: HTMLElement) =>
        el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")
          ? (el.closest<HTMLElement>('[class*="_checkbox"], [class*="_switch"], [class*="_option"]') ?? el)
          : el;
      const targets = controls
        .map((el) => ({ el, box: rowOf(el).getBoundingClientRect() }))
        .filter(({ el, box }) => box.width > 0 && box.height > 0 && getComputedStyle(el).visibility !== "hidden")
        // A link or button inside running text (an agent's file reference, say) is inline.
        // Browsers report a button set to display: inline as inline-block, so both count.
        .filter(({ el }) => !(getComputedStyle(el).display.startsWith("inline") && !el.matches("input, select, textarea") && el.closest("p, li, td, th, dd, figcaption")));
      const small = targets.filter(({ box }) => box.width < min || box.height < min);
      const center = (b: DOMRect) => ({ x: b.left + b.width / 2, y: b.top + b.height / 2 });
      const distanceToBox = (p: { x: number; y: number }, b: DOMRect) =>
        Math.hypot(Math.max(b.left - p.x, 0, p.x - b.right), Math.max(b.top - p.y, 0, p.y - b.bottom));
      return small
        .filter(({ el, box }) => {
          if (!spacing) return true;
          const c = center(box);
          return targets.some((other) => {
            if (other.el === el || other.el.contains(el) || el.contains(other.el)) return false;
            const undersized = other.box.width < min || other.box.height < min;
            return undersized ? Math.hypot(c.x - center(other.box).x, c.y - center(other.box).y) < min : distanceToBox(c, other.box) < min / 2;
          });
        })
        .map(({ el, box }) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(box.width)}x${Math.round(box.height)}`);
    },
    { min, spacing, scope },
  );
}

/** A phone: touch, a coarse pointer, and mobile emulation. Chromium and WebKit only. */
async function phone(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 800 }, hasTouch: true, isMobile: true });
  return { context, page: await context.newPage() };
}

for (const width of [320, 375]) {
  for (const path of PAGES) {
    test(`${path} reflows at ${width}px: nothing scrolls the page sideways`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await open(page, path);
      expect(await overflowing(page)).toEqual({ page: 0, elements: [] });
    });
  }
}

for (const path of PAGES) {
  test(`${path}: every control is at least 24 by 24 at phone width`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await open(page, path);
    expect(await smallTargets(page, 24, true)).toEqual([]);
  });
}

test("text fields use 16px text on touch screens, so iOS doesn't zoom in on focus", async ({ browser, browserName }) => {
  test.skip(browserName === "firefox", "Firefox has no mobile emulation");
  const { context, page } = await phone(browser);
  for (const path of ["/components/input", "/components/textarea", "/components/select"]) {
    await open(page, path);
    const sizes = await page.locator(".example-preview :is(input, textarea, select)").evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize)));
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.filter((s) => s < 16), path).toEqual([]);
  }
  await context.close();
});

for (const { slug } of COMPONENTS) {
  test(`/components/${slug}: on a touch screen every control in the examples is a fingertip, 44 by 44`, async ({ browser, browserName }) => {
    test.skip(browserName === "firefox", "Firefox has no mobile emulation");
    const { context, page } = await phone(browser);
    await open(page, `/components/${slug}`);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    expect(await smallTargets(page, 44, false, ".example-preview")).toEqual([]);
    await context.close();
  });
}

test("on a touch screen, a tap anywhere along a checkbox's row toggles it", async ({ browser, browserName }) => {
  test.skip(browserName === "firefox", "Firefox has no mobile emulation");
  const { context, page } = await phone(browser);
  await open(page, "/components/checkbox");
  const box = page.getByRole("checkbox", { name: "Send me a summary when a task finishes" });
  const before = await box.isChecked();
  await box.scrollIntoViewIfNeeded();
  const row = (await page.locator('[class*="_checkbox"]').filter({ has: box }).boundingBox())!;
  // The far end of the row, past the end of the label's text.
  await page.touchscreen.tap(row.x + row.width - 4, row.y + row.height / 2);
  await expect(box).toBeChecked({ checked: !before });
  await context.close();
});

test("on a phone the docs nav is a Menu button that opens the grouped list, and closes on navigation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page, "/components/button");
  const menu = page.getByRole("button", { name: /^Menu/ });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("navigation", { name: "Docs" }).getByRole("link", { name: "Slider" })).toBeHidden();
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("heading", { name: "Components", level: 2 })).toBeVisible();
  await page.getByRole("navigation", { name: "Docs" }).getByRole("link", { name: "Slider" }).click();
  await expect(page).toHaveURL(/\/components\/slider$/);
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  // Escape closes it too, and leaves focus on the button.
  await menu.click();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
});
