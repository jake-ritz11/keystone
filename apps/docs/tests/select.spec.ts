import { expect, test } from "@playwright/test";
import { open } from "./open";

test.beforeEach(async ({ page }) => open(page, "/components/select"));

test("is a native select, named by its label, with hint and required wired up", async ({ page }) => {
  const plan = page.getByRole("combobox", { name: "Plan" });
  await expect(plan).toHaveAccessibleDescription("You can change this later.");
  await expect(plan).toHaveJSProperty("required", true);
  // The placeholder is a hidden, empty first option, so required still means "choose something".
  await expect(plan).toHaveValue("");
  expect(await plan.evaluate((s: HTMLSelectElement) => s.validity.valueMissing)).toBe(true);
  await expect(plan.locator("option", { hasText: "Enterprise" })).toBeDisabled();
});

test("choosing an option sets the value", async ({ page }) => {
  const region = page.getByRole("combobox", { name: "Region" });
  await expect(region).toHaveValue("eu");
  await region.selectOption("ap");
  await expect(region).toHaveValue("ap");
});

test("an error marks it invalid and is read with it", async ({ page }) => {
  const zone = page.getByRole("combobox", { name: "Time zone" });
  await expect(zone).toHaveAttribute("aria-invalid", "true");
  await expect(zone).toHaveAccessibleDescription("Pick a time zone to continue.");
  await expect(page.getByRole("combobox", { name: "Disabled" })).toBeDisabled();
});

test("the keyboard opens the picker and chooses from it", async ({ page, browserName }) => {
  // WebKit opens the system picker, which Playwright can't drive.
  test.skip(browserName === "webkit", "the native picker isn't scriptable in WebKit");
  const region = page.getByRole("combobox", { name: "Region" });
  await region.focus();
  const styled = await page.evaluate(() => CSS.supports("appearance", "base-select"));
  await page.keyboard.press("ArrowDown");
  if (!styled) {
    // Without base-select (Firefox today) it's the classic select: arrows change the value.
    await expect(region).toHaveValue("us");
    return;
  }
  // With appearance: base-select, the arrow keys open Keystone's styled picker on the current
  // option, rather than changing the value behind a closed control.
  await expect(region).toHaveValue("eu");
  expect(await region.evaluate((s) => s.matches(":open"))).toBe(true);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(region).toHaveValue("us");
  expect(await region.evaluate((s) => s.matches(":open"))).toBe(false);
  await expect(region).toBeFocused();
});
