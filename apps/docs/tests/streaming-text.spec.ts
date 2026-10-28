import { expect, test, type Page } from "@playwright/test";
import { open } from "./open";

const SENTENCES = [
  "I found the problem in pagination.ts.",
  "The loop starts at 1, so the first page is skipped.",
  "Checking what else calls firstPage",
  "Nothing else does.",
  "I changed the start to 0 and added a test for the first page.",
  "All 14 tests pass.",
];

const example = (page: Page) => page.locator(".streaming-demo");
const region = (page: Page) => example(page).locator("[aria-live]");

/**
 * Counts every change to the response's text and every announcement the live region receives,
 * from inside the page, so the numbers are what assistive technology was given.
 */
async function record(page: Page) {
  await page.evaluate(() => {
    const root = document.querySelector(".streaming-demo")!;
    const live = root.querySelector("[aria-live]")!;
    // Times are the page's own clock, which the tests control, so they're exact.
    const log = { updates: 0, said: [] as string[], saidAt: [] as number[], pausedAt: 0 };
    (window as unknown as { streamLog: typeof log }).streamLog = log;
    new MutationObserver((records) => {
      if (!records.some((r) => !live.contains(r.target))) return;
      log.updates++;
      if (!log.pausedAt && root.textContent?.includes("calls `firstPage`")) log.pausedAt = Date.now();
    }).observe(root, { childList: true, subtree: true, characterData: true });
    new MutationObserver(() => {
      const text = live.textContent?.trim();
      if (!text) return;
      log.said.push(text);
      log.saidAt.push(Date.now());
    }).observe(live, { childList: true, subtree: true, characterData: true });
  });
}
type StreamLog = { updates: number; said: string[]; saidAt: number[]; pausedAt: number };
const streamLog = (page: Page) => page.evaluate(() => (window as unknown as { streamLog: StreamLog }).streamLog);

/**
 * Moves the page's clock forward in small steps. One big jump would fire timers faster than React
 * renders, so the response's own timers would see text that the component hasn't drawn yet.
 */
async function advance(page: Page, ms: number) {
  for (let t = 0; t < ms; t += 50) await page.clock.runFor(50);
}

/** Advances until the response shows `text`. */
async function until(page: Page, text: string) {
  for (let i = 0; i < 300 && !(await example(page).textContent())?.includes(text); i++) await page.clock.runFor(50);
}

async function play(page: Page, mode?: string) {
  await page.clock.install();
  await open(page, "/components/streaming-text");
  if (mode) await page.getByRole("radio", { name: mode }).click();
  await record(page);
  await page.getByRole("button", { name: "Play response" }).click();
}

test("the text itself is not a live region; the separate region is there before anything streams", async ({ page }) => {
  await open(page, "/components/streaming-text");
  await expect(page.locator("[aria-live]").filter({ has: page.getByText("Nothing yet") })).toHaveCount(0);
  await expect(region(page)).toHaveCount(1);
  await expect(region(page)).toHaveAttribute("aria-live", "polite");
  await expect(region(page)).toBeEmpty();
});

test("screen readers are given whole sentences, a few times per response instead of on every token", async ({ page }) => {
  await play(page);
  await advance(page, 12_000);
  await expect(example(page)).toContainText("All 14 tests pass.");
  const { updates, said } = await streamLog(page);
  expect(said).toEqual(SENTENCES);
  // Dozens of visible updates (how many depends on how often the browser renders) become six announcements.
  expect(updates).toBeGreaterThan(30);
  console.log(`[streaming] ${updates} text updates, ${said.length} announcements`);
});

test("a sentence left unfinished by a pause is said once the pause outlasts `pause`", async ({ page }) => {
  await play(page);
  await until(page, "Nothing else");
  const log = await streamLog(page);
  const at = log.saidAt[log.said.indexOf(SENTENCES[2]!)]!;
  // Said 1.5 seconds after the text stalled, not before. The upper bound allows for a couple of
  // steps of the test's clock.
  expect(at - log.pausedAt).toBeGreaterThanOrEqual(1500);
  expect(at - log.pausedAt).toBeLessThan(1700);
});

test('"At the end" says the whole response once, and "Off" says nothing', async ({ page }) => {
  await play(page, "At the end");
  await until(page, "Nothing else does.");
  expect((await streamLog(page)).said).toEqual([]);
  await advance(page, 6000);
  await expect.poll(async () => (await streamLog(page)).said).toEqual([SENTENCES.join(" ")]);

  await page.getByRole("radio", { name: "Off" }).click();
  await record(page);
  await page.getByRole("button", { name: "Play again" }).click();
  await advance(page, 12_000);
  await expect(example(page)).toContainText("All 14 tests pass.");
  expect((await streamLog(page)).said).toEqual([]);
});

test("stopping says what arrived and was not yet said, and the region empties afterwards", async ({ page }) => {
  await play(page);
  await until(page, "so the first");
  await page.getByRole("button", { name: "Stop" }).click();
  // Everything shown has been said, once, in order.
  const shown = () =>
    example(page).evaluate((el) => {
      const copy = el.cloneNode(true) as Element;
      copy.querySelector("[aria-live]")?.remove();
      return copy.textContent!.replace(/`/g, "").replace(/\s+/g, " ").trim();
    });
  await expect.poll(async () => (await streamLog(page)).said.join(" ")).toBe(await shown());
  expect((await streamLog(page)).said[0]).toBe(SENTENCES[0]);
  // The caret goes with the stream.
  await expect(example(page).locator("[aria-hidden='true']")).toHaveCount(0);
  await advance(page, 5100);
  await expect(region(page)).toBeEmpty();
});

test("the caret is hidden from screen readers, and still with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await play(page);
  await advance(page, 500);
  const caret = example(page).locator("[aria-hidden='true']");
  await expect(caret).toHaveCount(1);
  expect(await caret.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

test("the comparison mode makes the visible text the live region, and the component's own region stays quiet", async ({ page }) => {
  await play(page, "Live text");
  await advance(page, 12_000);
  await expect(example(page)).toHaveAttribute("aria-live", "polite");
  expect((await streamLog(page)).said).toEqual([]);
  await expect(page.getByText(/each of its \d+ changes/)).toBeVisible();
});
