import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { open } from "./open";

const PAGES = [
  "/",
  "/tokens",
  ...["button", "input", "textarea", "select", "dialog", "menu", "tabs", "segmented-control", "tooltip", "disclosure", "badge", "diff-view", "toast"].map((c) => `/components/${c}`),
  "/writing",
  ...["decisions", "variants", "study-plan", "phase-2-plan", "screen-reader-checklist"].map((w) => `/writing/${w}`),
];

for (const path of PAGES) {
  test(`${path} has one h1 and marks its nav link`, async ({ page }) => {
    await open(page, path);
    await expect(page.locator("h1")).toHaveCount(1);
    if (path !== "/") {
      await expect(page.getByRole("navigation", { name: "Docs" }).locator('[aria-current="page"]')).toHaveCount(1);
    }
  });

  for (const theme of ["light", "dark"] as const) {
    test(`${path} passes axe in ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await open(page, path);
      // Open every code sample so its contents are scanned too.
      for (const details of await page.locator("details").all()) await details.evaluate((d) => ((d as HTMLDetailsElement).open = true));
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const summary = violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      expect(summary).toEqual([]);
    });
  }
}

test("the skip link jumps past the nav to the content", async ({ page, browserName }) => {
  await open(page, "/components/button");
  const skip = page.getByRole("link", { name: "Skip to content" });
  if (browserName === "webkit") {
    // Safari leaves links out of the Tab order unless the user turns on "Press Tab to highlight
    // each item", which WebKit under Playwright can't. Reach it directly; the rest still applies.
    await skip.focus();
  } else {
    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
  }
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.keyboard.press("Tab");
  // The next stop is inside the page content, not the sidebar.
  expect(await page.evaluate(() => document.querySelector("main")?.contains(document.activeElement))).toBe(true);
});

test("the code shown is the file that renders the example", async ({ page }) => {
  await open(page, "/components/button");
  const example = page.locator(".example").filter({ has: page.getByRole("heading", { name: "Variants" }) });
  await example.getByText("Show code").click();
  await expect(example.locator("pre")).toContainText('<Button variant="danger">Delete</Button>');
});
