import { expect, test } from "@playwright/test";
import { open } from "./open";

test("textarea grows with its content, then stops at maxRows", async ({ page, browserName }) => {
  await open(page, "/components/textarea");
  const box = page.getByRole("textbox", { name: "Message" });
  const empty = (await box.boundingBox())!.height;
  await box.fill("one\ntwo\nthree\nfour");
  const four = (await box.boundingBox())!.height;
  const supported = await page.evaluate(() => CSS.supports("field-sizing", "content"));
  test.skip(!supported, `${browserName} doesn't support field-sizing yet; it falls back to rows and a resize handle.`);
  expect(four).toBeGreaterThan(empty);
  await box.fill(Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n"));
  const capped = (await box.boundingBox())!.height;
  await box.fill(Array.from({ length: 40 }, (_, i) => `line ${i}`).join("\n"));
  expect((await box.boundingBox())!.height).toBe(capped);
});

test("composer: Enter sends, Shift+Enter adds a line", async ({ page }) => {
  await open(page, "/components/textarea");
  const box = page.getByRole("textbox", { name: "Message" });
  await box.fill("first line");
  await box.press("Shift+Enter");
  await box.pressSequentially("second");
  await expect(box).toHaveValue("first line\nsecond");
  await box.press("Enter");
  await expect(box).toHaveValue("");
  await expect(page.getByText("Sent 1 message.")).toBeVisible();
});

test("a diff says what changed in words, not only in color", async ({ page }) => {
  await open(page, "/components/diff-view");
  const diff = page.getByRole("region", { name: "styles.css", exact: true });
  await expect(diff).toContainText("Added: .plans-scroll {");
  await expect(diff).toContainText("Removed:   min-width: 720px;");
  await expect(diff).toContainText("lines added");
  await diff.getByRole("button", { name: "Approve" }).click();
  await expect(diff.getByText("Approved")).toBeVisible();
});

test("disclosure: native toggle from the keyboard, and exclusive groups", async ({ page }) => {
  await open(page, "/components/disclosure");
  const read = page.locator(".example-preview details").filter({ hasText: "Read styles.css" });
  await expect(read).not.toHaveAttribute("open");
  await read.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(read).toHaveAttribute("open");
  await expect(read.locator("summary")).toContainText("Done");

  const faq = page.locator('.example-preview details[name="faq"]');
  await expect(faq.nth(0)).toHaveAttribute("open");
  await faq.nth(1).locator("summary").click();
  await expect(faq.nth(1)).toHaveAttribute("open");
  await expect(faq.nth(0)).not.toHaveAttribute("open");
});
