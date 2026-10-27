import { expect, test, type Page } from "@playwright/test";
import { open } from "./open";

const slider = (page: Page, name: string) => page.getByRole("slider", { name });
/** The value shown beside the label, which is hidden from screen readers. */
const shown = (page: Page, name: string) =>
  page.locator(".example-preview > div > div").filter({ has: slider(page, name) }).locator('[aria-hidden="true"]');

test.beforeEach(async ({ page }) => open(page, "/components/slider"));

test("is a native range, named by its label, announcing the formatted value", async ({ page }) => {
  const steps = slider(page, "Steps before checking in");
  await expect(steps).toHaveAttribute("type", "range");
  await expect(steps).toHaveAttribute("aria-valuetext", "8 steps");
  await expect(steps).toHaveAccessibleDescription("The agent works longer on its own between check-ins.");
  // Without formatValue the number is announced as it is, so there's no valuetext to keep in step.
  await expect(slider(page, "Lines of context in diffs")).not.toHaveAttribute("aria-valuetext");
});

test("the arrow keys, Home and End move it, and the shown and announced values follow", async ({ page }) => {
  const steps = slider(page, "Steps before checking in");
  await steps.focus();
  await page.keyboard.press("ArrowRight");
  await expect(steps).toHaveValue("9");
  await expect(steps).toHaveAttribute("aria-valuetext", "9 steps");
  await expect(shown(page, "Steps before checking in")).toHaveText("9 steps");
  await page.keyboard.press("ArrowDown");
  await expect(steps).toHaveValue("8");
  await page.keyboard.press("Home");
  await expect(steps).toHaveAttribute("aria-valuetext", "1 step");
  // The example's hint depends on the value; it's what's read with the slider.
  await expect(steps).toHaveAccessibleDescription("The agent will stop often to ask.");
  await page.keyboard.press("End");
  await expect(steps).toHaveValue("20");
});

test("uncontrolled, the fill and shown value still follow the thumb", async ({ page }) => {
  const lines = slider(page, "Lines of context in diffs");
  await expect(lines).toHaveCSS("--fill", "30%");
  await lines.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(lines).toHaveValue("2");
  await expect(shown(page, "Lines of context in diffs")).toHaveText("2");
  await expect(lines).toHaveCSS("--fill", "20%");
});

test("a click on the track jumps there, and the thumb sits on the fill's edge", async ({ page }) => {
  const lines = slider(page, "Lines of context in diffs");
  const box = (await lines.boundingBox())!;
  // The thumb's center travels from half a thumb in from each end, so its far end is max.
  await page.mouse.click(box.x + box.width - 2, box.y + box.height / 2);
  await expect(lines).toHaveValue("10");
  await page.mouse.click(box.x + 2, box.y + box.height / 2);
  await expect(lines).toHaveValue("0");
});

test("disabled, and with a hidden label that still names it", async ({ page }) => {
  await expect(slider(page, "Parallel agents")).toBeDisabled();
  const zoom = slider(page, "Preview zoom");
  await expect(zoom).toHaveAttribute("aria-valuetext", "100%");
  await expect(page.getByText("Preview zoom", { exact: true })).not.toBeInViewport();
  await zoom.focus();
  await page.keyboard.press("ArrowRight");
  await expect(zoom).toHaveAttribute("aria-valuetext", "110%");
});
