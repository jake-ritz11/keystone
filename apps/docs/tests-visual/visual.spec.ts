import { expect, test, type Locator, type Page } from "@playwright/test";
import { COMPONENTS } from "@keystone-ui/ui/docs";
import { open } from "../tests/open";

const THEMES = ["light", "dark"] as const;

test.skip(
  process.platform !== "linux",
  "baselines are rendered in CI's Linux image; fonts and antialiasing differ elsewhere",
);

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function load(page: Page, path: string, theme: (typeof THEMES)[number]) {
  await page.emulateMedia({ colorScheme: theme });
  await open(page, path);
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Modal shots can catch a pixel of the page around the dialog's rounded edge, and that page isn't
 * what's under test, so it's hidden while the shot is taken.
 */
const ONLY_THE_MODAL = "body { visibility: hidden } dialog[open] { visibility: visible }";

/** The smallest rectangle around a trigger and what it opened, with room for shadows. */
async function around(page: Page, ...parts: Locator[]) {
  const boxes = await Promise.all(parts.map(async (p) => (await p.boundingBox())!));
  const pad = 24;
  const x = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad);
  const y = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad);
  return {
    x,
    y,
    width: Math.max(...boxes.map((b) => b.x + b.width)) + pad - x,
    height: Math.max(...boxes.map((b) => b.y + b.height)) + pad - y,
  };
}

// Every example on every component page, from the registry, so a new component is covered
// as soon as it has a page.
for (const { slug } of COMPONENTS) {
  for (const theme of THEMES) {
    test(`${slug} examples, ${theme}`, async ({ page }) => {
      await load(page, `/components/${slug}`, theme);
      const examples = page.locator(".example");
      const count = await examples.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const example = examples.nth(i);
        const title = await example.locator("h3").innerText();
        await expect(example.locator(".example-preview")).toHaveScreenshot(`${slug}--${slugify(title)}--${theme}.png`);
      }
    });
  }
}

// States the examples only reach through interaction.
for (const theme of THEMES) {
  test(`focus ring, ${theme}`, async ({ page }) => {
    await load(page, "/components/button", theme);
    const button = page.locator(".example-preview").first().getByRole("button").first();
    await button.focus();
    await expect(page.locator(".example-preview").first()).toHaveScreenshot(`state--focus-ring--${theme}.png`);
  });

  test(`menu open, ${theme}`, async ({ page }) => {
    await load(page, "/components/menu", theme);
    const trigger = page.getByRole("button", { name: "Actions", exact: true });
    await trigger.click();
    const menu = page.getByRole("menu", { name: "Actions" });
    await expect(menu).toBeVisible();
    await expect(page).toHaveScreenshot(`state--menu-open--${theme}.png`, { clip: await around(page, trigger, menu) });
  });

  test(`tooltip shown, ${theme}`, async ({ page }) => {
    await load(page, "/components/tooltip", theme);
    const trigger = page.getByRole("button", { name: "Hover or focus me" });
    await trigger.hover();
    const tooltip = page.getByRole("tooltip", { name: "Saves a copy to your workspace" });
    await expect(tooltip).toBeVisible();
    await expect(page).toHaveScreenshot(`state--tooltip--${theme}.png`, { clip: await around(page, trigger, tooltip) });
  });

  test(`dialog open, ${theme}`, async ({ page }) => {
    await load(page, "/components/dialog", theme);
    await page.getByRole("button", { name: "Edit profile" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit profile" });
    await expect(dialog).toBeVisible();
    await page.addStyleTag({ content: ONLY_THE_MODAL });
    await expect(dialog).toHaveScreenshot(`state--dialog--${theme}.png`);
  });

  test(`command menu open, ${theme}`, async ({ page }) => {
    await load(page, "/components/command-menu", theme);
    await page.getByRole("button", { name: "Open commands" }).click();
    const menu = page.getByRole("dialog", { name: "Commands" });
    await expect(menu).toBeVisible();
    await page.addStyleTag({ content: ONLY_THE_MODAL });
    await expect(menu).toHaveScreenshot(`state--command-menu--${theme}.png`);
  });

  test(`toast, ${theme}`, async ({ page }) => {
    await load(page, "/components/toast", theme);
    await page.getByRole("button", { name: "Success", exact: true }).click();
    const toast = page.getByRole("region", { name: "Notifications" }).getByRole("listitem");
    await expect(toast).toHaveCount(1);
    // Hovering pauses the dismiss timer, so the toast is still there when the shot is taken.
    await toast.hover();
    await expect(toast).toHaveScreenshot(`state--toast--${theme}.png`);
  });
}
