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
