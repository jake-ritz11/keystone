/**
 * What NVDA actually says, for the checks in docs/screen-reader-checklist.md (IDs match). The
 * behavior specs prove roles, names and live regions are in the DOM; these prove a screen
 * reader turns them into the right speech. Every move is a key pressed through NVDA, as a
 * user's would be: focus placed from outside the browser (Playwright's focus()) isn't announced,
 * so `reach` puts focus just before the target and then presses Tab.
 *
 * Matching is on the parts that matter (name, role, state, description) rather than whole
 * phrases, since NVDA's wording varies a little between versions.
 */
import { expect, type Locator, type Page } from "@playwright/test";
import { nvdaTest as test } from "@guidepup/playwright";

type NVDA = Parameters<Parameters<typeof test>[2]>[0]["nvda"];

// By default Guidepup keeps only the first phrase after each key, which drops the newly focused
// element when a key both changes state and moves focus (opening a dialog or a menu).
test.use({ nvdaStartOptions: { capture: true } });

/** Loads a page and returns what NVDA said on arriving. */
async function open(page: Page, nvda: NVDA, path: string): Promise<string> {
  await page.goto(path, { waitUntil: "load" });
  await page.locator("html[data-hydrated]").waitFor();
  await nvda.navigateToWebContent();
  return heard(nvda, `open ${path}`);
}

/** Moves to `target` the way a keyboard user arrives at it: Tab from the element before it. */
async function reach(nvda: NVDA, target: Locator, check: string): Promise<string> {
  await target.focus();
  await nvda.press("Shift+Tab");
  await heard(nvda, `${check} (before)`);
  await nvda.press("Tab");
  return heard(nvda, check);
}

/**
 * Everything NVDA said since the last call, once it has been quiet for a second (or after eight
 * seconds of silence). Logged, so the CI output shows exactly what was heard.
 */
async function heard(nvda: NVDA, check: string): Promise<string> {
  let log: string[] = [];
  let quiet = 0;
  for (let i = 0; i < 32 && quiet < 4; i++) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const next = await nvda.spokenPhraseLog();
    quiet = next.length > 0 && next.length === log.length ? quiet + 1 : 0;
    log = next;
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

test("S1: the skip link comes first", async ({ page, nvda }) => {
  // NVDA lands on the first focusable element when the page loads.
  expectSaid(await open(page, nvda, "/components/input"), "skip to content", "link");
});

test("I1, I2: fields announce name, role, required, error and hint", async ({ page, nvda }) => {
  await open(page, nvda, "/components/input");
  expectSaid(await reach(nvda, page.getByRole("textbox", { name: "Email" }), "I1"), "email", "edit", "required", "used only for sign-in");
  const username = await reach(nvda, page.getByRole("textbox", { name: "Username" }), "I2");
  expectSaid(username, "username", "invalid", "that username is taken");
});

test("D1, D3: a dialog announces itself, and Escape returns to its trigger", async ({ page, nvda }) => {
  await open(page, nvda, "/components/dialog");
  await reach(nvda, page.getByRole("button", { name: "Edit profile" }), "D1 trigger");
  await nvda.press("Enter");
  expectSaid(await heard(nvda, "D1"), "edit profile", "dialog");
  await nvda.press("Escape");
  let closing = await heard(nvda, "D3");
  const dialog = page.getByRole("dialog", { name: "Edit profile" });
  if (await dialog.isVisible()) {
    // NVDA keeps the first Escape in a field to leave focus mode; the second reaches the page.
    console.log("[D3] first Escape stayed with NVDA");
    await nvda.press("Escape");
    closing = await heard(nvda, "D3 second Escape");
  }
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Edit profile" })).toBeFocused();
  // NVDA reads "Skip to content" first: the first Escape put it in browse mode inside the
  // dialog, and when the dialog leaves, NVDA's reading position resets to the top of the page
  // before following focus to the opener. Returning focus earlier doesn't change it (tried).
  expectSaid(closing, "edit profile", "button");
});

test("D4: an alert dialog starts on the safe choice", async ({ page, nvda }) => {
  await open(page, nvda, "/components/dialog");
  await reach(nvda, page.getByRole("button", { name: "Delete project" }), "D4 trigger");
  await nvda.press("Enter");
  // NVDA in Chrome reads role="alertdialog" as "dialog"; the role itself is checked by the
  // behavior specs. What matters here is the question, the consequence and the safe choice.
  expectSaid(await heard(nvda, "D4"), "delete this project?", "dialog", "can't be undone", "keep project", "button");
});

test("M1, M2, M4: the menu button, its items, and closing", async ({ page, nvda }) => {
  await open(page, nvda, "/components/menu");
  expectSaid(await reach(nvda, page.getByRole("button", { name: "Actions", exact: true }), "M1"), "actions", /menu button|has ?popup|submenu/i, "collapsed");
  await nvda.press("Enter");
  // NVDA leaves out "menu item" inside a menu; the position says it's one of the menu's items,
  // and counts the disabled one (M3).
  expectSaid(await heard(nvda, "M2"), "rename", "ctrl e", "1 of 5");
  await nvda.press("Escape");
  expectSaid(await heard(nvda, "M4"), "actions", "collapsed");
});

test("T1, T2: tabs announce the list, the selected tab and its position", async ({ page, nvda }) => {
  await open(page, nvda, "/components/tabs");
  expectSaid(await reach(nvda, page.getByRole("tab", { name: "Overview", exact: true }), "T1"), "project", "overview", "tab", "selected");
  await nvda.press("ArrowRight");
  expectSaid(await heard(nvda, "T2"), "activity", "tab", "selected");
});

test("TT1: a tooltip is read as the button's description", async ({ page, nvda }) => {
  await open(page, nvda, "/components/tooltip");
  expectSaid(await reach(nvda, page.getByRole("button", { name: "Hover or focus me" }), "TT1"), "hover or focus me", "button", "saves a copy");
});

test("TO1, TO2: toasts are announced without moving focus", async ({ page, nvda }) => {
  await open(page, nvda, "/components/toast");
  await reach(nvda, page.getByRole("button", { name: "Success" }), "TO1 trigger");
  await nvda.press("Enter");
  expectSaid(await heard(nvda, "TO1"), "project published");
  await expect(page.getByRole("button", { name: "Success" })).toBeFocused();
  await reach(nvda, page.getByRole("button", { name: "Danger" }), "TO2 trigger");
  await nvda.press("Enter");
  expectSaid(await heard(nvda, "TO2"), "couldn't upload file");
});
