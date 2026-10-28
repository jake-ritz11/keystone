import { expect, test, type Page } from "@playwright/test";
import { open } from "./open";

const header = (page: Page, name: string) => page.getByRole("heading", { name }).getByRole("button");
const panel = (page: Page, name: string) => page.getByRole("region", { name });

test("each title is a heading holding the button; an open section is a region named by it", async ({ page }) => {
  await open(page, "/components/accordion");
  await expect(page.getByRole("heading", { level: 4, name: "Which files can the agent change?" })).toBeVisible();
  const files = header(page, "Which files can the agent change?");
  await expect(files).toHaveAttribute("aria-expanded", "true");
  await expect(panel(page, "Which files can the agent change?")).toContainText("Only files in the project");
  await expect(header(page, "Can I undo an edit?")).toHaveAttribute("aria-expanded", "false");
  // Closed sections are hidden until found, not removed, so find-in-page still searches them.
  await expect(page.locator(`#${await header(page, "Can I undo an edit?").getAttribute("aria-controls")}`)).toHaveAttribute(
    "hidden",
    "until-found",
  );
});

test("one open at a time: opening another closes the first, and opening the open one closes it", async ({ page }) => {
  await open(page, "/components/accordion");
  await header(page, "Can I undo an edit?").click();
  await expect(header(page, "Can I undo an edit?")).toHaveAttribute("aria-expanded", "true");
  await expect(header(page, "Which files can the agent change?")).toHaveAttribute("aria-expanded", "false");
  await expect(panel(page, "Can I undo an edit?")).toBeVisible();
  await header(page, "Can I undo an edit?").click();
  await expect(header(page, "Can I undo an edit?")).toHaveAttribute("aria-expanded", "false");
});

test("multiple and controlled: Expand all opens every enabled section, and they close independently", async ({ page }) => {
  await open(page, "/components/accordion");
  await page.getByRole("button", { name: "Expand all" }).click();
  for (const name of ["Read the pricing page", "Fix the table overflow", "Check it at phone width"]) {
    await expect(header(page, name)).toHaveAttribute("aria-expanded", "true");
  }
  await header(page, "Fix the table overflow").click();
  await expect(header(page, "Fix the table overflow")).toHaveAttribute("aria-expanded", "false");
  await expect(header(page, "Read the pricing page")).toHaveAttribute("aria-expanded", "true");
  await expect(header(page, "Deploy the preview")).toBeDisabled();
});

test("the arrow keys move between headings, wrapping and skipping disabled ones; Enter opens", async ({ page }) => {
  await open(page, "/components/accordion");
  await header(page, "Read the pricing page").focus();
  await page.keyboard.press("ArrowDown");
  await expect(header(page, "Fix the table overflow")).toBeFocused();
  await page.keyboard.press("End");
  await expect(header(page, "Check it at phone width")).toBeFocused();
  // Deploy is disabled, so Down wraps to the first.
  await page.keyboard.press("ArrowDown");
  await expect(header(page, "Read the pricing page")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(header(page, "Check it at phone width")).toBeFocused();
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await expect(header(page, "Read the pricing page")).toHaveAttribute("aria-expanded", "true");
  // The arrows stay inside one accordion: the questions above aren't reached.
  await page.keyboard.press("ArrowUp");
  await expect(header(page, "Check it at phone width")).toBeFocused();
});

test("a match in a closed section opens it, as find-in-page does", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "text fragments and beforematch are Chromium's for now");
  await open(page, "/components/accordion");
  // A same-page text fragment runs the browser's find, as Ctrl+F would.
  await page.evaluate(() => (location.hash = ":~:text=environment%20variable"));
  await expect(header(page, "Where is my API key kept?")).toHaveAttribute("aria-expanded", "true");
  await expect(panel(page, "Where is my API key kept?")).toBeVisible();
});

test("the closed chevron points along the reading direction", async ({ page }) => {
  await open(page, "/components/accordion");
  const chevron = header(page, "Can I undo an edit?").locator("svg");
  await expect(chevron).toHaveCSS("scale", "none");
  await page.locator(".example-preview").first().evaluate((el) => el.setAttribute("dir", "rtl"));
  await expect(chevron).toHaveCSS("scale", "-1 1");
});
