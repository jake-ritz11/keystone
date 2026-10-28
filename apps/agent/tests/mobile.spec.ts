/**
 * Phone-width checks for the agent app, the same standards as the docs site's
 * (apps/docs/tests/mobile.spec.ts and docs/mobile.md): no sideways page scroll at 320px, every
 * control at least 24 by 24, and a fingertip, 44 by 44, on a touch screen.
 */
import { expect, test, type Browser, type Page } from "@playwright/test";

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

async function start(page: Page) {
  await page.goto("/?speed=fast");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

async function waiting(page: Page) {
  await page.getByRole("button", { name: /Fix the broken link/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Waiting for you" })).toBeVisible();
}

for (const width of [320, 375]) {
  test(`at ${width}px nothing scrolls the page sideways: the picker, and each pane of a session`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await start(page);
    expect(await overflowing(page)).toEqual({ page: 0, elements: [] });
    await waiting(page);
    expect(await overflowing(page)).toEqual({ page: 0, elements: [] });
    await page.getByRole("radiogroup", { name: "View" }).getByRole("radio", { name: "Workspace" }).click();
    for (const tab of ["Preview", "Changes", "Files"]) {
      await page.getByRole("tab", { name: tab }).click();
      expect(await overflowing(page), tab).toEqual({ page: 0, elements: [] });
    }
  });
}

test("every control is at least 24 by 24 at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await start(page);
  expect(await smallTargets(page, 24, true)).toEqual([]);
  await waiting(page);
  expect(await smallTargets(page, 24, true)).toEqual([]);
});

test("on a touch screen every control is a fingertip, 44 by 44, and the composer's text is 16px", async ({ browser, browserName }) => {
  test.skip(browserName === "firefox", "Firefox has no mobile emulation");
  const context = await (browser as Browser).newContext({ viewport: { width: 375, height: 800 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await start(page);
  expect(await smallTargets(page, 44, false)).toEqual([]);
  await waiting(page);
  expect(await smallTargets(page, 44, false)).toEqual([]);
  const size = await page.getByRole("textbox", { name: "Message the agent" }).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(16);
  await context.close();
});
