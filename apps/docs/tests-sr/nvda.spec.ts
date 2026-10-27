/**
 * What NVDA actually says, for the checks in docs/screen-reader-checklist.md (IDs match). The
 * behavior specs prove roles, names and live regions are in the DOM; these prove a screen
 * reader turns them into the right speech. Keys go through NVDA, as a user's would. Focus is
 * sometimes placed by the test first, to skip tabbing through the rest of the page.
 *
 * Matching is on the parts that matter (name, role, state, description) rather than whole
 * phrases, since NVDA's wording varies a little between versions.
 */
import { expect, type Page } from "@playwright/test";
import { nvdaTest as test } from "@guidepup/playwright";

type NVDA = Parameters<Parameters<typeof test>[2]>[0]["nvda"];

async function open(page: Page, nvda: NVDA, path: string) {
  await page.goto(path, { waitUntil: "load" });
  await page.locator("html[data-hydrated]").waitFor();
  await nvda.navigateToWebContent();
  await nvda.clearSpokenPhraseLog();
}

/** Everything NVDA said since the last call, once it has gone quiet. Logged for the CI output. */
async function heard(nvda: NVDA, check: string): Promise<string> {
  let log: string[] = [];
  let previous = -1;
  for (let i = 0; i < 24 && (log.length === 0 || log.length !== previous); i++) {
    previous = log.length;
    await new Promise((resolve) => setTimeout(resolve, 250));
    log = await nvda.spokenPhraseLog();
  }
  await nvda.clearSpokenPhraseLog();
  const text = log.join(" | ");
  console.log(`[${check}] ${text}`);
  return text;
}

function expectSaid(text: string, ...parts: (string | RegExp)[]) {
  for (const part of parts) {
    if (typeof part === "string") expect(text.toLowerCase()).toContain(part.toLowerCase());
    else expect(text).toMatch(part);
  }
}

test("S1: the first Tab reaches the skip link", async ({ page, nvda }) => {
  await open(page, nvda, "/components/input");
  await nvda.press("Tab");
  expectSaid(await heard(nvda, "S1"), "skip to content", "link");
});

test("I1, I2: fields announce name, role, required, error and hint", async ({ page, nvda }) => {
  await open(page, nvda, "/components/input");
  await page.getByRole("textbox", { name: "Email" }).focus();
  expectSaid(await heard(nvda, "I1"), "email", "edit", "required", "used only for sign-in");
  await page.getByRole("textbox", { name: "Username" }).focus();
  const username = await heard(nvda, "I2");
  expectSaid(username, "username", "invalid", "that username is taken");
});

test("D1, D3: a dialog announces itself, and Escape returns to its trigger", async ({ page, nvda }) => {
  await open(page, nvda, "/components/dialog");
  await page.getByRole("button", { name: "Edit profile" }).focus();
  await heard(nvda, "D1 trigger");
  await nvda.press("Enter");
  expectSaid(await heard(nvda, "D1"), "edit profile", "dialog");
  await nvda.press("Escape");
  expectSaid(await heard(nvda, "D3"), "edit profile", "button");
});

test("D4: an alert dialog starts on the safe choice", async ({ page, nvda }) => {
  await open(page, nvda, "/components/dialog");
  await page.getByRole("button", { name: "Delete project" }).focus();
  await heard(nvda, "D4 trigger");
  await nvda.press("Enter");
  expectSaid(await heard(nvda, "D4"), "delete this project?", /alert/i, "keep project", "button");
});

test("M1, M2, M4: the menu button, its items, and closing", async ({ page, nvda }) => {
  await open(page, nvda, "/components/menu");
  await page.getByRole("button", { name: "Actions", exact: true }).focus();
  expectSaid(await heard(nvda, "M1"), "actions", /menu button|has ?popup|submenu/i, "collapsed");
  await nvda.press("Enter");
  expectSaid(await heard(nvda, "M2"), "rename", "menu item");
  await nvda.press("Escape");
  expectSaid(await heard(nvda, "M4"), "actions", "collapsed");
});

test("T1, T2: tabs announce the list, the selected tab and its position", async ({ page, nvda }) => {
  await open(page, nvda, "/components/tabs");
  await page.getByRole("tab", { name: "Overview", exact: true }).focus();
  expectSaid(await heard(nvda, "T1"), "project", "overview", "tab", "selected");
  await nvda.press("ArrowRight");
  expectSaid(await heard(nvda, "T2"), "activity", "tab", "selected");
});

test("TT1: a tooltip is read as the button's description", async ({ page, nvda }) => {
  await open(page, nvda, "/components/tooltip");
  await page.getByRole("button", { name: "Hover or focus me" }).focus();
  expectSaid(await heard(nvda, "TT1"), "hover or focus me", "button", "saves a copy");
});

test("TO1, TO2: toasts are announced without moving focus", async ({ page, nvda }) => {
  await open(page, nvda, "/components/toast");
  await page.getByRole("button", { name: "Success" }).focus();
  await heard(nvda, "TO1 trigger");
  await nvda.press("Enter");
  expectSaid(await heard(nvda, "TO1"), "project published");
  await expect(page.getByRole("button", { name: "Success" })).toBeFocused();
  await page.getByRole("button", { name: "Danger" }).focus();
  await heard(nvda, "TO2 trigger");
  await nvda.press("Enter");
  expectSaid(await heard(nvda, "TO2"), "couldn't upload file");
});
