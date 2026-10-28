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
import { NVDAClient } from "@guidepup/guidepup/lib/windows/NVDA/NVDAClient.js";

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
  const moved = await heard(nvda, "T2");
  expectSaid(moved, "activity", "tab", "selected");
  // Once: selecting before focusing stopped NVDA reading the new tab twice.
  expect(moved.match(/activity, tab/gi)).toHaveLength(1);
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

test("CM1–CM3: the command menu reads its field, each command, and the match count", async ({ page, nvda }) => {
  await open(page, nvda, "/components/command-menu");
  await reach(nvda, page.getByRole("button", { name: "Open commands" }), "CM1 trigger");
  await nvda.press("Enter");
  const opening = await heard(nvda, "CM1");
  expectSaid(opening, "commands", "dialog", /combo ?box|edit/i);
  // The key hint is for sighted users; it shouldn't be read as content.
  expect(opening).not.toMatch(/\bEsc\b/);
  // Focus stays in the field; NVDA follows aria-activedescendant to each command.
  await nvda.press("ArrowDown");
  expectSaid(await heard(nvda, "CM2"), "stop the agent");
  await nvda.type("dark");
  expectSaid(await heard(nvda, "CM3"), "1 command");
  await nvda.press("Escape");
});

test("CB1, CB2: a checkbox reads its mixed state and its hint", async ({ page, nvda }) => {
  await open(page, nvda, "/components/checkbox");
  expectSaid(await reach(nvda, page.getByRole("checkbox", { name: "All files" }), "CB1"), "all files", "check box", /half checked|mixed|partially/i);
  expectSaid(
    await reach(nvda, page.getByRole("checkbox", { name: "Send me a summary when a task finishes" }), "CB2"),
    "send me a summary",
    "check box",
    "checked",
    "one email per task",
  );
});

test("SW1, SW2: a switch reads as on or off, and its hint follows the state", async ({ page, nvda }) => {
  await open(page, nvda, "/components/switch");
  expectSaid(await reach(nvda, page.getByRole("switch", { name: "Apply edits automatically" }), "SW1"), "apply edits automatically", "switch", /off|not pressed/i, "each edit waits");
  await nvda.press("Space");
  expectSaid(await heard(nvda, "SW2"), /\bon\b|pressed/i);
});

test("SL1, SL2: a slider reads its formatted value and hint, and the new value as it moves", async ({ page, nvda }) => {
  await open(page, nvda, "/components/slider");
  expectSaid(
    await reach(nvda, page.getByRole("slider", { name: "Steps before checking in" }), "SL1"),
    "steps before checking in",
    "slider",
    "8 steps",
    "works longer on its own",
  );
  await nvda.press("ArrowRight");
  expectSaid(await heard(nvda, "SL2"), "9 steps");
});

test("PR1: a progress bar is found while reading, with its label and formatted value", async ({ page, nvda }) => {
  await open(page, nvda, "/components/progress");
  // It isn't focusable, so read backwards from the button below it, as someone browsing would.
  await reach(nvda, page.getByRole("button", { name: "Upload another" }), "PR1 (start)");
  let text = "";
  for (let i = 0; i < 3 && !/progress/i.test(text); i++) {
    await nvda.press("ArrowUp");
    text += ` | ${await heard(nvda, `PR1 (${i + 1})`)}`;
  }
  expectSaid(text, "progress bar", "3 of 12 files");
});

test("TG1, TG2: a toggle group reads its name, then each button's pressed state", async ({ page, nvda }) => {
  await open(page, nvda, "/components/toggle-group");
  expectSaid(
    await reach(nvda, page.getByRole("group", { name: "Show in the activity log" }).getByRole("button", { name: "Edits" }), "TG1"),
    "show in the activity log",
    "grouping",
    "edits",
    "toggle button",
    "pressed",
  );
  await nvda.press("Space");
  expectSaid(await heard(nvda, "TG2"), /not pressed/i);
});

test("PO1, PO2: a popover is announced as a dialog by name, and closing returns to its trigger", async ({ page, nvda }) => {
  await open(page, nvda, "/components/popover");
  expectSaid(await reach(nvda, page.getByRole("button", { name: "Share", exact: true }), "PO1 (trigger)"), "share", "button", "collapsed");
  await nvda.press("Enter");
  expectSaid(await heard(nvda, "PO1"), "share this session", "dialog", "link");
  // Focus is in a text field, so NVDA is in focus mode and takes the first Escape itself, to
  // leave it. A second Escape reaches the page.
  await nvda.press("Escape");
  let closed = await heard(nvda, "PO2 (first Escape)");
  if (!/button/i.test(closed)) {
    await nvda.press("Escape");
    closed = await heard(nvda, "PO2");
  }
  expectSaid(closed, "share", "button", "collapsed");
});

test("AC1, AC2: an accordion section is a heading with a button, and says when it expands", async ({ page, nvda }) => {
  await open(page, nvda, "/components/accordion");
  expectSaid(
    await reach(nvda, page.getByRole("heading", { name: "Can I undo an edit?" }).getByRole("button"), "AC1"),
    "can i undo an edit",
    "button",
    "collapsed",
    /heading,? level 4|level 4/i,
  );
  await nvda.press("Enter");
  expectSaid(await heard(nvda, "AC2"), "expanded");
});

test("RG1, RG2: a radio group reads its question, then the answer and its position", async ({ page, nvda }) => {
  await open(page, nvda, "/components/radio-group");
  expectSaid(
    await reach(nvda, page.getByRole("radio", { name: "Approve each edit" }), "RG1"),
    "when should edits need you",
    "grouping",
    "approve each edit",
    "radio button",
    "checked",
    "1 of 3",
  );
  await nvda.press("ArrowDown");
  expectSaid(await heard(nvda, "RG2"), "review at the end", "2 of 3", "review them all together");
});

/**
 * Everything NVDA says from pressing `key` until `ms` later. Guidepup records speech only until
 * NVDA has been quiet for a second after a key, and a stream with pauses outlasts that: the first
 * run recorded two of six sentences, while the page had given NVDA all six. So a second
 * connection to NVDA's relay listens for the whole time instead.
 */
async function listen(nvda: NVDA, key: string, ms: number, check: string): Promise<string[]> {
  const listener = new NVDAClient();
  await listener.connect({ capture: false });
  const phrases: string[] = [];
  const onSpeak = (phrase: string) => phrases.push(phrase);
  listener.on("speak", onSpeak);
  await nvda.press(key);
  await new Promise((resolve) => setTimeout(resolve, ms));
  listener.off("speak", onSpeak);
  listener.disconnect();
  await nvda.clearSpokenPhraseLog();
  console.log(`[${check}] ${phrases.length} phrases: ${phrases.join(" | ")}`);
  return phrases;
}

test("ST1, ST2: a streamed response is read a sentence at a time, each sentence once", async ({ page, nvda }) => {
  await open(page, nvda, "/components/streaming-text");
  await reach(nvda, page.getByRole("button", { name: "Play response" }), "ST1 trigger");
  const phrases = await listen(nvda, "Enter", 14_000, "ST1");
  const said = phrases.join(" ");
  // NVDA reads the file name as "pagination dot ts".
  expectSaid(said, "found the problem in pagination", "first page is skipped", "checking what else calls", "nothing else does", "all 14 tests pass");
  // ST2: no sentence is said in pieces or twice, which is what a live region on the text itself does.
  for (const sentence of ["first page is skipped", "added a test for the first page"]) {
    expect(said.toLowerCase().split(sentence).length - 1, sentence).toBe(1);
  }
  expect(phrases.length).toBeLessThan(20);
});

test("ST3: for comparison, the same response with the text itself as the live region", async ({ page, nvda }) => {
  // Not a check of Keystone: a record of what the usual approach sounds like, for docs/streaming.md.
  await open(page, nvda, "/components/streaming-text");
  await page.getByRole("radio", { name: "Live text" }).click();
  await reach(nvda, page.getByRole("button", { name: "Play response" }), "ST3 trigger");
  const phrases = await listen(nvda, "Enter", 14_000, "ST3");
  const said = phrases.join(" ").toLowerCase();
  console.log(`[ST3] ${phrases.length} phrases; "first page is skipped" in ${said.split("first page is skipped").length - 1} of them`);
});

