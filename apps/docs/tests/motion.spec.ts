import { expect, test } from "@playwright/test";
import { open } from "./open";

const animation = (el: Element) => getComputedStyle(el).animationName;
const color = (el: Element) => getComputedStyle(el).color;

test.describe("with motion on", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("shimmer sweeps while active, and stops when the work ends", async ({ page }) => {
    await open(page, "/components/shimmer");
    const thinking = page.getByText("Thinking…", { exact: true });
    await expect(thinking).toHaveAttribute("data-active");
    expect(await thinking.evaluate(animation)).toContain("sweep");

    await page.getByRole("button", { name: "Finish" }).click();
    const done = page.getByText("Thought for 4 seconds", { exact: true });
    await expect(done).not.toHaveAttribute("data-active");
    expect(await done.evaluate(animation)).toBe("none");
    expect(await done.evaluate(color)).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("a pulsing badge dot animates; a plain one doesn't", async ({ page }) => {
    await open(page, "/components/badge");
    const running = page.locator("[data-pulse]");
    await expect(running).toHaveCount(1);
    expect(await running.evaluate(animation)).toContain("pulse");
  });
});

test("reduced motion: shimmer text is still and readable, the badge dot is still", async ({ page }) => {
  await open(page, "/components/shimmer");
  const thinking = page.getByText("Thinking…", { exact: true });
  expect(await thinking.evaluate(animation)).toBe("none");
  // The sweep paints the text through a transparent color; reduced motion must undo that.
  expect(await thinking.evaluate(color)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await page.locator("[data-pulse]").evaluate(animation)).toBe("none");
});

async function countTransitions(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const w = window as unknown as { transitions: number };
    w.transitions = 0;
    const original = document.startViewTransition?.bind(document);
    if (original) {
      document.startViewTransition = ((cb: () => void) => {
        w.transitions++;
        return original(cb);
      }) as typeof document.startViewTransition;
    }
  });
}

test.describe("theme changes, with motion on", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("cross-fade through a view transition where the browser has one", async ({ page }) => {
    await open(page, "/motion");
    const supported = await page.evaluate(() => "startViewTransition" in document);
    test.skip(!supported, "No view transitions in this browser; the theme still changes, without a fade.");
    await countTransitions(page);
    await page.getByRole("button", { name: /^Theme: system/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await page.evaluate(() => (window as unknown as { transitions: number }).transitions)).toBe(1);
  });
});

test("reduced motion: the theme changes at once, with no view transition", async ({ page }) => {
  await open(page, "/motion");
  await countTransitions(page);
  await page.getByRole("button", { name: /^Theme: system/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => (window as unknown as { transitions: number }).transitions)).toBe(0);
});

test("the easing plots follow the tokens", async ({ page }) => {
  await open(page, "/motion");
  await expect(page.getByRole("img", { name: "--ks-motion-easing-standard: cubic-bezier(0.2, 0, 0, 1)" })).toBeVisible();
  await expect(page.getByRole("img", { name: "--ks-motion-easing-emphasized: cubic-bezier(0.3, 0, 0, 1.3)" })).toBeVisible();
});

test.describe("theme changes in quick succession", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("two quick clicks step twice, even mid-transition", async ({ page }) => {
    await open(page, "/motion");
    const toggle = page.getByRole("button", { name: /^Theme: / });
    // Both in one task, so the second lands before the first transition has applied anything.
    await toggle.evaluate((button: HTMLElement) => {
      button.click();
      button.click();
    });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveText("Theme: dark");
  });
});
