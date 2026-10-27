import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { open } from "./open";

const menu = (page: Page) => page.getByRole("dialog", { name: "Commands" });
const search = (page: Page) => menu(page).getByRole("combobox", { name: "Commands" });

/** The selected command: the one highlighted, and the one Enter would run. */
const current = (page: Page) =>
  menu(page)
    .locator('[role="option"][aria-selected="true"]')
    .evaluate((option) => option.textContent)
    .catch(() => null);

async function openMenu(page: Page) {
  await open(page, "/components/command-menu");
  await page.getByRole("button", { name: "Open commands" }).click();
  await expect(menu(page)).toBeVisible();
}

test("opens as a named modal, focus in the search, the first command current", async ({ page }) => {
  await openMenu(page);
  await expect(search(page)).toBeFocused();
  expect(await current(page)).toContain("New task");
  await expect(menu(page).getByRole("group", { name: "Tasks" }).getByRole("option")).toHaveCount(3);
  const results = await new AxeBuilder({ page }).include("dialog[open]").analyze();
  expect(results.violations).toEqual([]);
});

test("the field stays focused for assistive tech until the arrows move into the list", async ({ page }) => {
  await openMenu(page);
  // On open, and after typing, the field is what a screen reader reports; the best match is selected.
  await expect(search(page)).not.toHaveAttribute("aria-activedescendant");
  expect(await current(page)).toContain("New task");
  await page.keyboard.press("ArrowDown");
  const id = await search(page).getAttribute("aria-activedescendant");
  await expect(page.locator(`[id="${id}"]`)).toContainText("Stop the agent");
  await page.keyboard.type("x");
  await expect(search(page)).not.toHaveAttribute("aria-activedescendant");
});

test("arrows wrap and skip disabled commands", async ({ page }) => {
  await openMenu(page);
  await page.keyboard.press("ArrowUp");
  expect(await current(page)).toContain("Open the docs");
  await page.keyboard.press("ArrowUp");
  // Export session is disabled: Up from Open the docs lands on Show preview.
  expect(await current(page)).toContain("Show preview");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  expect(await current(page)).toContain("New task");
  await expect(menu(page).getByRole("option", { name: "Export session" })).toHaveAttribute("aria-disabled", "true");
});

test("typing filters by label and keywords, and says how many match", async ({ page }) => {
  await openMenu(page);
  await page.keyboard.type("dark");
  await expect(menu(page).getByRole("option")).toHaveCount(1);
  expect(await current(page)).toContain("Toggle theme");
  await expect(menu(page).getByRole("status")).toHaveText("1 command");

  await search(page).fill("zzz");
  await expect(menu(page).getByRole("option")).toHaveCount(0);
  await expect(menu(page)).toContainText("No matching commands");
  await expect(menu(page).getByRole("status")).toHaveText("0 commands");
});

test("Enter closes, returns focus, then runs the command", async ({ page }) => {
  await openMenu(page);
  await page.keyboard.type("stop");
  await page.keyboard.press("Enter");
  await expect(menu(page)).toBeHidden();
  await expect(page.getByRole("button", { name: "Open commands" })).toBeFocused();
  await expect(page.getByText("Last command: Stop the agent")).toBeVisible();
});

test("a click runs a command; a click on a disabled one does nothing", async ({ page }) => {
  await openMenu(page);
  await menu(page).getByRole("option", { name: "Export session" }).click({ force: true });
  await expect(menu(page)).toBeVisible();
  await menu(page).getByRole("option", { name: /Show preview/ }).click();
  await expect(menu(page)).toBeHidden();
  await expect(page.getByText("Last command: Show preview")).toBeVisible();
});

test("Escape closes and returns focus; the app's shortcut toggles it", async ({ page }) => {
  await openMenu(page);
  await page.keyboard.press("Escape");
  await expect(menu(page)).toBeHidden();
  await expect(page.getByRole("button", { name: "Open commands" })).toBeFocused();

  await page.keyboard.press("Control+k");
  await expect(menu(page)).toBeVisible();
  await expect(search(page)).toHaveValue("");
  expect(await current(page)).toContain("New task");
});

test("the pointer moves the highlight only when it actually moves", async ({ page }) => {
  await openMenu(page);
  const preview = menu(page).getByRole("option", { name: /Show preview/ });
  const box = (await preview.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + box.height / 2);
  await page.mouse.move(Math.round(box.x + 40), Math.round(box.y + box.height / 2));
  expect(await current(page)).toContain("Show preview");

  // Typing re-filters the list under the resting cursor; the best match becomes current, and
  // the cursor doesn't take it back.
  await page.keyboard.type("o");
  expect(await current(page)).toContain("Open the docs");
  // Chrome then sends a pointer move at the same spot onto whatever row is now under it.
  // Headless browsers don't, so send it the way Chrome would.
  const x = Math.round(box.x + 40);
  const y = Math.round(box.y + box.height / 2);
  await page.evaluate(([px, py]) => {
    const under = document.elementFromPoint(px!, py!);
    under?.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: px, clientY: py }));
  }, [x, y]);
  expect(await current(page)).toContain("Open the docs");
});
