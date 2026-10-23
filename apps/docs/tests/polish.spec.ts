import { expect, test } from "@playwright/test";
import { open } from "./open";

test("hovering an invalid field keeps its red border", async ({ page }) => {
  await open(page, "/components/input");
  const field = page.getByRole("textbox", { name: "Username" });
  await expect(field).toHaveAttribute("aria-invalid", "true");
  const control = field.locator("xpath=..");
  const border = () => control.evaluate((el) => getComputedStyle(el).borderTopColor);
  const before = await border();
  await field.hover();
  expect(await border()).toBe(before);
});

test("Escape dismissing a tooltip doesn't reach anything behind it", async ({ page }) => {
  await open(page, "/components/tooltip");
  let escapes = 0;
  await page.exposeFunction("countEscape", () => escapes++);
  await page.evaluate(() => document.addEventListener("keydown", (e) => e.key === "Escape" && (window as unknown as { countEscape: () => void }).countEscape()));
  const trigger = page.getByRole("button", { name: "Hover or focus me" });
  await trigger.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const tooltip = page.getByRole("tooltip", { name: "Saves a copy to your workspace" });
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).toBeHidden();
  expect(escapes).toBe(0);
});

test("the pointer and the keyboard share one highlight in a menu", async ({ page }) => {
  await open(page, "/components/menu");
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  const menu = page.getByRole("menu", { name: "Actions" });
  await expect(menu.getByRole("menuitem", { name: /Rename/ })).toBeFocused();
  await menu.getByRole("menuitem", { name: /Download/ }).hover();
  await expect(menu.getByRole("menuitem", { name: /Download/ })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: /Delete/ })).toBeFocused();
  const painted = await menu.getByRole("menuitem").evaluateAll((items) =>
    items.filter((i) => getComputedStyle(i).backgroundColor !== "rgba(0, 0, 0, 0)").length,
  );
  expect(painted).toBe(1);
});

test("many tabs scroll inside the list instead of widening the page", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await open(page, "/components/tabs");
  const pageOverflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await pageOverflow()).toBe(0);
  await page.evaluate(() => {
    const list = document.querySelector('[role="tablist"]')!;
    for (let i = 0; i < 6; i++) list.append(list.firstElementChild!.cloneNode(true));
  });
  expect(await pageOverflow()).toBe(0);
});

test("right-to-left tabs: the left arrow moves to the next tab", async ({ page }) => {
  await open(page, "/components/tabs");
  const list = page.getByRole("tablist", { name: "Project" });
  await list.evaluate((el) => el.setAttribute("dir", "rtl"));
  await list.getByRole("tab", { name: "Overview", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(list.getByRole("tab", { name: "Activity", exact: true })).toBeFocused();
});
