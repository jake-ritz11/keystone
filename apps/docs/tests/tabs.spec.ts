import { expect, test, type Page } from "@playwright/test";
import { open } from "./open";

const list = (page: Page, name: string) => page.getByRole("tablist", { name });
const tab = (page: Page, list: string, name: string) =>
  page.getByRole("tablist", { name: list }).getByRole("tab", { name, exact: true });

test.beforeEach(async ({ page }) => {
  await open(page, "/components/tabs");
});

test("each panel is named by its tab", async ({ page }) => {
  const overview = tab(page, "Project", "Overview");
  await expect(overview).toHaveAttribute("aria-selected", "true");
  // No aria-controls: it made NVDA announce each newly selected tab twice.
  await expect(overview).not.toHaveAttribute("aria-controls");
  const panel = page.getByRole("tabpanel", { name: "Overview" });
  await expect(panel).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: "Activity" })).toHaveCount(0);
});

test("only the selected tab is in the tab order", async ({ page }) => {
  await expect(tab(page, "Project", "Overview")).toHaveAttribute("tabindex", "0");
  for (const name of ["Activity", "Settings", "Billing"]) {
    await expect(tab(page, "Project", name)).toHaveAttribute("tabindex", "-1");
  }
  await tab(page, "Project", "Overview").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("tabpanel", { name: "Overview" })).toBeFocused();
});

test("automatic: arrows select as they move, skip disabled tabs, and wrap", async ({ page }) => {
  await tab(page, "Project", "Overview").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab(page, "Project", "Activity")).toBeFocused();
  await expect(tab(page, "Project", "Activity")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Activity" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  // Billing is disabled, so Settings wraps to Overview.
  await expect(tab(page, "Project", "Overview")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(tab(page, "Project", "Settings")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(tab(page, "Project", "Overview")).toBeFocused();
  await page.keyboard.press("End");
  await expect(tab(page, "Project", "Settings")).toHaveAttribute("aria-selected", "true");
});

test("manual: arrows move focus, Enter selects", async ({ page }) => {
  await tab(page, "Range", "Day").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab(page, "Range", "Week")).toBeFocused();
  await expect(tab(page, "Range", "Day")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter");
  await expect(tab(page, "Range", "Week")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Week" })).toBeVisible();
});

test("vertical: up and down move, left and right don't", async ({ page }) => {
  await expect(list(page, "Account settings")).toHaveAttribute("aria-orientation", "vertical");
  await tab(page, "Account settings", "General").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab(page, "Account settings", "General")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(tab(page, "Account settings", "Security")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowUp");
  await expect(tab(page, "Account settings", "General")).toHaveAttribute("aria-selected", "true");
});

test("clicking a tab selects it", async ({ page }) => {
  await tab(page, "Project", "Settings").click();
  await expect(tab(page, "Project", "Settings")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Settings" })).toBeVisible();
});
